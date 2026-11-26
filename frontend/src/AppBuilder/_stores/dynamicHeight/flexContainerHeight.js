import { BOX_PADDING, SUBCONTAINER_CANVAS_BORDER_WIDTH } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import {
  computeEffectiveFlexDirection,
  flexCardHeaderPx,
  flexChildLineWidth,
  normalizeChildOrder,
  resolveFlexChildSizing,
} from '@/AppBuilder/Widgets/FlexContainer/flexContainer.utils';
import { usesFlexLayoutV2 } from '@/AppBuilder/_helpers/flexLayoutVersion';
import { getEffectiveLayout } from './layoutKeys';
import { resolveWidgetVisibility } from './visibility';

// ─────────────────────────────────────────────────────────────────────────────
// FlexContainer height.
//
// A grid container is as tall as its lowest child, because each child's saved
// `top` is where it sits. A FlexContainer places its children by flex rules
// instead: order, direction, wrapping, gap and padding decide where they land,
// and their saved tops mean nothing. A column of two children both saved at
// top 0 is `a + gap + b` tall, not `max(a, b)`.
//
// So the height is rebuilt from the children in render order and their current
// heights: stacked for a column, the tallest for a single-line row, and line
// by line for a wrapping row, packed the way the browser packs them.
//
// Containers saved before the UI 2.0 layout (flexLayoutVersion.js) keep the
// lts-3.16 rules where noted.
// ─────────────────────────────────────────────────────────────────────────────

// What FlexContainer.jsx draws when gap or padding is not set (`gap ?? 8`,
// `padding ?? 12`); kept equal so a default container measures as drawn.
const DEFAULT_GAP = 8;
const DEFAULT_PADDING = 12;

const toPx = (value, fallback) => {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
};

// The container's layout settings, read once.
const flexSettingsOf = (properties) => {
  const direction = computeEffectiveFlexDirection(properties.direction ?? 'column', properties.stackBelow ?? 'none');
  return {
    layoutV2: usesFlexLayoutV2(properties),
    gap: toPx(properties.gap, DEFAULT_GAP),
    padding: toPx(properties.padding, DEFAULT_PADDING),
    isRow: direction === 'row',
    wraps: properties.flexWrap === true,
  };
};

// Children in the order the container draws them (its saved `childOrder`, with
// any child missing from it appended).
const childIdsInOrder = (currentPageComponents, componentId, childIds) => {
  const childOrder = currentPageComponents?.[componentId]?.component?.definition?.properties?.childOrder?.value;
  return normalizeChildOrder(Array.isArray(childOrder) ? childOrder : [], childIds);
};

// Whether a child's own fitted height counts even below the height it was
// drawn at. A component pack widget, a shadcn-look Table (as tall as its rows),
// and a FlexContainer drawn as a card or as a UI 2.0 row all fit their content
// (dynamicHeightPolicy.fitsContentInView). Any other child is floored at its
// drawn height, which for a top-label input includes its label row.
const fitsOwnContent = (childType, child) =>
  /^Shad[A-Z]/.test(childType) ||
  (childType === 'Table' && child?.styles?.tableLook === 'shadcn') ||
  (childType === 'FlexContainer' &&
    (child?.properties?.cardStyle === 'shadcnCard' ||
      (child?.properties?.direction === 'row' && usesFlexLayoutV2(child?.properties))));

// The children that take space in the flow, with the height and width each
// one takes. A hidden child is drawn at 0 in a flex container, so it is left
// out, "Collapse when hidden" or not; lts-3.16 kept its slot unless it
// collapses.
const measureChildren = ({ childIds, settings, availableWidth, context }) => {
  const {
    currentLayout,
    contextIndices,
    moduleId,
    currentPageComponents,
    temporaryLayouts,
    getResolvedComponent,
    getExposedPropertyForAdditionalActions,
    calculateMoveableBoxHeightWithId,
  } = context;
  const children = [];

  for (const childId of childIds) {
    const definition = currentPageComponents?.[childId];
    const savedLayout = definition?.layouts?.[currentLayout];
    if (!savedLayout) continue;

    const child = getResolvedComponent(childId, contextIndices);
    const visible = resolveWidgetVisibility({
      componentId: childId,
      contextIndices,
      currentLayout,
      getResolvedComponent,
      getExposedPropertyForAdditionalActions,
    });
    const inFlow = visible || (!settings.layoutV2 && !child?.properties?.collapseWhenHidden);
    if (!inFlow) continue;

    const layout = getEffectiveLayout(
      childId,
      currentLayout,
      currentPageComponents,
      temporaryLayouts,
      contextIndices,
      moduleId
    );
    let height = layout?.height ?? savedLayout.height ?? 0;
    const childType = definition?.component?.component ?? '';
    if (typeof calculateMoveableBoxHeightWithId === 'function' && !fitsOwnContent(childType, child)) {
      const drawnHeight = calculateMoveableBoxHeightWithId(
        childId,
        currentLayout,
        definition?.component?.definition?.styles
      );
      if (typeof drawnHeight === 'number') height = Math.max(height, drawnHeight);
    }

    const fallbackWidth = savedLayout.widthPx ?? layout?.widthPx ?? availableWidth;
    const { fillWidth, widthPx, minWidthPx } = resolveFlexChildSizing(layout, { widthPx: fallbackWidth, height });
    children.push({ height, width: widthPx ?? fallbackWidth, fillWidth, minWidthPx });
  }

  return children;
};

// The width a child claims on a line of a wrapping row. In the UI 2.0 layout a
// fill child is packed at its minimum width and grows afterwards
// (computeFlexChildFlexStyle); in lts-3.16 it has the whole line as its basis
// and cannot shrink (computeFlexChildFlexStyleV1), so it claims a line alone.
const lineWidthOf = (child, { layoutV2 }, availableWidth) => {
  const width = Number.isFinite(child.width) ? child.width : availableWidth;
  if (layoutV2) return Math.min(flexChildLineWidth({ ...child, width }), availableWidth);
  return child.fillWidth ? availableWidth : width;
};

// A wrapping row, packed as the browser packs it: each child goes on the
// current line until the next one would not fit, then a new line starts. Each
// line is as tall as its tallest child, with the gap between lines.
const wrappedRowHeight = (children, settings, availableWidth) => {
  const lines = [];
  let line = null;
  for (const child of children) {
    const width = lineWidthOf(child, settings, availableWidth);
    if (line && line.width + settings.gap + width <= availableWidth) {
      line.width += settings.gap + width;
      line.height = Math.max(line.height, child.height);
    } else {
      line = { width, height: child.height };
      lines.push(line);
    }
  }
  return lines.reduce((total, { height }) => total + height, 0) + settings.gap * (lines.length - 1);
};

const contentHeightOf = (children, settings, availableWidth) => {
  if (!settings.isRow) {
    // A column: every child stacked, with the gap between neighbours.
    return children.reduce((total, { height }) => total + height, 0) + settings.gap * (children.length - 1);
  }
  // A row that does not wrap is one line. So is a wrapping row whose width is
  // not known yet (an early or off-screen pass): better one line than guessed
  // line breaks.
  if (!settings.wraps || !Number.isFinite(availableWidth)) {
    return Math.max(...children.map(({ height }) => height));
  }
  return wrappedRowHeight(children, settings, availableWidth);
};

// A card and a UI 2.0 row always fit their content, so they have no floor:
// a row of cards shorter than drawn leaves no empty band under it.
const fitsContentBothWays = (properties, { layoutV2 }) =>
  !!flexCardHeaderPx(properties) ||
  properties.cardStyle === 'shadcnCard' ||
  (properties.direction === 'row' && layoutV2);

/**
 * The FlexContainer's height: its content laid out by flex rules plus its
 * chrome (padding, the widget's box padding, the canvas border, a card header),
 * floored at the saved height unless it is a card or a UI 2.0 row.
 *
 * `wrapperWidth` is the container's measured width (border excluded, padding
 * included), or null when it has not been measured; it only matters for a
 * wrapping row. The getters are the store's, bound to the container's module.
 */
export const resolveFlexContainerHeight = ({
  componentId,
  currentLayout,
  contextIndices = null,
  moduleId = 'canvas',
  currentPageComponents,
  temporaryLayouts,
  wrapperWidth,
  getResolvedComponent,
  getExposedPropertyForAdditionalActions,
  getContainerChildrenMapping,
  calculateMoveableBoxHeightWithId,
}) => {
  const savedHeight = currentPageComponents?.[componentId]?.layouts?.[currentLayout]?.height ?? 0;
  const container = getResolvedComponent(componentId, contextIndices);
  const properties = container?.properties || {};
  const settings = flexSettingsOf(properties);

  // The flex canvas draws its own padding inside the wrapper, so the children
  // share the wrapper's width less that padding on both sides.
  const availableWidth = Number.isFinite(wrapperWidth)
    ? Math.max(wrapperWidth - settings.padding * 2, 0)
    : Number.POSITIVE_INFINITY;

  const childIds = childIdsInOrder(currentPageComponents, componentId, getContainerChildrenMapping(componentId));
  const children = measureChildren({
    childIds,
    settings,
    availableWidth,
    context: {
      currentLayout,
      contextIndices,
      moduleId,
      currentPageComponents,
      temporaryLayouts,
      getResolvedComponent,
      getExposedPropertyForAdditionalActions,
      calculateMoveableBoxHeightWithId,
    },
  });
  if (children.length === 0) return savedHeight;

  // The widget's box padding (RenderWidget's BOX_PADDING, unless its padding
  // style is 'none') wraps the canvas too; lts-3.16 left it out.
  const boxPadding = !settings.layoutV2 || container?.styles?.padding === 'none' ? 0 : BOX_PADDING;
  const height =
    contentHeightOf(children, settings, availableWidth) +
    settings.padding * 2 +
    boxPadding * 2 +
    SUBCONTAINER_CANVAS_BORDER_WIDTH * 2 +
    flexCardHeaderPx(properties);

  return fitsContentBothWays(properties, settings) ? height : Math.max(height, savedHeight);
};
