import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { onboardingSelectors } from "Selectors/onboarding";
import {
    manageUsersElements,
    fillUserInviteForm,
    confirmInviteElements,
    selectUserGroup,
    inviteUserWithUserGroups,
    fetchAndVisitInviteLink,
} from "Support/utils/manageUsers";
import {
    navigateToManageUsers,
    logout,
    searchUser,
    navigateToManageGroups,
} from "Support/utils/common";
import { updateWorkspaceName } from "Support/utils/userPermissions";
import { groupsSelector } from "Selectors/manageGroups";
import { groupsText } from "Texts/manageGroups";
import { addNewUser, visitWorkspaceInvitation, newInvite } from "Support/utils/onboarding";
import { commonText } from "Texts/common";
import { setSignupStatus, enableSignUp } from "Support/utils/manageSSO";
import { ssoSelector } from "Selectors/manageSSO";
import {
    SignUpPageElements,
    verifyConfirmEmailPage,
    signUpLink,
    verifyOnboardingQuestions,
} from "Support/utils/onboarding";

const data = {};

describe("user invite flow cases", () => {
    beforeEach(() => {
        cy.defaultWorkspaceLogin();
    });
    it("should verify the user signup after invited in a workspace", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.signUpName = fake.firstName;
        data.workspaceName = fake.companyName;

        setSignupStatus(true);
        navigateToManageUsers();
        fillUserInviteForm(data.firstName, data.email);
        cy.get(usersSelector.buttonInviteUsers).click();
        cy.logoutApi();

        cy.visit("/");
        cy.get(commonSelectors.createAnAccountLink).click();
        SignUpPageElements();
        cy.wait(3000);
        cy.clearAndType(onboardingSelectors.nameInput, data.signUpName);
        cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.LoginpasswordInput, commonText.password);
        cy.get(commonSelectors.signUpButton).click();
        cy.wait(1000);
        signUpLink(data.email);
        cy.wait(1000);
        // verifyOnboardingQuestions(data.signUpName, data.workspaceName);
        visitWorkspaceInvitation(data.email, "My workspace");
        cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.LoginpasswordInput, usersText.password);
        cy.get(onboardingSelectors.signInButton).click();

        cy.get(commonSelectors.invitedUserName).verifyVisibleElement(
            "have.text",
            data.signUpName
        );
        cy.get(commonSelectors.acceptInviteButton).click();
    });

    it("should verify the user signup after invited in a workspace", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.signUpName = fake.firstName;
        data.workspaceName = fake.companyName;

        setSignupStatus(true);
        navigateToManageUsers();
        fillUserInviteForm(data.firstName, data.email);
        cy.get(usersSelector.buttonInviteUsers).click();
        logout();

        cy.get(commonSelectors.createAnAccountLink).click();
        SignUpPageElements();
        cy.wait(5000);

        cy.clearAndType(onboardingSelectors.nameInput, data.signUpName);
        cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.LoginpasswordInput, commonText.password);
        cy.get(commonSelectors.signUpButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "The user is already registered. Please check your inbox for the activation link"
        );
    });

    it.only("should verify exisiting user workspace signup", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.signUpName = fake.firstName;
        data.workspaceName = fake.firstName.toLowerCase();

        setSignupStatus(true);
        navigateToManageUsers();
        addNewUser(data.firstName, data.email);
        logout();
        cy.wait(3000);
        cy.get(commonSelectors.createAnAccountLink).click();
        cy.wait(1000);
        cy.clearAndType(onboardingSelectors.nameInput, data.firstName);
        cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.LoginpasswordInput, commonText.password);
        cy.get(commonSelectors.signUpButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "User already exists in the workspace."
        );
        cy.apiLogin();
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceName);
        cy.visit(`${data.workspaceName}`);
        cy.wait(3000)
        setSignupStatus(true, data.workspaceName);
        logout();

        cy.get(commonSelectors.createAnAccountLink).click();
        cy.wait(3000);
        cy.clearAndType(onboardingSelectors.nameInput, data.firstName);
        cy.clearAndType(onboardingSelectors.SignupEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.LoginpasswordInput, commonText.password);
        cy.get(commonSelectors.signUpButton).click();

        cy.defaultWorkspaceLogin();
        visitWorkspaceInvitation(data.email, data.workspaceName);
        cy.verifyToastMessage(commonSelectors.toastMessage, usersText.inviteToast);
        logout();
    });
});
