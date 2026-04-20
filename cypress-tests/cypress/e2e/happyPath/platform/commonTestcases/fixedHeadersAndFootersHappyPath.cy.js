/**
 * Fixed Headers and Footers — Happy Path
 *
 * Feature: Page Menu Update — per-page canvas header and footer slots, toggleable
 * per device (desktop / mobile), sticky-positioned, full width, styled via the
 * right sidebar.
 *
 * Sources:
 *  - GitHub tj-ee#4744: Header Component spec (default 64px height, sticky,
 *    100% width, per-page toggle, Inspector controls).
 *  - GitHub tj-ee#4684: "Need fixed headers and footers" (header+footer parity,
 *    paid feature).
 *  - Figma node 4524-18536: design frame (not read in this session — MCP unavailable).
 *  - Codebase: frontend/ee/modules/Appbuilder/components/PageCanvasHeader/PageCanvasHeader.jsx,
 *    frontend/src/AppBuilder/RightSideBar/PageSettingsTab/PageMenu/AddNewPagePopup.jsx,
 *    frontend/src/AppBuilder/_stores/slices/pageMenuSlice.js.
 *
 * Plan doc: /tmp/generate-tests-fixed-headers-footers/fixed-headers-and-footers-page-menu-update.md
 *  (not committed — flags.spec_only = true).
 *
 * Prerequisites:
 *  - License flags `canvasPageHeaderEnabled` and `canvasPageFooterEnabled` must be TRUE
 *    for the workspace used in these tests. On a CE workspace without EE license these
 *    tests will fail at the first toggle click (toggle is rendered `disabled`).
 *  - Data-cy gaps: the per-page toggles and canvas slots have no data-cy attributes yet.
 *    This spec uses label scoping and `[component-id="..."]` / CSS id anchors. When
 *    data-cy attributes land (see plan doc Section C), migrate to named selectors.
 */

import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { multipageSelector } from "Selectors/multipage";
import {
  fixedHeadersAndFootersSelector,
  fixedHeadersAndFootersDefaults,
} from "Selectors/fixedHeadersAndFooters";
import { addNewPage } from "Support/utils/multipage";

/**
 * Toggle "Page header → Show on desktop" or similar via label scoping.
 * Works around the data-cy gap in AddNewPagePopup.jsx (see plan Section C).
 *
 * @param {"header"|"footer"} region
 * @param {"desktop"|"mobile"} device
 * @param {boolean} enable
 */
const togglePageHeaderFooter = (region, device, enable = true) => {
  const sectionLabel =
    region === "header"
      ? fixedHeadersAndFootersSelector.pageHeaderSectionLabel
      : fixedHeadersAndFootersSelector.pageFooterSectionLabel;
  const deviceLabel =
    device === "desktop"
      ? fixedHeadersAndFootersSelector.showOnDesktopLabel
      : fixedHeadersAndFootersSelector.showOnMobileLabel;

  cy.contains(
    fixedHeadersAndFootersSelector.sectionHeaderClass,
    sectionLabel
  )
    .parent()
    .contains("label", deviceLabel)
    .parent()
    .find("input[type=checkbox]")
    .then(($el) => {
      if (enable) cy.wrap($el).check({ force: true });
      else cy.wrap($el).uncheck({ force: true });
    });
};

/**
 * Open the page settings popup for a given page by name. Uses the per-page
 * options icon rendered in the left-sidebar pages panel.
 * source: cypress-tests/cypress/constants/selectors/multipage.js:10 (pageMenuIcon)
 */
const openPageSettingsPopup = (pageName = "Home") => {
  // If the page row isn't already visible, the panel is closed — open it.
  // source: frontend/src/AppBuilder/RightSideBar/RightSidebarToggle.jsx:89-97 tip="Page settings" (toggle, not idempotent)
  cy.get("body").then(($body) => {
    const alreadyOpen =
      $body.find(`[data-cy="pages-name-${pageName.toLowerCase()}"]`).length > 0;
    if (!alreadyOpen) {
      cy.get('[data-cy="right-sidebar-page-settings-button"]').click();
    }
    // source: frontend/src/AppBuilder/RightSideBar/PageSettingsTab/PageMenu/PageMenuItem.jsx:195-200
    cy.get(`[data-cy="pages-name-${pageName.toLowerCase()}"]`).click();
  });
};

/**
 * Close any open popover by clicking the canvas background.
 */
const closePopover = () => {
  cy.get("body").click(10, 10);
  cy.wait(300); // allow popover close animation
};

describe("Fixed Headers and Footers — Happy Path", () => {
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    cy.apiCreateApp(`${fake.companyName}-App`);
    cy.openApp();
    cy.viewport(1800, 1200); // ensure desktop layout
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("TC-001: enables the page header on desktop and renders a sticky canvas slot", () => {
    // Arrange + Act
    openPageSettingsPopup("Home");
    togglePageHeaderFooter("header", "desktop", true);
    closePopover();

    // Assert — slot is in DOM
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderByComponentId, {
      timeout: 10000,
    }).should("be.visible");

    // Assert — slot has sticky positioning at top:0
    // source: PageCanvasHeader.jsx:45 `position: sticky, top: 0, zIndex: 10`
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderSlot)
      .should("have.css", "position", "sticky")
      .and("have.css", "top", "0px");

    // Assert — default height 64px
    // source: tj-ee#4744 "Height: defaulting to 64px"; PAGE_CANVAS_HEADER_HEIGHT
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderByComponentId)
      .should("have.attr", "style")
      .and(
        "match",
        new RegExp(
          `height:\\s*${fixedHeadersAndFootersDefaults.defaultHeaderHeightPx}px`
        )
      );

    // Assert — full width
    // source: tj-ee#4744 "Width: Fixed at 100% of the viewport"
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderByComponentId)
      .should("have.attr", "style")
      .and("match", /width:\s*100%/);
  });

  it("TC-002: enables the page footer on desktop and renders a sticky canvas slot", () => {
    openPageSettingsPopup("Home");
    togglePageHeaderFooter("footer", "desktop", true);
    closePopover();

    cy.get(fixedHeadersAndFootersSelector.canvasFooterByComponentId, {
      timeout: 10000,
    }).should("be.visible");

    // Assert footer slot is sticky.
    // source: symmetric with PageCanvasHeader.jsx:45 for footer
    cy.get(fixedHeadersAndFootersSelector.canvasFooterSlot).should(
      "have.css",
      "position",
      "sticky"
    );

    cy.get(fixedHeadersAndFootersSelector.canvasFooterByComponentId)
      .should("have.attr", "style")
      .and("match", /width:\s*100%/);
  });

  it("TC-003: disabling the header toggle removes the canvas slot", () => {
    // Enable first
    openPageSettingsPopup("Home");
    togglePageHeaderFooter("header", "desktop", true);
    closePopover();
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderByComponentId).should(
      "exist"
    );

    // Now disable
    openPageSettingsPopup("Home");
    togglePageHeaderFooter("header", "desktop", false);
    closePopover();

    // Slot should be gone. source: PageCanvasHeader.jsx:33 `if (!showCanvasHeader) return null;`
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderByComponentId).should(
      "not.exist"
    );
  });

  // SKIPPED — addNewPage() depends on [data-cy="add-page-button"] which only exists on the
  // unlicensed PageGroupMenu branch (AddPageButton.jsx:34). On EE workspaces where header/footer
  // actually work, the licensed button at AddPageButton.jsx:86 has no data-cy. Reopen when
  // the licensed branch gets a data-cy hook.
  it.skip("TC-010: header/footer state is independent per page", () => {
    const page2Name = "Page2";

    // Enable header on Home
    openPageSettingsPopup("Home");
    togglePageHeaderFooter("header", "desktop", true);
    closePopover();
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderByComponentId).should(
      "exist"
    );

    // Add a second page
    addNewPage(page2Name);

    // Switch to Page2 — header must NOT follow
    cy.get(`[data-cy="pages-name-${page2Name.toLowerCase()}"]`).click();
    cy.wait(500);
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderByComponentId).should(
      "not.exist"
    );

    // Enable footer only on Page2
    openPageSettingsPopup(page2Name);
    togglePageHeaderFooter("footer", "desktop", true);
    closePopover();
    cy.get(fixedHeadersAndFootersSelector.canvasFooterByComponentId).should(
      "exist"
    );

    // Back to Home — no footer
    // source: frontend/src/AppBuilder/RightSideBar/RightSidebarToggle.jsx:89-97 tip="Page settings"
    cy.get('[data-cy="right-sidebar-page-settings-button"]').click();
    cy.get('[data-cy="pages-name-home"]').click();
    cy.wait(500);
    cy.get(fixedHeadersAndFootersSelector.canvasFooterByComponentId).should(
      "not.exist"
    );
  });

  it("TC-014: header and footer can be enabled simultaneously on the same page", () => {
    openPageSettingsPopup("Home");
    togglePageHeaderFooter("header", "desktop", true);
    togglePageHeaderFooter("footer", "desktop", true);
    closePopover();

    cy.get(fixedHeadersAndFootersSelector.canvasHeaderByComponentId).should(
      "be.visible"
    );
    cy.get(fixedHeadersAndFootersSelector.canvasFooterByComponentId).should(
      "be.visible"
    );
  });

  it("TC-012: header is sticky-positioned with top: 0px", () => {
    openPageSettingsPopup("Home");
    togglePageHeaderFooter("header", "desktop", true);
    closePopover();

    // source: frontend/ee/modules/Appbuilder/components/PageCanvasHeader/PageCanvasHeader.jsx:44-46
    // The slot has inline style `position: sticky; top: 0px` — this is the visual contract
    // that keeps it pinned to the top of the canvas scroll container. We prove stickiness
    // via CSS instead of a scrollTo because the editor canvas scrolls inside a container,
    // not the body.
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderSlot).should(
      "have.css",
      "position",
      "sticky"
    );
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderSlot).should(
      "have.css",
      "top",
      "0px"
    );
  });
});
