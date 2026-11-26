import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { heightContractOf } from './contracts';
import { resolveWidgetVisibility } from './visibility';

// ─────────────────────────────────────────────────────────────────────────────
// Module scope: the engine's read model of one module on its current page,
// for one layout (desktop or mobile).
//
// Everything the engine asks about a widget goes through here: its saved
// layout and drawn height, the canvas it sits on and the widgets on a canvas,
// the widget that owns a canvas, how deeply it is nested, whether it is
// visible, and the height it is known to have. The store getters are bound to
// the module once, so the engine never passes a moduleId around.
//
// A scope reads the store state it was created from. The engine creates one
// per module per pass and drops it afterwards, so its caches never go stale.
// ─────────────────────────────────────────────────────────────────────────────

// Widgets on the main canvas (or a module's root canvas) have no parent.
const ROOT = null;

// canvas id → widget ids on it, built once per page object. The store
// replaces the page's components object on every edit, so a new object is a
// new index, and an unchanged one is reused across passes.
const childrenIndexes = new WeakMap();

const childrenIndexOf = (components) => {
  let index = childrenIndexes.get(components);
  if (index) return index;
  index = new Map();
  for (const [id, component] of Object.entries(components)) {
    const canvasId = component?.component?.parent ?? ROOT;
    if (!index.has(canvasId)) index.set(canvasId, []);
    index.get(canvasId).push(id);
  }
  childrenIndexes.set(components, index);
  return index;
};

// An embedded module's root ModuleContainer takes its Dynamic height from the
// Module widget using it (resolved on the main canvas, whose id is the
// module's id): the ModuleContainer's own setting is only the module editor's
// default. Without this, a module root would keep its drawn height whenever
// that default is off, even though the app turned Dynamic height on.
export const bindModuleAwareGetResolvedComponent = (getResolvedComponent, getComponentTypeFromId, moduleId) => {
  return (id, ctx) => {
    const resolved = getResolvedComponent(id, ctx, moduleId);
    if (moduleId !== 'canvas' && resolved?.properties && getComponentTypeFromId(id, moduleId) === 'ModuleContainer') {
      const instanceDynamicHeight = getResolvedComponent(moduleId, null, 'canvas')?.properties?.dynamicHeight;
      if (instanceDynamicHeight !== undefined && resolved.properties.dynamicHeight !== instanceDynamicHeight) {
        return { ...resolved, properties: { ...resolved.properties, dynamicHeight: instanceDynamicHeight } };
      }
    }
    return resolved;
  };
};

/**
 * @param {object} state  the App Builder store state
 * @param {string} moduleId  'canvas' for the app, else a module instance's id
 * @param {string} currentLayout  'desktop' or 'mobile'
 */
export const createModuleScope = (state, moduleId, currentLayout) => {
  const components = state.getCurrentPageComponents(moduleId) || {};
  const childrenIndex = childrenIndexOf(components);
  const typeOf = (id) => components[id]?.component?.component;
  // The type is read from this page's components, as the store's getComponentTypeFromId would, without its page
  // lookup on every resolve.
  const getResolvedComponent = bindModuleAwareGetResolvedComponent(state.getResolvedComponent, typeOf, moduleId);
  const getExposed = (id, contextIndices, property) =>
    state.getExposedPropertyForAdditionalActions(id, contextIndices, property, moduleId);

  const savedHeights = new Map();
  const depths = new Map();
  const rowDepths = new Map();

  const savedLayout = (id) => components[id]?.layouts?.[currentLayout];
  const contractOf = (id) => heightContractOf(typeOf(id));

  // The height the editor draws the widget at: its saved height, plus the
  // label row a top-aligned input adds.
  const savedHeight = (id) => {
    if (!savedHeights.has(id)) {
      const styles = components[id]?.component?.definition?.styles;
      const drawn = state.calculateMoveableBoxHeightWithId(id, currentLayout, styles, moduleId);
      savedHeights.set(id, typeof drawn === 'number' ? drawn : (savedLayout(id)?.height ?? 0));
    }
    return savedHeights.get(id);
  };

  const childrenOf = (canvasId) => childrenIndex.get(canvasId ?? ROOT) ?? [];

  // Every canvas that holds a widget, in page order; the root canvas is null.
  const canvases = () => [...childrenIndex.keys()];

  // The widget a canvas belongs to: a Container's canvas is its own id, a
  // tab's is `<tabs id>-<tab id>`, a modal header's `<modal id>-header`.
  // Null for the root canvas, or a canvas whose widget is not on this page.
  const ownerOf = (canvasId) => {
    if (canvasId == null) return null;
    const ownerId = state.getBaseParentId(canvasId);
    return components[ownerId] ? ownerId : null;
  };

  // The containers around a widget, innermost first. Guarded against a
  // corrupt parent chain that loops back on itself.
  const ownersAround = (id) => {
    const owners = [];
    const seen = new Set([id]);
    let owner = ownerOf(components[id]?.component?.parent);
    while (owner && !seen.has(owner)) {
      owners.push(owner);
      seen.add(owner);
      owner = ownerOf(components[owner]?.component?.parent);
    }
    return owners;
  };

  // How many containers a widget sits in: 0 on the root canvas.
  const depthOf = (id) => {
    if (!depths.has(id)) depths.set(id, ownersAround(id).length);
    return depths.get(id);
  };

  // How many List views a widget sits in. Each adds one row index to the
  // widget's context, so this is how long its context is.
  const rowDepthOf = (id) => {
    if (!rowDepths.has(id)) {
      rowDepths.set(id, ownersAround(id).filter((owner) => contractOf(owner)?.content === 'rows').length);
    }
    return rowDepths.get(id);
  };

  // The nearest List view a widget is drawn in, whose rows its last row index counts; null outside any row.
  const listAround = (id) => ownersAround(id).find((owner) => contractOf(owner)?.content === 'rows') ?? null;

  const isVisible = (id, contextIndices) =>
    resolveWidgetVisibility({
      componentId: id,
      contextIndices,
      currentLayout,
      getResolvedComponent,
      getExposedPropertyForAdditionalActions: getExposed,
    });

  const isCollapsible = (id, contextIndices) =>
    getResolvedComponent(id, contextIndices)?.properties?.collapseWhenHidden === true;

  const isJsonSchemaForm = (id) => {
    const generateFormFrom = components[id]?.component?.definition?.properties?.generateFormFrom?.value;
    return state.getResolvedValue(generateFormFrom, undefined, moduleId) === 'jsonSchema';
  };

  const currentTabOf = (id, contextIndices) => getExposed(id, contextIndices, 'currentTab');

  // The height a widget is known to have when this pass did not decide it:
  // its last rendered height when it sizes to its content, else the height it
  // is drawn at. A rendered height of 0 is not a size (not drawn yet).
  //
  // "Sizes to its content" is the rule the canvas wrapper draws it by
  // (fitsContentInView: Dynamic height on, a pack widget unless turned off, a
  // FlexContainer card or row), plus an Accordion following being opened and
  // closed. Any other rule would place it at one height while it is drawn at
  // another.
  const knownHeight = (id, contextIndices, renderedLayout) => {
    const properties = getResolvedComponent(id, contextIndices)?.properties;
    const sizesToContent = fitsContentInView(typeOf(id), properties) || contractOf(id)?.followsExpansion === true;
    return sizesToContent && renderedLayout?.height > 0 ? renderedLayout.height : savedHeight(id);
  };

  return {
    moduleId,
    currentLayout,
    components,
    getResolvedComponent,
    getExposed,
    savedLayout,
    savedHeight,
    typeOf,
    contractOf,
    childrenOf,
    canvases,
    ownerOf,
    depthOf,
    rowDepthOf,
    listAround,
    isVisible,
    isCollapsible,
    isJsonSchemaForm,
    currentTabOf,
    knownHeight,
  };
};
