import { fake } from "Fixtures/fake";
import { aiSpendSelectors } from "Selectors/platform/cloudAiSpend";
import { aiSpendText } from "Texts/platform/cloudAiSpend";
import { loginToWorkspace } from "Support/utils/platform/ai";
import {
  GHOST_USER_ID,
  addSpendUser,
  builderRow,
  createSpendWorkspace,
  dialog,
  openAiCreditsUsage,
} from "Support/utils/platform/aiSpend";

const POOL = { monthly: 10000, addon: 1000 };

describe("Cloud AI Spend — Usage Page", { retries: 0 }, () => {
  const adminEmail = `cloud-spend-${Date.now()}@tooljet.test`;
  let admin;
  let workspaceId;
  let priya;
  let omar;
  let viewer;

  // Spend: admin 100, Priya 2,500 + 50 add-on, Omar 0, an end user 40, an unknown user 15, 20 unattributed.
  const walletWith = ({ pool = POOL, extraSpent = {} } = {}) => ({
    pool,
    monthlySpent: {
      [admin.userId]: 100,
      [priya.userId]: 2500,
      [omar.userId]: 0,
      [viewer.userId]: 40,
      [GHOST_USER_ID]: 15,
      ...extraSpent,
    },
    addonSpent: { [priya.userId]: 50 },
    unattributed: { monthly: 20, addon: 0 },
  });

  const seedWallet = (options) => cy.setAiGatewayWallet(walletWith(options), workspaceId);

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
    cy.then(() => seedWallet());
  });

  it("should list AI credits usage in the settings menu and open it", () => {
    loginToWorkspace(adminEmail, workspaceId);
    cy.visit(`/${workspaceId}/settings`);
    cy.get(aiSpendSelectors.navItem).verifyVisibleElement("contain.text", aiSpendText.pageTitle);
    cy.get(aiSpendSelectors.navItem).click();

    cy.location("pathname").should("eq", `/${workspaceId}/settings/ai-credits-usage`);
    cy.contains("h1", aiSpendText.pageTitle).should("be.visible");
    cy.get(aiSpendSelectors.limitSwitch).should("have.attr", "aria-checked", "true");
  });

  it("should show the monthly and add-on pools and the footnote", () => {
    openAiCreditsUsage(adminEmail, workspaceId);

    cy.contains(aiSpendText.billingCycle).should("be.visible");
    cy.get(aiSpendSelectors.card(aiSpendText.monthlyCard))
      .should("contain.text", "7,325")
      .and("contain.text", "remaining of 10,000")
      .and("contain.text", "26% used");
    cy.get(aiSpendSelectors.card(aiSpendText.addonCard))
      .should("contain.text", "950")
      .and("contain.text", "remaining of 1,000")
      .and("contain.text", "5% used");
    cy.contains(aiSpendText.footnote).should("be.visible");
  });

  it("should show each builder against the equal share and the other spenders apart", () => {
    openAiCreditsUsage(adminEmail, workspaceId);

    cy.get(aiSpendSelectors.card(aiSpendText.defaultCard))
      .should("contain.text", "3,333")
      .and("contain.text", "333")
      .and("contain.text", `${aiSpendText.usersOnCustomLimit}0`);
    builderRow(priya.name).should("contain.text", "2,550 / 3,333").and("contain.text", "69%");
    builderRow(omar.name).should("contain.text", "0 / 3,333").and("contain.text", "0%");
    builderRow(viewer.name).should("contain.text", aiSpendText.notABuilder).and("contain.text", "40");
    builderRow(aiSpendText.unknownUser).should("contain.text", aiSpendText.unknownUserNote).and("contain.text", "15");
    builderRow(aiSpendText.unattributed)
      .should("contain.text", aiSpendText.unattributedNote)
      .and("contain.text", "20");
    cy.contains("Showing 3 of 3 builders").should("be.visible");
  });

  it("should search, filter and sort the builders", () => {
    openAiCreditsUsage(adminEmail, workspaceId);

    cy.get(aiSpendSelectors.searchInput).type("zzzz-no-such-builder");
    cy.contains(aiSpendText.searchNoMatch).should("be.visible");
    cy.clearAndType(aiSpendSelectors.searchInput, omar.name);
    cy.get(aiSpendSelectors.tableRows).should("have.length", 1).and("contain.text", omar.name);
    cy.get(aiSpendSelectors.searchInput).clear();

    cy.get(aiSpendSelectors.builderTypeButton).click();
    aiSpendText.filterOptions.forEach((option) => cy.contains(option).should("be.visible"));
    cy.get("body").type("{esc}");
    cy.get(aiSpendSelectors.sortButton).click();
    aiSpendText.sortOptions.forEach((option) => cy.contains(option).should("be.visible"));
  });

  it("should validate and save the default credits", () => {
    openAiCreditsUsage(adminEmail, workspaceId);
    cy.get(aiSpendSelectors.card(aiSpendText.defaultCard)).contains("button", aiSpendText.editLimits).click();

    dialog().should("contain.text", aiSpendText.editDefaultTitle);
    dialog().contains(aiSpendText.customValue).click();
    cy.clearAndType(aiSpendSelectors.dialogInput, "5000");
    dialog().should("contain.text", aiSpendText.overMax("3,333"));
    dialog().contains("button", aiSpendText.saveChanges).should("be.disabled");
    ["0", "1.5"].forEach((value) => {
      cy.clearAndType(aiSpendSelectors.dialogInput, value);
      dialog().should("contain.text", aiSpendText.wholeNumber);
    });
    cy.clearAndType(aiSpendSelectors.dialogInput, "2000");
    dialog().should("contain.text", "4,000 credits (40%) unallocated");
    dialog().contains("button", aiSpendText.saveChanges).should("be.enabled").click();

    cy.get(aiSpendSelectors.dialog).should("not.exist");
    cy.get(aiSpendSelectors.card(aiSpendText.defaultCard))
      .should("contain.text", "2,000")
      .and("contain.text", "40% unallocated");
    // The 50 add-on credits no longer fit under the lower monthly limit, so the overshoot shows on add-on.
    builderRow(priya.name)
      .should("contain.text", "2,000 / 2,000")
      .and("contain.text", "550 / 333")
      .and("contain.text", "109%");
  });

  it("should set a custom limit for one builder", () => {
    openAiCreditsUsage(adminEmail, workspaceId);
    cy.get(aiSpendSelectors.editBuilderLimit(priya.name)).click();

    dialog().should("contain.text", aiSpendText.editLimitTitle);
    dialog().contains(aiSpendText.customLimit).click();
    cy.clearAndType(aiSpendSelectors.dialogInput, "9999");
    dialog().should("contain.text", aiSpendText.overMax("6,000"));
    dialog().contains("button", aiSpendText.saveLimit).should("be.disabled");
    cy.clearAndType(aiSpendSelectors.dialogInput, "3000");
    dialog().contains("button", aiSpendText.saveLimit).should("be.enabled").click();

    cy.get(aiSpendSelectors.dialog).should("not.exist");
    builderRow(priya.name)
      .should("contain.text", aiSpendText.customLimitTag)
      .and("contain.text", "2,550 / 3,000");
    cy.get(aiSpendSelectors.card(aiSpendText.defaultCard))
      .should("contain.text", `${aiSpendText.usersOnCustomLimit}1`)
      .and("contain.text", "30% unallocated");
  });

  it("should turn per-builder limits off and back on keeping the saved limits", () => {
    openAiCreditsUsage(adminEmail, workspaceId);

    cy.get(aiSpendSelectors.limitSwitch).click().should("have.attr", "aria-checked", "false");
    cy.get(aiSpendSelectors.card(aiSpendText.defaultCard)).should("contain.text", aiSpendText.limitsOff);
    cy.contains("th", aiSpendText.percentOfPool).should("be.visible");
    builderRow(priya.name).should("contain.text", "2,500").and("contain.text", "50");

    cy.get(aiSpendSelectors.limitSwitch).click().should("have.attr", "aria-checked", "true");
    builderRow(priya.name)
      .should("contain.text", aiSpendText.customLimitTag)
      .and("contain.text", "2,550 / 3,000");
    cy.get(aiSpendSelectors.card(aiSpendText.defaultCard)).should("contain.text", "2,000");
  });

  it("should ask for confirmation before turning limits on while builders are over their limit", () => {
    // Over both pools: 2,000 monthly + 333 add-on is the most Omar may use.
    seedWallet({ extraSpent: { [omar.userId]: 2500 } });
    openAiCreditsUsage(adminEmail, workspaceId);

    cy.get(aiSpendSelectors.limitSwitch).click().should("have.attr", "aria-checked", "false");
    cy.get(aiSpendSelectors.limitSwitch).click();
    cy.get(aiSpendSelectors.confirmDialog)
      .should("contain.text", aiSpendText.turnOnTitle)
      .and("contain.text", aiSpendText.turnOnWarning);

    cy.get(aiSpendSelectors.confirmDialog).contains("button", aiSpendText.cancel).click();
    cy.get(aiSpendSelectors.confirmDialog).should("not.exist");
    cy.get(aiSpendSelectors.limitSwitch).should("have.attr", "aria-checked", "false");

    cy.get(aiSpendSelectors.limitSwitch).click();
    cy.get(aiSpendSelectors.confirmDialog).contains("button", aiSpendText.turnOnLimits).click();
    cy.get(aiSpendSelectors.confirmDialog).should("not.exist");
    cy.get(aiSpendSelectors.limitSwitch).should("have.attr", "aria-checked", "true");
  });

  it("should filter the builders that have a custom limit", () => {
    openAiCreditsUsage(adminEmail, workspaceId);

    cy.get(aiSpendSelectors.builderTypeButton).click();
    cy.contains('[role="menuitem"], [role="option"], [role="menuitemradio"]', aiSpendText.filterOptions[2]).click();
    cy.get(aiSpendSelectors.tableRows).should("have.length", 1).and("contain.text", priya.name);
    cy.contains(aiSpendText.customFilterSummary).should("be.visible");
  });

  it("should reset a builder to the default limit", () => {
    openAiCreditsUsage(adminEmail, workspaceId);
    cy.get(aiSpendSelectors.editBuilderLimit(priya.name)).click();

    dialog().contains("button", aiSpendText.resetToDefault).click();
    dialog().contains("button", aiSpendText.saveLimit).should("be.enabled").click();

    cy.get(aiSpendSelectors.dialog).should("not.exist");
    builderRow(priya.name).should("not.contain.text", aiSpendText.customLimitTag).and("contain.text", "/ 2,000");
    cy.get(aiSpendSelectors.card(aiSpendText.defaultCard)).should(
      "contain.text",
      `${aiSpendText.usersOnCustomLimit}0`
    );
  });

  it("should flag the monthly pool as nearing its limit and then at its limit", () => {
    seedWallet({ pool: { monthly: 3000, addon: 1000 } });
    openAiCreditsUsage(adminEmail, workspaceId);
    cy.get(aiSpendSelectors.card(aiSpendText.monthlyCard))
      .should("contain.text", aiSpendText.nearingLimit)
      .and("contain.text", "89% used");

    seedWallet({ pool: { monthly: 2675, addon: 1000 } });
    openAiCreditsUsage(adminEmail, workspaceId);
    cy.get(aiSpendSelectors.card(aiSpendText.monthlyCard))
      .should("contain.text", aiSpendText.atLimit)
      .and("contain.text", "100% used");
  });
});
