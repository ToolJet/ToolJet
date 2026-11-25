import { isTruthyOrZero } from '@/_helpers/appUtils';

// Where a widget's rendered layout lives. The engine writes each widget's
// rendered `top`/`height` to `temporaryLayouts` under the key built here, and the
// canvas finds the widget's box with the selector built here.
//
// A context is the row path of a widget inside a ListView (or another
// row-scoped container): null on the canvas, otherwise the row indices from the
// outermost list in. The same widget id has one rendered layout per row.

export const ROOT_LAYOUT_CONTEXT = 'root';

// null at the canvas, otherwise a non-empty array of row indices (row 0 kept).
export const normalizeLayoutContext = (contextIndices = null) => {
  if (contextIndices === null || contextIndices === undefined) {
    return null;
  }

  const indices = Array.isArray(contextIndices) ? contextIndices : [contextIndices];
  const normalized = indices.filter((value) => isTruthyOrZero(value));

  return normalized.length > 0 ? normalized : null;
};

// The `data-layout-context` attribute value and the row part of a key.
export const serializeLayoutContext = (contextIndices = null) => {
  const normalized = normalizeLayoutContext(contextIndices);
  return normalized ? normalized.join('.') : ROOT_LAYOUT_CONTEXT;
};

// Key of a widget's rendered layout in `temporaryLayouts`. Widgets of an embedded
// module are scoped by the module instance: one module used twice shares its
// component ids, and unscoped keys would overwrite each other. The main canvas
// stays unscoped. `suffix` is only used for the modal body (`-body`).
export const getDynamicLayoutKey = (componentId, contextIndices = null, suffix = '', moduleId = 'canvas') => {
  const normalized = normalizeLayoutContext(contextIndices);
  const baseKey = normalized ? `${componentId}-${normalized.join('.')}` : componentId;
  const scopedKey = moduleId && moduleId !== 'canvas' ? `${moduleId}::${baseKey}` : baseKey;
  return suffix ? `${scopedKey}${suffix}` : scopedKey;
};

// Selector for a widget's box on the canvas. `WidgetWrapper` renders the
// `data-layout-context` and `data-module-id` attributes it matches.
export const getDynamicElementSelector = (componentId, contextIndices = null, moduleId = 'canvas') => {
  return (
    `.ele-${componentId}` +
    `[data-layout-context="${serializeLayoutContext(contextIndices)}"]` +
    `[data-module-id="${moduleId || 'canvas'}"]`
  );
};

// The saved layout with the rendered top and height laid over it: where the
// widget is drawn right now. Null when the widget has no layout in `currentLayout`.
export const getEffectiveLayout = (
  componentId,
  currentLayout,
  currentPageComponents,
  temporaryLayouts,
  contextIndices,
  moduleId = 'canvas'
) => {
  const baseLayout = currentPageComponents?.[componentId]?.layouts?.[currentLayout];
  if (!baseLayout) {
    return null;
  }

  const temporaryLayout = temporaryLayouts?.[getDynamicLayoutKey(componentId, contextIndices, '', moduleId)] || {};
  return { ...baseLayout, ...temporaryLayout };
};
