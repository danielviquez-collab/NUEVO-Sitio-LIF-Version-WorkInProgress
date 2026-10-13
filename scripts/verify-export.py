import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

root = Path(__file__).resolve().parent.parent / 'dist' / 'client'
missing = []
external_media = []
checked = set()
worker_routes = {'/juega', '/juega/', '/juega.html', '/juega.rsc'} if (
    (root.parent / 'server' / 'index.js').is_file()
    and (root.parent / '.templates' / 'juega.html').is_file()
) else set()


def check_url(value, origin, media=False):
    if not value or value.startswith(('#', 'data:', 'blob:')):
        return
    url = urlsplit(value)
    if url.scheme or url.netloc:
        if media and url.scheme in ('http', 'https'):
            external_media.append(value)
        return
    path = unquote(url.path)
    if path in worker_routes:
        checked.add(path.lstrip('/'))
        return
    target = root / path.lstrip('/') if path.startswith('/') else origin.parent / path
    if not path:
        target = origin
    checked.add(str(target.relative_to(root)))
    candidates = [target, target.with_name(target.name + '.html'), target / 'index.html']
    if not any(candidate.is_file() for candidate in candidates):
        missing.append({'source': str(origin.relative_to(root)), 'url': value})


class Assets(HTMLParser):
    def __init__(self, origin):
        super().__init__()
        self.origin = origin

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ('src', 'poster'):
            if key in attrs:
                check_url(attrs[key], self.origin, media=True)
        if tag in ('a', 'link') and 'href' in attrs:
            check_url(attrs['href'], self.origin, media=tag == 'link' and attrs.get('rel') == 'stylesheet')
        for candidate in attrs.get('srcset', '').split(','):
            if candidate.strip():
                check_url(candidate.strip().split()[0], self.origin, media=True)


pages = list(root.rglob('*.html'))
for page in pages:
    Assets(page).feed(page.read_text())
for css in root.rglob('*.css'):
    for match in re.finditer(r'url\(\s*[\'\"]?([^\)\'\"]+)', css.read_text()):
        check_url(match.group(1), css, media=True)
report = {'htmlPages': len(pages), 'workerRoutes': sorted(worker_routes), 'checkedResourcePaths': len(checked), 'missing': missing, 'externalMedia': sorted(set(external_media))}
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(1 if missing or external_media else 0)
