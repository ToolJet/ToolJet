// ToolJet UI 2.0: keyboard focus for the Dialog. ToolJet's ModalV2 turns react-bootstrap's focus
// enforcement off (enforceFocus, restoreFocus), so Tab walked out of an open dialog into the page behind it, and
// closing it left focus nowhere. A strict trap would also steal focus from the pack's popovers (a select list, a
// calendar), which render outside the dialog; this one only wraps Tab at the dialog's ends.

/** An element that may take focus (an HTML or SVG element has focus(); others do not). */
export type Focusable = Element & Partial<HTMLOrSVGElement>;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const hidden = (el: Element, root: Element): boolean => {
  for (let n: Element | null = el; n && n !== root.parentElement; n = n.parentElement) {
    if ((n instanceof HTMLElement && n.hidden) || n.getAttribute?.('aria-hidden') === 'true') return true;
    const cs = typeof getComputedStyle === 'function' ? getComputedStyle(n) : null;
    if (cs && (cs.display === 'none' || cs.visibility === 'hidden')) return true;
  }
  return false;
};

/** The elements Tab reaches inside `root`, in order. */
export const focusables = (root: Element | null | undefined): HTMLElement[] =>
  root ? [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !hidden(el, root)) : [];

/** A keydown handler's work: Tab from the last field goes to the first, Shift+Tab from the first to the last, and Tab
 *  with focus lost to the page body comes back into the dialog. Focus elsewhere (a popover, the editor) is left. */
export const trapTab = (event: KeyboardEvent, root: Element | null | undefined): boolean => {
  if (event.key !== 'Tab' || !root) return false;
  const active = typeof document !== 'undefined' ? document.activeElement : null;
  const inside = !!active && root.contains(active);
  if (!inside && active && active !== document.body) return false;
  const list = focusables(root);
  if (!list.length) return false;
  const first = list[0];
  const last = list[list.length - 1];
  let target: HTMLElement | null = null;
  if (!inside) target = event.shiftKey ? last : first;
  else if (!event.shiftKey && active === last) target = first;
  else if (event.shiftKey && (active === first || active === root || !list.some((el) => el === active))) target = last;
  if (!target) return false;
  event.preventDefault();
  target.focus();
  return true;
};

// What opened a dialog: the last element focused or pressed outside any dialog. By the time the dialog's own effect
// runs, react-bootstrap has already moved focus into it; Safari does not focus a pressed button at all.
let lastOutside: Focusable | null = null;
let listening = false;
const remember = (e: Event) => {
  const el = e.target instanceof Element ? e.target.closest(FOCUSABLE) || e.target : null;
  if (el && !el.closest('.modal, [data-radix-popper-content-wrapper]')) lastOutside = el;
};
export const watchOpeners = () => {
  if (listening || typeof document === 'undefined') return;
  listening = true;
  document.addEventListener('focusin', remember, true);
  document.addEventListener('pointerdown', remember, true);
};
/** The element to give focus back to when a dialog that just opened closes. */
export const openerOf = (): Focusable | null => (lastOutside?.isConnected ? lastOutside : null);
