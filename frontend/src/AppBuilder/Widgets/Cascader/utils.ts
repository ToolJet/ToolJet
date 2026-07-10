import { getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import type {
  CascaderNode,
  CascaderOption,
  CascaderOptionControlValue,
  CascaderPathMaps,
  CascaderSelection,
  CascaderValue,
} from './types';

const resolveOptionControlValue = (
  value: CascaderOptionControlValue,
  getResolvedValue: (value: unknown) => unknown
) => {
  const rawValue =
    value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'value')
      ? (value as { value?: unknown }).value
      : value;
  return getResolvedValue(rawValue);
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
    .join(',')}}`;
};

export const getCascaderValueKey = (value: CascaderValue): string => {
  const type = Array.isArray(value) ? 'array' : typeof value;
  return `${type}:${stableStringify(value)}`;
};

export const areCascaderValuesEqual = (a: CascaderValue, b: CascaderValue): boolean =>
  getCascaderValueKey(a) === getCascaderValueKey(b);

/**
 * Recursively normalize a hierarchical option tree for the Cascader.
 *
 * - Resolves per-node `visible` / `disable` via the passed `getResolvedValue`
 *   (handles both the static `{ value: ... }` inspector shape and plain dynamic values).
 * - Drops hidden nodes entirely. A hidden parent removes its whole branch — its
 *   descendants are not reachable even if individually visible.
 * - Normalizes labels to a safely renderable value.
 *
 * Returns nodes shaped `{ label, value, disabled, children }`.
 */
export const normalizeTree = (
  items: unknown,
  getResolvedValue: (value: unknown) => unknown
): CascaderNode[] => {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is CascaderOption => item !== null && typeof item === 'object')
    .filter((item) => resolveOptionControlValue(item?.visible, getResolvedValue) !== false)
    .map((item) => {
      const children = Array.isArray(item?.children) ? normalizeTree(item.children, getResolvedValue) : undefined;
      return {
        label: getSafeRenderableValue(getResolvedValue(item?.label)) as string,
        value: getResolvedValue(item?.value) as CascaderValue,
        disabled: resolveOptionControlValue(item?.disable, getResolvedValue) === true,
        children: children && children.length > 0 ? children : undefined,
      };
    });
};

/**
 * Build lookup maps from a normalized tree.
 * - valuePathObj: value -> [ancestorValues..., value]
 * - labelPathObj: value -> [ancestorLabels..., label]
 * - leafSet: Set of values that have no children (selectable least-child nodes)
 * - valueToNode: value -> node
 */
export const buildPathMaps = (tree: CascaderNode[]): CascaderPathMaps => {
  const valuePathObj: CascaderPathMaps['valuePathObj'] = {};
  const labelPathObj: CascaderPathMaps['labelPathObj'] = {};
  const leafSet = new Set<string>();
  const valueToNode: CascaderPathMaps['valueToNode'] = {};

  const walk = (nodes: CascaderNode[], parentValues: CascaderValue[] = [], parentLabels: string[] = []) => {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      const valueKey = getCascaderValueKey(node.value);
      if (valueToNode[valueKey]) continue;
      const currentValues = [...parentValues, node.value];
      const currentLabels = [...parentLabels, node.label];
      valuePathObj[valueKey] = currentValues;
      labelPathObj[valueKey] = currentLabels;
      valueToNode[valueKey] = node;
      if (node.children && node.children.length > 0) {
        walk(node.children, currentValues, currentLabels);
      } else {
        leafSet.add(valueKey);
      }
    }
  };

  walk(tree);
  return { valuePathObj, labelPathObj, leafSet, valueToNode };
};

/** Empty selection contract — exposed when nothing valid is selected. */
export const emptySelection: CascaderSelection = {
  value: null,
  selectedOption: null,
  pathArray: [],
  pathLabels: [],
  pathString: '',
};

/**
 * Compute the selected exposed-variable bundle for a given leaf value.
 * Returns `emptySelection` when the value is not a selectable leaf.
 */
export const computeSelection = (
  value: CascaderValue | null | undefined,
  maps: CascaderPathMaps,
  pathSeparator?: string
): CascaderSelection => {
  const { valuePathObj, labelPathObj, leafSet, valueToNode } = maps;
  if (value === null || value === undefined) {
    return { ...emptySelection };
  }

  const valueKey = getCascaderValueKey(value);
  if (!leafSet.has(valueKey)) {
    return { ...emptySelection };
  }
  const node = valueToNode[valueKey];
  const pathArray = valuePathObj[valueKey] ?? [];
  const pathLabels = labelPathObj[valueKey] ?? [];
  return {
    value: node?.value,
    selectedOption: { label: node?.label, value: node?.value },
    pathArray,
    pathLabels,
    pathString: pathLabels.join(pathSeparator ?? ''),
  };
};

/**
 * Find the selected value from a dynamic-options schema: the first visible leaf
 * node whose `default` resolves truthy. Parent nodes and hidden branches are
 * ignored (selection is least-child only). Returns undefined when none.
 */
export const findDefaultValue = (
  items: unknown,
  getResolvedValue: (value: unknown) => unknown
): CascaderValue | undefined => {
  if (!Array.isArray(items)) return undefined;
  for (const item of items as CascaderOption[]) {
    if (resolveOptionControlValue(item?.visible, getResolvedValue) === false) continue;
    const children = Array.isArray(item?.children) ? item.children : null;
    if (children && children.length > 0) {
      const found = findDefaultValue(children, getResolvedValue);
      if (found !== undefined) return found;
    } else if (resolveOptionControlValue(item?.default, getResolvedValue) === true) {
      return getResolvedValue(item?.value);
    }
  }
  return undefined;
};

/** Get the child list at a given drilldown path (array of parent values). */
export const getNodesAtPath = (tree: CascaderNode[], pathValues: CascaderValue[]): CascaderNode[] => {
  let nodes = tree;
  for (const value of pathValues) {
    const next = nodes?.find((n) => areCascaderValuesEqual(n.value, value));
    if (!next || !next.children) return [];
    nodes = next.children;
  }
  return nodes ?? [];
};
