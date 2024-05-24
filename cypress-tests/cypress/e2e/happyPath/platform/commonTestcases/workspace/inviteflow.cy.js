import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
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
import { addNewUser, visitWorkspaceInvitation } from "Support/utils/onboarding";
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

        cy.clearAndType(commonSelectors.nameInputField, data.signUpName);
        cy.clearAndType(commonSelectors.emailInputField, data.email);
        cy.clearAndType(commonSelectors.passwordInputField, commonText.password);
        cy.get(commonSelectors.signUpButton).click();
        signUpLink(data.email);
        cy.get(commonSelectors.setUpToolJetButton).click();
        verifyOnboardingQuestions(data.signUpName, data.workspaceName);
        visitWorkspaceInvitation(data.email, "My workspace");
        cy.clearAndType(commonSelectors.workEmailInputField, data.email);
        cy.clearAndType(commonSelectors.passwordInputField, usersText.password);
        cy.get(commonSelectors.loginButton).click();

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

        cy.get(ssoSelector.workspaceSubHeader).verifyVisibleElement(
            "have.text",
            "Sign in to your workspace - My workspace"
        );
        cy.get(commonSelectors.signInSubHeader).verifyVisibleElement(
            "have.text",
            "New to this workspace?Sign up"
        );
        cy.get(commonSelectors.createAnAccountLink).click();
        SignUpPageElements();
        cy.get(ssoSelector.workspaceSignUpHeader).verifyVisibleElement(
            "have.text",
            "Sign up to the workspace - My workspace"
        );

        cy.clearAndType(commonSelectors.nameInputField, data.signUpName);
        cy.clearAndType(commonSelectors.emailInputField, data.email);
        cy.clearAndType(commonSelectors.passwordInputField, commonText.password);
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

        cy.get(commonSelectors.createAnAccountLink).click();
        cy.clearAndType(commonSelectors.nameInputField, data.firstName);
        cy.clearAndType(commonSelectors.emailInputField, data.email);
        cy.clearAndType(commonSelectors.passwordInputField, commonText.password);
        cy.get(commonSelectors.signUpButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "User already exists in the workspace."
        );
        cy.apiLogin();
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceName);
        cy.visit(`${data.workspaceName}`);
        enableSignUp();
        logout();

        cy.get(commonSelectors.createAnAccountLink).click();
        cy.clearAndType(commonSelectors.nameInputField, data.firstName);
        cy.clearAndType(commonSelectors.emailInputField, data.email);
        cy.clearAndType(commonSelectors.passwordInputField, commonText.password);
        cy.get(commonSelectors.signUpButton).click();

        visitWorkspaceInvitation(data.email, data.workspaceName);

        cy.clearAndType(commonSelectors.workEmailInputField, data.email);
        cy.clearAndType(commonSelectors.passwordInputField, "password");
        cy.get(commonSelectors.signInButton).click();
        cy.get(usersSelector.acceptInvite).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, usersText.inviteToast);
        logout();
    });
});
