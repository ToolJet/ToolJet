import { showTitleWhenClipped } from '../overflowTitle';

const hover = (element, { scrollWidth, clientWidth }, text = 'does not contains') => {
  Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scrollWidth });
  Object.defineProperty(element, 'clientWidth', { configurable: true, value: clientWidth });
  element.textContent = text;
  showTitleWhenClipped({ currentTarget: element });
  return element.getAttribute('title');
};

describe('Table-FILTERUI-070 a tooltip for text that is cut off', () => {
  test('Table-FILTERUI-070 text wider than its box gets its whole text as the title', () => {
    // Break this catches: a cut-off text ("does ...") that cannot be read in full.
    expect(hover(document.createElement('span'), { scrollWidth: 140, clientWidth: 90 })).toBe('does not contains');
  });

  test('Table-FILTERUI-070 text that fits gets no title', () => {
    // Break this catches: a tooltip repeating text that is already fully visible.
    expect(hover(document.createElement('span'), { scrollWidth: 90, clientWidth: 90 })).toBeNull();
  });

  test('Table-FILTERUI-070 the title goes away when the text no longer overflows', () => {
    // Break this catches: a stale title staying on a box that was widened.
    const element = document.createElement('span');
    hover(element, { scrollWidth: 140, clientWidth: 90 });
    expect(hover(element, { scrollWidth: 90, clientWidth: 90 })).toBeNull();
  });

  test('Table-FILTERUI-070 an input is read by its value', () => {
    // Break this catches: a cut-off typed value showing no title because an input has no text content.
    const input = document.createElement('input');
    input.value = 'a very long filter value';
    Object.defineProperty(input, 'scrollWidth', { configurable: true, value: 200 });
    Object.defineProperty(input, 'clientWidth', { configurable: true, value: 100 });
    showTitleWhenClipped({ currentTarget: input });
    expect(input.getAttribute('title')).toBe('a very long filter value');
  });
});
