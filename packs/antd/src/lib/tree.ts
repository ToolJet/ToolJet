import { toArray } from './data';

/** How deep and how large a tree (TreeSelect, Tree, Cascader, a menu's submenus) is taken from bound data. */
export const TREE_LIMITS = { depth: 64, nodes: 10000 };

let warned = false;

/**
 * A tree from bound data ([{ ..., children: [...] }]) through `node`, which builds one item and calls `children()` for
 * its normalised children. Bounded: past TREE_LIMITS.depth levels or TREE_LIMITS.nodes items the rest is left out, and
 * a node that is its own ancestor (a cycle a JS binding can build) is skipped, with one console warning. Unbounded
 * recursion overflowed the stack on a 5,000-level tree (Codex review CODE-05, 2026-10-25), and a cycle never ended.
 */
export const boundedTree = <T,>(raw: unknown, node: (item: unknown, index: number, children: () => T[]) => T | null): T[] => {
  let count = 0;
  let cut = '';
  const ancestors = new Set<unknown>();
  const level = (list: unknown, depth: number): T[] => {
    const items = toArray(list);
    if (!items.length) return [];
    if (depth > TREE_LIMITS.depth) {
      cut ||= `deeper than ${TREE_LIMITS.depth} levels`;
      return [];
    }
    const out: T[] = [];
    for (let i = 0; i < items.length; i++) {
      if (count >= TREE_LIMITS.nodes) {
        cut ||= `more than ${TREE_LIMITS.nodes} items`;
        break;
      }
      const item = items[i];
      if (item && typeof item === 'object' && ancestors.has(item)) {
        cut ||= 'an item inside itself';
        continue;
      }
      count += 1;
      const children = () => {
        if (!item || typeof item !== 'object') return [];
        ancestors.add(item);
        try {
          return level((item as Record<string, unknown>).children, depth + 1);
        } finally {
          ancestors.delete(item);
        }
      };
      const built = node(item, i, children);
      if (built) out.push(built);
    }
    return out;
  };
  const tree = level(raw, 1);
  if (cut && !warned) {
    warned = true;
    console.warn(`[ToolJet pack] tree data has ${cut}; the rest is not shown.`);
  }
  return tree;
};
