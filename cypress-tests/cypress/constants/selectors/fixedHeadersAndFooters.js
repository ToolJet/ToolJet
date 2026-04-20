/**
 * Selectors for "Fixed Headers and Footers (Page Menu Update)" feature.
 * source: docs/test-cases/features/fixed-headers-and-footers-page-menu-update.md (plan doc, held in /tmp during spec-only run)
 *
 * NOTE: The canvas header/footer slots and the per-page show-on-desktop/mobile
 * toggles currently have NO data-cy attributes. These selectors use
 * [component-id="..."] and CSS id anchors that exist on the live DOM.
 * Track data-cy gaps in the plan doc Section C.
 */

export const fixedHeadersAndFootersSelector = {
  // --- Canvas slots ---
  // source: frontend/ee/modules/Appbuilder/components/PageCanvasHeader/PageCanvasHeader.jsx:37,43
  canvasHeaderSlot: '#canvas-header-slot',
  canvasHeaderByComponentId: '[component-id="canvas-header"]',
  // source: frontend/ee/modules/Appbuilder/components/PageCanvasFooter/PageCanvasFooter.jsx:37-43
  // Footer slot element has className="canvas-footer-slot" but NO id attribute
  // (unlike the header which has both). Use the class selector.
  canvasFooterSlot: '.canvas-footer-slot',
  canvasFooterByComponentId: '[component-id="canvas-footer"]',

  // --- Page settings popup section headers ---
  // source: frontend/src/AppBuilder/RightSideBar/PageSettingsTab/PageMenu/AddNewPagePopup.jsx:492,547
  pageHeaderSectionLabel: "Page header",
  pageFooterSectionLabel: "Page footer",
  showOnDesktopLabel: "Show on desktop",
  showOnMobileLabel: "Show on mobile",
  // section-header CSS class used inside the popup
  sectionHeaderClass: ".section-header",

  // --- Style panel inputs (AppHeaderStylesPanel / AppFooterStylesPanel) ---
  // source: frontend/src/AppBuilder/CodeBuilder/Elements/NumberInput.jsx:13 — data-cy = `${cyLabel}-input`
  // source: frontend/src/AppBuilder/RightSideBar/ComponentConfigurationTab/AppHeaderStylesPanel.jsx:109
  headerHeightInput: '[data-cy="header-height-input"]',
  headerHeightIncrement: '[data-cy="header-height-input-increment"]',
  headerHeightDecrement: '[data-cy="header-height-input-decrement"]',
  // source: frontend/src/AppBuilder/RightSideBar/ComponentConfigurationTab/AppFooterStylesPanel.jsx:109
  footerHeightInput: '[data-cy="footer-height-input"]',
  footerHeightIncrement: '[data-cy="footer-height-input-increment"]',
  footerHeightDecrement: '[data-cy="footer-height-input-decrement"]',
  // source: AppHeaderStylesPanel.jsx:70 / AppFooterStylesPanel.jsx:70
  stylePanelCloseButton: '[data-cy="pages-close-button"]',
};

/**
 * Defaults and constants asserted by tests.
 * source: frontend/src/AppBuilder/AppCanvas/appCanvasConstants.js — PAGE_CANVAS_HEADER_HEIGHT
 * NOTE: GitHub tj-ee#4744 said 64 but the actual code (and Figma design) is 60.
 */
export const fixedHeadersAndFootersDefaults = {
  // source: frontend/src/AppBuilder/AppCanvas/appCanvasConstants.js:84 (PAGE_CANVAS_HEADER_HEIGHT = 60)
  defaultHeaderHeightPx: 60,
  heightStep: 10,
  minHeightPx: 10,
};
