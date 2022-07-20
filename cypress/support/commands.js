import { emptyDashboardText } from "Texts/dashboard";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { loginSelectors } from "Selectors/login";
import { commonText, createBackspaceText } from "Texts/common";

Cypress.Commands.add("login", (email, password) => {
  cy.visit("/");
  cy.clearAndType(loginSelectors.emailField, email);
  cy.clearAndType(loginSelectors.passwordField, password);
  cy.get(loginSelectors.signInButton).click();
  cy.get(loginSelectors.homePage).should("be.visible");
});

Cypress.Commands.add("clearAndType", (selector, text) => {
  cy.get(selector).clear().type(text);
});

Cypress.Commands.add("verifyToastMessage", (selector, message) => {
  cy.get(selector).should("be.visible").should("have.text", message);
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
  if (appName) {
    cy.clearAndType(commonSelectors.appNameInput, appName);
    cy.get(commonSelectors.backButton).click();
  }
});

Cypress.Commands.add(
  "dragAndDropWidget",
  (widgetName, positionX = 190, positionY = 80) => {
    const dataTransfer = new DataTransfer();

    cy.get(commonSelectors.searchField).type(widgetName);
    cy.get(commonWidgetSelector.widgetBox(widgetName)).trigger(
      "dragstart",
      { dataTransfer },
      { force: true }
    );
    cy.get(commonSelectors.canvas).trigger("drop", positionX, positionY, {
      dataTransfer,
      force: true,
    });
    cy.get(commonSelectors.autoSave, { timeout: 10000 }).should(
      "have.text",
      commonText.autoSave
    );
  }
);

Cypress.Commands.add("appUILogin", () => {
  cy.visit("/");
  cy.clearAndType(loginSelectors.emailField, "dev@tooljet.io");
  cy.clearAndType(loginSelectors.passwordField, "password");
  cy.get(loginSelectors.signInButton).click();
  cy.get(commonSelectors.homePageLogo).should("be.visible");
  cy.wait(1000);
  cy.get("body").then(($el) => {
    if ($el.text().includes("Skip")) {
      cy.get(commonSelectors.skipInstallationModal).click();
    } else {
      cy.log("Installation is Finished");
    }
  });

  Cypress.Commands.add(
    "clearAndTypeOnCodeMirror",
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
});
