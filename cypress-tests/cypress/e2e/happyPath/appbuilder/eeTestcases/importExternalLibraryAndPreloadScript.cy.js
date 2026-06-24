/**
 * App Builder — Import External Library and Preload Script (EE)
 *
 * Feature doc:  docs/test-cases/import-external-library-and-setup-script-test-cases.md
 * Gaps tracker: docs/test-cases/data-cy-gaps-tracking.md
 *
 * Consolidated into a single describe with 6 it() blocks for speed:
 *   it 1 — drawer + Add modal + Preload modal lifecycle (ATC-001, 002)
 *   it 2 — install + remove + persist (ATC-003, 007, 008)
 *   it 3 — validation: HTTP + reserved name + 404 toast (ATC-004, 005, 011, 012)
 *   it 4 — multi-library load order (ATC-013)
 *   it 5 — preload save + library e2e + preload e2e (ATC-006, 009, 010)
 *   it 6 — confirm button disabled while install in flight (ATC-014)
 *
 * Notes on selectors:
 *   - Variable name + CDN URL inputs use placeholder fallbacks (GAP-001/002 in
 *     gaps tracker). Marked `// FALLBACK: GAP-NNN` so the AI prompt can swap.
 *   - runJS body uses `[data-cy="runjs-input-field"]` (GAP-007 resolved live).
 *   - ATC-015 (preload banner) was DROPPED — no banner element exists in source.
 */

import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import {
  appBuilderLibrariesSelector,
  appBuilderLibrariesGapFallbacks,
} from "Selectors/appBuilder/libraries";
import {
  appBuilderLibrariesText,
  appBuilderLibrariesTestData,
} from "Texts/appbuilder/libraries";
import {
  selectQueryFromLandingPage,
  addInputOnQueryField,
  query,
} from "Support/utils/queries";
import { resizeQueryPanel, verifypreview } from "Support/utils/dataSource";

const fallback = appBuilderLibrariesGapFallbacks;

// Helpers scoped to this spec — keep beforeEach lean.
const openLibrariesDrawer = () =>
  cy.get(appBuilderLibrariesSelector.leftSidebarLibrariesButton).click();

const fillAndSubmitAddLibrary = (name, url) => {
  cy.get(appBuilderLibrariesSelector.appLibrariesJavascriptAddButton).click();
  // FALLBACK: GAP-001
  cy.get(fallback.variableNameInput).clear().type(name);
  // FALLBACK: GAP-002
  cy.get(fallback.cdnUrlInput).clear().type(url);
  cy.get(appBuilderLibrariesSelector.modalConfirmButton).click();
};

const closeAnyOpenModal = () => {
  cy.get("body").then(($body) => {
    if ($body.find(appBuilderLibrariesSelector.modalCloseButton).length) {
      cy.get(appBuilderLibrariesSelector.modalCloseButton).click({ force: true });
    }
  });
};

describe("App Builder — Libraries & Preload Script (EE)", () => {
  const data = {};

  beforeEach(() => {
    data.appName = `${fake.companyName}-LibsApp`;
    cy.apiLogin();
    cy.apiCreateApp(data.appName);
    cy.openApp();
    cy.viewport(1600, 1200);
    cy.skipWalkthrough();
  });

  afterEach(() => {
    cy.apiDeleteApp().then(
      () => {},
      () => {}
    );
  });

  it("ATC-001/002 — opens & closes Libraries drawer, Add modal, Preload modal", () => {
    // Drawer open + verify entry-point buttons
    openLibrariesDrawer();
    cy.get(appBuilderLibrariesSelector.appLibrariesJavascriptAddButton)
      .should("be.visible")
      .and("contain.text", appBuilderLibrariesText.drawerJavascriptAddButtonLabel);
    cy.get(appBuilderLibrariesSelector.appLibrariesJavascriptScriptButton)
      .should("be.visible")
      .and(
        "have.attr",
        "aria-label",
        appBuilderLibrariesText.drawerJavascriptScriptButtonAriaLabel
      );

    // Add modal — open, verify chrome, close via Cancel
    cy.get(appBuilderLibrariesSelector.appLibrariesJavascriptAddButton).click();
    cy.get(appBuilderLibrariesSelector.modalTitle).should(
      "contain.text",
      appBuilderLibrariesText.addLibraryModalTitle
    );
    // FALLBACK: GAP-001 / GAP-002
    cy.get(fallback.variableNameInput).should("be.visible");
    cy.get(fallback.cdnUrlInput).should("be.visible");
    cy.get(appBuilderLibrariesSelector.modalCancelButton).click();
    cy.get(appBuilderLibrariesSelector.modalTitle).should("not.exist");

    // Add modal — re-open and close via X
    cy.get(appBuilderLibrariesSelector.appLibrariesJavascriptAddButton).click();
    cy.get(appBuilderLibrariesSelector.modalCloseButton).click();
    cy.get(appBuilderLibrariesSelector.modalTitle).should("not.exist");

    // Preload modal — open, verify title, close via X
    cy.get(appBuilderLibrariesSelector.appLibrariesJavascriptScriptButton).click();
    cy.get(appBuilderLibrariesSelector.modalTitle).should(
      "contain.text",
      appBuilderLibrariesText.preloadScriptModalTitle
    );
    cy.get(appBuilderLibrariesSelector.modalCloseButton).click();
    cy.get(appBuilderLibrariesSelector.modalTitle).should("not.exist");

    // Drawer close
    cy.get(appBuilderLibrariesSelector.appLibrariesCloseButton).click();
    cy.get(appBuilderLibrariesSelector.appLibrariesJavascriptAddButton).should(
      "not.exist"
    );
  });

  it("ATC-003/007/008 — installs lodash, removes via hover, persists across reload", () => {
    const name = appBuilderLibrariesTestData.lodashVariableName;
    const url = appBuilderLibrariesTestData.lodashCdn;

    openLibrariesDrawer();
    fillAndSubmitAddLibrary(name, url);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      appBuilderLibrariesText.addLibrarySuccessToast(name)
    );
    cy.get(appBuilderLibrariesSelector.appLibrariesItem(name))
      .should("be.visible")
      .and("contain.text", name);

    // Persist across reload
    cy.waitForAutoSave();
    cy.reload();
    cy.skipWalkthrough();
    openLibrariesDrawer();
    cy.get(appBuilderLibrariesSelector.appLibrariesItem(name)).should(
      "be.visible"
    );

    // Hover-reveal + remove
    cy.get(appBuilderLibrariesSelector.appLibrariesItem(name)).trigger(
      "mouseover"
    );
    cy.get(appBuilderLibrariesSelector.appLibrariesItemRemove(name))
      .invoke("show")
      .click({ force: true });
    cy.get(appBuilderLibrariesSelector.appLibrariesItem(name)).should(
      "not.exist"
    );
  });

  it("ATC-004/005/011/012 — rejects HTTP, reserved names, and unreachable CDN", () => {
    cy.intercept("GET", "**/__nope__/**", { statusCode: 404, body: "" }).as(
      "cdnNotFound"
    );

    openLibrariesDrawer();

    // ATC-004 — HTTP URL rejected
    fillAndSubmitAddLibrary(
      "httpAttempt",
      appBuilderLibrariesTestData.httpUrlRejected
    );
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      appBuilderLibrariesText.httpRejectedToast
    );
    cy.get(appBuilderLibrariesSelector.modalTitle).should(
      "contain.text",
      appBuilderLibrariesText.addLibraryModalTitle
    );
    closeAnyOpenModal();

    // ATC-005/011 — every reserved name rejected
    appBuilderLibrariesTestData.reservedNameSamples.forEach((reservedName) => {
      fillAndSubmitAddLibrary(reservedName, appBuilderLibrariesTestData.lodashCdn);
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        appBuilderLibrariesText.reservedNameToastFor(reservedName)
      );
      closeAnyOpenModal();
    });

    // ATC-012 — unreachable CDN surfaces a load-failure toast
    fillAndSubmitAddLibrary(
      "nopeLib",
      appBuilderLibrariesTestData.notFoundCdnUrl
    );
    // FALLBACK: GAP-008 — assert via toast (no inline error-banner data-cy)
    cy.get(commonSelectors.toastMessage).should("contain.text", "Failed to load");
    cy.get(appBuilderLibrariesSelector.modalTitle).should(
      "contain.text",
      appBuilderLibrariesText.addLibraryModalTitle
    );
  });

  it("ATC-013 — lists multiple libraries in the order they were added", () => {
    openLibrariesDrawer();

    const installs = [
      {
        name: appBuilderLibrariesTestData.lodashVariableName,
        url: appBuilderLibrariesTestData.lodashCdn,
      },
      {
        name: appBuilderLibrariesTestData.papaParseVariableName,
        url: appBuilderLibrariesTestData.papaParseCdn,
      },
    ];

    installs.forEach(({ name, url }) => {
      fillAndSubmitAddLibrary(name, url);
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        appBuilderLibrariesText.addLibrarySuccessToast(name)
      );
    });

    cy.get(fallback.appLibrariesList)
      .find(fallback.appLibrariesItemAny)
      .then(($items) => {
        const order = [...$items].map((el) =>
          el.getAttribute("data-cy").replace(/^app-libraries-item-/, "")
        );
        expect(order).to.deep.equal(installs.map((i) => i.name));
      });
  });

  it("ATC-006/009/010 — saves preload script and exercises library + preload exports in runJS", () => {
    const name = appBuilderLibrariesTestData.lodashVariableName;
    const url = appBuilderLibrariesTestData.lodashCdn;

    // Install lodash
    openLibrariesDrawer();
    fillAndSubmitAddLibrary(name, url);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      appBuilderLibrariesText.addLibrarySuccessToast(name)
    );

    // Save preload script (ATC-006)
    cy.get(appBuilderLibrariesSelector.appLibrariesJavascriptScriptButton).click();
    cy.get(appBuilderLibrariesSelector.modalTitle).should(
      "contain.text",
      appBuilderLibrariesText.preloadScriptModalTitle
    );
    cy.get(
      appBuilderLibrariesSelector.preloadedScriptEditorInputField
    ).clearAndTypeOnCodeMirror(appBuilderLibrariesTestData.preloadSampleBody);
    cy.get(appBuilderLibrariesSelector.modalConfirmButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      appBuilderLibrariesText.scriptSavedToast
    );

    // Close drawer so query panel is reachable
    cy.get(appBuilderLibrariesSelector.appLibrariesCloseButton).click();

    // Open queries panel + create runJS query (uses shared helpers)
    resizeQueryPanel("80");

    // ATC-009 — runJS uses installed library
    selectQueryFromLandingPage("runjs", "JavaScript");
    addInputOnQueryField("runjs", appBuilderLibrariesTestData.runJsLodashBody);
    query("run");
    verifypreview("raw", JSON.stringify(appBuilderLibrariesTestData.runJsLodashExpected));

    // ATC-010 — runJS uses preload export
    addInputOnQueryField("runjs", appBuilderLibrariesTestData.runJsPreloadBody);
    query("run");
    verifypreview("raw", String(appBuilderLibrariesTestData.runJsPreloadExpected));
  });

  it("ATC-016 — runtime cleanup: deleted library + replaced/cleared preload exports are no longer callable", () => {
    const lib = appBuilderLibrariesTestData.lodashVariableName;

    // Setup: install lodash + save preload returning { add }
    openLibrariesDrawer();
    fillAndSubmitAddLibrary(lib, appBuilderLibrariesTestData.lodashCdn);
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      appBuilderLibrariesText.addLibrarySuccessToast(lib)
    );

    cy.get(appBuilderLibrariesSelector.appLibrariesJavascriptScriptButton).click();
    cy.get(
      appBuilderLibrariesSelector.preloadedScriptEditorInputField
    ).clearAndTypeOnCodeMirror(appBuilderLibrariesTestData.preloadSampleBody);
    cy.get(appBuilderLibrariesSelector.modalConfirmButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      appBuilderLibrariesText.scriptSavedToast
    );
    cy.get(appBuilderLibrariesSelector.appLibrariesCloseButton).click();

    // Open queries panel and create the runJS query we'll re-use
    resizeQueryPanel("80");
    selectQueryFromLandingPage("runjs", "JavaScript");

    // Sanity — both library and preload export are callable
    addInputOnQueryField("runjs", appBuilderLibrariesTestData.probeLodashLib);
    query("run");
    verifypreview("raw", "lib-here");

    addInputOnQueryField("runjs", appBuilderLibrariesTestData.probeAddFn);
    query("run");
    verifypreview("raw", "add-here");

    // Phase 1 — delete the library and confirm the symbol is gone from runtime
    openLibrariesDrawer();
    cy.get(appBuilderLibrariesSelector.appLibrariesItem(lib)).trigger(
      "mouseover"
    );
    cy.get(appBuilderLibrariesSelector.appLibrariesItemRemove(lib))
      .invoke("show")
      .click({ force: true });
    cy.get(appBuilderLibrariesSelector.appLibrariesItem(lib)).should(
      "not.exist"
    );
    cy.get(appBuilderLibrariesSelector.appLibrariesCloseButton).click();

    addInputOnQueryField("runjs", appBuilderLibrariesTestData.probeLodashLib);
    query("run");
    verifypreview("raw", "lib-gone");

    // Phase 2 — replace the preload script (add → sub). Old export torn down,
    // new export available.
    openLibrariesDrawer();
    cy.get(appBuilderLibrariesSelector.appLibrariesJavascriptScriptButton).click();
    cy.get(
      appBuilderLibrariesSelector.preloadedScriptEditorInputField
    ).clearAndTypeOnCodeMirror(appBuilderLibrariesTestData.preloadAltBody);
    cy.get(appBuilderLibrariesSelector.modalConfirmButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      appBuilderLibrariesText.scriptSavedToast
    );
    cy.get(appBuilderLibrariesSelector.appLibrariesCloseButton).click();

    addInputOnQueryField("runjs", appBuilderLibrariesTestData.probeSubFn);
    query("run");
    verifypreview("raw", "sub-here");

    addInputOnQueryField("runjs", appBuilderLibrariesTestData.probeAddFn);
    query("run");
    verifypreview("raw", "add-gone");

    // Phase 3 — clear preload script (return {}). Even `sub` is no longer
    // callable.
    openLibrariesDrawer();
    cy.get(appBuilderLibrariesSelector.appLibrariesJavascriptScriptButton).click();
    cy.get(
      appBuilderLibrariesSelector.preloadedScriptEditorInputField
    ).clearAndTypeOnCodeMirror(appBuilderLibrariesTestData.preloadEmptyBody);
    cy.get(appBuilderLibrariesSelector.modalConfirmButton).click();
    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      appBuilderLibrariesText.scriptSavedToast
    );
    cy.get(appBuilderLibrariesSelector.appLibrariesCloseButton).click();

    addInputOnQueryField("runjs", appBuilderLibrariesTestData.probeSubFn);
    query("run");
    verifypreview("raw", "sub-gone");
  });

  it("ATC-014 — disables the confirm button while a library install is in flight", () => {
    cy.intercept("GET", appBuilderLibrariesTestData.lodashCdn, (req) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          req.continue();
          resolve();
        }, 1500);
      });
    }).as("slowCdn");

    openLibrariesDrawer();
    fillAndSubmitAddLibrary(
      appBuilderLibrariesTestData.lodashVariableName,
      appBuilderLibrariesTestData.lodashCdn
    );
    // FALLBACK: GAP-010
    cy.get(fallback.confirmButtonLoading).should("exist");

    cy.verifyToastMessage(
      commonSelectors.toastMessage,
      appBuilderLibrariesText.addLibrarySuccessToast(
        appBuilderLibrariesTestData.lodashVariableName
      )
    );
  });
});
