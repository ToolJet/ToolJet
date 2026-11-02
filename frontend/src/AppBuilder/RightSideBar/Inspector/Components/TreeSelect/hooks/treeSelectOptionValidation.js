import { getSafeRenderableValue } from '@/AppBuilder/Widgets/utils';
import { duplicateValueMessage, objectLabelMessage } from '@/AppBuilder/Widgets/TreeSelect/optionProblems';

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const flatten = (items = []) =>
  items.flatMap((item) => (item && typeof item === 'object' ? [item, ...flatten(item.children)] : []));

const labelText = (item, resolve) => String(getSafeRenderableValue(resolve(item.label)));

// Text equality is how the tree library keys its nodes, so '1' and {{1}} collide there.
export const findOptionsWithSameValue = (items, value, itemValue, resolve) => {
  const key = String(resolve(value));
  return flatten(items).filter((item) => item.value !== itemValue && String(resolve(item.value)) === key);
};

export const validateOptionValue = (items, value, itemValue, resolve) => {
  const others = findOptionsWithSameValue(items, value, itemValue, resolve);
  if (others.length === 0) return [true, null];
  return [
    false,
    `Option value must be unique. Also used by: ${others.map((o) => `"${labelText(o, resolve)}"`).join(', ')}`,
  ];
};

// Only a plain object crashed the tree before; arrays, numbers and empty labels always rendered.
export const validateOptionLabel = (value, resolve) =>
  isPlainObject(resolve(value)) ? [false, 'Option label must be text, a number, or a boolean.'] : [true, null];

export const duplicateValueLogMessage = (items, value, itemValue, resolve) => {
  const current = flatten(items).find((item) => item.value === itemValue);
  const labels = [current, ...findOptionsWithSameValue(items, value, itemValue, resolve)]
    .filter(Boolean)
    .map((o) => labelText(o, resolve));
  return duplicateValueMessage(String(resolve(value)), labels);
};

// Mirrors what reaches the tree on the canvas: hidden nodes and non-object entries never did, so they never crashed.
export const findSchemaProblems = (data, resolve) => {
  if (!Array.isArray(data)) return [];
  const firstLabel = new Map();
  const duplicates = new Map();
  const labelProblems = [];
  const walk = (items) =>
    items.forEach((item) => {
      if (!isPlainObject(item) || resolve(item.visible) === false) return;
      const key = String(resolve(item.value));
      const label = labelText(item, resolve);
      if (firstLabel.has(key)) duplicates.set(key, [...(duplicates.get(key) ?? [firstLabel.get(key)]), label]);
      else firstLabel.set(key, label);
      if (isPlainObject(resolve(item.label))) labelProblems.push(objectLabelMessage(key));
      if (Array.isArray(item.children)) walk(item.children);
    });
  walk(data);
  return [...[...duplicates].map(([value, labels]) => duplicateValueMessage(value, labels)), ...labelProblems];
};
