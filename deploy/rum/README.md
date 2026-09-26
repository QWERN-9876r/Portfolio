# Метрики посетителей (RUM)

Страница при уходе шлёт один beacon на `/api/rum`: LCP или FCP, время загрузки, JS при загрузке,
какие секции посетитель увидел и по каким контактам кликнул. Без cookie, идентификаторов и IP.
Сервис пишет события в JSONL и отдаёт медианы за 30 дней на `/api/rum/summary` —
их показывает блок «Почему я», когда набирается хотя бы 10 визитов.

## Выкладка

```bash
# 1. Сборка под сервер (Linux x86-64) — на Mac, Go на сервере не нужен
cd deploy/rum && GOOS=linux GOARCH=amd64 go build -o portfolio-rum .

# 2. Бинарник и юнит на сервер
scp portfolio-rum portfolio-rum.service portfolio:/tmp/
ssh portfolio 'sudo mv /tmp/portfolio-rum /usr/local/bin/ && sudo mv /tmp/portfolio-rum.service /etc/systemd/system/ \
  && sudo systemctl daemon-reload && sudo systemctl enable --now portfolio-rum'

# 3. В конфиг nginx — блоки /api/rum из deploy/nginx.example.conf, затем
ssh portfolio 'sudo nginx -t && sudo systemctl reload nginx'
```

## Что смотрят посетители

```bash
ssh portfolio 'sudo /usr/local/bin/portfolio-rum report -data /var/lib/portfolio-rum/events.jsonl'
```

Визиты за 30 дней, медиана LCP и JS, устройства, язык, роль, до каких секций досматривают
и по каким контактам кликают. `-days 7` — за неделю.

## Локально

`npm run preview` проксирует `/api/rum` на `127.0.0.1:8090`: запусти рядом `go run . -data /tmp/rum.jsonl`.
