// Keyboard focus for pack dialogs (Ant Modal and Drawer, MUI Dialog, Rocket Dialog).
//
// A pack draws its dialogs in a popup layer that is a shadow root, and a dialog's body components are light-DOM children
// of that layer projected through a <slot>. The libraries' own focus traps compare document.activeElement, which is only
// ever the layer's host from outside a shadow root, so a real Tab left an open dialog and reached the page behind it;
// and they restore focus on close to the element that was active when they opened, which is the widget's host, not the
// trigger button inside it, so focus fell to the page body.
//
// A pack marks the element that holds a dialog's controls with data-tj-modal="open" while it is open. The host keeps Tab
// and Shift+Tab inside the topmost open one (through slots and nested shadow roots), and a widget's host hands a
// focus() call to the element last focused inside it.

export const MODAL_ATTR = 'data-tj-modal';

/** The focused element, inside every open shadow root on the way. */
export const deepActiveElement = (): Element | null => {
  let el: Element | null = document.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
};

/** The node a node is drawn in: its slot when slotted, the host for a shadow root's child, else its parent. */
const flatParent = (node: Node): Node | null => {
  if (node instanceof Element && node.assignedSlot) return node.assignedSlot;
  const parent = node.parentNode;
  if (parent instanceof ShadowRoot) return parent.host;
  return parent;
};

/** Whether `node` is drawn inside `ancestor`, across shadow roots and slots. */
export const flatContains = (ancestor: Node, node: Node | null): boolean => {
  for (let n: Node | null = node; n; n = flatParent(n)) if (n === ancestor) return true;
  return false;
};

const NATIVE_FOCUSABLE =
  'a[href], button, input, select, textarea, summary, iframe, [contenteditable=""], [contenteditable="true"]';

const skipsSubtree = (el: Element): boolean => {
  if (el.hasAttribute('inert') || el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') return true;
  const view = el as HTMLElement & { checkVisibility?: (o?: object) => boolean };
  // jsdom has no layout; a browser drops what is not drawn (display: none, a closed details).
  return typeof view.checkVisibility === 'function' ? !view.checkVisibility({ visibilityProperty: true }) : false;
};

const isTabbable = (el: Element): el is HTMLElement => {
  if (!(el instanceof HTMLElement)) return false;
  if ((el as HTMLButtonElement).disabled) return false;
  if (el.tabIndex < 0) return false;
  if (el instanceof HTMLInputElement && el.type === 'hidden') return false;
  return el.matches(NATIVE_FOCUSABLE) || el.hasAttribute('tabindex');
};

/** The elements Tab reaches inside `root`, in order, through slots and open shadow roots. */
export const tabbablesIn = (root: Element): HTMLElement[] => {
  const out: HTMLElement[] = [];
  const visit = (el: Element) => {
    if (skipsSubtree(el)) return;
    if (isTabbable(el)) out.push(el);
    if (el instanceof HTMLSlotElement) {
      const assigned = el.assignedElements({ flatten: true });
      (assigned.length ? assigned : Array.from(el.children)).forEach(visit);
      return;
    }
    if (el.shadowRoot) Array.from(el.shadowRoot.children).forEach(visit);
    else Array.from(el.children).forEach(visit);
  };
  visit(root);
  return out;
};

type ModalSource = () => Element[];
let source: ModalSource = () => [];
let installed = false;

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Tab' || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
  const modals = source();
  const modal = modals[modals.length - 1];
  if (!modal) return;
  const items = tabbablesIn(modal);
  const active = deepActiveElement();
  const inside = flatContains(modal, active);
  if (!items.length) {
    if (inside) e.preventDefault();
    return;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const listed = items.includes(active as HTMLElement);
  let target: HTMLElement | null = null;
  // From outside (focus left by a click behind the mask, or never moved in): into the dialog.
  if (!inside) target = e.shiftKey ? last : first;
  // At either end: around to the other. From the dialog's own frame (focused on open, not in the Tab order) Shift+Tab
  // goes to the last control rather than out.
  else if (!e.shiftKey && active === last) target = first;
  else if (e.shiftKey && (active === first || !listed)) target = last;
  if (!target) return;
  e.preventDefault();
  target.focus();
};

/** Keeps Tab inside the topmost open pack dialog that `modals` lists (last is topmost). Installed once per page. */
export const installModalFocusTrap = (modals: ModalSource): void => {
  source = modals;
  if (installed) return;
  installed = true;
  document.addEventListener('keydown', onKeyDown, true);
};

/** A focus() call on the widget's host (a library restoring focus to what was active when its dialog opened) goes to
 *  the element last focused inside the widget, while it is still there. */
export const restoreFocusInside = (host: HTMLElement, root: ShadowRoot): (() => void) => {
  let last: HTMLElement | null = null;
  const onFocusIn = (e: Event) => {
    const origin = e.composedPath()[0];
    if (origin instanceof HTMLElement && origin !== host) last = origin;
  };
  root.addEventListener('focusin', onFocusIn);
  const own = Object.getOwnPropertyDescriptor(host, 'focus');
  Object.defineProperty(host, 'focus', {
    configurable: true,
    value(options?: FocusOptions) {
      if (last && last.isConnected && flatContains(host, last)) last.focus(options);
      else HTMLElement.prototype.focus.call(host, options);
    },
  });
  return () => {
    root.removeEventListener('focusin', onFocusIn);
    if (own) Object.defineProperty(host, 'focus', own);
    else delete (host as { focus?: unknown }).focus;
  };
};
