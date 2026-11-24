import { isTruthyOrZero } from '@/_helpers/appUtils';
import {
  getExtraContainerHeight,
  resolveContainerHeight,
  resolveListviewHeightFromRows,
} from '../utils/dynamicHeightReflow';

// Space around a Listview's rows: 2px wrapper padding, 7px inner padding and
// a 1px border, top and bottom. A row's bottom border is drawn inside the
// row's own height, so it adds nothing.
const LISTVIEW_CHROME = 20;

// Slot that holds a container's grid content: the body for most containers,
// the active tab's pane when the contract says so.
export const getContentSlotId = ({ componentId, contract, resolved, getExposedValue }) => {
  if (contract?.contentSlot !== 'activeTab') return componentId;
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
//
// Rows and flex content keep the existing calculation (`resolveContainerHeight`),
// as does a collapsed accordion and a form generated from a JSON schema.
export const resolveContainerHeightV2 = ({
  componentId,
  contract,
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
  const isExpanded = getExposedValue('isExpanded') ?? true;
  const sizesToContent = properties.dynamicHeight !== false || contract?.followsExpansion === true;

  // Rows stacked, never below the drawn height.
  if (contract?.content === 'rows' && !isListviewRow) {
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

  const delegated =
    contract?.content === 'rows' ||
    contract?.content === 'flex' ||
    legacyArgs.isJsonSchemaForm ||
    (contract?.followsExpansion === true && !isExpanded);
  if (delegated) return resolveContainerHeight(legacyArgs);

  if (!sizesToContent) return canonicalHeight;
  if (!visibility && !contract?.portal) return canonicalHeight;

  const slotId = getContentSlotId({ componentId, contract, resolved, getExposedValue });
  const contentBottom = solveSlot(slotId);

  const { extraHeight, skipContentHeightCalculation } = getExtraContainerHeight({
    componentId: slotId,
    componentType: legacyArgs.componentType,
    contextIndices: contract?.contentSlot === 'activeTab' ? null : contextIndices,
    element: null,
    currentMax: contentBottom,
    getResolvedComponent: legacyArgs.getResolvedComponent,
    getResolvedValue: legacyArgs.getResolvedValue,
    getComponentDefinition: legacyArgs.getComponentDefinition,
    isAccordionExpanded: isExpanded,
    hideTabs: properties.hideTabs === true,
  });

  if (skipContentHeightCalculation) return canonicalHeight;

  // A module root with dynamic height fits its content in both directions.
  if (contract?.moduleRoot === true && properties.dynamicHeight === true) {
    return contentBottom + extraHeight;
  }
  return Math.max(contentBottom + extraHeight, canonicalHeight);
};
