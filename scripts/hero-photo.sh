#!/bin/sh
# Фото в hero из любого исходника: квадратная обрезка → static/img/photo-<хеш>-{300,400,600}.{avif,webp}
# и -600.jpg (резерв и картинка в JSON-LD). Хеш исходника и обрезки в имени — после замены
# браузеры не возьмут старое фото из кэша (nginx кэширует картинки на 30 дней).
# Нужен ImageMagick с AVIF: brew install imagemagick
#
#   scripts/hero-photo.sh static/img/og-image.jpg 630x630+420+0
#
# Обрезка — ШxВ+X+Y в пикселях исходника; квадрат от 600 px, иначе на ретине фото будет мыльным
set -eu

src=$1
crop=$2
hash=$({ cat "$src"; printf '%s' "$crop"; } | shasum -a 256 | cut -c1-8)
out=static/img/photo-$hash

for w in 300 400 600; do
    magick "$src" -crop "$crop" +repage -resize "${w}x${w}" -strip -quality 50 "$out-$w.avif"
    magick "$src" -crop "$crop" +repage -resize "${w}x${w}" -strip -quality 80 "$out-$w.webp"
done
magick "$src" -crop "$crop" +repage -resize 600x600 -strip -quality 85 -interlace JPEG "$out-600.jpg"

ls -l "$out"-*
echo "Дальше: PHOTO = '/img/photo-$hash' в src/lib/site.ts и удалить прежние static/img/photo-*"
