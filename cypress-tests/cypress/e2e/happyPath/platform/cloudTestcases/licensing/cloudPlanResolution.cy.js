import { fake } from "Fixtures/fake";

describe("Cloud Licensing — Workspace Plan Resolution", { retries: 0 }, () => {
  const teamOnlyFeatures = ["auditLogs", "multiEnvironment", "gitSync", "customGroups"];
  let workspaceId;
  let trialTerms;

  beforeEach(() => {
    const email = `cloud-plan-${Date.now()}@tooljet.test`;
    cy.apiCloudSignup({ email, name: fake.firstName }).then((signup) => {
      workspaceId = signup.workspaceId;
      cy.apiGetCloudLicenseRow(workspaceId).then((row) => {
        trialTerms = row.terms;
      });
    });
  });

  it("should give a new cloud signup a 14-day trial for its workspace", () => {
    cy.apiGetCloudLicenseRow(workspaceId).then((row) => {
      expect(row.license_type).to.equal("trial");
      expect(row.terms.apps).to.equal(10);
      expect(row.terms.users).to.include({ editor: 2, viewer: 50 });
    });
    cy.waitForCloudPlan("trial", workspaceId).then((access) => {
      expect(access.licenseStatus).to.include({ isLicenseValid: true, isExpired: false });
      expect(access.auditLogs).to.equal(true);
    });
  });

  it("should fall back to the Basic plan when the workspace has no licence", () => {
    cy.apiSetCloudPlan("basic", { workspaceId }).then((access) => {
      expect(access.licenseStatus.isLicenseValid).to.equal(false);
      teamOnlyFeatures.forEach((feature) => expect(access[feature], feature).to.equal(false));
    });
  });

  it("should resolve Pro and Team terms from PlanTerms for the workspace", () => {
    cy.apiSetCloudPlan("pro", { workspaceId }).then((access) => {
      expect(access.plan).to.equal("pro");
      expect(access.licenseStatus.isLicenseValid).to.equal(true);
      expect(access.customStyling).to.equal(true);
      teamOnlyFeatures.forEach((feature) => expect(access[feature], feature).to.equal(false));
    });

    cy.apiSetCloudPlan("team", { workspaceId }).then((access) => {
      expect(access.plan).to.equal("team");
      teamOnlyFeatures.forEach((feature) => expect(access[feature], feature).to.equal(true));
    });
  });

  it("should treat an expired trial as Basic", () => {
    cy.apiSetCloudPlan("trial", { workspaceId, terms: trialTerms, expiryDays: -2, wait: false });
    cy.waitForCloudPlan("basic", workspaceId).then((access) => {
      teamOnlyFeatures.forEach((feature) => expect(access[feature], feature).to.equal(false));
    });
  });

  ["starter", "basicplus"].forEach((plan) => {
    it(`should resolve the ${plan} plan with the features from its PlanTerms`, () => {
      cy.task("cloudPlanTerms", plan).then((terms) => {
        cy.apiSetCloudPlan(plan, { workspaceId }).then((access) => {
          expect(access.licenseStatus.isLicenseValid).to.equal(true);
          [...teamOnlyFeatures, "customStyling"].forEach((feature) => {
            expect(access[feature], feature).to.equal(Boolean(terms.features?.[feature]));
          });
        });
      });
    });
  });

  it("should keep a paid plan valid during its grace period", () => {
    cy.apiSetCloudPlan("team", { workspaceId, expiryDays: -1, graceDays: 5 }).then((access) => {
      expect(access.licenseStatus.isLicenseValid).to.equal(true);
      teamOnlyFeatures.forEach((feature) => expect(access[feature], feature).to.equal(true));
    });
  });

  it("should drop a paid plan to Basic once its grace period has ended", () => {
    cy.apiSetCloudPlan("team", { workspaceId, expiryDays: -10, graceDays: 5, wait: false });
    cy.waitForCloudPlan("basic", workspaceId).then((access) => {
      teamOnlyFeatures.forEach((feature) => expect(access[feature], feature).to.equal(false));
    });
  });

  it("should keep plans separate for two workspaces of the same user", () => {
    const secondWorkspace = `cloud-ws-${Date.now()}`;
    cy.apiCreateWorkspace(secondWorkspace, secondWorkspace).then(({ body }) => {
      const secondId = body.organization_id || body.id;
      cy.apiSetCloudPlan("team", { workspaceId });
      cy.waitForCloudPlan("basic", secondId);
      cy.waitForCloudPlan("team", workspaceId);
    });
  });
});
