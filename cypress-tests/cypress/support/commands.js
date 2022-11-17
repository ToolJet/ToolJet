import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { loginSelectors } from "Selectors/login";
import { commonText, createBackspaceText } from "Texts/common";

Cypress.Commands.add("login", (email, password) => {
  cy.visit("/");
  cy.clearAndType(loginSelectors.emailField, email);
  cy.clearAndType(loginSelectors.passwordField, password);
  cy.intercept("GET", "/api/apps?page=1&folder=&searchKey=").as("homePage");
  cy.get(loginSelectors.signInButton).click();
  cy.get(loginSelectors.homePage).should("be.visible");
  cy.wait("@homePage");
});

Cypress.Commands.add("clearAndType", (selector, text) => {
  cy.get(selector).clear().type(text);
});

Cypress.Commands.add("forceClickOnCanvas", () => {
  cy.get(commonSelectors.canvas).click({ force: true });
});

Cypress.Commands.add("verifyToastMessage", (selector, message) => {
  cy.get(selector).should("be.visible").and("have.text", message);
  cy.get("body").then(($body) => {
    if ($body.find(commonSelectors.toastCloseButton).length > 0) {
      cy.closeToastMessage();
    }
  });
});

Cypress.Commands.add("appLogin", () => {
  cy.request({
    url: "http://localhost:3000/api/authenticate",
    method: "POST",
    body: {
      email: "dev@tooljet.io",
      password: "password",
    },
  })
    .its("body")
    .then((res) =>
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          id: res.id,
          auth_token: res.auth_token,
          email: res.email,
          first_name: res.first_name,
          last_name: res.last_name,
          organization_id: res.organization_id,
          organization: res.organization,
          admin: true,
          group_permissions: [
            {
              id: res.id,
              organization_id: res.organization_id,
              group: res.group,
              app_create: false,
              app_delete: false,
              folder_create: false,
            },
            {
              id: res.id,
              organization_id: res.organization_id,
              group: res.group,
              app_create: true,
              app_delete: true,
              folder_create: true,
            },
          ],
          app_group_permissions: [],
        })
      )
    );

  cy.visit("/");
});

Cypress.Commands.add("waitForAutoSave", () => {
  cy.get(commonSelectors.autoSave, { timeout: 10000 }).should(
    "have.text",
    commonText.autoSave
  );
});

Cypress.Commands.add("createApp", (appName) => {
  cy.get("body").then(($title) => {
    if ($title.text().includes(commonText.introductionMessage)) {
      cy.get(commonSelectors.emptyAppCreateButton).click();
    } else {
      cy.get(commonSelectors.appCreateButton).click();
    }
    cy.intercept("GET", "/api/apps/**/versions").as("appVersion");
    cy.wait("@appVersion", { timeout: 15000 });
    cy.get("body").then(($el) => {
      if ($el.text().includes("Skip", { timeout: 1000 })) {
        cy.get(commonSelectors.skipButton).click();
      } else {
        cy.log("instructions modal is skipped ");
      }
    });
  });
});

Cypress.Commands.add(
  "dragAndDropWidget",
  (widgetName, positionX = 190, positionY = 80) => {
    const dataTransfer = new DataTransfer();

    cy.clearAndType(commonSelectors.searchField, widgetName);
    cy.get(commonWidgetSelector.widgetBox(widgetName)).trigger(
      "dragstart",
      { dataTransfer },
      { force: true }
    );
    cy.get(commonSelectors.canvas).trigger("drop", positionX, positionY, {
      dataTransfer,
      force: true,
    });
    cy.waitForAutoSave();
  }
);

Cypress.Commands.add("appUILogin", () => {
  cy.visit("/");
  cy.clearAndType(loginSelectors.emailField, "dev@tooljet.io");
  cy.clearAndType(loginSelectors.passwordField, "password");
  cy.intercept("GET", "/api/apps?page=1&folder=&searchKey=").as("homePage");
  cy.get(loginSelectors.signInButton).click();
  cy.get(commonSelectors.homePageLogo).should("be.visible");
  cy.wait("@homePage");
  cy.wait(500);
  cy.get("body").then(($el) => {
    if ($el.text().includes("Skip")) {
      cy.get(commonSelectors.skipInstallationModal).click();
    } else {
      cy.log("Installation is Finished");
    }
  });
});

Cypress.Commands.add(
  "clearAndTypeOnCodeMirror",
  {
    prevSubject: "optional",
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
    .find(commonSelectors.appCardOptionsButton)
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
  cy.clearAndType("[data-cy='maximum-canvas-height-input-field']", y);
  cy.forceClickOnCanvas();
});

Cypress.Commands.add("renameApp", (appName) => {
  cy.clearAndType(commonSelectors.appNameInput, appName);
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
