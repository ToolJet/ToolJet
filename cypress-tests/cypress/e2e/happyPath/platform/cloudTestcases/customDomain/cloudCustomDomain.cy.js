import { fake } from "Fixtures/fake";
import { commonSelectors } from "Selectors/common";
import {
  cloudSettingsSelectors,
  customDomainSelectors,
} from "Selectors/platform/cloudSettings";
import { cloudSettingsText, customDomainText } from "Texts/platform/cloudSettings";

describe("Cloud Custom Domain — Workspace Settings", { retries: 0 }, () => {
  let workspaceId;

  const uniqueDomain = (prefix) => `${prefix}-${Date.now()}.tooljet-cypress.com`;

  const signupWithPlan = (plan) => {
    const email = `cloud-cd-${Date.now()}@tooljet.test`;
    cy.apiCloudSignup({ email, name: fake.firstName }).then((signup) => {
      workspaceId = signup.workspaceId;
      if (plan !== "trial") cy.apiSetCloudPlan(plan, { workspaceId });
    });
  };

  const openCustomDomainPage = () => {
    cy.visit(`/${workspaceId}/settings/custom-domain`);
    cy.get(cloudSettingsSelectors.cardTitle).verifyVisibleElement(
      "have.text",
      customDomainText.pageTitle
    );
  };

  const customDomainRequest = (method, path = "", options = {}) =>
    cy.getAuthHeaders().then((headers) =>
      cy.request({
        method,
        url: `${Cypress.env("server_host")}/api/custom-domains${path}`,
        headers: { ...headers, ...options.headers },
        body: options.body,
        failOnStatusCode: false,
      })
    );

  const resolveDomain = (domain) =>
    cy.request({
      method: "GET",
      url: `${Cypress.env("server_host")}/api/custom-domains/resolve?domain=${encodeURIComponent(domain)}`,
      failOnStatusCode: false,
    });

  const expectNoDomain = (response) =>
    expect(Cypress._.isEmpty(response.body), "no custom domain").to.equal(true);

  const listWorkspaces = () =>
    cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/organizations`,
          headers,
        })
        .its("body.organizations")
    );

  context("on the basic plan", () => {
    beforeEach(() => signupWithPlan("basic"));

    it("should show the paid feature pill and lock the form on basic", () => {
      openCustomDomainPage();

      cy.get(cloudSettingsSelectors.paidFeatureButton).verifyVisibleElement(
        "have.text",
        cloudSettingsText.paidFeature
      );
      cy.get(customDomainSelectors.domainInput).should("be.disabled");
      cy.get(customDomainSelectors.saveButton).should("be.disabled");
    });
  });

  context("on the trial plan", () => {
    beforeEach(() => {
      signupWithPlan("trial");
      cy.then(() => cy.waitForCloudPlan("trial", workspaceId));
    });

    it("should show the paid feature pill but keep the form editable on trial", () => {
      openCustomDomainPage();

      cy.get(cloudSettingsSelectors.paidFeatureButton).verifyVisibleElement(
        "have.text",
        cloudSettingsText.paidFeature
      );
      cy.get(customDomainSelectors.domainInput).should("be.enabled");
    });
  });

  context("on the Team plan", () => {
    beforeEach(() => signupWithPlan("team"));

    it("should enable the custom domain form on the Team plan", () => {
      openCustomDomainPage();

      cy.get(cloudSettingsSelectors.paidFeatureButton).should("not.exist");
      cy.get(customDomainSelectors.domainInput).should("be.enabled");
    });

    it("should block a builder from the custom domain page and admin APIs", () => {
      const builderEmail = `cloud-cd-builder-${Date.now()}@tooljet.test`;
      cy.apiFullUserOnboarding(fake.firstName, builderEmail, "builder");
      cy.apiLogin(builderEmail, "password", workspaceId);

      cy.visit(`/${workspaceId}/settings/custom-domain`);
      cy.url().should("not.include", "/settings");
      cy.get(customDomainSelectors.domainInput).should("not.exist");

      customDomainRequest("POST", "", { body: { domain: uniqueDomain("builder") } })
        .its("status")
        .should("equal", 403);
      customDomainRequest("POST", "/verify").its("status").should("equal", 403);
      customDomainRequest("GET", "/status").its("status").should("equal", 403);
      customDomainRequest("DELETE").its("status").should("equal", 403);
    });

    it("should show the custom domain page elements", () => {
      openCustomDomainPage();

      cy.get(customDomainSelectors.domainLabel).verifyVisibleElement(
        "have.text",
        customDomainText.domainLabel
      );
      cy.get(customDomainSelectors.domainInput)
        .should("be.visible")
        .and("have.attr", "placeholder", customDomainText.domainPlaceholder);
      cy.get(customDomainSelectors.domainHelper).verifyVisibleElement(
        "have.text",
        customDomainText.domainHelper
      );
      cy.get(customDomainSelectors.workspaceUrlLabel).verifyVisibleElement(
        "have.text",
        customDomainText.workspaceUrlLabel
      );
      cy.location("origin").then((origin) => {
        cy.get(customDomainSelectors.workspaceUrl).verifyVisibleElement(
          "have.text",
          `${origin}/login/${workspaceId}`
        );
      });
      cy.get(customDomainSelectors.workspaceUrlCopyButton).verifyVisibleElement(
        "contain.text",
        customDomainText.copyButton
      );
      cy.get(customDomainSelectors.workspaceUrlHelper).verifyVisibleElement(
        "have.text",
        customDomainText.workspaceUrlHelper
      );
      cy.get(customDomainSelectors.readDocumentationLink)
        .should("be.visible")
        .and("have.text", customDomainText.readDocumentation)
        .and("have.attr", "target", "_blank")
        .and("have.attr", "href")
        .and("include", "docs.tooljet.com");
      cy.get(customDomainSelectors.testConnectionButton)
        .should("be.visible")
        .and("contain.text", customDomainText.testConnection)
        .and("be.disabled");
      cy.get(customDomainSelectors.cancelButton).verifyVisibleElement(
        "have.text",
        customDomainText.cancelButton
      );
      cy.get(customDomainSelectors.saveButton)
        .should("be.visible")
        .and("contain.text", customDomainText.saveButton)
        .and("be.disabled");
    });

    it("should reject an invalid domain and discard changes on cancel", () => {
      openCustomDomainPage();

      cy.clearAndType(customDomainSelectors.domainInput, "https://not a domain");
      cy.get(customDomainSelectors.saveButton).should("be.enabled").click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        customDomainText.invalidDomainToast
      );
      customDomainRequest("GET").then(expectNoDomain);

      const draftDomain = uniqueDomain("draft");
      cy.clearAndType(customDomainSelectors.domainInput, draftDomain);
      cy.get(customDomainSelectors.cancelButton).click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        customDomainText.changesDiscardedToast
      );
      cy.get(customDomainSelectors.domainInput).should("not.have.value", draftDomain);
      cy.get(customDomainSelectors.saveButton).should("be.disabled");
    });

    it("should show a seeded pending domain and fail its connection test", () => {
      const domain = uniqueDomain("pending");
      cy.apiSeedCustomDomain({ workspaceId, domain, status: "pending_verification" });

      customDomainRequest("GET").its("body").should("include", {
        domain,
        status: "pending_verification",
      });
      resolveDomain(domain).its("status").should("equal", 404);

      openCustomDomainPage();
      cy.get(customDomainSelectors.domainInput).should("have.value", domain);
      cy.get(customDomainSelectors.workspaceUrl).verifyVisibleElement(
        "have.text",
        `https://${domain}/login/${workspaceId}`
      );
      // Seeded rows have no Cloudflare hostname, so verify stops before calling Cloudflare
      cy.get(customDomainSelectors.testConnectionButton).should("be.enabled").click();
      cy.verifyToastMessage(
        commonSelectors.toastMessage,
        customDomainText.notRegisteredWithProviderToast
      );
      cy.get(customDomainSelectors.testConnectionButton).should(
        "contain.text",
        customDomainText.couldNotConnect
      );
    });

    it("should resolve an active domain to its workspace without auth", () => {
      const domain = uniqueDomain("active");
      cy.apiSeedCustomDomain({ workspaceId, domain, status: "active" });

      resolveDomain(domain).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.organizationId).to.equal(workspaceId);
      });
      resolveDomain(domain.toUpperCase())
        .its("body.organizationId")
        .should("equal", workspaceId);

      listWorkspaces().then((organizations) => {
        const workspace = organizations.find((org) => org.id === workspaceId);
        expect(workspace.custom_domain).to.equal(domain);
      });
    });

    it("should remove a seeded domain from the settings page", () => {
      const domain = uniqueDomain("remove");
      cy.apiSeedCustomDomain({ workspaceId, domain, status: "active" });
      resolveDomain(domain).its("status").should("equal", 200);

      openCustomDomainPage();
      cy.get(customDomainSelectors.domainInput).should("have.value", domain);
      cy.get(customDomainSelectors.domainInput).clear();
      cy.get(customDomainSelectors.saveButton).should("be.enabled").click();
      cy.verifyToastMessage(commonSelectors.toastMessage, customDomainText.removedToast);

      customDomainRequest("GET").then(expectNoDomain);
      resolveDomain(domain).its("status").should("equal", 404);
    });

    it("should keep a workspace domain out of other workspaces", () => {
      const domain = uniqueDomain("isolated");
      const otherWorkspace = `cloud-cd-b-${Date.now()}`;

      cy.apiCreateWorkspace(otherWorkspace, otherWorkspace).then(({ body }) => {
        const otherWorkspaceId = body.organization_id || body.id;
        cy.apiSetCloudPlan("team", { workspaceId: otherWorkspaceId });
        cy.apiSeedCustomDomain({ workspaceId, domain, status: "active" });

        customDomainRequest("GET", "", { headers: { "Tj-Workspace-Id": otherWorkspaceId } }).then(
          expectNoDomain
        );
        resolveDomain(domain).its("body.organizationId").should("equal", workspaceId);
        listWorkspaces().then((organizations) => {
          const other = organizations.find((org) => org.id === otherWorkspaceId);
          expect(other.custom_domain ?? null).to.equal(null);
        });
      });
    });
  });
});
