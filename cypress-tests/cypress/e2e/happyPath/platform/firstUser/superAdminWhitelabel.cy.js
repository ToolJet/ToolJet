import { commonSelectors, whiteLabelSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { onboardingSelectors } from "Selectors/onboarding";
import { openInstanceSettings } from "Support/utils/platform/eeCommon";
import { commonEeSelectors } from "Selectors/eeCommon";
import { whitelabelText } from "Texts/common";
import { fetchAndVisitInviteLink } from "Support/utils/manageUsers";
const testData = {
    logo: "https://images.pexels.com/photos/1796715/pexels-photo-1796715.jpeg?cs=srgb&dl=pexels-chaitaastic-1796715.jpg&fm=jpg",
    pageTitle: "Random Title",
    favicon: "https://images.pexels.com/photos/1796715/pexels-photo-1796715.jpeg?cs=srgb&dl=pexels-chaitaastic-1796715.jpg&fm=jpg",
    logoIdentifier: 'pexels-photo-1796715',
    defaultWorkspace: "My workspace",
};

describe("Instance settings - White labelling", () => {


    beforeEach(() => {
        cy.defaultWorkspaceLogin();
        cy.apiConfigureSmtp({
            smtpEnabled: true,
            host: "20.29.40.108",
            port: "1025",
            user: "user",
            password: "user",
            fromEmail: "hello@tooljet.io",
            smtpEnvEnabled: false
        });
    });


    it("should verify all white labelling UI elements", () => {
        openWhiteLabelingSettings();
        verifyWhiteLabelingUI();
    });

    it("should verify white label in user invitation email and on onboarding flow", () => {
        const name = fake.firstName;
        const email = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");

        openWhiteLabelingSettings();
        fillWhiteLabelingForm();
        saveWhiteLabelingChanges();

        cy.apiUserInvite(name, email);

        verifyInvitationEmail(email, {
            expectedLogo: testData.logo,
            expectedText: testData.pageTitle
        });
        fetchAndVisitInviteLink(email);

        verifyCustomLogo('.tooljet-header img', testData.logoIdentifier);
        verifyPageTitleAndFavicon(testData.pageTitle, testData.logoIdentifier);

        cy.get('[data-cy="password-input"]').type('password');
        cy.get('[data-cy="sign-up-button"]').click();

        cy.contains('Join My workspace').should('be.visible');
        verifyCustomLogo('.tooljet-header img', testData.logoIdentifier);
        verifyPageTitleAndFavicon(testData.pageTitle, testData.logoIdentifier);

    });

    it("should update white labelling settings and verify across login/signup/password reset", () => {
        const testWorkspace = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");

        openWhiteLabelingSettings();
        fillWhiteLabelingForm();
        saveWhiteLabelingChanges();
        verifyLogoOnLoginPage();
        verifyPageTitleAndFavicon();
        cy.get('.signup-info').should('contain.text', 'Random Title');

        // Navigate to signup page and verify whitelabel
        cy.get(onboardingSelectors.createAnAccountLink).click();
        verifyCustomLogo('.tooljet-header img', testData.logoIdentifier);
        verifyPageTitleAndFavicon(testData.pageTitle, testData.logoIdentifier);

        // Verify Terms of Service & Privacy Policy are NOT visible

        cy.get(onboardingSelectors.termsOfServiceLink).should('not.exist');
        cy.get(onboardingSelectors.privacyPolicyLink).should('not.exist');

        // Fill signup form and submit
        const signupEmail = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");
        const signupName = fake.firstName;
        cy.clearAndType(onboardingSelectors.signupNameLabel, signupName);
        cy.clearAndType(onboardingSelectors.signupEmailInput, signupEmail);
        cy.clearAndType('[data-cy="password-input"]', 'password');
        cy.get('[data-cy="sign-up-button"]').click();

        // Verify whitelabel on post-signup page (email verification or workspace setup)
        verifyCustomLogo('.tooljet-header img', testData.logoIdentifier);
        verifyPageTitleAndFavicon(testData.pageTitle, testData.logoIdentifier);

        // Navigate back to login and go to forgot password page
        cy.visit('/');
        cy.get(commonSelectors.forgotPasswordLink).click();

        // Verify whitelabel on forgot password page
        verifyCustomLogo('.tooljet-header img', testData.logoIdentifier);
        verifyPageTitleAndFavicon(testData.pageTitle, testData.logoIdentifier);
        cy.get('[data-cy="signup-redirect-text"]').should('contain.text', 'Random Title');

        // Submit password reset request
        cy.clearAndType(onboardingSelectors.forgotEmailInput, 'dev@tooljet.io');
        cy.get(commonSelectors.resetPasswordLinkButton).click();

        // Verify mail sent confirmation appears with whitelabel still present
        cy.contains('Please check your email for the password reset link').should('be.visible');
        verifyCustomLogo('.tooljet-header img', testData.logoIdentifier);
        verifyPageTitleAndFavicon(testData.pageTitle, testData.logoIdentifier);


        verifyLogoOnWorkspaceLoginPage('my-workspace');

        // Navigate to signup page from workspace login and verify whitelabel
        cy.get(onboardingSelectors.createAnAccountLink).click();
        verifyCustomLogo('.tooljet-header img', testData.logoIdentifier);
        verifyPageTitleAndFavicon(testData.pageTitle, testData.logoIdentifier);

        // Verify Terms of Service & Privacy Policy are NOT visible
        // cy.get('.signup-info').should('have.text', 'New to Random Title?');
        cy.get(onboardingSelectors.termsOfServiceLink).should('not.exist');
        cy.get(onboardingSelectors.privacyPolicyLink).should('not.exist');

        // Fill signup form and submit
        const workspaceSignupEmail = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");
        const workspaceSignupName = fake.firstName;
        cy.clearAndType(onboardingSelectors.signupNameLabel, workspaceSignupName);
        cy.clearAndType(onboardingSelectors.signupEmailInput, workspaceSignupEmail);
        cy.clearAndType('[data-cy="password-input"]', 'password');
        cy.get('[data-cy="sign-up-button"]').click();

        // Verify whitelabel on post-signup page
        verifyCustomLogo('.tooljet-header img', testData.logoIdentifier);
        verifyPageTitleAndFavicon(testData.pageTitle, testData.logoIdentifier);

        // Navigate back to workspace login and go to forgot password page
        cy.visit(`/my-workspace`);
        cy.get(commonSelectors.forgotPasswordLink).click();

        // Verify whitelabel on forgot password page
        verifyCustomLogo('.tooljet-header img', testData.logoIdentifier);
        verifyPageTitleAndFavicon(testData.pageTitle, testData.logoIdentifier);
        // cy.get('.signup-info').should('have.text', 'New to Random Title?');

        // Submit password reset request
        cy.clearAndType(onboardingSelectors.forgotEmailInput, 'dev@tooljet.io');
        cy.get(commonSelectors.resetPasswordLinkButton).click();

        // Verify mail sent confirmation appears with whitelabel still present
        cy.contains('Please check your email for the password reset link').should('be.visible');
        verifyCustomLogo('.tooljet-header img', testData.logoIdentifier);
        verifyPageTitleAndFavicon(testData.pageTitle, testData.logoIdentifier);

        // Navigate back to workspace login and login
        cy.visit(`/my-workspace`);
        cy.get(onboardingSelectors.loginEmailInput, { timeout: 50000 }).should('be.visible');
        cy.clearAndType(onboardingSelectors.loginEmailInput, "dev@tooljet.io");
        cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
        cy.get(onboardingSelectors.signInButton).click();
        verifyLogoOnDashboard();

        openWhiteLabelingSettings();
        verifyWhiteLabelInputs();
    });

    it.only("should verify white label persists across apps", () => { //dashboard, app editor, app preview, public & private app build with tooljet
        openWhiteLabelingSettings();
        fillWhiteLabelingForm();
        saveWhiteLabelingChanges();

        verifyPageTitleAndFavicon();

        cy.apiCreateApp("WhiteLabelApp").then((app) => {
        });
    });
});




const openWhiteLabelingSettings = () => {
    cy.intercept("PUT", "**/api/white-labelling").as("saveWhitelabel");
    openInstanceSettings();
    cy.get(whiteLabelSelectors.navWhiteLabellingListItem).click();
};

const verifyWhiteLabelingUI = () => {
    cy.get(commonEeSelectors.pageTitle).verifyVisibleElement("have.text", whitelabelText.settingsPageTitle);
    cy.get(whiteLabelSelectors.breadcrumbPageTitle).verifyVisibleElement("have.text", whitelabelText.breadcrumbTitle);

    const fields = [
        { label: whitelabelText.appLogoLabel, input: whiteLabelSelectors.appLogoInput, help: whiteLabelSelectors.appLogoHelpText, helpText: whitelabelText.appLogoHelp },
        { label: whitelabelText.pageTitleLabel, help: whiteLabelSelectors.appLogoHelpText, helpText: whitelabelText.appLogoHelp },
        { label: whitelabelText.faviconLabel, help: whiteLabelSelectors.favIconHelpText, helpText: whitelabelText.faviconHelp }
    ];

    fields.forEach(field => {
        cy.contains('label', field.label).should('be.visible');
        if (field.input) cy.get(field.input).should('be.visible');
        cy.get(field.help).should('be.visible').and('contain', field.helpText);
    });

    cy.get(whiteLabelSelectors.cancelButton).verifyVisibleElement("have.text", whitelabelText.cancelButton);
    cy.get(whiteLabelSelectors.saveButton).verifyVisibleElement("have.text", whitelabelText.saveButton);
};

const fillWhiteLabelingForm = (logo = testData.logo, pageTitle = testData.pageTitle, favicon = testData.favicon) => {
    cy.clearAndType(whiteLabelSelectors.appLogoInput, logo);
    cy.clearAndType(whiteLabelSelectors.pageTitleInput, pageTitle);
    cy.clearAndType(whiteLabelSelectors.favIconInput, favicon);
};

const saveWhiteLabelingChanges = () => {
    cy.get(whiteLabelSelectors.saveButton).click();
    cy.wait("@saveWhitelabel");
};

const verifyCustomLogo = (selector, logoIdentifier = testData.logoIdentifier) => {
    cy.get(selector)
        .should('be.visible')
        .and('have.attr', 'src')
        .and('include', logoIdentifier);
};

const verifyPageTitleAndFavicon = (pageTitle = testData.pageTitle, logoIdentifier = testData.logoIdentifier) => {
    cy.title().should('contain', pageTitle);
    cy.get('link[rel="icon"]')
        .should('have.attr', 'href')
        .and('include', logoIdentifier);
};

const verifyLogoOnLoginPage = () => {
    cy.apiLogout();
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.visit('/');
    verifyCustomLogo('.tooljet-header img');
};

const verifyLogoOnWorkspaceLoginPage = (workspaceName) => {
    cy.visit(`/${workspaceName}`);
    verifyCustomLogo('.tooljet-header img');
    verifyPageTitleAndFavicon();
};

const verifyLogoOnDashboard = () => {
    cy.get('[data-cy="home-page-logo"] img')
        .should('be.visible')
        .should('have.attr', 'width', '26px')
        .should('have.attr', 'height', '26px')
        .and('have.attr', 'src')
        .and('include', testData.logoIdentifier);
    verifyPageTitleAndFavicon();
};

const cleanEmailBody = (mailBody) => {
    return mailBody
        .replace(/=\r?\n/g, "")
        .replace(/=3D/g, "=")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
};

const verifyWhiteLabelInEmail = (cleanedBody, headers, expectedLogo, expectedText) => {
    if (expectedLogo) {
        const logoBaseUrl = expectedLogo.split("?")[0];
        expect(cleanedBody).to.include(logoBaseUrl);
    }

    if (expectedText) {
        const normalizedExpectedText = expectedText.replace(/\s+/g, " ").trim();
        const headerString = JSON.stringify(headers).replace(/\s+/g, " ");
        const textParts = normalizedExpectedText.split(" ").filter((p) => p.length > 2);

        const hasTextInBody = cleanedBody.includes(normalizedExpectedText);
        const hasTextInHeaders = headerString.includes(normalizedExpectedText);
        const hasAllParts = textParts.every((p) => cleanedBody.includes(p) || headerString.includes(p));

        expect(hasTextInBody || hasTextInHeaders || hasAllParts).to.be.true;
    }
};

const verifyInvitationEmail = (email, whiteLabelConfig = {}, maxRetries = 10, retryDelay = 1000) => {
    if (!Cypress.env('mailHogUrl')) {
        Cypress.env('mailHogUrl', 'http://localhost:8025/');
    }
    if (Cypress.env('mailHogAuth') === undefined) {
        Cypress.env('mailHogAuth', '');
    }

    const checkForEmail = (attempt = 1) => {
        cy.mhGetMailsByRecipient(email).then((mails) => {
            if (mails.length > 0) {
                const lastMail = mails[mails.length - 1];
                const mailContent = lastMail?.Content || {};
                const mailBody = mailContent.Body || mailContent.Html || "";
                const headers = lastMail?.Content?.Headers || {};

                const cleanedBody = cleanEmailBody(mailBody);

                if (whiteLabelConfig.expectedLogo || whiteLabelConfig.expectedText) {
                    verifyWhiteLabelInEmail(cleanedBody, headers, whiteLabelConfig.expectedLogo, whiteLabelConfig.expectedText);
                }

                const hrefMatch = cleanedBody.match(/href=["']?(http[^"'\s>]*invitation[^"'\s>]*)/i);
                const urlMatch = cleanedBody.match(/https?:\/\/[^\s"'<>]*invitation[s]?[^\s"'<>]*/i);
                const inviteUrl = hrefMatch ? hrefMatch[1] : (urlMatch ? urlMatch[0] : "");

                expect(inviteUrl).to.not.be.empty;
            } else if (attempt < maxRetries) {
                cy.wait(retryDelay);
                checkForEmail(attempt + 1);
            } else {
                throw new Error(`No invitation email received for ${email} after ${maxRetries} attempts`);
            }
        });
    };

    checkForEmail();
};

const verifyWhiteLabelInputs = (logo = testData.logo, pageTitle = testData.pageTitle, favicon = testData.favicon) => {
    const decodeValue = (val) => val.replace(/&amp;/g, '&');

    cy.get(whiteLabelSelectors.appLogoInput)
        .invoke('val')
        .then((val) => expect(decodeValue(val)).to.eq(logo));

    cy.get(whiteLabelSelectors.pageTitleInput).should('have.value', pageTitle);

    cy.get(whiteLabelSelectors.favIconInput)
        .invoke('val')
        .then((val) => expect(decodeValue(val)).to.eq(favicon));
};
