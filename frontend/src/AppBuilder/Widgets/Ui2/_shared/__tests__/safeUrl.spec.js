import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
import { safeImageUrl, safeUrl } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// A bound URL is data: it reaches an href, window.open or an image's src only when it cannot run script.
describe('safeUrl', () => {
  it.each([
    'https://tooljet.com/docs',
    'http://localhost:8082/a?b=1#c',
    'mailto:ada@example.com',
    'tel:+441234567',
    '/applications/1',
    './next',
    '#section',
    '//cdn.example.com/a',
    'www.example.com',
  ])('keeps %s', (url) => expect(safeUrl(url)).toBe(url));

  it.each([
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    '\u0001javascript:alert(1)',
    'vbscript:msgbox(1)',
    'data:text/html,<script>alert(1)</script>',
    'data:image/png;base64,AAAA',
    'file:///etc/passwd',
  ])('drops %j', (url) => expect(safeUrl(url)).toBe(''));

  it('reads junk as no URL', () => {
    expect([null, undefined, {}, [], 12].map(safeUrl)).toEqual(['', '', '', '', '12']);
  });
});

describe('safeImageUrl', () => {
  it('also keeps data:image and blob: sources', () => {
    expect(safeImageUrl('data:image/png;base64,AAAA')).toBe('data:image/png;base64,AAAA');
    expect(safeImageUrl('blob:http://localhost/1')).toBe('blob:http://localhost/1');
    expect(safeImageUrl('https://example.com/a.png')).toBe('https://example.com/a.png');
  });
  it('drops script and HTML sources', () => {
    expect(safeImageUrl('javascript:alert(1)')).toBe('');
    expect(safeImageUrl('data:text/html,<script>alert(1)</script>')).toBe('');
    expect(safeImageUrl('data:image/svg+xml,<svg onload=alert(1)>')).toBe('data:image/svg+xml,<svg onload=alert(1)>');
  });
});
