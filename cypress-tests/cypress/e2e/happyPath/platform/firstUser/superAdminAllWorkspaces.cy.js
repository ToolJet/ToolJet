import { fake } from "Fixtures/fake";
import {
  openAllWorkspaces,
  verifyWorkspacePageHeader,
  verifyWorkspaceTableControls,
  verifyWorkspaceSelectDropdown,
  verifyWorkspaceRow,
  verifyWorkspaceTabs,
  verifyWorkspaceRowTags,
  verifyDefaultWorkspaceTooltip,
  openArchiveWorkspaceModal,
  verifyArchiveWorkspaceModalUI,
  verifyOpenWorkspaceTooltip,
  verifyUnarchiveWorkspaceModalUI
} from "Support/utils/superAdminAllWorkspaces";

const userName = () => fake.firstName.toLowerCase().replace(/[^a-z]/g, "");
const defaultWorkspaceName = "My workspace";

describe("Instance Settings - All Workspaces UI", () => {
 beforeEach(() => {
    cy.apiLogin();
    cy.visit("/");
  });

  it("verifies All Workspaces UI components and row-level UI", () => {
    const testWorkspace = userName();

    cy.apiCreateWorkspace(testWorkspace, testWorkspace);
    cy.apiLogin();

    openAllWorkspaces();
    verifyWorkspacePageHeader();
    verifyWorkspaceTableControls();
    verifyWorkspaceSelectDropdown(testWorkspace);
    verifyWorkspaceRow(defaultWorkspaceName, true);
    verifyWorkspaceRow(testWorkspace, false);
    verifyWorkspaceTabs();
    verifyWorkspaceRowTags(testWorkspace);
    verifyDefaultWorkspaceTooltip();
    openArchiveWorkspaceModal(testWorkspace);
    verifyArchiveWorkspaceModalUI(testWorkspace);
    verifyOpenWorkspaceTooltip(testWorkspace);

    // need to run after bug fixes
    // verifyUnarchiveWorkspaceModalUI(testWorkspace)
  });
  });
