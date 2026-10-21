import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import {
  getCurrentCountFromLimitCounter,
  verifyLimitCounter,
  verifyLimitReachedModal,
} from "Support/utils/license";


describe("License - Workspace Limits", () => {
  const workspace1Name = `${fake.companyName}-Workspace-1`;
  const workspace1Slug = workspace1Name.toLowerCase().replace(/\s+/g, "-");
  const workspace2Name = `${fake.companyName}-Workspace-2`;
  const workspace2Slug = workspace2Name.toLowerCase().replace(/\s+/g, "-");
  let workspace1Id;
  let workspace2Id;

  const openWorkspaceModal = () => {
    cy.visit("/my-workspace");
    cy.wait("@getLicenseAccess");
    cy.wait(2000);
    cy.get(commonSelectors.workspaceName).click();
  };

  beforeEach(() => {
    cy.apiLogin();
    cy.intercept("GET", "/api/license/access").as("getLicenseAccess");
    cy.apiUpdateLicense("workspace");
    cy.apiDeleteAllWorkspaces();
    cy.visit("/my-workspace");
    cy.wait("@getLicenseAccess");
    cy.wait(2000);
  });

  afterEach(() => {
    cy.apiArchiveWorkspace(workspace1Id);
    cy.apiArchiveWorkspace(workspace2Id);
    cy.apiUpdateLicense("valid");
  });

  it("should verify workspace limit progression with nearing and reached states", () => {
    
    cy.apiCreateWorkspace(workspace1Name, workspace1Slug).then((res) => {
      workspace1Id = res.body.organization_id;
    });

    openWorkspaceModal();
    cy.get(commonSelectors.addWorkspaceButton).click();
    cy.get('[data-cy="create-workspace-title"]').should("be.visible");
    
    verifyLimitCounter();
    getCurrentCountFromLimitCounter().then((counts) => {
      expect(counts.current).to.equal(2);
      expect(counts.total).to.equal(3);
    });
    cy.get(commonSelectors.cancelButton).click();

    cy.apiCreateWorkspace(workspace2Name, workspace2Slug).then((res) => {
      workspace2Id = res.body.organization_id;
    });

    openWorkspaceModal();
    cy.get(commonSelectors.addWorkspaceButton).click();
    verifyLimitReachedModal("Workspace limit reached", {
      bodyText: "You've reached your limit for workspaces (3/3).",
    });
    cy.get('[data-cy="create-workspace-title"]').should("not.exist");
  });
});
