import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";

describe("License - Workspace Limits", () => {
    const workspace1Name = `${fake.companyName}-Workspace-1`;
    const workspace1Slug = workspace1Name.toLowerCase().replace(/\s+/g, "-");
    const workspace2Name = `${fake.companyName}-Workspace-2`;
    const workspace2Slug = workspace2Name.toLowerCase().replace(/\s+/g, "-");
    let workspace1Id;
    let workspace2Id;

    const openWorkspaceModal = () => {
        cy.visit("/my-workspace");
        cy.get(commonSelectors.workspaceName).click();
    };

    const verifyWorkspaceLimitModal = (
        heading,
        infoText,
        shouldUpgradeButtonExist = true
    ) => {
        cy.get('[data-cy="workspaces-limit-heading"]')
            .should("be.visible")
            .and("have.text", heading);

        cy.get('[data-cy="workspaces-limit-info"]')
            .should("be.visible")
            .and("have.text", infoText);

        if (shouldUpgradeButtonExist) {
            cy.get('[data-cy="workspaces-limit-banner"]').within(() => {
                cy.get('[data-cy="upgrade-button"]').should("be.visible");
            });
        }
    };

    beforeEach(() => {
        cy.apiLogin();
        cy.visit("/");
        cy.apiUpdateLicense("workspace");
    });

    afterEach(() => {
        cy.apiArchiveWorkspace(workspace1Id);
        cy.apiArchiveWorkspace(workspace2Id);
    });

    it("should verify workspace limit progression with nearing and reached states", () => {
        cy.apiCreateWorkspace(workspace1Name, workspace1Slug).then((res) => {
            workspace1Id = res.body.organization_id;
        });

        openWorkspaceModal();

        verifyWorkspaceLimitModal(
            "Workspace  limit nearing - 2/3",
            "You're nearing your limit for number of workspaces. Upgrade for more"
        );

        cy.get(commonSelectors.addWorkspaceButton).click();
        cy.get('[data-cy="create-workspace-title"]').should("be.visible");

        cy.get("body").click();

        cy.apiCreateWorkspace(workspace2Name, workspace2Slug).then((res) => {
            workspace2Id = res.body.organization_id;
        });

        openWorkspaceModal();

        verifyWorkspaceLimitModal(
            "Workspace limit reached",
            "You've reached your limit for number of workspaces. Upgrade for more"
        );

        cy.get(commonSelectors.addWorkspaceButton).click();
        cy.get('[data-cy="create-workspace-title"]').should("not.exist");
    });
});
