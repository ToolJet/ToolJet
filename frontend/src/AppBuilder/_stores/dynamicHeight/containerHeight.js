import { isTruthyOrZero } from '@/_helpers/appUtils';
import {
  getExtraContainerHeight,
  resolveContainerHeight,
  resolveListviewHeightFromRows,
} from '../utils/dynamicHeightReflow';

// Container types whose height comes from data or flex rules rather than from
// grid children; the existing calculation already handles them and is kept.
const DELEGATED_TYPES = new Set(['Listview', 'FlexContainer']);

// Space around a Listview's rows: 2px wrapper padding, 7px inner padding and
// a 1px border, top and bottom. A row's bottom border is drawn inside the
// row's own height, so it adds nothing.
const LISTVIEW_CHROME = 20;

// Slot that holds a container's grid content: the body for most containers,
// the active tab's pane for Tabs.
export const getContentSlotId = ({ componentId, componentType, resolved, getExposedValue }) => {
  if (componentType !== 'Tabs') return componentId;
  const tabs = resolved?.properties?.tabItems || resolved?.properties?.tabs;
  const firstVisibleTabId = Array.isArray(tabs)
    ? (tabs.find((tab) => tab?.visible !== false)?.id ?? tabs[0]?.id)
    : null;
  const activeTab = getExposedValue('currentTab') ?? resolved?.properties?.defaultTab ?? firstVisibleTabId;
  return isTruthyOrZero(activeTab) ? `${componentId}-${activeTab}` : componentId;
};

// Height of a container from the SOLVED layout of its content: the lowest
// rendered bottom among its children plus the container's own chrome, never
// below the height the builder drew. `solveSlot(slotId)` returns the solved
// content bottom of one slot, using the heights already worked out in the
// current pass, so nested containers are always measured inner first.
export const resolveContainerHeightV2 = ({
  componentId,
  componentType,
  contextIndices,
  canonicalHeight,
  visibility,
  resolved,
  getExposedValue,
  solveSlot,
  isListviewRow = false,
  legacyArgs,
}) => {
  const properties = resolved?.properties || {};
  const isAccordionExpanded = getExposedValue('isExpanded') ?? true;
  const isJsonSchemaForm = componentType === 'Form' && legacyArgs.isJsonSchemaForm;

  // The Listview itself: its rows stacked, never below the drawn height.
  if (componentType === 'Listview' && !isListviewRow) {
    if (properties.dynamicHeight === false) return canonicalHeight;
    const stacked = resolveListviewHeightFromRows({
      componentId,
      contextIndices,
      component: resolved,
      currentLayout: legacyArgs.currentLayout,
      currentPageComponents: legacyArgs.currentPageComponents,
      temporaryLayouts: legacyArgs.temporaryLayouts,
      moduleId: legacyArgs.moduleId,
      rowBordersInside: true,
      outerChrome: LISTVIEW_CHROME,
    });
    return Math.max(stacked, canonicalHeight);
  }

  if (
    DELEGATED_TYPES.has(componentType) ||
    isJsonSchemaForm ||
    (componentType === 'Accordion' && !isAccordionExpanded)
  ) {
    return resolveContainerHeight(legacyArgs);
  }

  if (properties.dynamicHeight === false && componentType !== 'Accordion') return canonicalHeight;
  if (!visibility && componentType !== 'ModalV2') return canonicalHeight;

  const slotId = getContentSlotId({ componentId, componentType, resolved, getExposedValue });
  const contentBottom = solveSlot(slotId);

  const { extraHeight, skipContentHeightCalculation } = getExtraContainerHeight({
    componentId: slotId,
    componentType,
    contextIndices: componentType === 'Tabs' ? null : contextIndices,
    element: null,
    currentMax: contentBottom,
    getResolvedComponent: legacyArgs.getResolvedComponent,
    getResolvedValue: legacyArgs.getResolvedValue,
    getComponentDefinition: legacyArgs.getComponentDefinition,
    isAccordionExpanded,
    hideTabs: properties.hideTabs === true,
  });

  if (skipContentHeightCalculation) return canonicalHeight;

  // A dynamic-height module root fits its content in both directions.
  if (componentType === 'ModuleContainer' && properties.dynamicHeight === true) {
    return contentBottom + extraHeight;
  }
  return Math.max(contentBottom + extraHeight, canonicalHeight);
};
