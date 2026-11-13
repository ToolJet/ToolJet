import type React from 'react';

// The inline runtime draws a pack inside a shadow root, where document.activeElement is the shadow host while focus
// moves between elements inside it. Keyboard code that compares document.activeElement (Radix's roving focus and menu
// focusFirst, a hand-written arrow handler) then never sees a focus move land and walks on to the last candidate, or
// treats every element as unfocused. These read focus from the element's own root instead, and move it the way Radix
// would (shadow keyboard audit SP-22, 2026-10-23).

/** The focused element as seen from `node`'s own root (document or shadow root), down through nested open shadow roots;
 *  null when focus is elsewhere. */
export const activeElementIn = (node: Node | null | undefined): Element | null => {
  if (!node) return null;
  const root = node.getRootNode() as Document | ShadowRoot;
  let el: Element | null = (root as Document | ShadowRoot).activeElement ?? null;
  while (el?.shadowRoot?.activeElement) el = el.shadowRoot.activeElement;
  return el;
};

/** Whether focus is on `node` or inside it, read from its own root. */
export const hasFocusWithin = (node: Node | null | undefined): boolean => {
  const active = activeElementIn(node);
  return !!node && !!active && (active === node || node.contains(active));
};

export interface RovingOptions {
  /** Which arrows move: vertical takes Up/Down, horizontal Left/Right, none both (as Radix's roving focus). */
  orientation?: 'horizontal' | 'vertical';
  /** Past the last item comes the first again. */
  loop?: boolean;
  dir?: 'ltr' | 'rtl';
}

type Intent = 'prev' | 'next' | 'first' | 'last';

// Radix's key map (react-roving-focus getFocusIntent).
const intentOf = (key: string, { orientation, dir }: RovingOptions): Intent | undefined => {
  let k = key;
  if (dir === 'rtl') k = k === 'ArrowLeft' ? 'ArrowRight' : k === 'ArrowRight' ? 'ArrowLeft' : k;
  if (orientation === 'vertical' && (k === 'ArrowLeft' || k === 'ArrowRight')) return undefined;
  if (orientation === 'horizontal' && (k === 'ArrowUp' || k === 'ArrowDown')) return undefined;
  switch (k) {
    case 'ArrowLeft':
    case 'ArrowUp':
      return 'prev';
    case 'ArrowRight':
    case 'ArrowDown':
      return 'next';
    case 'Home':
    case 'PageUp':
      return 'first';
    case 'End':
    case 'PageDown':
      return 'last';
    default:
      return undefined;
  }
};

/** The item a navigation key moves focus to among `items` (the enabled ones, in order), from `current`: undefined when
 *  the key does not navigate, null when it does but there is nowhere to go (the end of a list that does not loop). */
export const rovingTarget = (
  items: HTMLElement[],
  current: Element | null,
  key: string,
  options: RovingOptions = {}
): HTMLElement | null | undefined => {
  const intent = intentOf(key, options);
  if (!intent) return undefined;
  if (!items.length) return null;
  if (intent === 'first') return items[0];
  if (intent === 'last') return items[items.length - 1];
  const at = items.indexOf(current as HTMLElement);
  if (at === -1) return intent === 'next' ? items[0] : items[items.length - 1];
  const to = intent === 'next' ? at + 1 : at - 1;
  if (to >= 0 && to < items.length) return items[to];
  return options.loop ? items[(to + items.length) % items.length] : null;
};

/** A keydown on one of `items` (the enabled ones, in order) moves focus as Radix's roving focus does, reading focus
 *  from the items' own root. Returns the item focused, or null when the key was not a move. The key is consumed
 *  (preventDefault) when it navigates, so a Radix item's own roving handler, which checks defaultPrevented, stays out;
 *  call it from a capture handler on the group so it runs before the item's. Keys with a modifier, and keys from
 *  anything inside an item rather than the item, are left alone. */
export const moveRovingFocus = (e: React.KeyboardEvent, items: HTMLElement[], options: RovingOptions = {}): HTMLElement | null => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey || e.nativeEvent.isComposing) return null;
  const target = e.target as HTMLElement;
  if (!items.includes(target)) return null;
  const next = rovingTarget(items, activeElementIn(target) ?? target, e.key, options);
  if (next === undefined) return null;
  e.preventDefault();
  if (!next || next === target) return null;
  next.focus();
  return next;
};

/** Where focus goes when it lands on a roving group itself (Tab into it): its active item (the checked radio, a pressed
 *  toggle), else its current tab stop, else its first enabled item. Radix does this with the same document-based walk,
 *  which in a shadow root ends on the last item. */
export const rovingEntry = (items: HTMLElement[], isActive: (el: HTMLElement) => boolean): HTMLElement | null =>
  items.find(isActive) ?? items.find((el) => el.tabIndex === 0) ?? items[0] ?? null;
