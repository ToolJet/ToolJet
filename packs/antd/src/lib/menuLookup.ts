import { useEffect, useState, type RefObject } from 'react';

// rc-menu (Ant's Menu, and the menu in Ant's Dropdown) finds its items for the arrow keys with
// document.querySelector("[data-menu-id='<menu id>-<key>']"), and the list of a sub-menu opened from the keyboard with
// document.getElementById: lookups from the document, which never reach into a shadow root, where the pack draws its
// menus and their lists. It found no items, so the arrow keys moved nothing and Enter picked nothing (QA AD-16).
// While a pack menu is mounted, those two lookups also search its roots (its widget's and the popup layer's) when the
// document has no match and the lookup names that menu's id. Every other lookup is the document's own, unchanged.

type Anchor = RefObject<Element | null>;
type LookupName = 'querySelector' | 'getElementById';

const menus = new Map<string, Anchor>();
// Ids stay apart from another copy of the pack on the page (a development build beside the built-in one).
const copy = Math.random().toString(36).slice(2, 8);
let count = 0;

// The roots a menu draws in: its widget's shadow root and the popup layer's (the host gives the widget's root its
// layer as tjOverlay).
const rootsOf = (anchor: Anchor): ShadowRoot[] => {
  const root = anchor.current?.getRootNode();
  if (!(root instanceof ShadowRoot)) return [];
  const layer = (root as ShadowRoot & { tjOverlay?: Element }).tjOverlay?.getRootNode();
  return layer instanceof ShadowRoot && layer !== root ? [root, layer] : [root];
};

const searchMenuRoots = (named: string, find: (root: ShadowRoot) => Element | null): Element | null => {
  for (const [id, anchor] of menus) {
    if (!named.includes(`${id}-`)) continue;
    for (const root of rootsOf(anchor)) {
      const found = find(root);
      if (found) return found;
    }
  }
  return null;
};

let installed: {
  ours: Record<LookupName, unknown>;
  before: Record<LookupName, PropertyDescriptor | undefined>;
} | null = null;

const install = () => {
  if (installed || typeof document === 'undefined') return;
  const doc = document;
  const querySelector = doc.querySelector;
  const getElementById = doc.getElementById;
  const ours = {
    querySelector: function (this: Document, selectors: string) {
      const found = querySelector.call(this, selectors);
      if (found || this !== doc) return found;
      return searchMenuRoots(String(selectors), (root) => root.querySelector(selectors));
    },
    getElementById: function (this: Document, elementId: string) {
      const found = getElementById.call(this, elementId);
      if (found || this !== doc) return found;
      return searchMenuRoots(String(elementId), (root) => root.getElementById(elementId));
    },
  };
  installed = {
    ours,
    before: {
      querySelector: Object.getOwnPropertyDescriptor(doc, 'querySelector'),
      getElementById: Object.getOwnPropertyDescriptor(doc, 'getElementById'),
    },
  };
  for (const name of ['querySelector', 'getElementById'] as const)
    Object.defineProperty(doc, name, { configurable: true, writable: true, value: ours[name] });
};

const uninstall = () => {
  if (!installed || typeof document === 'undefined') return;
  for (const name of ['querySelector', 'getElementById'] as const) {
    // Only ours is taken off: a lookup put over it since stays, and ours, under it, just passes through.
    if (Object.getOwnPropertyDescriptor(document, name)?.value !== installed.ours[name]) continue;
    const before = installed.before[name];
    if (before) Object.defineProperty(document, name, before);
    else delete (document as unknown as Record<LookupName, unknown>)[name];
  }
  installed = null;
};

/**
 * The id to give an Ant Menu (its `id`, or a Dropdown's `menu.id`) drawn in the widget that `anchor` is in: while it is
 * mounted, rc-menu's document lookups for that id also search the widget's and the popup layer's shadow roots.
 */
export const useMenuLookup = (anchor: Anchor): string => {
  const [id] = useState(() => `tj-ant-menu-${copy}-${++count}`);
  useEffect(() => {
    menus.set(id, anchor);
    install();
    return () => {
      menus.delete(id);
      if (!menus.size) uninstall();
    };
  }, [id, anchor]);
  return id;
};
