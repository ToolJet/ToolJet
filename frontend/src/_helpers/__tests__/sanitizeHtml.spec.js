import { sanitizeHtml, sanitizeSvg } from '../sanitizeHtml';

// Parse sanitizer output the way the app does (innerHTML) and report anything
// that could execute: dangerous elements, on* handlers, or script-scheme URLs.
const executableParts = (html) => {
  const root = document.createElement('div');
  root.innerHTML = html;
  const found = [];
  root.querySelectorAll('*').forEach((el) => {
    const tag = el.tagName.toLowerCase();
    if (['script', 'iframe', 'object', 'embed', 'foreignobject', 'animate', 'set', 'meta', 'base'].includes(tag)) {
      found.push(`<${tag}>`);
    }
    Array.from(el.attributes).forEach(({ name, value }) => {
      if (/^on/i.test(name)) found.push(`${tag}[${name}]`);
      const urlAttr = /^(href|src|action|formaction|xlink:href|poster|background)$/i.test(name);
      // eslint-disable-next-line no-control-regex
      if (urlAttr && /^(javascript|vbscript|data:text)/i.test(value.replace(/[\x00-\x20]/g, ''))) {
        found.push(`${tag}[${name}]`);
      }
    });
  });
  return found;
};

const ATTACKS = [
  '<script>alert(1)</script>ok',
  '<img src=x onerror=alert(1)>',
  '<a href="javascript:alert(1)">x</a>',
  '<a href="JaVaScRiPt:alert(1)">x</a>',
  '<a href="java&#x09;script:alert(1)">x</a>',
  '<a href="vbscript:msgbox(1)">x</a>',
  '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>',
  '<iframe src="https://evil.example"></iframe>',
  '<object data="x.swf"></object><embed src="x.swf">',
  '<svg onload=alert(1)><circle r="5"/></svg>',
  '<svg><script>alert(1)</script></svg>',
  '<svg><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>',
  '<svg><use href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=#x"/></svg>',
  '<svg><foreignObject><img src=x onerror=alert(1)></foreignObject></svg>',
  '<svg><animate attributeName="href" to="javascript:alert(1)"/></svg>',
  '<div onclick="alert(1)" onmouseover="alert(1)">x</div>',
  '<form action="javascript:alert(1)"><button>b</button></form>',
  '<button formaction="javascript:alert(1)">b</button>',
  '<math><mtext><table><mglyph><style><img src=x onerror=alert(1)>',
  '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
  '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
  '<base href="https://evil.example/">',
];

describe('sanitizeHtml', () => {
  describe('removes executable content', () => {
    test.each(ATTACKS)('default mode: %s', (payload) => {
      expect(executableParts(sanitizeHtml(payload))).toEqual([]);
    });

    test.each(ATTACKS)('html widget mode: %s', (payload) => {
      expect(executableParts(sanitizeHtml(payload, { htmlWidget: true }))).toEqual([]);
    });
  });

  test('keeps ordinary formatting, links, images, tables and inline styles', () => {
    const input =
      '<p>Hi <b>bold</b> <i>it</i> <a href="https://tooljet.com" title="t">link</a> <a href="/rel#x">rel</a></p>' +
      '<img src="https://example.com/a.png" alt="a" width="10">' +
      '<img src="data:image/png;base64,iVBORw0KGgo=" alt="d">' +
      '<table><tr><td colspan="2">cell</td></tr></table>' +
      '<div class="c" id="i" style="color: red" data-x="1" aria-label="l">styled</div>';
    const root = document.createElement('div');
    root.innerHTML = sanitizeHtml(input);

    expect(root.querySelector('b').textContent).toBe('bold');
    expect(root.querySelector('a[href="https://tooljet.com"]')).not.toBeNull();
    expect(root.querySelector('a[href="/rel#x"]')).not.toBeNull();
    expect(root.querySelectorAll('img')).toHaveLength(2);
    expect(root.querySelector('img[src^="data:image/png"]')).not.toBeNull();
    expect(root.querySelector('td').getAttribute('colspan')).toBe('2');
    const div = root.querySelector('div');
    expect(div.getAttribute('style')).toBe('color: red');
    expect(div.dataset.x).toBe('1');
    expect(div.getAttribute('aria-label')).toBe('l');
  });

  test('keeps inline SVG icons inside HTML', () => {
    const out = sanitizeHtml('<p>icon <svg viewBox="0 0 24 24"><path d="M0 0h24"/></svg></p>');
    expect(out).toContain('<path d="M0 0h24">');
    expect(out).toContain('viewbox="0 0 24 24"');
  });

  test('drops <style> blocks and link targets outside the Html widget', () => {
    const out = sanitizeHtml('<style>.x{color:red}</style><a href="https://a.com" target="_top">a</a>');
    expect(out).not.toContain('<style');
    expect(out).toBe('<a href="https://a.com">a</a>');
  });

  test('html widget mode keeps <style> blocks and opens links and forms in a new tab', () => {
    const out = sanitizeHtml(
      '<style>.x{color:red}</style><a href="https://a.com" target="_self">a</a><form action="/f"></form>',
      { htmlWidget: true }
    );
    expect(out).toContain('<style>.x{color:red}</style>');
    expect(out).toContain('<a href="https://a.com" target="_blank" rel="noopener">a</a>');
    expect(out).toContain('<form action="/f" target="_blank" rel="noopener">');
  });

  test.each([
    [null, ''],
    [undefined, ''],
    [42, '42'],
    ['', ''],
  ])('coerces %p to a string', (input, expected) => {
    expect(sanitizeHtml(input)).toBe(expected);
  });
});

describe('sanitizeSvg', () => {
  test.each(ATTACKS)('removes executable content: %s', (payload) => {
    expect(executableParts(sanitizeSvg(payload))).toEqual([]);
  });

  test('keeps gradients, clip paths, filters and same-document <use> references', () => {
    const out = sanitizeSvg(
      '<svg viewBox="0 0 10 10"><defs><linearGradient id="g"><stop offset="0" stop-color="red"/></linearGradient>' +
        '<clipPath id="c"><rect width="5" height="5"/></clipPath><filter id="f"><feGaussianBlur stdDeviation="1"/></filter></defs>' +
        '<rect width="10" height="10" fill="url(#g)" clip-path="url(#c)" filter="url(#f)"/><use href="#g"/></svg>'
    );
    expect(out).toContain('<linearGradient id="g">');
    expect(out).toContain('<clipPath id="c">');
    expect(out).toContain('<feGaussianBlur stddeviation="1">');
    expect(out).toContain('fill="url(#g)"');
    expect(out).toContain('<use href="#g">');
  });

  test('drops non-SVG elements but keeps their text', () => {
    expect(sanitizeSvg('<svg><rect width="1" height="1"/></svg><p>caption</p>')).toBe(
      '<svg><rect width="1" height="1"></rect></svg>caption'
    );
  });

  test('strips external <use> references', () => {
    expect(sanitizeSvg('<svg><use href="https://evil.example/sprite.svg#x"/></svg>')).toBe('<svg><use></use></svg>');
  });
});
