const DAY_MS = 24 * 60 * 60 * 1000;

const sqlLiteral = (value) => `'${String(value).replace(/'/g, "''")}'`;

const isoDaysFromNow = (days) =>
  new Date(Date.now() + days * DAY_MS).toISOString();

const LOOPBACK_HOSTS = ["localhost", "127.0.0.1", "::1"];

const assertCloudTarget = () => {
  const serverHost = new URL(Cypress.env("server_host")).hostname;
  const db = Cypress.env("app_db") || {};
  const disposableDb = Cypress.env("cloud_disposable_db");
  const problems = [
    Cypress.env("environment") !== "Cloud" && `environment=${Cypress.env("environment")}`,
    !LOOPBACK_HOSTS.includes(serverHost) && `server_host=${serverHost}`,
    !LOOPBACK_HOSTS.includes(db.host) && `app_db.host=${db.host}`,
    (!disposableDb || db.database !== disposableDb) &&
      `app_db.database=${db.database} is not the declared cloud_disposable_db=${disposableDb}`,
  ].filter(Boolean);
  if (problems.length) {
    throw new Error(`Cloud seed commands only run against a local throwaway Cloud deployment: ${problems.join(", ")}`);
  }
};

Cypress.Commands.add(
  "apiCloudSignup",
  ({ email, password = "password", name = "Cloud Admin" }) => {
    assertCloudTarget();
    const host = Cypress.env("server_host");

    cy.request({
      method: "GET",
      url: `${host}/api/ai/onboarding/request-otp/${encodeURIComponent(email)}`,
      log: false,
    });

    return cy
      .task("cloudOtp", { email, secret: Cypress.env("cloud_mfa_secret") }, { log: false })
      .then((otp) =>
        cy.request({
          method: "POST",
          url: `${host}/api/ai/onboarding`,
          body: { email, password, name, otp },
          log: false,
        })
      )
      .then(({ body }) => {
        Cypress.env("workspaceId", body.current_organization_id);
        Cypress.log({
          name: "apiCloudSignup",
          displayName: "CLOUD SIGNUP",
          message: `: ${email}`,
        });
        return {
          workspaceId: body.current_organization_id,
          workspaceSlug: body.current_organization_slug,
          userId: body.id,
        };
      });
  }
);

Cypress.Commands.add(
  "apiGetLicenseAccess",
  (workspaceId = Cypress.env("workspaceId")) => {
    return cy.getAuthHeaders().then((headers) =>
      cy
        .request({
          method: "GET",
          url: `${Cypress.env("server_host")}/api/license/access`,
          headers: { ...headers, "Tj-Workspace-Id": workspaceId },
          log: false,
        })
        .its("body")
    );
  }
);

const currentPlanOf = (access) =>
  access.licenseStatus?.licenseType === "trial" ? "trial" : access.plan;

Cypress.Commands.add(
  "waitForCloudPlan",
  (expectedPlan, workspaceId = Cypress.env("workspaceId"), attempts = 15) => {
    return cy.apiGetLicenseAccess(workspaceId).then((access) => {
      if (currentPlanOf(access) === expectedPlan) return access;
      if (attempts <= 1) {
        throw new Error(
          `Workspace ${workspaceId} plan is "${currentPlanOf(access)}", expected "${expectedPlan}"`
        );
      }
      // The server caches a workspace licence for up to 30s.
      cy.wait(3000, { log: false });
      return cy.waitForCloudPlan(expectedPlan, workspaceId, attempts - 1);
    });
  }
);

Cypress.Commands.add(
  "apiSetCloudPlan",
  (
    plan,
    {
      workspaceId = Cypress.env("workspaceId"),
      expiryDays = 30,
      graceDays = 0,
      terms,
      licenseType,
      wait = true,
    } = {}
  ) => {
    assertCloudTarget();
    const workspace = sqlLiteral(workspaceId);

    const applied = () =>
      wait ? cy.waitForCloudPlan(plan === "expired" ? "basic" : plan, workspaceId) : cy.wrap(null);

    if (plan === "basic") {
      return cy
        .runSqlQueryOnDB(`DELETE FROM organization_license WHERE organization_id = ${workspace};`)
        .then(applied);
    }

    const upsert = (planTerms, type, planName) => {
      const expiry = isoDaysFromNow(expiryDays);
      const grace = isoDaysFromNow(expiryDays + graceDays);
      const termsJson = sqlLiteral(
        JSON.stringify({ ...planTerms, expiry: expiry.split("T")[0], type, workspaceId })
      );
      return cy.runSqlQueryOnDB(`
        INSERT INTO organization_license
          (organization_id, license_type, plan, expiry_date, expiry_with_grace_period, terms, updated_at)
        VALUES (${workspace}, ${sqlLiteral(type)}, ${planName ? sqlLiteral(planName) : "NULL"},
                ${sqlLiteral(expiry)}, ${sqlLiteral(grace)}, ${termsJson}, now())
        ON CONFLICT (organization_id) DO UPDATE SET
          license_type = EXCLUDED.license_type, plan = EXCLUDED.plan,
          expiry_date = EXCLUDED.expiry_date, expiry_with_grace_period = EXCLUDED.expiry_with_grace_period,
          terms = EXCLUDED.terms, updated_at = now();`);
    };

    if (plan === "trial") {
      if (!terms) {
        throw new Error("apiSetCloudPlan('trial') needs the trial terms saved from a cloud signup");
      }
      return upsert(terms, "trial", null).then(applied);
    }

    return cy
      .task("cloudPlanTerms", plan, { log: false })
      .then((planTerms) => upsert({ ...planTerms, ...terms }, licenseType || "business", plan))
      .then(applied);
  }
);

Cypress.Commands.add(
  "apiGetCloudLicenseRow",
  (workspaceId = Cypress.env("workspaceId")) => {
    return cy
      .runSqlQueryOnDB(
        `SELECT license_type, plan, terms, expiry_date FROM organization_license WHERE organization_id = ${sqlLiteral(workspaceId)};`
      )
      .then((result) => result.rows[0]);
  }
);

Cypress.Commands.add(
  "apiSetAiCreditWallets",
  ({ workspaceId = Cypress.env("workspaceId"), recurring, topup, renewalDays = 30 } = {}) => {
    assertCloudTarget();
    const wallets = [
      ["recurring", recurring],
      ["topup", topup],
    ].filter(([, balance]) => balance !== undefined);

    const values = wallets
      .map(
        ([type, balance]) =>
          `(${sqlLiteral(workspaceId)}, ${Number(balance)}, ${Number(balance)}, ${sqlLiteral(type)}, now(), ${sqlLiteral(isoDaysFromNow(renewalDays))})`
      )
      .join(", ");

    return cy.runSqlQueryOnDB(`
      INSERT INTO organizations_ai_feature
        (organization_id, balance, total_amount, wallet_type, balance_renewed_date, expiry_date)
      VALUES ${values}
      ON CONFLICT (organization_id, wallet_type) DO UPDATE SET
        balance = EXCLUDED.balance, total_amount = EXCLUDED.total_amount,
        expiry_date = EXCLUDED.expiry_date, updated_at = now();`);
  }
);

Cypress.Commands.add(
  "setAiGatewayBalance",
  (balance, workspaceId = Cypress.env("workspaceId")) => {
    return cy.task("setAiGatewayBalance", { workspaceId, balance }, { log: false });
  }
);

// wallet: { pool: { monthly, addon }, monthlySpent: { userId: n }, addonSpent, plan, unattributed: { monthly, addon }, fail }
Cypress.Commands.add(
  "setAiGatewayWallet",
  (wallet, workspaceId = Cypress.env("workspaceId")) => {
    return cy.task("setAiGatewayWallet", { workspaceId, wallet }, { log: false });
  }
);

Cypress.Commands.add(
  "apiSeedCustomDomain",
  ({ workspaceId = Cypress.env("workspaceId"), domain, status = "pending_verification" }) => {
    assertCloudTarget();
    return cy.runSqlQueryOnDB(`
      INSERT INTO custom_domains (organization_id, domain, status, cname_target)
      VALUES (${sqlLiteral(workspaceId)}, ${sqlLiteral(domain)}, ${sqlLiteral(status)}, 'cname.tooljet.test')
      ON CONFLICT (organization_id) DO UPDATE SET
        domain = EXCLUDED.domain, status = EXCLUDED.status, updated_at = now();`);
  }
);

// Without the licence PostgREST the server silently treats every workspace as Basic.
Cypress.Commands.add("verifyCloudLicensing", () => {
  const email = `cloud-preflight-${Date.now()}-${Cypress._.random(1e6)}@tooljet.test`;
  cy.apiCloudSignup({ email, name: "Preflight" }).then(({ workspaceId }) =>
    cy.apiGetLicenseAccess(workspaceId).then((access) => {
      const type = access.licenseStatus?.licenseType;
      if (type !== "trial") {
        throw new Error(
          `A new cloud signup reads as "${type}" instead of "trial": workspace licences are not reaching the server. Check the licence PostgREST (ORGANIZATION_LICENSE_URL).`
        );
      }
    })
  );
  cy.clearCookies();
  cy.then(() => Cypress.env("workspaceId", undefined));
});

if (Cypress.env("environment") === "Cloud") {
  before(() => cy.verifyCloudLicensing());
}
