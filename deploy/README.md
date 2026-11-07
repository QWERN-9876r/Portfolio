# Выкладка

Push в `main` запускает GitHub Actions. Оба workflow сначала прогоняют тесты (`test.yml`), выкладка — только если они прошли:

| Что изменилось | Workflow | Что выкладывает |
| --- | --- | --- |
| всё, кроме `deploy/` | `deploy-site.yml` | сборку с PDF-резюме, на которой прошли e2e, — на GitHub Pages за своим доменом: https://qwern9876r.ru |
| `deploy/rum/` | `deploy-rum.yml` | бинарник сервиса метрик под Linux в `/opt/portfolio-rum` на сервере, перезапуск |

Push в другие ветки запускает только тесты.

Выкладки можно запустить вручную: Actions → workflow → Run workflow. Сайт стоит пересобрать так
после правок контента в бакете — HTML пререндерится из него при сборке.

Сайт от сервера не зависит. DNS апекса (`qwern9876r.ru`) указывает прямо на GitHub Pages — сервер
в этом пути не участвует вообще. У сервера свой поддомен, `rum.qwern9876r.ru`, и на нём только
сервис метрик (страница ходит в него с сайта, CORS ставит сам сервис). Лежит сервер — сайт
работает, в «Почему я» нет медианы посетителей, а /stats пишет «Сервис метрик недоступен».

GitHub Pages при выкладке заменяет все файлы: чанк, который открытая до выкладки вкладка ещё не
догрузила (3D, Pixi), пропадёт. Страница от этого не падает, а у посетителей с service worker
он обычно уже в кэше.

Конфиг nginx (`nginx.example.conf`) и юнит systemd CI не трогает — их правки выкладываются вручную.

## Тесты

```bash
npm test             # всё: unit, сервис метрик, e2e
npm run test:unit    # Vitest: логика сайта и service worker (src/**/*.test.ts)
npm run test:rum     # Go: сервис метрик, HTTP и журнал на диске (deploy/rum/*_test.go)
npm run test:e2e     # Playwright: собранный сайт + настоящий сервис метрик (tests/e2e)
```

E2e нужны установленные Chrome и Go; локально сайт собирается перед тестами сам. Сервис метрик
для них — свой, на порту 8091 с временным журналом, рабочий на 8090 не трогается.

## Разовая настройка

### GitHub Pages

Pages бесплатно работает только у публичного репозитория. Перед тем как открыть его, смени
ключ CI (шаг 1 ниже): старый когда-то попал в историю ветки `sveltekit`, а GitHub ещё какое-то
время отдаёт коммиты удалённых веток по хешу.

```bash
gh repo edit QWERN-9876r/Portfolio --visibility public --accept-visibility-change-consequences
# Pages из GitHub Actions (Settings → Pages → Source: GitHub Actions)
gh api -X POST repos/QWERN-9876r/Portfolio/pages -f build_type=workflow
```

Окружение `github-pages` Actions создадут сами при первой выкладке.

#### Свой домен

Сайт выкладывается из Actions, а не из ветки — CNAME-файл в репозитории GitHub не создаёт и
игнорирует, даже если он есть. Домен задаётся только в самом Settings → Pages:

```bash
# Сначала здесь, потом DNS — иначе домен без владельца в GitHub может перехватить кто-то другой
gh api -X PUT repos/QWERN-9876r/Portfolio/pages -f cname=qwern9876r.ru
```

DNS у регистратора `qwern9876r.ru` — apex нельзя CNAME, только A/AAAA на адреса Pages (или
ALIAS/ANAME, если провайдер их поддерживает):

```
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
AAAA  @     2606:50c0:8000::153
AAAA  @     2606:50c0:8001::153
AAAA  @     2606:50c0:8002::153
AAAA  @     2606:50c0:8003::153
```

`www.qwern9876r.ru` — опционально, туда же: `CNAME www → qwern-9876r.github.io` (без имени
репозитория), Pages сам решит, редиректить ли его на apex или наоборот — смотря что задано в
Settings → Pages как основной домен.

До 24 часов на распространение DNS и ещё до 24 часов — на «Enforce HTTPS» в настройках Pages.
Проверка: `dig qwern9876r.ru` — должны вернуться эти четыре A-адреса.

### Сервер для сервиса метрик

Ниже `portfolio` — хост из `~/.ssh/config`, `$USER` на сервере — deploy-пользователь,
под которым CI выкладывает сервис.

### 1. Ключ для CI

Отдельный, без пароля, чтобы его можно было отозвать, не трогая свой:

```bash
ssh-keygen -t ed25519 -N '' -C github-actions -f ~/.ssh/portfolio_ci
# restrict — без pty и пробросов: для scp и команд по ssh они не нужны
ssh portfolio "echo 'restrict $(cat ~/.ssh/portfolio_ci.pub)' >> ~/.ssh/authorized_keys"
```

### 2. Сервис метрик на сервере

Бинарник лежит в папке deploy-пользователя, чтобы CI обновлял его без root. Root нужен только
на перезапуск — sudo разрешён ровно для этой команды.

```bash
scp deploy/rum/portfolio-rum.service portfolio:/tmp/
ssh portfolio
  sudo install -d -o "$USER" -g "$USER" -m 755 /opt/portfolio-rum
  sudo mv /tmp/portfolio-rum.service /etc/systemd/system/
  sudo systemctl daemon-reload && sudo systemctl enable portfolio-rum
  echo "$USER ALL=(root) NOPASSWD: $(command -v systemctl) restart portfolio-rum" \
    | sudo tee /etc/sudoers.d/portfolio-rum
  sudo chmod 440 /etc/sudoers.d/portfolio-rum && sudo visudo -c
```

Запустит сервис первая выкладка из CI. Если раньше бинарник ставился в `/usr/local/bin`,
его можно удалить.

Конфиг nginx на сервере — по `nginx.example.conf`, на поддомене `rum.qwern9876r.ru`: точный
`/api/rum` для приёма визитов, префиксный `^~ /api/rum/` для сводки и живой ленты (SSE, без
буфера). Затем `sudo nginx -t && sudo systemctl reload nginx`.

### 3. Секреты GitHub

Окружение `production`, в нём четыре секрета:

`SSH_HOST` — поддомен сервиса метрик, не apex: у apex DNS теперь ведёт на GitHub Pages, а не
на этот сервер. IP ниже — адрес сервера (сверь с актуальным, если сервер меняется):

```bash
gh api -X PUT repos/QWERN-9876r/Portfolio/environments/production
gh secret set SSH_HOST --env production --body rum.qwern9876r.ru
gh secret set SSH_USER --env production --body <пользователь на сервере>
gh secret set SSH_PRIVATE_KEY --env production < ~/.ssh/portfolio_ci
gh secret set SSH_KNOWN_HOSTS --env production --body "$(ssh-keyscan -t ed25519 <IP сервера> rum.qwern9876r.ru)"
```

ssh ищет ключ сервера по тому имени, к которому подключается: запись для `rum.qwern9876r.ru`
не подходит, если в `SSH_HOST` IP (как `HostName` в `~/.ssh/config`), — `Host key verification failed`.
Поэтому в `SSH_KNOWN_HOSTS` оба имени. Отпечаток стоит сверить с тем, что уже знает твой ssh:
`ssh-keygen -lf <(ssh-keyscan -t ed25519 <IP сервера>)` и `ssh-keygen -lF <IP сервера>` — должны совпасть.

Сервер не x86-64 — переменная `SERVER_ARCH` (например, `arm64`):
`gh variable set SERVER_ARCH --env production --body arm64`.

## Вручную

Сайт — только через Actions (Deploy site → Run workflow): Pages принимает выкладку из workflow.
Сервис метрик, если CI недоступен, — с Mac:

```bash
cd deploy/rum && GOOS=linux GOARCH=amd64 go build -o portfolio-rum . \
  && scp portfolio-rum portfolio:/opt/portfolio-rum/portfolio-rum.new \
  && ssh portfolio 'mv /opt/portfolio-rum/portfolio-rum.new /opt/portfolio-rum/portfolio-rum && sudo systemctl restart portfolio-rum'
```
