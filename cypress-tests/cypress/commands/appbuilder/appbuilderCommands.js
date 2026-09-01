import {
  commonSelectors,
  commonWidgetSelector,
  cyParamName,
} from "Selectors/common";
import { commonText } from "Texts/common";
import { selectAppCardOption } from "Support/utils/common";

/**
 * @tjCmd   canvas · drop a widget onto the editor canvas by its display name and target coordinates
 * @tjUsage cy.dragAndDropWidget('Button', 300, 200)
 */
Cypress.Commands.add(
  "dragAndDropWidget",
  (
    widgetName,
    positionX = 100,
    positionY = 100,
    widgetName2 = widgetName,
    canvas = null // null = auto-detect: #real-canvas, or ModuleContainer's sub-canvas if in module editor
  ) => {
    // Open widget panel and search
    cy.get('[data-cy="right-sidebar-components-button"]').click();
    cy.get(commonSelectors.searchField)
      .should("be.visible")
      .first()
      .clear()
      .type(widgetName);
    cy.get(commonWidgetSelector.widgetBox(widgetName2)).should("be.visible");

    // `[data-cy=real-canvas]` is reused by every SubContainer — `cy.get` picks
    // the FIRST match which can be a sidebar/preview surface, not the actual
    // editing canvas. Resolve by id instead:
    //   - module editor → ModuleContainer's sub-canvas (`#canvas-{uuid}`) —
    //     the root canvas rejects drops in that mode.
    //   - app editor   → `#real-canvas` (unique).
    // Caller can override via `canvas` arg if they need a specific sub-canvas.
    cy.get("body").then(($body) => {
      let resolvedCanvas = canvas;
      if (!resolvedCanvas) {
        const mc = $body.find('[component-type="ModuleContainer"]')[0];
        resolvedCanvas = mc?.id ? `#${mc.id}` : "#real-canvas";
      }

      // The react-dnd connector ref sits on `.draggable-box`, ancestor of the
      // widget-list-box. `:has()` lets the source selector resolve straight to
      // it. Don't reuse `widgetBox()` here — its trailing `:eq(0)` doesn't
      // nest cleanly inside `:has()`.
      const sourceSelector = `.draggable-box:has([data-cy=widget-list-box-${cyParamName(widgetName2)}])`;
      // Re-prime the drag pipeline for the freshly-navigated app document.
      // Each test creates+opens an app in beforeEach, which resets the
      // renderer's intercept state; without this the first drag goes cold and
      // the plugin's retry loop can overrun the 15s task timeout. Priming here
      // lands the drag on the first attempt.
      cy.realDragRewarm();
      cy.realDragAndDrop(sourceSelector, resolvedCanvas, {
        targetX: positionX,
        targetY: positionY,
      });
      cy.waitForAutoSave();
    });
  }
);

/* ===========================================================================
 * REUSE-AFTER-PLUGIN-FIX: simplified dragAndDropWidget (band-aid removed)
 * ---------------------------------------------------------------------------
 * The `cy.on('fail')` trap + `installFailTrap`/`currentTrap`/`onFail` above is
 * a WORKAROUND for a bug in cypress-real-dnd: `cy.realDragInit()` is a no-op on
 * a warm (cached) CDP client, so it can't re-arm the intercept after each
 * apiCreateApp+openApp AUT navigation → the first post-navigation drag THROWS
 * "No Input.dragIntercepted", which a rejected cy.task can't recover from.
 *
 * Once cypress-real-dnd is fixed so `cy.realDragInit()` (or a new
 * `cy.realDragRewarm()`) ACTUALLY re-runs the arm+warmup on the existing client
 * — see cypress-tests/CYPRESS_REAL_DND_FIX.md for the exact package change —
 * the throw stops happening, the fail-trap is no longer needed, and this whole
 * command collapses to the version below. Delete `installFailTrap`,
 * `currentTrap`, `onFail`, and the `cy.on('fail')` wiring; keep only the
 * per-navigation re-arm + the silent-miss poll:
 *
 *   const attempt = (triesLeft) => {
 *     countWidgets().then((before) => {
 *       openPanelAndSearch();
 *       cy.get(sourceSelector, { timeout: 15000 }).should("exist");
 *       cy.realDragInit();   // post-fix: genuinely re-arms+re-warms per nav
 *       cy.wait(300);
 *       cy.get("body").then(($body) => {
 *         cy.realDragAndDrop(sourceSelector, resolveCanvas($body), {
 *           targetX: positionX,
 *           targetY: positionY,
 *         });
 *         confirmDropOrRetry(before, 16, triesLeft); // silent-miss safety net
 *       });
 *     });
 *   };
 *   cy.realDragInit();
 *   cy.wait(500);
 *   attempt(3);
 *   cy.waitForAutoSave();
 *
 * Validate after switching: re-run buttonHappyPath + datePickerHappyPath +
 * componentsBasics/button.cy.js — all should stay green with NO fail-trap.
 * =========================================================================== */

/**
 * @tjCmd   interaction · click the canvas background to deselect the current widget or dismiss panels
 * @tjUsage cy.forceClickOnCanvas()
 */
Cypress.Commands.add("forceClickOnCanvas", () => {
  cy.get(commonSelectors.canvas).click("topRight", { force: true });
});

/**
 * @tjCmd   wait · pause until the editor autosave indicator clears, confirming all changes are saved
 * @tjUsage cy.waitForAutoSave()
 */
Cypress.Commands.add("waitForAutoSave", () => {
  cy.wait(200);
  cy.get(commonSelectors.autoSave, { timeout: 20000 })
    .should("have.text", "", { timeout: 20000 })
    .find("svg")
    .should("be.visible", { timeout: 20000 });
});

/**
 * @tjCmd   canvas · change the maximum canvas width via the editor settings panel
 * @tjUsage cy.modifyCanvasSize(1200, 800)
 */
Cypress.Commands.add("modifyCanvasSize", (x, y) => {
  cy.get("[data-cy='left-sidebar-settings-button']").click();
  cy.clearAndType("[data-cy='maximum-canvas-width-input-field']", x);
  cy.forceClickOnCanvas();
});

/**
 * @tjCmd   canvas · resize a widget on the canvas to new pixel dimensions by dragging its bottom-right handle
 * @tjUsage cy.resizeWidget('button1', 600, 400)
 */
Cypress.Commands.add(
  "resizeWidget",
  (widgetName, x, y, autosaveStatusCheck = true) => {
    cy.get(`[data-cy="draggable-widget-${widgetName}"]`).trigger("mouseover", {
      force: true,
    });

    cy.get('[class="bottom-right"]').trigger("mousedown", {
      which: 1,
      force: true,
    });
    cy.get(commonSelectors.canvas)
      .trigger("mousemove", {
        which: 1,
        clientX: x,
        ClientY: y,
        clientX: x,
        clientY: y,
        pageX: x,
        pageY: y,
        screenX: x,
        screenY: y,
      })
      .trigger("mouseup");
    if (autosaveStatusCheck) {
      cy.waitForAutoSave();
    }
  }
);

/**
 * @tjCmd   canvas · move an existing widget to a new position on the canvas
 * @tjUsage cy.moveComponent('button1', 400, 300)
 */
Cypress.Commands.add("moveComponent", (componentName, x, y) => {
  cy.get(`[data-cy="draggable-widget-${componentName}"]`, { log: false })
    .trigger("mouseover", {
      force: true,
      log: false,
    })
    .trigger("mousedown", {
      which: 1,
      force: true,
      log: false,
    });
  cy.get(commonSelectors.canvas, { log: false })
    .trigger("mousemove", {
      which: 1,
      // #real-canvas is overlaid by #main-editor-canvas, so an un-forced
      // mousemove fails the actionability "covered by another element" check.
      force: true,
      clientX: x,
      clientY: y,
      pageX: x,
      pageY: y,
      screenX: x,
      screenY: y,
      log: false,
    })
    .trigger("mouseup", { force: true, log: false });

  const log = Cypress.log({
    name: "moveComponent",
    displayName: "Component moved:",
    message: `X: ${x}, Y:${y}`,
  });
});

/**
 * @tjCmd   canvas · retrieve the current center coordinates of a placed widget on the canvas
 * @tjUsage cy.getPosition('button1')
 */
Cypress.Commands.add("getPosition", (componentName) => {
  cy.get(commonWidgetSelector.draggableWidget(componentName)).then(
    ($element) => {
      const element = $element[0];
      const rect = element.getBoundingClientRect();

      const clientX = Math.round(rect.left + window.scrollX + rect.width / 2);
      const clientY = Math.round(rect.top + window.scrollY + rect.height / 2);

      const log = Cypress.log({
        name: "getPosition",
        displayName: `${componentName}'s Position:\n`,
        message: `\nX: ${clientX}, Y:${clientY}`,
      });
      return [clientX, clientY];
    }
  );
});

/**
 * @tjCmd   editor · reload the current app page only when a specific element or text is not yet present
 * @tjUsage cy.reloadAppForTheElement('drag-and-drop-a-component-label')
 */
Cypress.Commands.add("reloadAppForTheElement", (elementText) => {
  cy.get("body").then(($title) => {
    if (!$title.text().includes(elementText)) {
      cy.reload();
    }
  });
});

/**
 * @tjCmd   editor · dismiss the onboarding walkthrough popover if it appears after opening the editor
 * @tjUsage cy.skipEditorPopover()
 */
Cypress.Commands.add("skipEditorPopover", () => {
  cy.wait(1000);
  cy.get("body").then(($el) => {
    if ($el.text().includes("Skip", { timeout: 2000 })) {
      cy.get(commonSelectors.skipButton).realClick();
    }
  });
  const log = Cypress.log({
    name: "Skip Popover",
    displayName: "Skip Popover",
    message: " Popover skipped",
  });
});

/**
 * @tjCmd   wait · wait for the app editor to finish loading by intercepting the data-queries API response
 * @tjUsage cy.waitForAppLoad()
 */
Cypress.Commands.add("waitForAppLoad", () => {
  // const API_ENDPOINT =
  //   Cypress.env("environment") === "Community"
  //     ? "/api/v2/data_sources"
  //     : "/api/app-environments**";

  // const TIMEOUT = 15000;

  cy.intercept("GET", "/api/data-queries/**").as("appDs");
  cy.wait("@appDs", { timeout: 15000 });
});

/**
 * @tjCmd   editor · open the components sidebar panel if it is not already visible
 * @tjUsage cy.openComponentSidebar()
 */
Cypress.Commands.add("openComponentSidebar", (selector, value) => {
  cy.get("body").then(($body) => {
    const isSearchVisible = $body
      .find(commonSelectors.searchField)
      .is(":visible");

    if (!isSearchVisible) {
      cy.get('[data-cy="right-sidebar-components-button"]').click();
    }
  });
});

/**
 * @tjCmd   interaction · hide any visible tooltip overlay that may obscure elements during a test
 * @tjUsage cy.hideTooltip()
 */
Cypress.Commands.add("hideTooltip", () => {
  cy.get("body").then(($body) => {
    if ($body.find(".tooltip-inner").length > 0) {
      cy.get(".tooltip-inner").invoke("css", "display", "none");
    }
  });
});

/**
 * @tjCmd   app-crud · create a new blank app from the dashboard and wait for the editor to load
 * @tjUsage cy.createApp('My Test App')
 */
Cypress.Commands.add("createApp", (appName) => {
  const getAppButtonSelector = ($title) =>
    $title.text().includes(commonText.introductionMessage)
      ? commonSelectors.dashboardAppCreateButton
      : commonSelectors.appCreateButton;

  cy.get("body").then(($title) => {
    cy.get(getAppButtonSelector($title))
      .scrollIntoView()
      .click({ force: true }); //workaround for cypress dashboard click issue
    cy.clearAndType('[data-cy="app-name-input"]', appName);
    cy.get('[data-cy="create-app"]').click();
  });
  cy.waitForAppLoad();
  cy.skipEditorPopover();
});

/**
 * @tjCmd   app-crud · delete an app from the dashboard by its name and confirm the deletion toast
 * @tjUsage cy.deleteApp('My Test App')
 */
Cypress.Commands.add("deleteApp", (appName) => {
  cy.intercept("DELETE", "/api/apps/*").as("appDeleted");
  selectAppCardOption(
    appName,
    commonSelectors.appCardOptions(commonText.deleteAppOption)
  );
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.appDeletedToast
  );
  cy.wait("@appDeleted");
});

/**
 * @tjCmd   app-crud · rename the currently open app via the editor header rename modal
 * @tjUsage cy.renameApp('Renamed App')
 */
Cypress.Commands.add("renameApp", (appName) => {
  // Renaming is now modal-driven (frontend/src/AppBuilder/Header/EditAppName.jsx):
  // the editor header shows a button `edit-app-name-button` that opens an
  // AppModal. The rename input (`app-name-input`) and submit button
  // (`rename-app`, from generateCypressDataCy("Rename app")) only exist once
  // that modal is open, so click the header button first.
  cy.get(commonSelectors.editAppNameButton).click();
  cy.get(commonSelectors.appNameInput).type(
    `{selectAll}{backspace}${appName}`,
    { force: true }
  );
  cy.get(commonSelectors.renameAppButton).should("be.enabled").click();
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    commonText.appRenamedToast
  );
});

/**
 * @tjCmd   app-crud · create a new app from a named template using the import dropdown
 * @tjUsage cy.createAppFromTemplate('Ecommerce')
 */
Cypress.Commands.add("createAppFromTemplate", (appName) => {
  cy.get('[data-cy="import-dropdown-menu"]').click();
  cy.get('[data-cy="choose-from-template-button"]').click();
  cy.get(`[data-cy="${appName}-list-item"]`).click();
  cy.get('[data-cy="create-application-from-template-button"]').click();
  cy.get('[data-cy="app-name-label"]').should("have.text", "App Name");
});
