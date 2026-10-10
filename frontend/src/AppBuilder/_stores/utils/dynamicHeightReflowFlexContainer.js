import { BOX_PADDING, SUBCONTAINER_CANVAS_BORDER_WIDTH } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import {
  computeEffectiveFlexDirection,
  flexCardHeaderPx,
  flexChildLineWidth,
  normalizeChildOrder,
  resolveFlexChildSizing,
} from '@/AppBuilder/Widgets/FlexContainer/flexContainer.utils';

// FlexContainer.jsx falls back to these literals when the property panel has
// not authored a value (`gap ?? 8`, `padding ?? 12`). Keep the resolver in
// lockstep so its measured chrome matches the rendered chrome — otherwise a
// default-config flex container measures shorter than it renders.
const FLEX_DEFAULT_GAP = 8;
const FLEX_DEFAULT_PADDING = 12;

const parseFlexPixelValue = (value, fallback = 0) => {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : fallback;
};

const getFlexContainerChildOrder = (currentPageComponents, componentId, childIds) => {
  const childOrder = currentPageComponents?.[componentId]?.component?.definition?.properties?.childOrder?.value;
  return normalizeChildOrder(Array.isArray(childOrder) ? childOrder : [], childIds);
};

// FlexContainer cannot use the generic container height formula.
//
// Classic subcontainers (Container/Form/Tabs/etc.) render children on the
// absolute-positioned grid. For them, the rendered content height is roughly
// `max(child.top + child.height) + chrome`: each child's canonical `top`
// describes where it sits inside the container.
//
// FlexContainer renders children as normal flex items. Their grid `top` values
// are irrelevant to runtime placement; order, direction, wrapping, gap, and
// padding decide where items land. A column flex container with two children at
// canonical top=0 should have height `childA + gap + childB`, not
// `max(0 + childA, 0 + childB)`. That mismatch is why dynamic-height children
// could grow without pushing widgets below the FlexContainer in the viewer.
//
// This helper reconstructs the rendered flex content height from the ordered
// children and their effective sizes, including temporary dynamic-height
// overrides written by child widgets. Generic reflow helpers are passed in by
// dynamicHeightReflow.js so this file stays focused on flex math and avoids a
// circular import back into the main reflow module.
export const resolveFlexContainerHeight = ({
  componentId,
  currentLayout,
  currentPageComponents,
  temporaryLayouts,
  contextIndices,
  getResolvedComponent,
  getContainerChildrenMapping,
  getExposedPropertyForAdditionalActions,
  calculateMoveableBoxHeightWithId,
  getComponentDefinition,
  getCanonicalLayout,
  getDynamicElementSelector,
  getEffectiveLayout,
  resolveWidgetVisibility,
}) => {
  const canonicalLayout = getCanonicalLayout(componentId, currentLayout, currentPageComponents);
  const component = getResolvedComponent(componentId, contextIndices);
  const properties = component?.properties || {};
  const gap = parseFlexPixelValue(properties.gap, FLEX_DEFAULT_GAP);
  const padding = parseFlexPixelValue(properties.padding, FLEX_DEFAULT_PADDING);
  const direction = computeEffectiveFlexDirection(properties.direction ?? 'column', properties.stackBelow ?? 'none');
  const isRow = direction === 'row';
  const flexWrap = properties.flexWrap === true;
  const rawChildIds = getContainerChildrenMapping(componentId);
  const childIds = getFlexContainerChildOrder(currentPageComponents, componentId, rawChildIds);
  const wrapperElement = document.querySelector(getDynamicElementSelector(componentId, contextIndices));
  // `clientWidth` is the wrapper's content-box width (border excluded, padding
  // included). The flex canvas inside the wrapper applies its own padding, so
  // flex children actually share `clientWidth - 2 * padding`. Subtract padding
  // here so wrap line-packing matches what the browser will lay out — without
  // this, wrap rows pack more items per line than reality and the resolver
  // under-estimates total height.
  const wrapperClientWidth = wrapperElement?.clientWidth;
  const availableWidth = Number.isFinite(wrapperClientWidth)
    ? Math.max(wrapperClientWidth - padding * 2, 0)
    : Number.POSITIVE_INFINITY;

  // Build a compact list of only the children that should occupy flex flow.
  // Visibility is resolved the same way as the rest of dynamic-height reflow,
  // but a hidden child is always out of flow (see below). For each in-flow child, read the effective layout so
  // previously measured dynamic-height temps are included. The
  // calculateMoveableBoxHeightWithId floor preserves the existing label-height
  // bump behavior used elsewhere in this file for top-aligned input widgets.
  const childMetrics = childIds.reduce((accumulator, childId) => {
    const childLayout = getCanonicalLayout(childId, currentLayout, currentPageComponents);
    if (!childLayout) return accumulator;

    const childVisibility = resolveWidgetVisibility({
      componentId: childId,
      contextIndices,
      currentLayout,
      getResolvedComponent,
      getExposedPropertyForAdditionalActions,
    });
    const childResolved = getResolvedComponent(childId, contextIndices);
    // A hidden child renders at 0 in flex flow (WidgetWrapper collapses hidden widgets), so it takes no space here
    // either, collapseWhenHidden or not: reserving its slot drew a blank band the size of a hidden empty state.
    if (!childVisibility) return accumulator;

    const effectiveLayout = getEffectiveLayout(
      childId,
      currentLayout,
      currentPageComponents,
      temporaryLayouts,
      contextIndices
    );
    let childHeight = effectiveLayout?.height ?? childLayout.height ?? 0;
    const childDefinition = getComponentDefinition?.(childId);
    // A component-pack widget fits its content (dynamicHeightPolicy), so its measured height stands even below the
    // drawn one. The bump below returns the drawn height for every non-input widget, which floored a short ShadTable
    // at its drawn 340px and left an empty band in its card (2026-10-10).
    // The same holds for a FlexContainer drawn as a card or a row (a row of cards kept its drawn 430px).
    const childType = childDefinition?.component?.component ?? '';
    const fitsContent =
      /^(Shad|Ant)[A-Z]/.test(childType) ||
      (childType === 'FlexContainer' &&
        (['antCard', 'shadcnCard'].includes(childResolved?.properties?.cardStyle) ||
          childResolved?.properties?.direction === 'row'));
    if (typeof calculateMoveableBoxHeightWithId === 'function' && !fitsContent) {
      const childStylesDefinition = childDefinition?.component?.definition?.styles;
      const bumpedHeight = calculateMoveableBoxHeightWithId(childId, currentLayout, childStylesDefinition);
      if (typeof bumpedHeight === 'number') {
        childHeight = Math.max(childHeight, bumpedHeight);
      }
    }

    const fallbackWidth = childLayout.widthPx ?? effectiveLayout?.widthPx ?? availableWidth;
    const { fillWidth, widthPx, minWidthPx } = resolveFlexChildSizing(effectiveLayout, {
      widthPx: fallbackWidth,
      height: childHeight,
    });
    const childWidth = widthPx ?? fallbackWidth;

    accumulator.push({
      height: childHeight,
      width: childWidth,
      fillWidth,
      minWidthPx,
    });
    return accumulator;
  }, []);

  if (childMetrics.length === 0) {
    return canonicalLayout?.height ?? 0;
  }

  let contentHeight = 0;
  if (!isRow) {
    // Column flow is a vertical stack: every in-flow child contributes its full
    // height, and the configured gap appears between adjacent items.
    contentHeight = childMetrics.reduce((sum, child) => sum + child.height, 0) + gap * (childMetrics.length - 1);
  } else if (!flexWrap || !Number.isFinite(availableWidth)) {
    // A non-wrapping row has one flex line, so its height is the tallest item.
    // If the DOM width is unavailable during an early/offscreen pass, use this
    // same single-line fallback rather than guessing line breaks.
    contentHeight = Math.max(...childMetrics.map((child) => child.height), 0);
  } else {
    // Row + wrap forms multiple flex lines. We recreate the browser's line
    // packing closely enough for height reflow: walk children in render order,
    // put each item on the current line until the next item would exceed the
    // available width, then start a new line. Each line contributes its tallest
    // child's height; gaps are added between lines.
    //
    // fillWidth children render with a zero basis and their `minWidthPx` as
    // min-width (see computeFlexChildFlexStyle), so the browser packs them at
    // that minimum and grows them afterwards. Pack the same way: fill children
    // share a line until their minimum widths no longer fit.
    const lines = childMetrics.reduce(
      (accumulator, child) => {
        const currentLine = accumulator[accumulator.length - 1];
        const rawChildWidth = Number.isFinite(child.width) ? child.width : availableWidth;
        const childWidth = Math.min(flexChildLineWidth({ ...child, width: rawChildWidth }), availableWidth);
        const nextWidth = currentLine.items === 0 ? childWidth : currentLine.width + gap + childWidth;

        if (currentLine.items > 0 && nextWidth > availableWidth) {
          accumulator.push({ width: childWidth, height: child.height, items: 1 });
        } else {
          currentLine.width = nextWidth;
          currentLine.height = Math.max(currentLine.height, child.height);
          currentLine.items += 1;
        }

        return accumulator;
      },
      [{ width: 0, height: 0, items: 0 }]
    );

    contentHeight = lines.reduce((sum, line) => sum + line.height, 0) + gap * Math.max(lines.length - 1, 0);
  }

  // Add FlexContainer chrome after content height. The canonical layout remains
  // a floor so enabling dynamic height never silently shrinks the component
  // below the size the app author drew in the editor; a card surface (component
  // packs) fits its content instead, so a card never leaves an empty band.
  // The widget's own box padding (RenderWidget's BOX_PADDING, unless styles.padding is 'none') wraps the canvas too:
  // left out, every flex container came out 4px short and its content scrolled by that much (a 36px button row).
  const boxPadding = component?.styles?.padding === 'none' ? 0 : BOX_PADDING;
  const heightWithChrome =
    contentHeight + padding * 2 + boxPadding * 2 + SUBCONTAINER_CANVAS_BORDER_WIDTH * 2 + flexCardHeaderPx(properties);
  // A card and a row always fit their content (dynamicHeightPolicy.fitsContentInView): no floor, so a row of cards
  // whose content is shorter than drawn leaves no empty band under it.
  if (
    flexCardHeaderPx(properties) ||
    ['antCard', 'shadcnCard'].includes(properties.cardStyle) ||
    properties.direction === 'row'
  ) {
    return heightWithChrome;
  }
  return Math.max(heightWithChrome, canonicalLayout?.height ?? 0);
};
