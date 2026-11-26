import {
  BOX_PADDING,
  CONTAINER_FORM_CANVAS_PADDING,
  MODAL_CANVAS_PADDING,
  SUBCONTAINER_CANVAS_BORDER_WIDTH,
  TAB_CANVAS_PADDING,
  isModalType,
  isTabsType,
} from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { UI2_ROW_CHROME } from '@/AppBuilder/_helpers/dynamicHeightPolicy';

// ─────────────────────────────────────────────────────────────────────────────
// Container chrome: the space a container draws around its content (padding,
// borders, header, tab strip...). A container that fits its content is as
// tall as its content plus its chrome.
//
// Every number here is read off what the canvas draws; when a container's
// styles change, its chrome here has to change with it.
// ─────────────────────────────────────────────────────────────────────────────

// Tab strip of the native Tabs: a 49.5px list plus its 0.5px border (Tabs.jsx).
const TABS_STRIP_HEIGHT = 50;
// A tab pane's canvas draws a little past its pane (`.real-canvas` is
// `calc(100% + 3.5px)`), and growing leaves such as a TextArea with a label
// report a few px past their box. Without this the last widget clips.
const TABS_CANVAS_ALLOWANCE = 16;
// The UI 2.0 Tabs' 1px frame, top and bottom.
const UI2_TABS_FRAME = 2;
// The UI 2.0 Tabs' Back/Next bar in steps mode (ShadTabs STEP_NAV_HEIGHT).
const UI2_TABS_STEP_NAV_HEIGHT = 56;
// A modal's header and footer each draw about 10px taller than their set
// height (slot padding and a 1px border), and the modal takes that out of the
// body, so the body asks for it back.
const MODAL_SLOT_ALLOWANCE = 12;
// A modal body's canvas draws 1px past it (`calc(100% + 1px)`); rounded up.
const MODAL_CANVAS_ALLOWANCE = 8;

// The padding and border a Container or Accordion draws around its canvas.
const CONTAINER_FRAME = BOX_PADDING * 2 + SUBCONTAINER_CANVAS_BORDER_WIDTH * 2 + CONTAINER_FORM_CANVAS_PADDING * 2;

// A header's or footer's height when it is shown and set to a number, else
// null. Read with Number(): a height typed as text ("60") still counts.
const shownHeight = (shown, height) => {
  if (!shown) return null;
  const value = Number(height);
  return Number.isFinite(value) ? value : null;
};

const containerOrAccordionChrome = ({ showHeader, headerHeight }) => {
  const header = shownHeight(showHeader, headerHeight);
  // Under the header: canvas padding, a 3px gap and its 1px bottom border.
  return CONTAINER_FRAME + (header === null ? 0 : header + CONTAINER_FORM_CANVAS_PADDING + 3 + 1);
};

// FormUtils.getBodyHeight takes the header (+10) and footer (+14) and a 20px
// floor out of the form's height; adding them back lets the body fit its
// content exactly.
const formChrome = ({ showHeader, headerHeight, showFooter, footerHeight }) => {
  const header = shownHeight(showHeader, headerHeight);
  const footer = shownHeight(showFooter, footerHeight);
  return 20 + (header === null ? 0 : header + 10) + (footer === null ? 0 : footer + 14);
};

const tabsChrome = (componentType, { hideTabs, variant, showStepNav }) => {
  const strip = hideTabs === true ? 0 : TABS_STRIP_HEIGHT;
  const native = TAB_CANVAS_PADDING * 2 + TABS_CANVAS_ALLOWANCE + strip;
  if (componentType !== 'ShadTabs') return native;
  const stepNav = variant === 'steps' && showStepNav !== false ? UI2_TABS_STEP_NAV_HEIGHT : 0;
  return native + UI2_TABS_FRAME + stepNav;
};

const modalBodyChrome = ({ showHeader, showFooter }) =>
  MODAL_CANVAS_PADDING * 2 +
  MODAL_CANVAS_ALLOWANCE +
  (showHeader ? MODAL_SLOT_ALLOWANCE : 0) +
  (showFooter ? MODAL_SLOT_ALLOWANCE : 0);

/**
 * The chrome a container draws around its content, in px.
 * @param {string} componentType
 * @param {object} [properties]  the container's resolved properties
 * @param {object} [options]
 * @param {boolean} [options.isUi2Row]  sizing one row (or card) of a UI 2.0 List view or Kanban, not the widget
 * @param {boolean} [options.jsonSchemaForm]  a Form generated from a JSON schema: drawn by the schema, measured as is
 */
export const containerChrome = (componentType, properties = {}, { isUi2Row = false, jsonSchemaForm = false } = {}) => {
  if (componentType === 'Container' || componentType === 'Accordion') return containerOrAccordionChrome(properties);
  if (componentType === 'Form') return jsonSchemaForm ? 0 : formChrome(properties);
  if (isTabsType(componentType)) return tabsChrome(componentType, properties);
  if (isModalType(componentType)) return modalBodyChrome(properties);
  // The module root's box padding, plus its canvas's 1px padding pair net of
  // its `calc(100% + 1px)` extension.
  if (componentType === 'ModuleContainer') return BOX_PADDING * 2 + 2;
  if (isUi2Row) return UI2_ROW_CHROME;
  return 0;
};

// A closed Accordion is drawn as its header alone: the header plus 12px
// (canvas padding, the 3px gap and the header's top and bottom borders). With
// no header shown it takes no space.
export const collapsedAccordionHeight = ({ showHeader, headerHeight } = {}) => {
  const header = shownHeight(showHeader, headerHeight);
  return header === null ? 0 : header + CONTAINER_FORM_CANVAS_PADDING + 3 + 2;
};
