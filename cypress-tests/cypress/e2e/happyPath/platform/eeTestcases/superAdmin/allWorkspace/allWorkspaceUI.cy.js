import { fake } from "Fixtures/fake";
import {
  openAllWorkspaces,
  openArchiveWorkspaceModal,
  verifyArchiveWorkspaceModalUI,
  verifyDefaultWorkspaceTooltip,
  verifyOpenWorkspaceTooltip,
  verifyWorkspacePageHeader,
  verifyWorkspaceRow,
  verifyWorkspaceRowTags,
  verifyWorkspaceSelectDropdown,
  verifyWorkspaceTableControls,
  verifyWorkspaceTabs,
} from "Support/utils/platform/allWorkspace";
import { commonEeSelectors } from "Selectors/eeCommon";

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
    cy.clearAndType(commonEeSelectors.searchBar, defaultWorkspaceName);
    verifyWorkspaceRow(defaultWorkspaceName, true);
    cy.get(".tj-common-search-input-clear-icon > svg").click();
    cy.clearAndType(commonEeSelectors.searchBar, testWorkspace);
    verifyWorkspaceRow(testWorkspace, false);
    cy.get(".tj-common-search-input-clear-icon > svg").click();
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
