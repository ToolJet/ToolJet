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

    beforeEach(() => {
        cy.defaultWorkspaceLogin();
    });

    const openWhiteLabelingSettings = () => {
        openInstanceSettings();
        cy.wait(1000);
        cy.get(whiteLabelSelectors.navWhiteLabellingListItem).click();
        cy.wait(1000);
    };

    const openSMTPSettings = () => {
        openInstanceSettings();
        cy.wait(1000);
        cy.get(whiteLabelSelectors.smtpListItem).click();
        cy.wait(1000);
    };

    const verifyWhiteLabelingUI = () => {
        cy.get(commonEeSelectors.pageTitle).verifyVisibleElement("have.text", whitelabelText.settingsPageTitle);
        cy.get(whiteLabelSelectors.breadcrumbPageTitle).verifyVisibleElement("have.text", whitelabelText.breadcrumbTitle);

        cy.get('label').contains(whitelabelText.appLogoLabel).should('be.visible');
        cy.get(whiteLabelSelectors.appLogoInput).should('be.visible');
        cy.get(whiteLabelSelectors.appLogoHelpText)
            .should('be.visible')
            .and('contain', whitelabelText.appLogoHelp);
        cy.get('label').contains(whitelabelText.pageTitleLabel).should('be.visible');
        cy.get(whiteLabelSelectors.appLogoHelpText)
            .should('exist')
            .and('contain', whitelabelText.appLogoHelp);
        cy.get('label').contains(whitelabelText.faviconLabel).should('be.visible');
        cy.get('label').contains(whitelabelText.faviconLabel).should('be.visible');
        cy.get(whiteLabelSelectors.favIconHelpText)
            .should('be.visible')
            .and('contain', whitelabelText.faviconHelp);
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
        cy.wait(2000);
    };

    const verifyLogoOnLoginPage = () => {
        cy.apiLogout();
        cy.clearCookies();
        cy.clearLocalStorage();
        cy.wait(1000);
        cy.visit('/');
        cy.wait(2000);
        cy.get('.tooljet-header img')
            .should('be.visible')
            .and('have.attr', 'src')
            .and('include', 'pexels-photo-1796715');
    };

    const verifyPageTitleAndFavicon = () => {
        cy.title().should('contain', WHITE_LABEL_TEXT);
        cy.get('link[rel="icon"]')
            .should('have.attr', 'href')
            .and('include', 'pexels-photo-1796715');
    };

    const verifyLogoOnInstanceLoginPage = (workspaceName) => {
        cy.visit(`/${workspaceName}`);
        cy.wait(2000);
        cy.get('.tooljet-header img')
            .should('be.visible')
            .and('have.attr', 'src')
            .and('include', 'pexels-photo-1796715');
        verifyPageTitleAndFavicon();
    };

    const verifyLogoOnDashboard = () => {
        cy.get('[data-cy="home-page-logo"] img')
            .should('be.visible')
            .should('have.attr', 'width', '26px')
            .should('have.attr', 'height', '26px')
            .and('have.attr', 'src')
            .and('include', 'pexels-photo-1796715');
        verifyPageTitleAndFavicon();
    };

    const fetchAndCheckUIViaMH = (
        email,
        verifyWhiteLabel = false,
        whiteLabelConfig = {}
    ) => {
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
                    const hasLogo = cleanedBody.includes(logoBaseUrl);
                    expect(
                        hasLogo,
                        `Expected email to contain white-label logo URL: ${logoBaseUrl}`
                    ).to.be.true;
                }

                if (expectedText) {
                    const normalizedExpectedText = expectedText.replace(/\s+/g, " ").trim();
                    const hasTextInBody = cleanedBody.includes(normalizedExpectedText);
                    const headerString = JSON.stringify(headers).replace(/\s+/g, " ");
                    const hasTextInHeaders = headerString.includes(normalizedExpectedText);
                    const textParts = normalizedExpectedText
                        .split(" ")
                        .filter((p) => p.length > 2);
                    const hasAllParts =
                        textParts.every((p) => cleanedBody.includes(p)) ||
                        textParts.every((p) => headerString.includes(p));

                    expect(
                        hasTextInBody || hasTextInHeaders || hasAllParts,
                        `Expected email (body or headers) to contain white-label text: ${normalizedExpectedText}`
                    ).to.be.true;
                }
            }

            let inviteUrl = "";
            const hrefMatch = cleanedBody.match(/href=["']?(http[^"'\s>]*invitation[^"'\s>]*)/i);
            if (hrefMatch) {
                inviteUrl = hrefMatch[1];
            } else {
                const urlMatch = cleanedBody.match(/https?:\/\/[^\s"'<>]*invitation[s]?[^\s"'<>]*/i);
                inviteUrl = urlMatch ? urlMatch[0] : "";
            }
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
        cy.wait(5000);
    };

    it("should verify all white labelling UI elements", () => {
        openWhiteLabelingSettings();
        verifyWhiteLabelingUI();
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
        cy.wait(3000);
        verifyLogoOnDashboard();

        openWhiteLabelingSettings();
        cy.get(whiteLabelSelectors.appLogoInput)
            .invoke('val')
            .then((val) => {
                const decodedVal = val.replace(/&amp;/g, '&');
                expect(decodedVal).to.eq(WHITE_LABEL_LOGO);
            });
        cy.get(whiteLabelSelectors.pageTitleInput).should('have.value', WHITE_LABEL_TEXT);
        cy.get(whiteLabelSelectors.favIconInput)
            .invoke('val')
            .then((val) => {
                const decodedVal = val.replace(/&amp;/g, '&');
                expect(decodedVal).to.eq(WHITE_LABEL_FAVICON);
            });
    });

    it("should verify white label in user invitation email", () => {
        const name = fake.firstName;
        const email = fake.email.toLowerCase().replaceAll(/[^a-z0-9@.]/g, "");
        openWhiteLabelingSettings();
        fillWhiteLabelingForm();
        saveWhiteLabelingChanges();

        openSMTPSettings();
        configureSMTP("localhost", "1025", "dev", fake.firstName, "hello@tooljet.io");
        cy.wait(5000);
        cy.apiUserInvite(name, email);

        cy.wait(3000);
        fetchAndCheckUIViaMH(email, true, {
            expectedLogo: WHITE_LABEL_LOGO,
            expectedText: WHITE_LABEL_TEXT
        });
    });

    it("should verify white label persists across browser tab", () => {
        openWhiteLabelingSettings();
        fillWhiteLabelingForm();
        saveWhiteLabelingChanges();
        cy.title().should('contain', WHITE_LABEL_TEXT);

        cy.get('link[rel="icon"]')
            .should('have.attr', 'href')
            .and('include', 'pexels-photo-1796715');
        verifyPageTitleAndFavicon();

        cy.get('[data-cy="apps-icon"]').click();
        cy.wait(1000);
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
        cy.wait(2000);

        cy.get('[data-cy="page-logo"] svg')
            .should('be.visible')
            .should('have.attr', 'width', '94')
            .should('have.attr', 'height', '24');
        cy.title().should('contain', 'ToolJet');
    });

    // need to run after bug fixes 
    it.skip("should validate white label URL format", () => {
        openWhiteLabelingSettings();
        cy.get(whiteLabelSelectors.appLogoInput).clear().type('invalid-url');
        cy.get(whiteLabelSelectors.saveButton).should('be.disabled');
        cy.get(whiteLabelSelectors.appLogoInput).clear().type(WHITE_LABEL_LOGO);
        cy.get(whiteLabelSelectors.saveButton).click();
    });
});
