import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import { onboardingText } from "Texts/platform/onboarding";

describe("Cloud Onboarding — OTP Signup", { retries: 0 }, () => {
  const host = () => Cypress.env("server_host");
  const uniqueEmail = (prefix) =>
    `${prefix}-${Date.now()}-${Cypress._.random(1000, 9999)}@tooljet.test`;

  const cloudOtp = (email) =>
    cy.task("cloudOtp", { email, secret: Cypress.env("cloud_mfa_secret") }, { log: false });

  const requestOtp = (email) =>
    cy.request({
      method: "GET",
      url: `${host()}/api/ai/onboarding/request-otp/${encodeURIComponent(email)}`,
      failOnStatusCode: false,
    });

  const cloudOnboard = (email, otp) =>
    cy.request({
      method: "POST",
      url: `${host()}/api/ai/onboarding`,
      body: { email, password: "password", name: fake.firstName, otp },
      failOnStatusCode: false,
    });

  it("should create an admin user, a workspace and a trial licence and log the user in", () => {
    const email = uniqueEmail("cloud-onb");

    cy.apiCloudSignup({ email, name: fake.firstName }).then(({ workspaceId, workspaceSlug, userId }) => {
      expect(workspaceId, "workspace id").to.be.a("string").and.not.be.empty;

      cy.runSqlQueryOnDB(
        `SELECT pg.name FROM group_users gu
           JOIN permission_groups pg ON pg.id = gu.group_id
          WHERE gu.user_id = '${userId}' AND pg.organization_id = '${workspaceId}';`
      ).then(({ rows }) => {
        expect(rows.map((row) => row.name)).to.include("admin");
      });

      cy.apiGetCloudLicenseRow(workspaceId).then((row) => {
        expect(row.license_type).to.equal("trial");
      });

      cy.visit(`/${workspaceSlug}`);
      cy.get(commonSelectors.homePageLogo).should("be.visible");
      cy.url().should("include", `/${workspaceSlug}`).and("not.include", "/login");
    });
  });

  it("should block a second OTP request for the same email within 30 seconds", () => {
    const email = uniqueEmail("cloud-otp-cooldown");

    requestOtp(email).its("status").should("eq", 200);
    requestOtp(email).then(({ status, body }) => {
      expect(status).to.equal(400);
      expect(body.message).to.equal(onboardingText.otpCooldownError);
    });
  });

  it("should reject a wrong OTP and an email that already has an account", () => {
    const newEmail = uniqueEmail("cloud-otp-wrong");
    const existingEmail = uniqueEmail("cloud-otp-existing");

    requestOtp(newEmail).its("status").should("eq", 200);
    cloudOtp(newEmail).then((otp) => {
      const wrongOtp = String((Number(otp) + 500000) % 1000000).padStart(6, "0");
      cloudOnboard(newEmail, wrongOtp).then(({ status, body }) => {
        expect(status).to.equal(400);
        expect(body.message).to.equal(onboardingText.invalidOtpError);
      });
    });

    cy.apiCloudSignup({ email: existingEmail, name: fake.firstName });
    cy.clearCookies();
    cloudOtp(existingEmail).then((otp) => {
      cloudOnboard(existingEmail, otp).then(({ status, body }) => {
        expect(status).to.equal(401);
        expect(body.message).to.equal(onboardingText.userAlreadyExistsError);
      });
    });
  });

  it("should forbid super admin setup and MFA enrolment on cloud", () => {
    cy.request({
      method: "POST",
      url: `${host()}/api/onboarding/setup-super-admin`,
      body: {
        email: uniqueEmail("cloud-super-admin"),
        password: "password",
        name: fake.firstName,
        workspace: `ws-${Date.now()}`,
      },
      failOnStatusCode: false,
    }).then(({ status }) => {
      expect(status, "setup-super-admin status").to.equal(403);
    });

    cy.apiCloudSignup({ email: uniqueEmail("cloud-mfa"), name: fake.firstName });
    cy.getAuthHeaders().then((headers) => {
      cy.request({
        method: "GET",
        url: `${host()}/api/profile/mfa/setup`,
        headers,
        failOnStatusCode: false,
      }).then(({ status, body }) => {
        expect(status, "mfa/setup status").to.equal(451);
        expect(body.message).to.equal(onboardingText.planFeatureBlockedError);
      });
    });
  });
});
