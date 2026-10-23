"""Run after a full Docusaurus build to catch conflicting crawl/index signals."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parents[1] / 'build'
legacy_versions = ('2.50.0-LTS', '3.0.0-LTS', '3.5.0-LTS')
assert root.exists(), 'Run a full Docusaurus build first (without build_lts).'
robots = (root / 'robots.txt').read_text()
urls = [node.text for node in ET.parse(root / 'sitemap.xml').iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')]
legacy_count = 0
for version in legacy_versions:
    pages = list((root / 'docs' / version).rglob('*.html'))
    assert pages, f'Missing {version} output; run a full build.'
    for page in pages:
        assert re.search(r'<meta[^>]+name="robots"[^>]+content="[^"]*noindex', page.read_text()), f'Missing noindex: {page}'
    assert not any(version.lower() in url.lower() for url in urls), f'{version} appears in sitemap'
    assert not any(line.lower().startswith('disallow:') and version.lower() in line.lower() for line in robots.splitlines()), f'{version} noindex is blocked by robots.txt'
    legacy_count += len(pages)
for path in ('docs/', 'api/tooljet-api/workspaces/get-all-workspaces/'):
    html = (root / path / 'index.html').read_text()
    assert not re.search(r'<meta[^>]+name="robots"[^>]+content="[^"]*noindex', html), f'Current content is noindex: {path}'
    assert f'https://docs.tooljet.com/{path}' in urls, f'Missing current content from sitemap: {path}'
assert 'Sitemap: https://docs.tooljet.com/sitemap.xml' in robots
print(f'PASS: {legacy_count} legacy pages have crawlable noindex; {len(urls)} sitemap URLs exclude legacy versions; current docs and API reference stay indexable.')
