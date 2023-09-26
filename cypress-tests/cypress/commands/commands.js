import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { dashboardSelector } from "Selectors/dashboard";
import { ssoSelector } from "Selectors/manageSSO";
import { commonText, createBackspaceText } from "Texts/common";
import { passwordInputText } from "Texts/passwordInput";

Cypress.Commands.add(
  "login",
  (email = "dev@tooljet.io", password = "password") => {
    cy.visit("/");
    cy.clearAndType(commonSelectors.workEmailInputField, email);
    cy.clearAndType(commonSelectors.passwordInputField, password);
    cy.get(commonSelectors.signInButton).click();
    cy.wait(2000);
    cy.get(commonSelectors.homePageLogo).should("be.visible");
  }
);

Cypress.Commands.add("clearAndType", (selector, text) => {
  cy.get(selector).clear().type(text, { log: false });
});

Cypress.Commands.add("forceClickOnCanvas", () => {
  cy.get(commonSelectors.canvas).click("topRight", { force: true });
});

Cypress.Commands.add(
  "verifyToastMessage",
  (selector, message, closeAction = true) => {
    cy.get(selector).as("toast").should("contain.text", message);
    if (closeAction) {
      cy.get("body").then(($body) => {
        if ($body.find(commonSelectors.toastCloseButton).length > 0) {
          cy.closeToastMessage();
          cy.wait(200);
        }
      });
    }
  }
);

Cypress.Commands.add("waitForAutoSave", () => {
  cy.wait(200);
  cy.get(commonSelectors.autoSave, { timeout: 20000 }).should(
    "have.text",
    commonText.autoSave,
    { timeout: 20000 }
  );
});

Cypress.Commands.add("createApp", (appName) => {
  const getAppButtonSelector = ($title) =>
    $title.text().includes(commonText.introductionMessage)
      ? commonSelectors.emptyAppCreateButton
      : commonSelectors.appCreateButton;

  cy.get("body").then(($title) => {
    cy.get(getAppButtonSelector($title)).click();
  });
  cy.waitForAppLoad();
  cy.skipEditorPopover();
});

Cypress.Commands.add(
  "dragAndDropWidget",
  (
    widgetName,
    positionX = 190,
    positionY = 80,
    widgetName2 = widgetName,
    canvas = commonSelectors.canvas
  ) => {
    const dataTransfer = new DataTransfer();

    cy.clearAndType(commonSelectors.searchField, widgetName);
    cy.get(commonWidgetSelector.widgetBox(widgetName2)).trigger(
      "dragstart",
      { dataTransfer },
      { force: true }
    );
    cy.get(canvas).trigger("drop", positionX, positionY, {
      dataTransfer,
      force: true,
    });
    cy.waitForAutoSave();
  }
);

Cypress.Commands.add("appUILogin", () => {
  cy.visit("/");
  cy.clearAndType(commonSelectors.workEmailInputField, "dev@tooljet.io");
  cy.clearAndType(commonSelectors.passwordInputField, "password");
  cy.get(commonSelectors.signInButton).click();
  cy.wait(2000);
  cy.get(commonSelectors.homePageLogo).should("be.visible");
});

Cypress.Commands.add(
  "clearAndTypeOnCodeMirror",
  {
    prevSubject: "optional",
  },
  (subject, value) => {
    cy.wrap(subject)
      .realClick()
      .find("pre.CodeMirror-line")
      .invoke("text")
      .then((text) => {
        cy.wrap(subject).type(createBackspaceText(text), { delay: 0 }),
        {
          delay: 0,
        };
      });
    if (!Array.isArray(value)) {
      cy.wrap(subject).type(value, {
        parseSpecialCharSequences: false,
        delay: 0,
      });
    } else {
      cy.wrap(subject)
        .type(value[1], {
          parseSpecialCharSequences: false,
          delay: 0,
        })
        .type(`{home}${value[0]}`, { delay: 0 });
    }
  }
);

Cypress.Commands.add("deleteApp", (appName) => {
  cy.intercept("DELETE", "/api/apps/*").as("appDeleted");
  cy.get(commonSelectors.appCard(appName))
    .realHover()
    .find(commonSelectors.appCardOptionsButton)
    .realHover()
    .click();
  cy.get(commonSelectors.deleteAppOption).click();
  cy.get(commonSelectors.buttonSelector(commonText.modalYesButton)).click();
  cy.wait("@appDeleted");
});

Cypress.Commands.add(
  "verifyVisibleElement",
  {
    prevSubject: "element",
  },
  (subject, assertion, value, ...arg) => {
    return cy
      .wrap(subject)
      .scrollIntoView()
      .should("be.visible")
      .and(assertion, value, ...arg);
  }
);

Cypress.Commands.add("openInCurrentTab", (selector) => {
  cy.get(selector).invoke("removeAttr", "target").click();
});

Cypress.Commands.add("modifyCanvasSize", (x, y) => {
  cy.get("[data-cy='left-sidebar-settings-button']").click();
  cy.clearAndType("[data-cy='maximum-canvas-width-input-field']", x);
  cy.forceClickOnCanvas();
});

Cypress.Commands.add("renameApp", (appName) => {
  cy.get(commonSelectors.appNameInput).type(
    `{selectAll}{backspace}${appName}`,
    { force: true }
  );
  cy.forceClickOnCanvas();
  cy.waitForAutoSave();
});

Cypress.Commands.add(
  "clearCodeMirror",
  {
    prevSubject: "element",
  },
  (subject, value) => {
    cy.wrap(subject)
      .click()
      .find("pre.CodeMirror-line")
      .invoke("text")
      .then((text) => {
        cy.wrap(subject).type(createBackspaceText(text)),
        {
          delay: 0,
        };
      });
  }
);

Cypress.Commands.add("closeToastMessage", () => {
  cy.get(`${commonSelectors.toastCloseButton}:eq(0)`).click();
});

Cypress.Commands.add("notVisible", (dataCy) => {
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
  // cy.get(".text-muted");
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
  const API_ENDPOINT =
    Cypress.env("environment") === "Community"
      ? "/api/v2/data_sources"
      : "/api/app-environments/**";

  const TIMEOUT = 15000;

  cy.intercept("GET", API_ENDPOINT).as("appDs");
  cy.wait("@appDs", { timeout: TIMEOUT });
});

Cypress.Commands.add("visitTheWorkspace", (workspaceName) => {
  cy.task("updateId", {
    dbconfig: Cypress.env("app_db"),
    sql: `select id from organizations where name='${workspaceName}';`,
  }).then((resp) => {
    let workspaceId = resp.rows[0].id;
    cy.visit(workspaceId);
  });
  cy.wait(2000);
});

Cypress.Commands.add("hideTooltip", () => {
  cy.get("body").then(($body) => {
    if ($body.find(".tooltip-inner").length > 0) {
      cy.get(".tooltip-inner").invoke("css", "display", "none");
    }
  });
});
