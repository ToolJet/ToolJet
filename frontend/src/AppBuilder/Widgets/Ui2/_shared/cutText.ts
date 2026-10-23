// The whole text of a cut line, on hover: a label, title or caption that ends in an ellipsis (or a clamp) shows its
// full text as its title while the pointer is on it, and only while it is cut. Shell does this for every element in a
// UI 2.0 widget (its popups too), so no widget needs its own: a Button group squeezed its labels into fragments, and a
// Carousel's title under its image was cut, with no way to read them (Codex round 8, R8O-01 and R8O-02). A title the
// author set on the element or around it (a button's tooltip) is left alone.

/** The elements that cut their text: Tailwind's truncate, a line clamp, or an ellipsis. */
export const CUTS_TEXT = '.tw-truncate, [class*="tw-line-clamp-"], .tw-text-ellipsis';
const OURS = 'data-cut-title';

const isCut = (el: HTMLElement): boolean =>
  el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;

/** Sets or clears the full-text title of the cut-text element at `target`, if any. */
export const showCutText = (target: EventTarget | null): void => {
  const el = (target as Element | null)?.closest?.(CUTS_TEXT) as HTMLElement | null;
  if (!el) return;
  const ours = el.hasAttribute(OURS);
  // The author's own title, on the element or on what holds it (a button's tooltip), wins.
  if (!ours && el.closest('[title]')) return;
  const text = (el.textContent || '').trim();
  if (text && isCut(el)) {
    el.title = text;
    el.setAttribute(OURS, '');
  } else if (ours) {
    el.removeAttribute('title');
    el.removeAttribute(OURS);
  }
};
