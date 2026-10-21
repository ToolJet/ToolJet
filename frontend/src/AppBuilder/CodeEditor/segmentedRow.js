// A UI 2.0 widget's segmented properties (type 'switch' with fullWidth: Size, Align, Appearance, Change format...).
// A full-width switch took whatever the label left: the label ran into it with no gap, each control started at a
// different edge depending on its label's length, and a long label wrapped while the control squeezed beside it.
// Now a two-choice control takes the column a dropdown takes (144px, so every control starts on the same edge) with
// the label wrapping in its own column; three or more choices do not fit that column legibly, so they go on their own
// line under the label, full width, as the inspector's code fields do. Native widgets' rows are unchanged.

/** 'column', 'stacked' or null (not a UI 2.0 segmented property). */
export const segmentedLayout = ({ component, paramType, fieldMeta = {} }) => {
  if (paramType !== 'switch' || !fieldMeta.fullWidth || fieldMeta.isIcon) return null;
  if (typeof component !== 'string' || !component.startsWith('Shad')) return null;
  return (fieldMeta.options?.length ?? 0) > 2 ? 'stacked' : 'column';
};
