export const prerender = true
// Страница — папка с index.html (/en/ → en/index.html). Иначе рядом лежали бы en.html и папка en/
// для /en/fullstack, и статический хостинг (GitHub Pages) отвечал бы на /en редиректом на /en/ и 404
export const trailingSlash = 'always'
