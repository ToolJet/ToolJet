import "cypress-mailhog";
import {
  commonSelectors,
  commonWidgetSelector,
  cyParamName,
} from "Selectors/common";
import { commonEeSelectors } from "Selectors/platform/eeCommon";
import { importSelectors } from "Selectors/platform/exportImport";
import { onboardingSelectors } from "Selectors/platform/onboarding";
import { selectAppCardOption } from "Support/utils/common";
import { commonText, createBackspaceText } from "Texts/common";
import { importText } from "Texts/platform/exportImport";
const API_ENDPOINT =
  Cypress.env("environment") === "Community"
    ? "/api/library_apps"
    : "/api/library_apps";

/**
 * @tjBlock  shared
 * @tjUsage  cy.appUILogin(data.email, "password")
 */
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

/**
 * @tjBlock  shared
 * @tjUsage  cy.clearAndType(ssoEeSelector.portInput, "10389")
 */
Cypress.Commands.add("clearAndType", (selector, text) => {
  cy.waitForElement(selector)
    .scrollIntoView()
    .should("be.visible", { timeout: 10000 })
    .click({ force: true })
    .type(`{selectall}{backspace}`)
    .type(`{selectall}{backspace}${text}`);
});

/**
 * @tjType   toastMessage.verify
 * @tjBlock  shared
 * @tjUsage  cy.verifyToastMessage(commonSelectors.toastMessage, serverMessage)
 */
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
/**
 * @tjBlock  shared
 * @tjUsage  cy.scrollToElement(field)
 */
Cypress.Commands.add("scrollToElement", (selector) => {
  cy.get(selector).scrollIntoView()
    .should("be.visible");
});

/**
 * @tjBlock  shared
 * @tjUsage  cy.openInCurrentTab(commonWidgetSelector.previewButton)
 */
Cypress.Commands.add("openInCurrentTab", (selector) => {
  cy.get(selector).parent().invoke("removeAttr", "target").click({ force: true });
});

Cypress.Commands.add("closeToastMessage", () => {
  cy.get(`${commonSelectors.toastCloseButton}:eq(0)`).click();
});

/**
 * @tjBlock  shared
 * @tjUsage  cy.notVisible(whiteLabelSelectors.poweredByBanner)
 */
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

/**
 * @tjBlock  shared
 * @tjUsage  cy.defaultWorkspaceLogin()
 */
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

/**
 * @tjType   slug.visit
 * @tjBlock  shared
 * @tjUsage  cy.visitSlug({ actualUrl: getAppUrl(data.slug) })
 */
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

/**
 * @tjBlock  shared
 * @tjUsage  cy.backToApps()
 */
Cypress.Commands.add("backToApps", () => {
  cy.get(commonSelectors.editorPageLogo).click();
  cy.get(commonSelectors.backToAppOption).click();
  cy.intercept("GET", API_ENDPOINT).as("library_apps");
  cy.get(commonSelectors.homePageLogo);
  cy.wait("@library_apps");
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

/**
 * @tjBlock  shared
 * @tjUsage  cy.skipWalkthrough()
 */
Cypress.Commands.add("skipWalkthrough", () => {
  cy.window({ log: false }).then((win) => {
    win.localStorage.setItem("walkthroughCompleted", "true");
  });
});

Cypress.Commands.add("appPrivacy", (appName, isPublic) => {
  const isPublicValue = isPublic ? "true" : "false";
  cy.task("dbConnection", {
    dbconfig: Cypress.env("app_db"),
    sql: `UPDATE apps SET is_public = ${isPublicValue} WHERE name = '${appName}';`,
  });
});

/**
 * @tjBlock  shared
 * @tjUsage  cy.intercept('POST', '/api/folders')
 */
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



/**
 * @tjType   element.verify
 * @tjBlock  shared
 * @tjUsage  cy.verifyElement(groupsSelector.adminListItem, "Admin")
 */
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

/**
 * @tjBlock  shared
 * @tjUsage  cy.ifEnv("Enterprise", () => { enableInstanceSignup(); })
 */
Cypress.Commands.add("ifEnv", (expectedEnvs, callback) => {
  const actualEnv = Cypress.env("environment");
  const envArray = Array.isArray(expectedEnvs) ? expectedEnvs : [expectedEnvs];

  if (envArray.includes(actualEnv)) {
    callback();
  }
});

/**
 * @tjBlock  shared
 * @tjUsage  cy.runSqlQueryOnDB(`UPDATE users SET trial_claimed_at = NULL WHERE id = '${signup.userId}';`)
 */
Cypress.Commands.add("runSqlQueryOnDB", (query, db = Cypress.env("app_db")) => {
  return cy.task("dbConnection", {
    dbconfig: db,
    sql: query,
  });
});

/**
 * @tjType   workflow.open
 * @tjBlock  shared
 * @tjUsage  cy.openWorkflow()
 */
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

    // The editor fetches the workflow only once its bundle has loaded, which
    // can take longer than the 10s default on a development build.
    cy.wait("@getWorkflowData", { requestTimeout: 30000 }).then((interception) => {
      const responseData = interception.response.body;

      Cypress.env("editingVersionId", responseData.editing_version.id);
      Cypress.env("environmentId", responseData.editorEnvironment.id);
      Cypress.env("workflowId", responseData.id);
    });
  }
);

/**
 * @tjBlock  shared
 * @tjUsage  cy.waitForElement(ssoEeSelector.ldapCard)
 */
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
