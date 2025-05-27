import { commonSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { usersText } from "Texts/manageUsers";
import { usersSelector } from "Selectors/manageUsers";
import { fillUserInviteForm } from "Support/utils/manageUsers";
import { commonText } from "Texts/common";
import { setSignupStatus } from "Support/utils/manageSSO";
import {
    SignUpPageElements,
    signUpLink,
    verifyOnboardingQuestions,
    visitWorkspaceInvitation,
    addNewUser,
    enableInstanceSignUp,
} from "Support/utils/onboarding";

import {
    navigateToManageUsers,
    logout,
    searchUser,
} from "Support/utils/common";

import { onboardingSelectors } from "Selectors/onboarding";
import { enableInstanceSignup } from "Support/utils/manageSSO";

const data = {};
const envVar = Cypress.env("environment");

describe("inviteflow edge cases", () => {
    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        cy.ifEnv("Enterprise", () => {
            enableInstanceSignup();
        });
    });

    it("Should verify exisiting user invite flow", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        const workspaceName = data.firstName.toLowerCase();

        addNewUser(data.firstName, data.email);
        logout();

        cy.defaultWorkspaceLogin();
        cy.apiCreateWorkspace(workspaceName, workspaceName);
        cy.visit(workspaceName);

        navigateToManageUsers();
        fillUserInviteForm(data.firstName, data.email);
        cy.get(usersSelector.buttonInviteUsers).click();
        cy.wait(2000);
        visitWorkspaceInvitation(data.email, workspaceName);
        cy.wait(3000);
        cy.clearAndType(onboardingSelectors.loginEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
        cy.get(onboardingSelectors.signInButton).click();
        cy.get(usersSelector.acceptInvite).click();
        cy.verifyToastMessage(commonSelectors.toastMessage, usersText.inviteToast);
        logout();

        cy.apiLogin();
        cy.visit(workspaceName);
        navigateToManageUsers();
        searchUser(data.email);
        cy.contains("td", data.email)
            .parent()
            .within(() => {
                cy.get("td small").should("have.text", usersText.activeStatus);
            });
    });

    it("should verify the user signup after invited in a workspace", () => {
        data.firstName = fake.firstName;
        data.email = fake.email.toLowerCase().replaceAll("[^A-Za-z]", "");
        data.signUpName = fake.firstName;
        data.workspaceName = fake.companyName;

        enableInstanceSignUp();
        setSignupStatus(true);
        navigateToManageUsers();
        fillUserInviteForm(data.firstName, data.email);
        cy.get(usersSelector.buttonInviteUsers).click();
        cy.apiLogout();

        cy.visit("/");
        cy.get(commonSelectors.createAnAccountLink).click();
        SignUpPageElements();
        cy.wait(3000);
        cy.clearAndType(onboardingSelectors.nameInput, data.signUpName);
        cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
        cy.clearAndType(
            onboardingSelectors.loginPasswordInput,
            commonText.password
        );
        cy.get(commonSelectors.signUpButton).click();
        cy.wait(1000);
        signUpLink(data.email);
        if (envVar === "Enterprise") {
            verifyOnboardingQuestions(data.workspaceName);
            cy.wait(1000);
            cy.get(commonSelectors.skipbutton).click();
            cy.backToApps();
        }
        cy.wait(1000);
        visitWorkspaceInvitation(data.email, "My workspace");
        cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
        cy.clearAndType(onboardingSelectors.loginPasswordInput, usersText.password);
        cy.get(onboardingSelectors.signInButton).click();
        cy.wait(3000);
        cy.get(commonSelectors.invitedUserName).verifyVisibleElement(
            "have.text",
            data.signUpName
        );
        cy.get(commonSelectors.acceptInviteButton).click();
        cy.get(commonSelectors.workspaceName).verifyVisibleElement(
            "have.text",
            "My workspace"
        );
    });

    it("should verify the user signup with same creds after invited in a workspace", () => {
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
        cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
        cy.clearAndType(
            onboardingSelectors.loginPasswordInput,
            commonText.password
        );
        cy.get(commonSelectors.signUpButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "The user is already registered. Please check your inbox for the activation link"
        );
    });

    it("should verify exisiting user workspace signup from instance using form", () => {
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
        cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
        cy.clearAndType(
            onboardingSelectors.loginPasswordInput,
            commonText.password
        );
        cy.get(commonSelectors.signUpButton).click();
        cy.verifyToastMessage(
            commonSelectors.toastMessage,
            "User already exists in the workspace."
        );
        cy.apiLogin();
        cy.apiCreateWorkspace(data.workspaceName, data.workspaceName);
        cy.visit(`${data.workspaceName}`);
        cy.wait(3000);
        setSignupStatus(true, data.workspaceName);
        logout();

        cy.get(commonSelectors.createAnAccountLink).click();
        cy.wait(3000);
        cy.clearAndType(onboardingSelectors.nameInput, data.firstName);
        cy.clearAndType(onboardingSelectors.signupEmailInput, data.email);
        cy.clearAndType(
            onboardingSelectors.loginPasswordInput,
            commonText.password
        );
        cy.get(commonSelectors.signUpButton).click();

        cy.defaultWorkspaceLogin();
        visitWorkspaceInvitation(data.email, data.workspaceName);
        cy.verifyToastMessage(commonSelectors.toastMessage, usersText.inviteToast);
        logout();
    });
});
