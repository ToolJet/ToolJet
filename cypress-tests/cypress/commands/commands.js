import "cypress-mailhog";
import {
  commonSelectors,
  commonWidgetSelector,
  cyParamName,
} from "Selectors/common";
import { commonEeSelectors } from "Selectors/eeCommon";
import { importSelectors } from "Selectors/exportImport";
import { onboardingSelectors } from "Selectors/onboarding";
import { selectAppCardOption } from "Support/utils/common";
import { commonText, createBackspaceText } from "Texts/common";
import { importText } from "Texts/exportImport";
const API_ENDPOINT =
  Cypress.env("environment") === "Community"
    ? "/api/library_apps"
    : "/api/library_apps";

Cypress.Commands.add(
  "appUILogin",
  (
    email = "dev@tooljet.io",
    password = "password",
    status = "success",
    toast = ""
  ) => {
    cy.waitForElement(onboardingSelectors.loginPasswordInput);
    cy.get(onboardingSelectors.loginPasswordInput, { timeout: 20000 })
      .should("be.visible")
      .click();
    cy.clearAndType(onboardingSelectors.loginEmailInput, email);
    cy.clearAndType(onboardingSelectors.loginPasswordInput, password);
    cy.get(onboardingSelectors.signInButton).click();
  }
);

Cypress.Commands.add("clearAndType", (selector, text) => {
  cy.waitForElement(selector)
    .scrollIntoView()
    .should("be.visible", { timeout: 10000 })
    .click({ force: true })
    .type(`{selectall}{backspace}`)
    .type(`{selectall}{backspace}${text}`);
});

Cypress.Commands.add("forceClickOnCanvas", () => {
  cy.get(commonSelectors.canvas).click("topRight", { force: true });
});

Cypress.Commands.add(
  "verifyToastMessage",
  (selector, message, closeAction = true, timeout = 15000) => {
    cy.get(selector, { timeout: timeout })
      .as("toast")
      .should("contain.text", message, { timeout: timeout });
    if (closeAction) {
      cy.get("body").then(($body) => {
        if ($body.find(commonSelectors.toastCloseButton).length > 0) {
          cy.closeToastMessage();
          cy.wait(500);
        }
      });
    }
  }
);

Cypress.Commands.add("waitForAutoSave", () => {
  cy.wait(200);
  cy.get(commonSelectors.autoSave, { timeout: 20000 })
    .should("have.text", "", { timeout: 20000 })
    .find("svg")
    .should("be.visible", { timeout: 20000 });
});

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

Cypress.Commands.add(
  "dragAndDropWidget",
  (
    widgetName,
    positionX = 100,
    positionY = 100,
    widgetName2 = widgetName,
    canvas = null // null = auto-detect: #real-canvas, or ModuleContainer's sub-canvas if in module editor
  ) => {
    // The react-dnd connector ref sits on `.draggable-box`, ancestor of the
    // widget-list-box. `:has()` lets the source selector resolve straight to
    // it. Don't reuse `widgetBox()` here — its trailing `:eq(0)` doesn't nest
    // cleanly inside `:has()`. Require `draggable="true"`: react-dnd sets that
    // attribute on the connector node only once mounted/connected, and dragging
    // before it's set makes cypress-real-dnd throw "source may not be a real
    // HTML5 draggable" (no dragIntercepted event).
    const sourceSelector = `.draggable-box[draggable="true"]:has([data-cy=widget-list-box-${cyParamName(widgetName2)}])`;
    const placedWidget = '[data-cy^="draggable-widget-"]';

    const countWidgets = () =>
      cy.get("body").then(($b) => $b.find(placedWidget).length);

    // Self-healing panel open. The search box is only RENDERED when the
    // components tab is active (RightSidebar renders it under
    // `activeTab === COMPONENTS`), so its DOM *presence* — not jQuery
    // `:visible`, flaky mid-transition — is the reliable "panel open" signal.
    // The components button is a TOGGLE and a drag's own `isDragging` effect
    // flips the sidebar asynchronously, so a single click can race the toggle
    // and land on the wrong state. Click → verify the search box appeared →
    // re-click if it didn't, until the panel is open (bounded retries).
    const ensureComponentsPanelOpen = (tries = 5) => {
      cy.get("body").then(($b) => {
        if ($b.find(commonSelectors.searchField).length > 0) return; // already open
        cy.get('[data-cy="right-sidebar-components-button"]').click();
        cy.wait(500); // let the toggle settle before re-checking
        cy.get("body").then(($b2) => {
          if ($b2.find(commonSelectors.searchField).length === 0 && tries > 1) {
            ensureComponentsPanelOpen(tries - 1);
          }
        });
      });
    };

    const openPanelAndSearch = () => {
      ensureComponentsPanelOpen();
      cy.get(commonSelectors.searchField)
        .should("be.visible")
        .first()
        .clear()
        .type(widgetName);
      cy.get(commonWidgetSelector.widgetBox(widgetName2)).should("be.visible");
    };

    // `[data-cy=real-canvas]` is reused by every SubContainer — `cy.get` picks
    // the FIRST match which can be a sidebar/preview surface, not the actual
    // editing canvas. Resolve by id instead:
    //   - module editor → ModuleContainer's sub-canvas (`#canvas-{uuid}`).
    //   - app editor   → `#real-canvas` (unique).
    const resolveCanvas = ($body) => {
      if (canvas) return canvas;
      const mc = $body.find('[component-type="ModuleContainer"]')[0];
      return mc?.id ? `#${mc.id}` : "#real-canvas";
    };

    // Poll for the new widget instead of checking once after a fixed wait: a
    // fixed delay races the render+autosave and triggers a SPURIOUS retry that
    // double-drops the widget (button1 + button2). Only re-drag if no new widget
    // appears within the poll window (a genuine cold-intercept SILENT miss).
    const confirmDropOrRetry = (before, pollsLeft, triesLeft) => {
      countWidgets().then((now) => {
        if (now > before) return; // drop succeeded
        if (pollsLeft <= 0) {
          if (triesLeft > 1) attempt(triesLeft - 1);
          return;
        }
        cy.wait(500);
        confirmDropOrRetry(before, pollsLeft - 1, triesLeft);
      });
    };

    // ----------------------------------------------------------------------
    // THE COLD-FIRST-DRAG THROW (suite-wide #1 blocker) and how this recovers.
    //
    // `cy.realDragAndDrop` → `cy.task("cdpRealDrag")`. On a cold pipeline (spec's
    // first drag, and re-cold after every apiCreateApp+openApp AUT navigation in
    // beforeEach) the plugin's CDP `Input.setInterceptDrags` arming is silently
    // absorbed by Cypress's still-settling automation/snapshot CDP traffic. The
    // plugin retries ONCE internally, but its warmup (getClient's cached
    // cdpPromise) runs only ONCE per spec run — NOT per navigation — so a freshly
    // navigated AUT can exhaust both internal attempts and the task REJECTS:
    //   "[cypress-real-dnd] No Input.dragIntercepted ...".
    // A rejected cy.task is a command-queue failure that `.then()` cannot catch,
    // so the old count-based retry never ran and beforeEach died.
    //
    // FIX: drive the drag under a scoped, single-shot `cy.on('fail')` trap. When
    // the cold-intercept throw fires, the trap re-arms via cy.realDragInit()
    // (re-runs the plugin warmup), settles, and re-drives the FULL attempt
    // (open→search→drag→count-poll). Returning false from the trap stops Cypress
    // from failing the test; the re-queued attempt resumes the command queue.
    // Any non-cold-intercept error, or exhausting throwTriesLeft, re-throws so we
    // never mask a genuine failure.
    //
    // We use a module-scoped flag (not a closure return) because Cypress invokes
    // `fail` handlers synchronously at error time; the handler enqueues recovery
    // commands and returns false. The handler is re-installed on every attempt so
    // it stays single-shot per drag.
    // Hold the current trap so we can detach a stale one before installing the
    // next (a never-fired `once` would otherwise stack and all fire together).
    let currentTrap = null;
    const installFailTrap = (throwTriesLeft) => {
      if (currentTrap) cy.removeListener("fail", currentTrap);
      const onFail = (err) => {
        currentTrap = null; // this handler has now fired
        const msg = (err && err.message) || "";
        const isColdIntercept = /dragIntercepted|cdpRealDrag/i.test(msg);
        if (isColdIntercept && throwTriesLeft > 1) {
          // Recover the cold-intercept THROW: re-arm + re-drive the whole
          // attempt. The re-armed init re-runs the plugin's mouse-cycle warmup.
          cy.realDragInit();
          cy.wait(900);
          attempt(throwTriesLeft - 1);
          return false; // swallow this failure; the re-driven attempt continues
        }
        throw err; // unrecoverable or out of retries — fail honestly
      };
      currentTrap = onFail;
      cy.on("fail", onFail);
    };

    const attempt = (triesLeft) => {
      installFailTrap(triesLeft);
      countWidgets().then((before) => {
        openPanelAndSearch();
        // Wait for react-dnd to mark the source draggable before initiating.
        cy.get(sourceSelector, { timeout: 15000 }).should("exist");
        // Re-arm immediately before each drag: heavy ops since the last arm
        // (panel toggle, search render) can clear the renderer's intercept.
        cy.realDragInit();
        cy.wait(300);
        cy.get("body").then(($body) => {
          cy.realDragAndDrop(sourceSelector, resolveCanvas($body), {
            targetX: positionX,
            targetY: positionY,
          });
          // Silent-miss recovery (intercept armed, but react-dnd made no
          // component). The THROW path is handled by the fail-trap above.
          confirmDropOrRetry(before, 16, triesLeft);
        });
      });
    };

    // Arm the CDP drag intercept before the first drag (re-runs plugin warmup
    // for THIS navigation; the plugin only auto-warms once per spec run).
    cy.realDragInit();
    cy.wait(500);
    // triesLeft doubles as the THROW retry budget — 4 gives the cold intercept
    // up to 4 re-arm+re-drive cycles before failing for real.
    attempt(4);
    cy.waitForAutoSave();
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

Cypress.Commands.add(
  "clearAndTypeOnCodeMirror",
  { prevSubject: "optional" },
  (subject, value) => {
    cy.wrap(subject)
      .realClick()
      .find(".cm-line")
      .invoke("text")
      .then((text) => {
        cy.wrap(subject)
          .last()
          .click()
          .type(createBackspaceText(text), { delay: 0 });
      });

    const splitIntoFlatArray = (value) => {
      // NOTE: include `-` in the word-char class. The regex only keeps matched
      // substrings, so any char absent from every alternative is silently
      // dropped — previously `custom-btn` tokenized to ["custom","btn"] and was
      // typed as "custombtn". `-` is placed last in the class so it's a literal.
      const regex = /(\{|\}|\(|\)|\[|\]|,|:|;|=>|\*|"[^"]*"|'[^']*'|[a-zA-Z0-9._-]+|\s+)/g;
      let prefix = "";
      return (
        value.match(regex)?.reduce((acc, part) => {
          if (part === "{{" || part === "((") {
            prefix = "{backspace}{backspace}";
            acc.push(part);
          } else if (part === "{" || part === "(" || part === "[") {
            acc.push(prefix + part);
            prefix = "{backspace}";
          } else if (part === "}}") {
            acc.push(prefix + part);
          } else if (part === " ") {
            acc.push(prefix + " ");
          } else if (part === ":") {
            acc.push(prefix + ":");
          } else {
            acc.push(prefix + part);
            prefix = "";
          }
          return acc;
        }, []) || []
      );
    };

    if (Array.isArray(value)) {
      cy.wrap(subject).last().realType(value.join(""), {
        parseSpecialCharSequences: false,
        delay: 0,
        force: true,
      });
    } else {
      splitIntoFlatArray(value).forEach((i) => {
        cy.wrap(subject)
          .last()
          .click()
          .realType(
            `{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}{end}${i}`,
            { parseSpecialCharSequences: false, delay: 0, force: true }
          );
      });
    }
  }
);

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

Cypress.Commands.add(
  "verifyVisibleElement",
  {
    prevSubject: "element",
  },
  (subject, assertion, value, ...arg) => {
    return cy
      .wrap(subject, { timeout: 10000 })
      .scrollIntoView({ timeout: 10000 })
      .should("be.visible", { timeout: 10000 })
      .and(assertion, value, ...arg);
  }
);
Cypress.Commands.add("scrollToElement", (selector) => {
  cy.get(selector).scrollIntoView()
    .should("be.visible");
});

Cypress.Commands.add("openInCurrentTab", (selector) => {
  cy.get(selector).parent().invoke("removeAttr", "target").click({ force: true });
});

Cypress.Commands.add("modifyCanvasSize", (x, y) => {
  cy.get("[data-cy='left-sidebar-settings-button']").click();
  cy.clearAndType("[data-cy='maximum-canvas-width-input-field']", x);
  cy.forceClickOnCanvas();
});

Cypress.Commands.add("createAppFromTemplate", (appName) => {
  cy.get('[data-cy="import-dropdown-menu"]').click();
  cy.get('[data-cy="choose-from-template-button"]').click();
  cy.get(`[data-cy="${appName}-list-item"]`).click();
  cy.get('[data-cy="create-application-from-template-button"]').click();
  cy.get('[data-cy="app-name-label"]').should("have.text", "App Name");
});

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

Cypress.Commands.add(
  "clearCodeMirror",
  {
    prevSubject: "element",
  },
  (subject, value) => {
    cy.wrap(subject)
      .realClick()
      .find(".cm-line")
      .invoke("text")
      .then((text) => {
        cy.wrap(subject).realType(createBackspaceText(text)),
        {
          delay: 0,
        };
      });
  }
);

Cypress.Commands.add("closeToastMessage", () => {
  cy.get(`${commonSelectors.toastCloseButton}:eq(0)`).click();
});

Cypress.Commands.add("notVisible", (dataCy) => { //Should be removed later
  cy.get("body").then(($body) => {
    if ($body.find(dataCy).length > 0) {
      cy.get(dataCy).should("not.be.visible");
    }
  });
  const log = Cypress.log({
    name: "notVisible",
    displayName: "Not Visible",
    message: dataCy,
  });
});

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

Cypress.Commands.add("reloadAppForTheElement", (elementText) => {
  cy.get("body").then(($title) => {
    if (!$title.text().includes(elementText)) {
      cy.reload();
    }
  });
});

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

Cypress.Commands.add("waitForAppLoad", () => {
  // const API_ENDPOINT =
  //   Cypress.env("environment") === "Community"
  //     ? "/api/v2/data_sources"
  //     : "/api/app-environments**";

  // const TIMEOUT = 15000;

  cy.intercept("GET", "/api/data-queries/**").as("appDs");
  cy.wait("@appDs", { timeout: 15000 });
});

Cypress.Commands.add("hideTooltip", () => {
  cy.get("body").then(($body) => {
    if ($body.find(".tooltip-inner").length > 0) {
      cy.get(".tooltip-inner").invoke("css", "display", "none");
    }
  });
});

Cypress.Commands.add("importApp", (appFile) => {
  cy.get(importSelectors.dropDownMenu).should("be.visible").click();
  cy.get(importSelectors.importOptionInput).eq(0).selectFile(appFile, {
    force: true,
  });
  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    importText.appImportedToastMessage
  );
});

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

Cypress.Commands.add("defaultWorkspaceLogin", (workspaceName = 'my-workspace') => {
  cy.apiLogin("dev@tooljet.io", "password").then(() => {
    cy.visit(`/${workspaceName}`);
    cy.wait(2000);
    cy.get(commonWidgetSelector.homePageLogo, { timeout: 50000 }).should(
      "be.visible",
      { timeout: 20000 }
    );

    cy.get(commonSelectors.homePageLogo, { timeout: 20000 });
  });
  cy.apiGetDefaultWorkspace().then((res) => {
    Cypress.env("workspaceId", res.id);
    cy.log(Cypress.env("workspaceId"));
  });

});

Cypress.Commands.add("visitSlug", ({ actualUrl }) => {
  cy.visit(actualUrl);
  cy.wait(2000);

  cy.url().then((currentUrl) => {
    if (currentUrl !== actualUrl) {
      cy.visit(actualUrl);
      cy.wait(2000);
    }
  });
});

Cypress.Commands.add("backToApps", () => {
  cy.get(commonSelectors.editorPageLogo).click();
  cy.get(commonSelectors.backToAppOption).click();
  cy.intercept("GET", API_ENDPOINT).as("library_apps");
  cy.wait("@library_apps");
  cy.get(commonSelectors.homePageLogo, { timeout: 10000 });
  cy.wait(2000);
});

Cypress.Commands.add(
  "saveFromIntercept",
  (interceptAlias, property, envVariable) => {
    cy.get(interceptAlias)
      .its("response.body")
      .then((responseBody) => {
        Cypress.env(envVariable, responseBody[property]);
      });
  }
);

Cypress.Commands.add("verifyLabel", (labelName) => {
  cy.get(commonSelectors.label(`${labelName}`)).verifyVisibleElement(
    "have.text",
    labelName
  );
});

Cypress.Commands.add(
  "verifyCssProperty",
  (selector, property, expectedValue) => {
    cy.get(selector).should("have.css", property).and("eq", expectedValue);
  }
);

Cypress.Commands.add("skipWalkthrough", () => {
  cy.window({ log: false }).then((win) => {
    win.localStorage.setItem("walkthroughCompleted", "true");
  });
});

Cypress.Commands.add("appPrivacy", (appName, isPublic) => {
  const isPublicValue = isPublic ? "true" : "false";
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `UPDATE apps SET is_public = ${isPublicValue} WHERE id = (SELECT app_id FROM app_versions WHERE app_name='${appName}' LIMIT 1);`,
  });
});

Cypress.Commands.overwrite( //update required if using
  "intercept",
  (originalFn, ...args) => {
    // The /apps subpath rewrite only applies to the (method, stringEndpoint)
    // form. Pass RouteMatcher objects, regexes, and the single-arg form
    // through untouched — otherwise `endpoint.startsWith` throws on a non-string
    // (e.g. `cy.intercept(/\/events/)`).
    const endpoint = args[1];
    if (typeof endpoint === "string") {
      const isSubpath = Cypress.config("baseUrl")?.includes("/apps");
      const cleanEndpoint = endpoint.startsWith("/apps")
        ? endpoint.replace("/apps", "")
        : endpoint;
      args[1] = isSubpath ? `/apps${cleanEndpoint}` : cleanEndpoint;
    }
    return originalFn(...args);
  }
);



Cypress.Commands.add("verifyElement", (selector, text, eqValue) => {
  const element =
    eqValue !== undefined ? cy.get(selector).eq(eqValue) : cy.get(selector);
  element.should("be.visible").and("have.text", text);
});

Cypress.Commands.add("getAppId", (appName) => {
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `select app_id from app_versions where app_name='${appName}';`,
  }).then((resp) => {
    const appId = resp.rows[0]?.app_id;
    return appId;
  });
});

Cypress.Commands.add("ifEnv", (expectedEnvs, callback) => {
  const actualEnv = Cypress.env("environment");
  const envArray = Array.isArray(expectedEnvs) ? expectedEnvs : [expectedEnvs];

  if (envArray.includes(actualEnv)) {
    callback();
  }
});

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

Cypress.Commands.add("runSqlQueryOnDB", (query, db = Cypress.env("app_db")) => {
  return cy.task("dbConnection", {
    dbconfig: db,
    sql: query,
  });
});

Cypress.Commands.add(
  "openWorkflow",
  (
    slug = "",
    workspaceId = Cypress.env("workspaceId"),
    workflowId = Cypress.env("workflowId")
  ) => {
    cy.intercept("GET", "/api/apps/*").as("getWorkflowData");
    cy.window({ log: false }).then((win) => {
      win.localStorage.setItem("walkthroughCompleted", "true");
    });
    cy.visit(`/${workspaceId}/apps/${workflowId}/${slug}`);

    cy.wait("@getWorkflowData").then((interception) => {
      const responseData = interception.response.body;

      Cypress.env("editingVersionId", responseData.editing_version.id);
      Cypress.env("environmentId", responseData.editorEnvironment.id);
      Cypress.env("workflowId", responseData.id);
    });
  }
);

Cypress.Commands.add("waitForElement", (selector, timeout = 50000) => {
  return cy.get(selector, { timeout: timeout, log: false })
    .should("be.visible", { timeout: timeout, log: false })
    .then(($el) => {
      Cypress.log({
        name: "waitForElement",
        displayName: "WAIT",
        message: `Waiting for element: ${selector}`,
        consoleProps: () => {
          return {
            Selector: selector,
            Timeout: timeout,
          };
        },
      });
      return cy.wrap($el, { log: false });
    })
    .wait(100, { log: false });
});

Cypress.Commands.add("verifyFromClipboard", (value, delay = 0) => {
  cy.wait(delay);
  cy.window().then((win) => {
    win.navigator.clipboard.readText().then((text) => {
      expect(text).to.eq(value);
    });
  });
});