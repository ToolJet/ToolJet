import { isTruthyOrZero } from '@/_helpers/appUtils';
import { heightHeldInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { collapsedAccordionHeight, containerChrome } from './containerChrome';
import { heightContractOf } from './contracts';
import { listviewHeight } from './listviewHeight';

// ─────────────────────────────────────────────────────────────────────────────
// Container height: how tall a container is drawn, from its contract
// (contracts.js), its state and its content.
//
// Pure. The engine works out the content (it solves the content canvas, sums
// the rows, lays out the flex children) and hands it over as getters, which
// are only called when the content decides the height: a container held at its
// drawn height, or hidden, never has its content solved.
// ─────────────────────────────────────────────────────────────────────────────

// The first tab a Tabs shows before one is picked: the first visible one, or
// the first one when all are hidden. Older Tabs keep their list under `tabs`.
const firstTabId = (properties) => {
  const tabs = properties.tabItems || properties.tabs;
  if (!Array.isArray(tabs)) return null;
  return (tabs.find((tab) => tab?.visible !== false) ?? tabs[0])?.id ?? null;
};

/**
 * The canvas a container lays its components on: its own (`componentId`), or
 * for Tabs the active tab's (`<componentId>-<tabId>`). The active tab is the
 * one the Tabs reports as `currentTab`, else its default tab, else the first
 * visible one.
 */
export const getContentSlotId = ({ componentId, contract, properties = {}, currentTab }) => {
  if (contract?.contentSlot !== 'activeTab') return componentId;
  const activeTab = currentTab ?? properties.defaultTab ?? firstTabId(properties);
  return isTruthyOrZero(activeTab) ? `${componentId}-${activeTab}` : componentId;
};

/**
 * @typedef {object} ContainerContent  The container's content, measured on demand by the engine.
 * @property {() => number} gridBottom  the lowest rendered bottom on its content canvas (`getContentSlotId`)
 * @property {() => {rowHeights: Array<number|undefined>, fallbackRowHeight: number}} rows  a List view's rows
 * @property {() => number} flexHeight  a FlexContainer's height (`resolveFlexContainerHeight`, chrome and floor included)
 * @property {() => number} jsonSchemaHeight  a Form generated from a JSON schema, as drawn
 */

/**
 * How tall a container is drawn. Decided in this order:
 *
 *   1. Dynamic height off: its drawn height. Not an Accordion, which always
 *      follows being opened and closed, nor a FlexContainer card or row,
 *      which always fit their content (dynamicHeightPolicy.heightHeldInView).
 *   2. A closed Accordion: its header alone (nothing while hidden).
 *   3. A List view: its rows stacked, never below its drawn height unless it
 *      sits in an outer list's row. Sized whether or not it is visible, as on
 *      main.
 *   4. Hidden: its drawn height. Not a modal: its Visibility is its trigger
 *      button's, and the modal can still be opened from code.
 *   5. A FlexContainer: its flex layout's height.
 *   6. An open Accordion with Dynamic height off: its drawn height.
 *   7. Otherwise its content plus its chrome, never below its drawn height. A
 *      module root whose module has Dynamic height fits both ways. A Form
 *      generated from a JSON schema is its schema as drawn.
 *
 * @param {object} options
 * @param {string} options.componentType
 * @param {object} [options.properties]  resolved; for a module root, with the module instance's Dynamic height
 * @param {number} options.savedHeight  the height it was drawn at in the editor
 * @param {boolean} [options.visible]
 * @param {boolean} [options.isExpanded]  an Accordion's exposed state; open unless it says otherwise
 * @param {boolean} [options.isNestedInRow]  a List view drawn inside an outer list's row
 * @param {boolean} [options.jsonSchemaForm]  a Form generated from a JSON schema
 * @param {ContainerContent} options.content
 * @returns {number}
 */
export const resolveContainerHeight = ({
  componentType,
  properties = {},
  savedHeight,
  visible = true,
  isExpanded,
  isNestedInRow = false,
  jsonSchemaForm = false,
  content,
}) => {
  const contract = heightContractOf(componentType);
  if (!contract) return savedHeight;

  const isOpen = isExpanded ?? true;
  const followsExpansion = contract.followsExpansion === true;

  if (heightHeldInView(componentType, properties) && !followsExpansion) return savedHeight;

  if (followsExpansion && !isOpen) return visible ? collapsedAccordionHeight(properties) : 0;

  if (contract.content === 'rows') {
    const stacked = listviewHeight({ properties, ...content.rows() });
    return isNestedInRow ? stacked : Math.max(stacked, savedHeight);
  }

  if (!visible && !contract.portal) return savedHeight;

  if (contract.content === 'flex') return content.flexHeight();

  if (followsExpansion && !properties.dynamicHeight) return savedHeight;

  const contentHeight = jsonSchemaForm ? content.jsonSchemaHeight() : content.gridBottom();
  const height = contentHeight + containerChrome(componentType, properties, { jsonSchemaForm });
  if (contract.moduleRoot && properties.dynamicHeight === true) return height;
  return Math.max(height, savedHeight);
};
