# Выкладка

Push в `main` запускает GitHub Actions:

| Что изменилось | Workflow | Что делает |
| --- | --- | --- |
| всё, кроме `deploy/` | `deploy-site.yml` | `npm run check`, сборка с PDF-резюме, rsync `dist/` в `/var/www/portfolio/dist` |
| `deploy/rum/` | `deploy-rum.yml` | `go vet`, `go test`, сборка под Linux, замена бинарника в `/opt/portfolio-rum`, перезапуск |

Оба можно запустить вручную: Actions → workflow → Run workflow. Сайт стоит пересобрать так
после правок контента в бакете — HTML пререндерится из него при сборке.

Выкладка сайта не ломает открытые вкладки: старые чанки `_app/immutable` остаются на сервере
ещё неделю после того, как пропали из сборки.

Конфиг nginx (`nginx.example.conf`) и юнит systemd CI не трогает — их правки выкладываются вручную.

## Разовая настройка

Ниже `portfolio` — хост из `~/.ssh/config`, `$USER` на сервере — тот, под кем уже делается rsync
и кому принадлежит `/var/www/portfolio/dist`.

### 1. Ключ для CI

Отдельный, без пароля, чтобы его можно было отозвать, не трогая свой:

```bash
ssh-keygen -t ed25519 -N '' -C github-actions -f ~/.ssh/portfolio_ci
# restrict — без pty и пробросов: для rsync, scp и команд по ssh они не нужны
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

В конфиг nginx на сервере — блоки `/api/rum` из `nginx.example.conf`, затем
`sudo nginx -t && sudo systemctl reload nginx`.

### 3. Секреты GitHub

Окружение `production`, в нём четыре секрета:

```bash
gh api -X PUT repos/QWERN-9876r/Portfolio/environments/production
gh secret set SSH_HOST --env production --body qwern9876r.ru
gh secret set SSH_USER --env production --body <пользователь на сервере>
gh secret set SSH_PRIVATE_KEY --env production < ~/.ssh/portfolio_ci
gh secret set SSH_KNOWN_HOSTS --env production --body "$(ssh-keyscan -t ed25519 qwern9876r.ru)"
```

Отпечаток из `ssh-keyscan` стоит сверить с тем, что знает твой ssh:
`ssh-keygen -lf <(ssh-keyscan -t ed25519 qwern9876r.ru)` и `ssh-keygen -lF qwern9876r.ru`.

Сервер не x86-64 — переменная `SERVER_ARCH` (например, `arm64`):
`gh variable set SERVER_ARCH --env production --body arm64`.

## Вручную

Если CI недоступен — то же самое с Mac:

```bash
npm run build && rsync -az --delete dist/ portfolio:/var/www/portfolio/dist/

cd deploy/rum && GOOS=linux GOARCH=amd64 go build -o portfolio-rum . \
  && scp portfolio-rum portfolio:/opt/portfolio-rum/portfolio-rum.new \
  && ssh portfolio 'mv /opt/portfolio-rum/portfolio-rum.new /opt/portfolio-rum/portfolio-rum && sudo systemctl restart portfolio-rum'
```
