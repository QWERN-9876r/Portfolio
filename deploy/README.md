# Выкладка

Push в `main` запускает GitHub Actions. Оба workflow сначала прогоняют тесты (`test.yml`), выкладка — только если они прошли:

| Что изменилось | Workflow | Что выкладывает |
| --- | --- | --- |
| всё, кроме `deploy/` | `deploy-site.yml` | сборку с PDF-резюме, на которой прошли e2e, — на GitHub Pages: https://qwern-9876r.github.io/Portfolio/ |
| `deploy/rum/` | `deploy-rum.yml` | бинарник сервиса метрик под Linux в `/opt/portfolio-rum` на сервере, перезапуск |

Push в другие ветки запускает только тесты.

Выкладки можно запустить вручную: Actions → workflow → Run workflow. Сайт стоит пересобрать так
после правок контента в бакете — HTML пререндерится из него при сборке.

Сайт от сервера не зависит. Сервер `qwern9876r.ru` держит только сервис метрик (страница ходит
в него с GitHub Pages, CORS ставит сам сервис) и переадресует старые ссылки на Pages. Лежит
сервер — сайт работает, в «Почему я» нет медианы посетителей, а /stats пишет «Сервис метрик недоступен».

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

Конфиг nginx на сервере — по `nginx.example.conf`: точный `/api/rum` для приёма визитов,
префиксный `^~ /api/rum/` для сводки и живой ленты (SSE, без буфера), всё остальное — 301 на
GitHub Pages. Затем `sudo nginx -t && sudo systemctl reload nginx`.

### 3. Секреты GitHub

Окружение `production`, в нём четыре секрета:

```bash
gh api -X PUT repos/QWERN-9876r/Portfolio/environments/production
gh secret set SSH_HOST --env production --body qwern9876r.ru
gh secret set SSH_USER --env production --body <пользователь на сервере>
gh secret set SSH_PRIVATE_KEY --env production < ~/.ssh/portfolio_ci
gh secret set SSH_KNOWN_HOSTS --env production --body "$(ssh-keyscan -t ed25519 111.88.240.234 qwern9876r.ru)"
```

ssh ищет ключ сервера по тому имени, к которому подключается: запись для `qwern9876r.ru`
не подходит, если в `SSH_HOST` IP (как `HostName` в `~/.ssh/config`), — `Host key verification failed`.
Поэтому в `SSH_KNOWN_HOSTS` оба имени. Отпечаток стоит сверить с тем, что уже знает твой ssh:
`ssh-keygen -lf <(ssh-keyscan -t ed25519 111.88.240.234)` и `ssh-keygen -lF 111.88.240.234` —
должно совпасть (`SHA256:xISUl5QGCIut9keyrrrZjtmrsTmelUHCJMIKv93inqs`).

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
