import { fake } from "Fixtures/fake";
import { cloudAiText } from "Texts/platform/cloudAi";
import { aiSpendText } from "Texts/platform/cloudAiSpend";
import { loginToWorkspace } from "Support/utils/platform/ai";
import {
  GHOST_USER_ID,
  addSpendUser,
  createSpendWorkspace,
  fixWithAi,
  messageOf,
  spendRequest,
} from "Support/utils/platform/aiSpend";

const POOL = { monthly: 10000, addon: 1000 };
const UNKNOWN_BUILDER_ID = "99999999-9999-4999-8999-999999999999";

describe("Cloud AI Spend — Limits and Enforcement API", { retries: 0 }, () => {
  const adminEmail = `cloud-spend-api-${Date.now()}@tooljet.test`;
  let admin;
  let workspaceId;
  let priya;
  let omar;
  let viewer;

  const wallet = (overrides = {}) => ({
    pool: POOL,
    monthlySpent: { [admin.userId]: 100, [priya.userId]: 2500, [omar.userId]: 0, [viewer.userId]: 40, [GHOST_USER_ID]: 15 },
    addonSpent: { [priya.userId]: 50 },
    unattributed: { monthly: 20, addon: 0 },
    ...overrides,
  });

  const asAdmin = () => loginToWorkspace(adminEmail, workspaceId);
  const asUser = (user) => loginToWorkspace(user.email, workspaceId);
  const usage = () => spendRequest("GET", "credits-usage", workspaceId).then((response) => response.body);
  const saveLimits = (body) => spendRequest("PUT", "credits-usage/limits", workspaceId, body);
  const saveBuilderLimit = (userId, body) =>
    spendRequest("PUT", `credits-usage/limits/builders/${userId}`, workspaceId, body);

  before(() => {
    cy.apiCloudSignup({ email: adminEmail, name: fake.firstName }).then((signup) => {
      admin = { userId: signup.userId, workspaceId: signup.workspaceId };
    });
    cy.then(() => createSpendWorkspace(adminEmail, admin.workspaceId)).then((id) => {
      workspaceId = id;
    });
    cy.then(() => addSpendUser(adminEmail, workspaceId, "builder")).then((user) => (priya = user));
    cy.then(() => addSpendUser(adminEmail, workspaceId, "builder")).then((user) => (omar = user));
    cy.then(() => addSpendUser(adminEmail, workspaceId, "end-user")).then((user) => (viewer = user));
    cy.then(() => cy.setAiGatewayWallet(wallet(), workspaceId));
  });

  beforeEach(() => {
    cy.then(() => cy.setAiGatewayWallet(wallet(), workspaceId));
    asAdmin();
  });

  it("should start with limits on and an equal share for every builder", () => {
    usage().then((body) => {
      expect(body.limitsAvailable).to.equal(true);
      expect(body.limits).to.include({ enabled: true, builderCount: 3, customCount: 0 });
      expect(body.limits.monthly).to.include({ mode: "equal_share", effective: 3333, max: 3333 });
      expect(body.limits.addon).to.include({ mode: "equal_share", effective: 333, max: 333 });
      expect(body.pools.monthly).to.include({ total: 10000, remaining: 7325, used: 2675 });
      expect(body.pools.addon).to.include({ total: 1000, remaining: 950, used: 50 });
    });
  });

  it("should list builders, the other spenders and the unattributed spend", () => {
    usage().then((body) => {
      const kinds = Cypress._.countBy(body.rows, "kind");
      expect(kinds).to.deep.equal({ builder: 3, nonBuilder: 1, unknown: 1, unattributed: 1 });
      const priyaRow = body.rows.find((row) => row.userId === priya.userId);
      // While limits are on, spend under the monthly limit counts as monthly.
      expect(priyaRow).to.include({ monthly: 2550, addon: 0 });
      expect(priyaRow.limit).to.deep.equal({ monthly: 3333, addon: 333 });
    });
  });

  it("should keep the usage and limit APIs away from builders and end users", () => {
    [priya, viewer].forEach((user) => {
      asUser(user);
      spendRequest("GET", "credits-usage", workspaceId).its("status").should("equal", 403);
      saveLimits({ enabled: false }).its("status").should("equal", 403);
      saveBuilderLimit(omar.userId, { monthly: 10 }).its("status").should("equal", 403);
    });
    asAdmin();
    usage().then((body) => expect(body.limits.enabled).to.equal(true));
  });

  it("should refuse invalid default limits", () => {
    saveLimits({ defaults: { monthly: { mode: "custom", value: 0 }, addon: { mode: "equal_share" } } }).then((response) => {
      expect(response.status).to.equal(400);
      expect(messageOf(response)).to.include(aiSpendText.wholeNumber);
    });
    saveLimits({ defaults: { monthly: { mode: "custom", value: 99999 }, addon: { mode: "equal_share" } } }).then((response) => {
      expect(response.status).to.equal(400);
      expect(messageOf(response)).to.equal(aiSpendText.overMax("3,333"));
    });
    saveLimits({}).then((response) => {
      expect(response.status).to.equal(400);
      expect(messageOf(response)).to.equal(aiSpendText.notABooleanBody);
    });
    usage().then((body) => expect(body.limits.monthly.mode).to.equal("equal_share"));
  });

  it("should refuse invalid builder limits and people who are not builders here", () => {
    [0, 1.5].forEach((monthly) => {
      saveBuilderLimit(omar.userId, { monthly }).then((response) => {
        expect(response.status).to.equal(400);
        expect(messageOf(response)).to.equal(aiSpendText.wholeNumber);
      });
    });
    saveBuilderLimit(omar.userId, { monthly: 99999 }).then((response) => {
      expect(response.status).to.equal(400);
      expect(messageOf(response)).to.match(aiSpendText.overMaxPattern);
    });
    [viewer.userId, UNKNOWN_BUILDER_ID].forEach((userId) => {
      saveBuilderLimit(userId, { monthly: 10 }).then((response) => {
        expect(response.status).to.equal(404);
        expect(messageOf(response)).to.equal(aiSpendText.builderNotFound);
      });
    });
  });

  it("should stop a builder at their limit and let the others carry on", () => {
    saveBuilderLimit(priya.userId, { monthly: 2000 }).its("status").should("equal", 200);

    asUser(priya);
    fixWithAi(workspaceId).then((response) => {
      expect(response.status).to.equal(402);
      expect(response.body.code).to.equal("credit_limit_reached");
      expect(response.body.message).to.equal(cloudAiText.creditLimitReached);
    });
    spendRequest("GET", "credits-usage/me", workspaceId).then(({ status, body }) => {
      expect(status).to.equal(200);
      expect(body.enabled).to.equal(true);
      expect(body.monthly).to.include({ used: 2000, limit: 2000, left: 0 });
      expect(body.addon).to.include({ used: 550, limit: 333, left: 0 });
      expect(body.pool.balance).to.equal(7325 + 950);
    });
    spendRequest("GET", `credits-usage/me?userId=${omar.userId}`, workspaceId).its("body.monthly.used").should("equal", 2000);

    asUser(omar);
    // Omar passes the credit check; the random component id is what fails next.
    fixWithAi(workspaceId).its("status").should("not.be.oneOf", [402, 503]);

    asUser(viewer);
    spendRequest("GET", "credits-usage/me", workspaceId).its("status").should("equal", 403);
  });

  it("should refuse every builder when the pool is empty", () => {
    cy.setAiGatewayWallet(wallet({ pool: { monthly: 2600, addon: 50 } }), workspaceId);
    [omar, priya].forEach((user) => {
      asUser(user);
      fixWithAi(workspaceId).then((response) => {
        expect(response.status).to.equal(402);
        expect(response.body.code).to.equal("pool_empty");
        expect(response.body.message).to.equal(cloudAiText.poolEmpty);
      });
    });
  });

  it("should fail closed when the AI credits cannot be read", () => {
    cy.setAiGatewayWallet(wallet({ fail: true }), workspaceId);
    asUser(omar);
    fixWithAi(workspaceId).then((response) => {
      expect(response.status).to.equal(503);
      expect(response.body.code).to.equal("balance_unavailable");
      expect(response.body.message).to.equal(cloudAiText.balanceUnavailable);
    });
    asAdmin();
    spendRequest("GET", "credits-usage", workspaceId).its("status").should("equal", 502);
  });

  it("should reset custom limits that no longer fit when the plan shrinks", () => {
    saveLimits({ defaults: { monthly: { mode: "custom", value: 2000 }, addon: { mode: "equal_share" } } })
      .its("status")
      .should("equal", 200);
    saveBuilderLimit(priya.userId, { monthly: 3000 }).its("status").should("equal", 200);
    cy.setAiGatewayWallet(wallet({ plan: POOL }), workspaceId);
    usage().then((body) => expect(body.limits.customCount).to.equal(1));

    cy.setAiGatewayWallet(
      wallet({ pool: { monthly: 4000, addon: 1000 }, plan: { monthly: 4000, addon: 1000 } }),
      workspaceId
    );
    usage().then((body) => {
      expect(body.limits.customCount).to.equal(0);
      expect(body.limits.monthly).to.include({ effective: 1333, note: "reduced" });
      expect(body.notices).to.have.length(1);
      expect(body.notices[0].kind).to.equal("plan_change");
      expect(body.notices[0].defaults.monthly).to.deep.equal({ before: 2000, after: 1333 });
    });
  });

  it("should write an audit entry for each limit change and refusal", () => {
    saveLimits({ enabled: false }).its("status").should("equal", 200);
    saveLimits({ enabled: true }).its("status").should("equal", 200);
    cy.runSqlQueryOnDB(
      `SELECT DISTINCT action_type FROM audit_logs WHERE organization_id = '${workspaceId}' AND action_type LIKE 'AI_CREDIT%';`
    ).then((result) => {
      const actions = result.rows.map((row) => row.action_type);
      [
        "AI_CREDIT_LIMIT_DISABLED",
        "AI_CREDIT_LIMIT_ENABLED",
        "AI_CREDIT_LIMIT_UPDATED",
        "AI_CREDIT_BUILDER_LIMIT_UPDATED",
        "AI_CREDIT_LIMIT_REACHED",
        "AI_CREDIT_LIMITS_ADJUSTED",
      ].forEach((action) => expect(actions, action).to.include(action));
    });
  });
});
