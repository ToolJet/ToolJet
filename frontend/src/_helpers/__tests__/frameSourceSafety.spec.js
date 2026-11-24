import { isScriptSchemeUrl, toSafeFrameSrc } from '@/_helpers/frameSourceSafety';

describe('frame source safety', () => {
  // Break this catches: a check that skips browser URL normalization lets obfuscated script URLs through.
  test.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'jAvAsCrIpT:alert(1)',
    '  javascript:alert(1)',
    '\u0000javascript:alert(1)',
    '\u001f javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'j\ra\tv\na\tscript:alert(1)',
    'javascript\n:alert(1)',
    'vbscript:msgbox(1)',
    '\tVBScript:msgbox(1)',
  ])('blocks %j', (url) => {
    expect(isScriptSchemeUrl(url)).toBe(true);
    expect(toSafeFrameSrc(url)).toBe('about:blank');
  });

  // Break this catches: an over-broad match that breaks saved apps embedding ordinary or non-http URLs (D-01).
  test.each([
    'https://example.com/',
    'http://example.com/?next=javascript:alert(1)',
    '//cdn.example.com/embed',
    '/applications/my-app',
    'docs/javascript:intro',
    'javascript-guide.html',
    '#javascript:x',
    'data:text/html,<p>hi</p>',
    'blob:https://example.com/0f1e',
    'about:blank',
    'java%73cript:alert(1)',
    '',
  ])('allows %j unchanged', (url) => {
    expect(isScriptSchemeUrl(url)).toBe(false);
    expect(toSafeFrameSrc(url)).toBe(url);
  });

  // Break this catches: throwing or coercing on a non-string reaching the helper from an unvalidated caller.
  test.each([undefined, null, 123])('passes non-string %p through', (value) => {
    expect(isScriptSchemeUrl(value)).toBe(false);
    expect(toSafeFrameSrc(value)).toBe(value);
  });
});
