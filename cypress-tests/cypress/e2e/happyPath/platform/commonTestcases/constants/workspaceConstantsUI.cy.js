import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import {
  constantsCRUDAndValidations,
  verifyConstantFormUI,
  VerifyConstantsFormInputValidation,
  verifySearch,
} from "Support/utils/workspaceConstants";

const data = {};

describe("Workspace constants", () => {
  beforeEach(() => {
    cy.defaultWorkspaceLogin();
    cy.skipWalkthrough();
    cy.viewport(2400, 2000);
  });

  it("Verify workspace constants UI and CRUD operations", () => {
    data.firstName = fake.firstName;
    data.workspaceName = data.firstName;
    data.workspaceSlug = data.firstName.toLowerCase();

    cy.apiCreateWorkspace(data.workspaceName, data.workspaceSlug);
    cy.visit(`${data.workspaceSlug}`);
    cy.wait(2000);

    cy.get(commonSelectors.workspaceConstantsIcon).click();
    verifyConstantFormUI();
    VerifyConstantsFormInputValidation();

    cy.ifEnv("Enterprise", () => {
      constantsCRUDAndValidations({
        constantType: "Global",
        constName: "Example_Constant1",
        newConstvalue: "UpdatedValue",
        envName: "Development",
      });

      constantsCRUDAndValidations({
        constantType: "Secrets",
        constName: "Example_Constant1",
        newConstvalue: "UpdatedValue",
        envName: "Development",
      });

      verifySearch({ envName: "Development" });

      constantsCRUDAndValidations({
        constantType: "Global",
        constName: "Example_Constant1",
        newConstvalue: "UpdatedValue",
        envName: "Staging",
      });
      constantsCRUDAndValidations({
        constantType: "Secrets",
        constName: "Example_Constant1",
        newConstvalue: "UpdatedValue",
        envName: "Staging",
      });
    });

    constantsCRUDAndValidations({
      constantType: "Global",
      constName: "Example_Constant1",
      newConstvalue: "UpdatedValue",
      envName: "Production",
    });
    constantsCRUDAndValidations({
      constantType: "Secrets",
      constName: "Example_Constant1",
      newConstvalue: "UpdatedValue",
      envName: "Production",
    });
  });
});
