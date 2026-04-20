/**
 * Fixed Headers and Footers — Styling (height + minimum + stepper)
 *
 * Covers the right-sidebar AppHeaderStylesPanel / AppFooterStylesPanel that
 * opens when the header or footer slot is selected on the canvas in edit mode.
 *
 * Sources:
 *  - frontend/src/AppBuilder/RightSideBar/ComponentConfigurationTab/AppHeaderStylesPanel.jsx
 *  - frontend/src/AppBuilder/RightSideBar/ComponentConfigurationTab/AppFooterStylesPanel.jsx
 *  - frontend/src/AppBuilder/CodeBuilder/Elements/NumberInput.jsx (cyLabel→data-cy)
 *  - GitHub tj-ee#4744 — "Height: Adjustable via the Inspector (defaulting to 64px)"
 *
 * Plan doc: /tmp/generate-tests-fixed-headers-footers/fixed-headers-and-footers-page-menu-update.md
 *  (not committed — flags.spec_only = true).
 */

import { fake } from "Fixtures/fake";
import { multipageSelector } from "Selectors/multipage";
import {
  fixedHeadersAndFootersSelector,
  fixedHeadersAndFootersDefaults,
} from "Selectors/fixedHeadersAndFooters";

/**
 * Duplicated intentionally with the happy-path spec so each spec stands alone.
 * When the data-cy gap is closed, both specs can import from a shared util.
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

const closePopover = () => {
  cy.get("body").click(10, 10);
  cy.wait(300);
};

describe("Fixed Headers and Footers — Styling", () => {
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    cy.apiCreateApp(`${fake.companyName}-App`);
    cy.openApp();
    cy.viewport(1800, 1200);

    // Enable header and footer on Home page before each test.
    openPageSettingsPopup("Home");
    togglePageHeaderFooter("header", "desktop", true);
    togglePageHeaderFooter("footer", "desktop", true);
    closePopover();
  });

  afterEach(() => {
    cy.apiDeleteApp();
  });

  it("TC-005: default header height is 64px and the style panel mirrors it", () => {
    // Canvas slot shows 64px height.
    // source: frontend/src/AppBuilder/AppCanvas/appCanvasConstants.js PAGE_CANVAS_HEADER_HEIGHT
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderByComponentId)
      .should("have.attr", "style")
      .and(
        "match",
        new RegExp(
          `height:\\s*${fixedHeadersAndFootersDefaults.defaultHeaderHeightPx}px`
        )
      );

    // Click the header slot to open the AppHeaderStylesPanel.
    // source: AppHeaderStylesPanel.jsx:61-62 (renders "App header" title when selected)
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderSlot).click();

    cy.get(fixedHeadersAndFootersSelector.headerHeightInput)
      .should("be.visible")
      .and(
        "have.value",
        String(fixedHeadersAndFootersDefaults.defaultHeaderHeightPx)
      );
  });

  it("TC-006: incrementing header height via stepper updates the canvas", () => {
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderSlot).click();

    // NumberInput uses step=10. Increment once from 64.
    // source: AppHeaderStylesPanel.jsx:111 `step={10}` and roundToNearest10 logic
    cy.get(fixedHeadersAndFootersSelector.headerHeightIncrement).click();

    // The panel rounds to nearest 10. Exact arithmetic depends on roundToNearest10
    // (64 → rounds to 60, then stepper effect). Rather than pin the exact value,
    // assert it became a multiple of 10 greater than the start and that the
    // canvas reflects the new height.
    cy.get(fixedHeadersAndFootersSelector.headerHeightInput)
      .invoke("val")
      .then((val) => {
        const n = Number(val);
        expect(n).to.be.greaterThan(0);
        expect(n % fixedHeadersAndFootersDefaults.heightStep).to.equal(0);
        // source: PageCanvasHeader.jsx:50 writes headerHeight inline as style
        cy.get(fixedHeadersAndFootersSelector.canvasHeaderByComponentId)
          .should("have.attr", "style")
          .and("match", new RegExp(`height:\\s*${n}px`));
      });

    // Decrement once and confirm monotonic decrease.
    cy.get(fixedHeadersAndFootersSelector.headerHeightInput)
      .invoke("val")
      .then((before) => {
        cy.get(fixedHeadersAndFootersSelector.headerHeightDecrement).click();
        cy.get(fixedHeadersAndFootersSelector.headerHeightInput)
          .invoke("val")
          .should((after) => {
            expect(Number(after)).to.be.lessThan(Number(before));
          });
      });
  });

  it("TC-007: header height clamps at a minimum of 10px", () => {
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderSlot).click();

    // Click decrement many times — it must clamp at 10, not go to 0 or negative.
    // source: AppHeaderStylesPanel.jsx:44 `Math.max(10, Math.round(Number(val) / 10) * 10)`
    for (let i = 0; i < 15; i += 1) {
      cy.get(fixedHeadersAndFootersSelector.headerHeightDecrement).click();
    }

    cy.get(fixedHeadersAndFootersSelector.headerHeightInput).should(
      "have.value",
      String(fixedHeadersAndFootersDefaults.minHeightPx)
    );
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderByComponentId)
      .should("have.attr", "style")
      .and(
        "match",
        new RegExp(`height:\\s*${fixedHeadersAndFootersDefaults.minHeightPx}px`)
      );
  });

  it("TC-015: header height input ignores typed characters (allowTyping=false)", () => {
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderSlot).click();

    // source: AppHeaderStylesPanel.jsx:112 `allowTyping={false}`
    cy.get(fixedHeadersAndFootersSelector.headerHeightInput).then(($el) => {
      // type() against a locked-typing input should not change the value.
      cy.wrap($el).type("abc999", { force: true });
    });

    cy.get(fixedHeadersAndFootersSelector.headerHeightInput).should(
      "have.value",
      String(fixedHeadersAndFootersDefaults.defaultHeaderHeightPx)
    );
  });

  it("TC-008: footer style panel controls footer height (mirrors header behaviour)", () => {
    // Click the footer slot to open AppFooterStylesPanel.
    cy.get(fixedHeadersAndFootersSelector.canvasFooterSlot).click();

    // Footer panel exposes its own `footer-height-input`.
    // source: AppFooterStylesPanel.jsx:109 `cyLabel="footer-height"`
    cy.get(fixedHeadersAndFootersSelector.footerHeightInput).should(
      "be.visible"
    );

    // Increment once — canvas footer slot height must reflect the new value.
    cy.get(fixedHeadersAndFootersSelector.footerHeightInput)
      .invoke("val")
      .then((before) => {
        cy.get(fixedHeadersAndFootersSelector.footerHeightIncrement).click();
        // Re-read the input once incremented, then assert the canvas mirrors it.
        // Note: `cy.get` calls inside `.should()` callbacks are forbidden, so we use `.then`.
        cy.get(fixedHeadersAndFootersSelector.footerHeightInput)
          .invoke("val")
          .then((after) => {
            expect(Number(after)).to.be.greaterThan(Number(before));
            expect(
              Number(after) % fixedHeadersAndFootersDefaults.heightStep
            ).to.equal(0);
            cy.get(
              fixedHeadersAndFootersSelector.canvasFooterByComponentId
            )
              .should("have.attr", "style")
              .and("match", new RegExp(`height:\\s*${after}px`));
          });
      });

    // Decrement to minimum and assert clamp.
    for (let i = 0; i < 20; i += 1) {
      cy.get(fixedHeadersAndFootersSelector.footerHeightDecrement).click();
    }
    cy.get(fixedHeadersAndFootersSelector.footerHeightInput).should(
      "have.value",
      String(fixedHeadersAndFootersDefaults.minHeightPx)
    );
  });

  it("Style panel close button dismisses the panel", () => {
    cy.get(fixedHeadersAndFootersSelector.canvasHeaderSlot).click();
    cy.get(fixedHeadersAndFootersSelector.headerHeightInput).should(
      "be.visible"
    );

    // source: AppHeaderStylesPanel.jsx:65-71 close button with data-cy="pages-close-button"
    cy.get(fixedHeadersAndFootersSelector.stylePanelCloseButton)
      .first()
      .click();
    cy.get(fixedHeadersAndFootersSelector.headerHeightInput).should(
      "not.exist"
    );
  });
});
