import createCache from '@emotion/cache';
import type { EmotionCache } from '@emotion/cache';
import { StyleSheet } from '@emotion/sheet';

// MUI styles through Emotion, which writes a <style> per rule into document.head by default. Inline in ToolJet every
// component lives in its own shadow root and its popups in the library's shared popup layer (another shadow root), and
// document styles reach neither. So each pack instance gets its own cache whose sheet writes every rule into both:
// its component's shadow root and the popup layer's.

const KEY = 'mui';

// One real sheet per container, shared by every instance writing to it (all instances write into the one popup layer),
// so a rule lands once per container. A container emptied by the host (it re-creates the shadow root's children on a
// library revision change) gets a fresh sheet.
type Target = { sheet: StyleSheet; seen: Set<string> };
const targets = new WeakMap<Node, Target>();
const targetFor = (container: Node): Target => {
  let target = targets.get(container);
  if (!target || (target.sheet.tags.length > 0 && !target.sheet.tags[0].isConnected)) {
    target = { sheet: new StyleSheet({ key: KEY, container: container as HTMLElement, speedy: true }), seen: new Set() };
    targets.set(container, target);
  }
  return target;
};
const put = (target: Target, rule: string) => {
  if (target.seen.has(rule)) return;
  target.seen.add(rule);
  target.sheet.insert(rule);
};

/**
 * The sheet Emotion's cache inserts into. It keeps the rules it was given and replays them into each container as it
 * is attached: the component renders (and Emotion inserts) before its layout effect knows the shadow root and the
 * popup layer, so the first rules wait here until then, still before the first paint.
 */
export class PackSheet {
  key = KEY;
  nonce: string | undefined = undefined;
  isSpeedy = true;
  before: Element | null = null;
  container: Node;
  private rules: string[] = [];
  private attached: Target[] = [];

  constructor(container: Node) {
    this.container = container;
  }

  /** The first attached container's tags (Emotion's <Global> inserts its own sheet before them). */
  get tags(): HTMLStyleElement[] {
    return this.attached[0]?.sheet.tags ?? [];
  }

  attach(container: Node) {
    const target = targetFor(container);
    if (this.attached.includes(target)) return;
    if (!this.attached.length) this.container = container;
    this.attached.push(target);
    for (const rule of this.rules) put(target, rule);
  }

  insert(rule: string) {
    this.rules.push(rule);
    for (const target of this.attached) put(target, rule);
  }

  hydrate() {}

  flush() {
    this.rules = [];
  }
}
// Emotion's <Global> makes its own sheet with `new cache.sheet.constructor(...)`: a plain one, in the first container.
Object.defineProperty(PackSheet.prototype, 'constructor', { value: StyleSheet });

/** A cache for one pack instance. `container` is a detached element until attach() is given the real roots. */
export const createPackCache = (): EmotionCache & { sheet: PackSheet } => {
  const parked = typeof document === 'undefined' ? undefined : document.createElement('div');
  const cache = createCache({ key: KEY, container: parked, speedy: true, prepend: false });
  if (parked) (cache as { sheet: unknown }).sheet = new PackSheet(parked);
  return cache as EmotionCache & { sheet: PackSheet };
};
