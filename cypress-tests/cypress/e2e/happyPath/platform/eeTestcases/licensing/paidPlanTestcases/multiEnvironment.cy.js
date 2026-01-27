import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { navigateToAppEditor } from "Support/utils/common";
import { multiEnvAppSetup } from "Support/utils/license";
import { deleteAllUIConstants } from "Support/utils/platform/apiUtils/apiWSConstants";
import { addAndVerifyConstants } from "Support/utils/workspaceConstants";

describe("License - Multi-Environment Flow", () => {
  const name = fake.firstName;
  const appName = `MultiEnv-App-${name}`;
  const data = {};
  data.slug = appName.toLowerCase().replace(/\s+/g, "-");

  before(() => {
    cy.apiLogin();

    cy.apiUpdateLicense("valid");

    cy.apiDeleteAllApps();
    deleteAllUIConstants();

    cy.visit("/");
    cy.intercept("GET", "/api/apps/*").as("getAppData");

    multiEnvAppSetup(appName);

    cy.apiUpdateLicense("expired");
    cy.apiLogout();
  });

  beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
    cy.wait(3000);
  });

  afterEach(() => {
    cy.apiUpdateLicense("valid");
    cy.apiLogout();
  });

  it("should verify basic plan restricts multi-env in datasource, workspace constants, app editor, and released app uses dev environment", () => {
    // Navigate to datasources and verify environment restrictions
    cy.get(commonSelectors.workspaceConstantsIcon).click();
    addAndVerifyConstants("rest_api_url_global", "http://20.29.40.108:4000");

    // Navigate to app editor and verify environment restrictions
    cy.get(commonSelectors.dashboardIcon).click();
    navigateToAppEditor(appName);
    cy.wait(3000);

    cy.apiReleaseApp(appName);
    cy.apiAddAppSlug(appName, data.slug);

    // Verify app shows development environment data
    cy.get(commonWidgetSelector.draggableWidget("text1")).verifyVisibleElement(
      "have.text",
      "Development environment testing"
    );

    // Preview app and verify
    cy.openInCurrentTab(commonWidgetSelector.previewButton);
    cy.get(commonWidgetSelector.draggableWidget("text1")).verifyVisibleElement(
      "have.text",
      "Development environment testing"
    );

    cy.apiReleaseApp(appName);
    cy.apiAddAppSlug(appName, data.slug);

    // cy.go("back");

    // Verify released app uses development environment
    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });
    cy.wait(3000);
    cy.get(commonWidgetSelector.draggableWidget("text1")).verifyVisibleElement(
      "have.text",
      "Development environment testing"
    );

    cy.log(
      "Phase 1 complete: Basic plan restricts multi-env and released app uses dev environment"
    );
  });

  it("upgrade to production and verify the released app data", () => {
    cy.visitSlug({
      actualUrl: `${Cypress.config("baseUrl")}/applications/${data.slug}`,
    });
    cy.wait(3000);
    cy.get(commonWidgetSelector.draggableWidget("text1")).verifyVisibleElement(
      "have.text",
      "Production environment testing"
    );
  });
});
