import { fake } from "Fixtures/fake";
import { cleanAllUsers } from "Support/utils/manageUsers";
import {
    ensureAllUsersTab,
    verifyLimitReachedForOtherUser,
    verifyLimitReachedForSuperAdmin,
    verifyNearingSuperAdminLimit,
    verifyToggleEnabledAfterDemotion,
    visitAllUsersSettings,
} from "Support/utils/platform/licenseLimits";

describe("Super Admin Limit", () => {
    const data = {};

    data.user1 = fake.firstName;
    data.user2 = fake.firstName;
    data.email1 = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    data.email2 = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
    let userId1;

    beforeEach(() => {
        cy.apiLogin();
        cleanAllUsers();
        cy.apiUpdateLicense("workspace");
        cy.apiFullUserOnboarding(data.user1, data.email1).then((res) => {
            userId1 = res.body.id;
        });
        cy.apiLogout();
        cy.apiLogin();
    });

    afterEach(() => {
        cleanAllUsers();
    });

    it("should verify super admin limit", () => {
        visitAllUsersSettings();
        verifyNearingSuperAdminLimit(data.email1);

        cy.apiUpdateSuperAdmin(userId1);
        ensureAllUsersTab();
        verifyLimitReachedForSuperAdmin(data.email1);

        cy.apiFullUserOnboarding(data.user2, data.email2);
        cy.apiLogout();

        cy.apiLogin();
        visitAllUsersSettings();
        verifyLimitReachedForOtherUser(data.email2);

        cy.apiUpdateSuperAdmin(userId1, "workspace");
        ensureAllUsersTab();
        verifyToggleEnabledAfterDemotion(data.email2);
    });
});
