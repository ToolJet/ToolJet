// Tab order around the packs' popups.
//
// A pack draws its select lists, menus, calendars and colour panels in the library's shared popup layer, at the end of
// the canvas and outside the widget that opened them. In the page's tab order that layer comes after every widget, so
// Tab from a popup's last control went on to the page around the canvas, a popup that closed under the focus (a Rocket
// Combobox's search) left it on the page's body, and a popup that keeps Tab inside itself (a Radix list or calendar)
// kept it there. ToolJet's own dropdowns and pickers take Tab on to the next component. So a popup the user tabs past
// (forward from its last control, back from its first) closes as Escape closes it, and the focus goes on from the
// control that opened it: to the next component on Tab, back to that control on Shift+Tab, as if the popup sat right
// after it. Dialogs keep their own order: a modal one, or one that holds ToolJet components.

export const POPUP_LAYER_CLASS = 'tj-cc-popup-host';

// How long a popup gets to close (its exit animation, then its own focus restore) before the focus moves on anyway.
export const POPUP_CLOSE_WAIT_MS = 600;

const FOCUSABLE =
  'a[href], area[href], button, input, select, textarea, iframe, summary, [tabindex], [contenteditable]:not([contenteditable="false"])';

// The parent in the flat tree: a slotted element's slot, a shadow root's host, else the parent element.
const flatParent = (node: Node): Node | null => {
  if (node instanceof Element && node.assignedSlot) return node.assignedSlot;
  if (node.parentNode instanceof ShadowRoot) return node.parentNode.host;
  return node.parentNode;
};

const isInert = (el: Element): boolean => {
  for (let node: Node | null = el; node; node = flatParent(node)) {
    if (node instanceof HTMLElement && node.inert) return true;
  }
  return false;
};

const isTabbable = (el: Element): el is HTMLElement => {
  if (!(el instanceof HTMLElement) || !el.matches(FOCUSABLE) || el.tabIndex < 0) return false;
  if ((el as HTMLButtonElement).disabled) return false;
  // Of a group of radios only the checked one takes Tab, or the first while none is checked.
  if (el instanceof HTMLInputElement && el.type === 'radio' && el.name && !el.checked) {
    const group = [
      ...(el.getRootNode() as Document | ShadowRoot).querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    ].filter((radio) => radio.name === el.name && radio.form === el.form);
    if (group.some((radio) => radio.checked) || group[0] !== el) return false;
  }
  if (el.getClientRects().length === 0 || getComputedStyle(el).visibility === 'hidden') return false;
  return !isInert(el);
};

const flatChildren = (node: Element): Element[] => {
  if (node.shadowRoot) return [...node.shadowRoot.children];
  if (node instanceof HTMLSlotElement) {
    const assigned = node.assignedElements({ flatten: true });
    return assigned.length ? assigned : [...node.children];
  }
  return [...node.children];
};

// The part of the page whose order the control is in: a pack dialog's layer for a widget in that dialog's body (its
// light-DOM child), else the page, with every popup layer left out.
const scopeOf = (el: Element): Element => {
  for (let node: Node | null = el; node; node = flatParent(node)) {
    if (node instanceof Element && node.classList.contains(POPUP_LAYER_CLASS)) return node;
  }
  return el.ownerDocument.body;
};

/** The element Tab moves to from `from` (a control the focus is no longer on), in the order of the page's flat tree:
 *  through shadow roots, and a slot's components at the slot. Popup layers other than `from`'s own are left out. */
export const nextTabbable = (from: Element): HTMLElement | null => {
  const scope = scopeOf(from);
  let passed = false;
  let found: HTMLElement | null = null;
  const visit = (node: Element): boolean => {
    if (node !== scope && node.classList.contains(POPUP_LAYER_CLASS)) return false;
    if (node === from) passed = true;
    else if (passed && isTabbable(node)) {
      found = node;
      return true;
    }
    return flatChildren(node).some(visit);
  };
  visit(scope);
  return found;
};

// The widget hosts' last focused control inside their shadow root: the focus event that enters a popup names only the
// host (the control is in another tree).
const innerFocus = new WeakMap<Element, Element>();
// The widget hosts on the page, to find a popup's opener by its ARIA when the focus never sat on it.
const widgetHosts = new Set<HTMLElement>();

/** Remembers the control inside `host` that last had the focus, as the one that opened a popup. */
export const rememberInnerFocus = (host: HTMLElement): (() => void) => {
  const onOut = (e: FocusEvent) => {
    const origin = e.composedPath()[0];
    if (origin instanceof Element && origin !== host) innerFocus.set(host, origin);
  };
  widgetHosts.add(host);
  host.addEventListener('focusout', onOut, true);
  return () => {
    widgetHosts.delete(host);
    host.removeEventListener('focusout', onOut, true);
  };
};

// The control that opened a popup, by its ARIA: the one whose aria-controls names the popup (or a part of it). A Radix
// Select opened with the mouse never takes the focus, so the focus came into its list from wherever it was before.
const controllerOf = (popup: HTMLElement): Element | null => {
  const ids = new Set([popup, ...popup.querySelectorAll('[id]')].map((el) => el.id).filter(Boolean));
  for (const host of widgetHosts) {
    if (!host.isConnected || !host.shadowRoot) continue;
    for (const el of host.shadowRoot.querySelectorAll('[aria-controls]')) {
      if ((el.getAttribute('aria-controls') ?? '').split(/\s+/).some((id) => ids.has(id))) return el;
    }
  }
  return null;
};

// Else the only control on the page that says the popup it opens is open (an accordion's header is no such control).
const onlyOpenTrigger = (): Element | null => {
  const open: Element[] = [];
  for (const host of widgetHosts) {
    if (!host.isConnected || !host.shadowRoot) continue;
    open.push(
      ...host.shadowRoot.querySelectorAll(
        '[aria-expanded="true"][aria-haspopup], [role="combobox"][aria-expanded="true"]'
      )
    );
  }
  return open.length === 1 ? open[0] : null;
};

// The popup an event is in: the layer's top-level element on its path.
const popupOf = (path: EventTarget[], overlay: HTMLElement): HTMLElement | null =>
  (path.find((node) => node instanceof HTMLElement && node.parentNode === overlay) as HTMLElement | undefined) ?? null;

// A dialog: modal, or holding ToolJet components (a pack Dialog's body). Its own focus order stands.
const isDialog = (popup: HTMLElement): boolean =>
  popup.matches('[aria-modal="true"]') || !!popup.querySelector('[aria-modal="true"], slot, [data-tj-slot]');

// Whether the popup has a control the focus reaches from `target` before leaving it. A focus trap's guards (MUI's
// sentinels, a hidden focus catcher) are no such control: they only send the focus back round.
const hasTabbableBeyond = (popup: HTMLElement, target: Element, backward: boolean): boolean =>
  [...popup.querySelectorAll(FOCUSABLE)].some((el) => {
    if (el === target || !isTabbable(el) || el.matches('[data-testid^="sentinel"], [aria-hidden="true"]')) return false;
    const position = target.compareDocumentPosition(el);
    return backward
      ? !!(position & Node.DOCUMENT_POSITION_PRECEDING) && !(position & Node.DOCUMENT_POSITION_CONTAINS)
      : !!(position & Node.DOCUMENT_POSITION_FOLLOWING);
  });

const deepActiveElement = (doc: Document): Element | null => {
  let el: Element | null = doc.activeElement;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
};

/** Takes Tab out of the popups drawn in a popup layer (`host`, with the popups in `overlay`), and gives the focus back
 *  to the control that opened a popup that hid with the focus in it. */
export const keepPopupTabOrder = (host: HTMLElement, overlay: HTMLElement): (() => void) => {
  const owners = new WeakMap<Element, Element>();
  const escapes = new WeakSet<Event>();
  let pending = false;
  // Whether the last press was outside the layer: the focus then left a popup for the page on purpose.
  let pressedOutside = false;

  // Focus entering a popup from outside the layer: the control it came from opened it.
  const onFocusIn = (e: FocusEvent) => {
    const popup = popupOf(e.composedPath(), overlay);
    const from = e.relatedTarget;
    if (!popup || !(from instanceof Element) || from === host || host.contains(from)) return;
    owners.set(popup, innerFocus.get(from) ?? from);
  };

  // A popup that hides with the focus in it (an Ant calendar takes the focus on a click on a day, then closes) left
  // the focus on the page's body, and Tab started over at the top of the page. A ToolJet picker keeps it on its field:
  // the focus goes back to the control that opened the popup. Not after a press outside the layer, nor while the
  // popup still shows (the window lost the focus).
  const onFocusOut = (e: FocusEvent) => {
    // Focus that went to another control is where it should be. A focus that went nowhere names no element.
    if (e.relatedTarget instanceof Element || pending || pressedOutside) return;
    const popup = popupOf(e.composedPath(), overlay);
    if (!popup || isDialog(popup)) return;
    const owner = controllerOf(popup) ?? owners.get(popup);
    if (!(owner instanceof HTMLElement)) return;
    setTimeout(() => {
      const active = deepActiveElement(host.ownerDocument);
      const lost = !active || active === host.ownerDocument.body;
      const shown = popup.isConnected && popup.getClientRects().length > 0;
      if (!lost || shown || !owner.isConnected || owner.getClientRects().length === 0 || isInert(owner)) return;
      owner.focus({ preventScroll: true });
    }, 0);
  };

  const onPress = (e: PointerEvent) => {
    pressedOutside = !e.composedPath().includes(host);
  };
  const onKey = () => {
    pressedOutside = false;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (escapes.has(e) || e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
    const path = e.composedPath();
    const popup = popupOf(path, overlay);
    if (!popup) return;
    if (pending) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    const owner = controllerOf(popup) ?? owners.get(popup) ?? onlyOpenTrigger();
    const target = path[0];
    if (!owner?.isConnected || !(owner instanceof HTMLElement) || !(target instanceof Element) || isDialog(popup))
      return;
    if (hasTabbableBeyond(popup, target, e.shiftKey)) return;
    // Past the popup's last (or first) control: neither the browser (on to the page after the canvas) nor the popup
    // (a loop back inside it, or a close that drops the focus) moves it.
    e.preventDefault();
    e.stopImmediatePropagation();
    pending = true;
    const backward = e.shiftKey;
    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      keyCode: 27,
      bubbles: true,
      cancelable: true,
      composed: true,
    });
    escapes.add(escape);
    target.dispatchEvent(escape);
    const started = performance.now();
    const settle = () => {
      pending = false;
      // The user moved the focus somewhere else meanwhile: it stays there.
      const active = deepActiveElement(host.ownerDocument);
      const ownerHost = owner.getRootNode() instanceof ShadowRoot ? (owner.getRootNode() as ShadowRoot).host : null;
      const untouched =
        !active ||
        active === host.ownerDocument.body ||
        active === owner ||
        popup.contains(active) ||
        (!!ownerHost && (active === ownerHost || ownerHost.shadowRoot?.contains(active)));
      if (!untouched || !owner.isConnected) return;
      (backward ? owner : (nextTabbable(owner) ?? owner)).focus();
    };
    // After the popup has closed (or its wait is over), and after its own restore of the focus (a timer it set as it
    // unmounted), so that restore does not take the focus back.
    const waitForClose = () => {
      const closed = !popup.isConnected || popup.getClientRects().length === 0;
      if (closed || performance.now() - started > POPUP_CLOSE_WAIT_MS) setTimeout(settle, 0);
      else requestAnimationFrame(waitForClose);
    };
    requestAnimationFrame(waitForClose);
  };

  // The Escape sent to close a popup stops at the layer: a ToolJet Modal around the widget closes on a real Escape.
  const onEscape = (e: KeyboardEvent) => {
    if (escapes.has(e)) e.stopPropagation();
  };

  host.addEventListener('focusin', onFocusIn, true);
  host.addEventListener('focusout', onFocusOut, true);
  host.addEventListener('keydown', onKeyDown, true);
  host.addEventListener('keydown', onEscape);
  host.addEventListener('keydown', onKey, true);
  host.ownerDocument.addEventListener('pointerdown', onPress, true);
  return () => {
    host.removeEventListener('focusin', onFocusIn, true);
    host.removeEventListener('focusout', onFocusOut, true);
    host.removeEventListener('keydown', onKeyDown, true);
    host.removeEventListener('keydown', onEscape);
    host.removeEventListener('keydown', onKey, true);
    host.ownerDocument.removeEventListener('pointerdown', onPress, true);
  };
};
