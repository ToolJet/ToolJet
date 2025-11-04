import { commonSelectors, whiteLabelSelectors } from "Selectors/common";
import { fake } from "Fixtures/fake";
import { onboardingSelectors } from "Selectors/onboarding";
import { openInstanceSettings } from "Support/utils/platform/eeCommon";
import { commonEeSelectors } from "Selectors/eeCommon";
import { whitelabelText } from "Texts/common";

describe("Instance settings - White labelling", () => {
    const DEFAULT_WORKSPACE = "My workspace";
    const WHITE_LABEL_LOGO = "https://images.pexels.com/photos/1796715/pexels-photo-1796715.jpeg?cs=srgb&dl=pexels-chaitaastic-1796715.jpg&fm=jpg";
    const WHITE_LABEL_TEXT = "Paris UK 321 321 321";
    const WHITE_LABEL_FAVICON = "https://images.pexels.com/photos/1796715/pexels-photo-1796715.jpeg?cs=srgb&dl=pexels-chaitaastic-1796715.jpg&fm=jpg";
    const LOGO_IDENTIFIER = 'pexels-photo-1796715';

    beforeEach(() => {
        cy.defaultWorkspaceLogin();
    });

    const openWhiteLabelingSettings = () => {
        openInstanceSettings();
        cy.get(whiteLabelSelectors.navWhiteLabellingListItem).click();
    };

    const openSMTPSettings = () => {
        openInstanceSettings();
        cy.get(whiteLabelSelectors.smtpListItem).click();
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

    const fillWhiteLabelingForm = () => {
        cy.get(whiteLabelSelectors.appLogoInput).clear().type(WHITE_LABEL_LOGO);
        cy.get(whiteLabelSelectors.pageTitleInput).clear().type(WHITE_LABEL_TEXT);
        cy.get(whiteLabelSelectors.favIconInput).clear().type(WHITE_LABEL_FAVICON);
    };

    const saveWhiteLabelingChanges = () => {
        cy.get(whiteLabelSelectors.saveButton).click();
    };

    const verifyLogoOnLoginPage = () => {
        cy.apiLogout();
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit('/');
        cy.get('.tooljet-header img')
            .should('be.visible')
            .and('have.attr', 'src')
            .and('include', LOGO_IDENTIFIER);
    };

    const verifyPageTitleAndFavicon = () => {
        cy.title().should('contain', WHITE_LABEL_TEXT);
        cy.get('link[rel="icon"]')
            .should('have.attr', 'href')
            .and('include', LOGO_IDENTIFIER);
    };

    const verifyLogoOnInstanceLoginPage = (workspaceName) => {
        cy.visit(`/${workspaceName}`);
        cy.get('.tooljet-header img')
            .should('be.visible')
            .and('have.attr', 'src')
            .and('include', LOGO_IDENTIFIER);
        verifyPageTitleAndFavicon();
    };

    const verifyLogoOnDashboard = () => {
        cy.get('[data-cy="home-page-logo"] img')
            .should('be.visible')
            .should('have.attr', 'width', '26px')
            .should('have.attr', 'height', '26px')
            .and('have.attr', 'src')
            .and('include', LOGO_IDENTIFIER);
        verifyPageTitleAndFavicon();
    };

    const fetchAndCheckUIViaMH = (email, verifyWhiteLabel = false, whiteLabelConfig = {}) => {
        if (!Cypress.env('mailHogUrl')) {
            Cypress.env('mailHogUrl', 'http://localhost:8025/');
        }
        if (Cypress.env('mailHogAuth') === undefined) {
            Cypress.env('mailHogAuth', '');
        }
        cy.wait(5000);
        cy.mhGetMailsByRecipient(email).then((mails) => {
            expect(mails, `No emails found for recipient: ${email}`).to.have.length.greaterThan(0);

            const lastMail = mails[mails.length - 1];
            const mailContent = lastMail?.Content || {};
            const mailBody = mailContent.Body || mailContent.Html || "";
            const headers = lastMail?.Content?.Headers || {};

            const cleanedBody = mailBody
                .replace(/=\r?\n/g, "")
                .replace(/=3D/g, "=")
                .replace(/&quot;/g, '"')
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&")
                .replace(/\s+/g, " ")
                .trim();

            if (verifyWhiteLabel && whiteLabelConfig) {
                const { expectedLogo, expectedText } = whiteLabelConfig;

                if (expectedLogo) {
                    const logoBaseUrl = expectedLogo.split("?")[0];
                    expect(cleanedBody, `Expected email to contain white-label logo URL: ${logoBaseUrl}`)
                        .to.include(logoBaseUrl);
                }

                if (expectedText) {
                    const normalizedExpectedText = expectedText.replace(/\s+/g, " ").trim();
                    const headerString = JSON.stringify(headers).replace(/\s+/g, " ");
                    const textParts = normalizedExpectedText.split(" ").filter((p) => p.length > 2);

                    const hasTextInBody = cleanedBody.includes(normalizedExpectedText);
                    const hasTextInHeaders = headerString.includes(normalizedExpectedText);
                    const hasAllParts = textParts.every((p) => cleanedBody.includes(p) || headerString.includes(p));

                    expect(hasTextInBody || hasTextInHeaders || hasAllParts,
                        `Expected email (body or headers) to contain white-label text: ${normalizedExpectedText}`)
                        .to.be.true;
                }
            }

            const hrefMatch = cleanedBody.match(/href=["']?(http[^"'\s>]*invitation[^"'\s>]*)/i);
            const urlMatch = cleanedBody.match(/https?:\/\/[^\s"'<>]*invitation[s]?[^\s"'<>]*/i);
            const inviteUrl = hrefMatch ? hrefMatch[1] : (urlMatch ? urlMatch[0] : "");

            expect(inviteUrl, "Invitation URL should exist in the email").to.not.be.empty;
        });
    };

    const configureSMTP = (host, port, smtpUser, smtpPassword, fromAddress) => {
        cy.get(whiteLabelSelectors.smtpHostInput).click().clear().type(host);
        cy.get(whiteLabelSelectors.smtpPortInput).click().clear().type(port);
        cy.get(whiteLabelSelectors.smtpUserInput).eq(0).click().clear().type(smtpUser);
        cy.get(whiteLabelSelectors.smtpPasswordInput).click().clear().type(smtpPassword);
        cy.get(whiteLabelSelectors.smtpUserInput).eq(1).click().clear().type(fromAddress);
        cy.get(whiteLabelSelectors.saveButton).click();
    };

    const verifyWhiteLabelInputs = () => {
        const decodeValue = (val) => val.replace(/&amp;/g, '&');

        cy.get(whiteLabelSelectors.appLogoInput)
            .invoke('val')
            .then((val) => expect(decodeValue(val)).to.eq(WHITE_LABEL_LOGO));

        cy.get(whiteLabelSelectors.pageTitleInput)
            .should('have.value', WHITE_LABEL_TEXT);

        cy.get(whiteLabelSelectors.favIconInput)
            .invoke('val')
            .then((val) => expect(decodeValue(val)).to.eq(WHITE_LABEL_FAVICON));
    };

    it("should verify all white labelling UI elements", () => {
        openWhiteLabelingSettings();
        verifyWhiteLabelingUI();
    });

    it("should verify white label in user invitation email", () => {
        const name = fake.firstName;
        const email = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");

        openWhiteLabelingSettings();
        fillWhiteLabelingForm();
        saveWhiteLabelingChanges();

        openSMTPSettings();
        configureSMTP("localhost", "1025", "dev", fake.firstName, "hello@tooljet.io");

        cy.apiUserInvite(name, email);
        fetchAndCheckUIViaMH(email, true, {
            expectedLogo: WHITE_LABEL_LOGO,
            expectedText: WHITE_LABEL_TEXT
        });
    });

    it("should update white labelling settings and verify across application", () => {
        openWhiteLabelingSettings();
        verifyWhiteLabelingUI();
        fillWhiteLabelingForm();
        saveWhiteLabelingChanges();
        verifyLogoOnLoginPage();
        verifyPageTitleAndFavicon();

        const testWorkspace = fake.firstName.toLowerCase().replaceAll(/[^a-z]/g, "");
        cy.apiLogin();
        cy.apiCreateWorkspace(testWorkspace, testWorkspace);
        cy.apiLogout();
        cy.clearCookies();
        cy.clearLocalStorage();
        verifyLogoOnInstanceLoginPage(testWorkspace);

        cy.clearAndType(onboardingSelectors.loginEmailInput, "dev@tooljet.io");
        cy.clearAndType(onboardingSelectors.loginPasswordInput, "password");
        cy.get(onboardingSelectors.signInButton).click();
        verifyLogoOnDashboard();

        openWhiteLabelingSettings();
        verifyWhiteLabelInputs();
    });

    it("should verify white label persists across browser tab", () => {
        openWhiteLabelingSettings();
        fillWhiteLabelingForm();
        saveWhiteLabelingChanges();

        verifyPageTitleAndFavicon();

        cy.get('[data-cy="apps-icon"]').click();
        verifyPageTitleAndFavicon();
        verifyLogoOnDashboard();
    });

    it("should reset white labelling settings", () => {
        openWhiteLabelingSettings();
        fillWhiteLabelingForm();
        saveWhiteLabelingChanges();

        openWhiteLabelingSettings();
        cy.get(whiteLabelSelectors.appLogoInput).clear();
        cy.get(whiteLabelSelectors.pageTitleInput).clear();
        cy.get(whiteLabelSelectors.favIconInput).clear();
        saveWhiteLabelingChanges();

        cy.apiLogout();
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.visit('/');

        cy.get('[data-cy="page-logo"] svg')
            .should('be.visible')
            .should('have.attr', 'width', '94')
            .should('have.attr', 'height', '24');
        cy.title().should('contain', 'ToolJet');
    });

    // need to update after bug fixes
    it.skip("should validate white label URL format", () => {
        openWhiteLabelingSettings();
        cy.get(whiteLabelSelectors.appLogoInput).clear().type('invalid-url');
        cy.get(whiteLabelSelectors.saveButton).should('be.disabled');
        cy.get(whiteLabelSelectors.appLogoInput).clear().type(WHITE_LABEL_LOGO);
        cy.get(whiteLabelSelectors.saveButton).click();
    });
});