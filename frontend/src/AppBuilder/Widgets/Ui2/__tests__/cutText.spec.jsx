import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * Text a UI 2.0 widget cuts (an ellipsis or a line clamp) shows its whole text on hover. A Button group squeezed its
 * labels into fragments and a Carousel cut its title under the image, with no way to read them (Codex round 8, R8O-01
 * and R8O-02). Every widget is mounted (its overlay opened), every element that cuts text is made to overflow, and a
 * pointer over it must give it a title with the whole text, unless the author's own title (a tooltip) covers it.
 * jsdom has no layout, so the overflow is set on each element.
 */
import { act, fireEvent } from '@testing-library/react';
import { NAMES, defaultsOf, installGuards, mountCase, styleDefaultsOf } from './fuzz/harness';
import { OPENS } from './packWidgets';
import { CUTS_TEXT, showCutText } from '../_shared/cutText';

installGuards();

const overflow = (el, cut) => {
  Object.defineProperty(el, 'scrollWidth', { configurable: true, get: () => (cut ? 500 : 50) });
  Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => 50 });
};

describe('[UI2-CUT-TEXT] cut text shows in full on hover', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('sets the whole text while cut, clears it when not, and leaves an author title alone', () => {
    document.body.innerHTML =
      '<span id="a" class="tw-truncate">A long label</span><button title="Explain"><span id="b" class="tw-truncate">Label</span></button>';
    const a = document.getElementById('a');
    overflow(a, true);
    showCutText(a);
    expect(a.title).toBe('A long label');
    overflow(a, false);
    showCutText(a);
    expect(a.hasAttribute('title')).toBe(false);
    const b = document.getElementById('b');
    overflow(b, true);
    showCutText(b);
    expect(b.hasAttribute('title')).toBe(false);
  });

  it.each(NAMES)('%s: every element that cuts text shows it whole on hover', async (name) => {
    const { stats, unmount } = await mountCase({ name, properties: defaultsOf(name), styles: styleDefaultsOf(name) });
    if (OPENS.has(name) && typeof stats.exposed.open === 'function') {
      await act(async () => {
        await stats.exposed.open();
      });
    }
    const missing = [...document.querySelectorAll(CUTS_TEXT)]
      .filter((el) => (el.textContent || '').trim())
      .filter((el) => {
        overflow(el, true);
        fireEvent.pointerOver(el);
        return !(el.title === el.textContent.trim() || el.parentElement?.closest('[title]'));
      })
      .map((el) => `${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}"`);
    unmount();
    expect(missing).toEqual([]);
  });
});
