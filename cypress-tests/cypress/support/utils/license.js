import { commonSelectors } from "Selectors/common";
import { commonEeSelectors } from "Selectors/platform/eeCommon";
import { importSelectors } from "Selectors/platform/exportImport";
import { licenseSelectors } from "Selectors/platform/license";
import { fillUserInviteForm } from "Support/utils/manageUsers";
import { createAndUpdateConstant } from "Support/utils/workspaceConstants";
import { licenseText } from "Texts/platform/license";
import { cloudLicenseSelectors } from "Selectors/platform/cloudLicense";
import { cloudLicenseText } from "Texts/platform/cloudLicense";

/**
 * @tjType   licenseExpiryDate.get
 * @tjBlock  licensing
 * @tjUsage  getLicenseExpiryDate()
 */
export const getLicenseExpiryDate = () => {
  return cy
    .request("GET", `${Cypress.env("server_host")}/api/license/access`)
    .then((response) => {
      expect(response.status).to.eq(200);

      const expiryISO = response.body.licenseStatus?.expiryDate;
      expect(expiryISO, "expiryDate should exist").to.be.a("string");

      const expiryDate = new Date(expiryISO);
      const formattedDate = expiryDate.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });

      return `Valid till ${formattedDate} (UTC)`;
    });
};

/**
 * @tjType   tabs.switch
 * @tjBlock  licensing
 * @tjUsage  switchTabs(licenseText.accessTabTitle)
 */
export const switchTabs = (tabTitle) => {
  cy.get(licenseSelectors.listOfItems(tabTitle)).scrollIntoView().should("be.visible").click();
  cy.get(licenseSelectors.tabTitle(tabTitle)).should("have.text", tabTitle);
};

/**
 * @tjType   licenseTab.verify
 * @tjBlock  licensing
 * @tjUsage  verifyLicenseTab()
 */
export const verifyLicenseTab = () => {
  cy.get(licenseSelectors.label(licenseText.licenseKeyTab.licenseLabel)).should(
    "be.visible"
  );
  cy.get(licenseSelectors.licenseTextArea).should(
    "have.attr",
    "placeholder",
    licenseText.licenseKeyTab.enterLicenseKeyPlaceholder
  );
};

const parseLimitValue = (value) => {
  if (!value) return "N/A";
  if (value.includes("/")) return Number(value.split("/")[0].trim());
  if (/unlimited/i.test(value)) return "Unlimited";
  const num = Number(value.trim());
  return isNaN(num) ? value.trim() : num;
};

/**
 * @tjType   subTabsAndStoreCurrentLimits.verify
 * @tjBlock  licensing
 * @tjUsage  verifySubTabsAndStoreCurrentLimits(licenseText.limitsTab[`${subTab}SubTab`], licenseText[`${subTab}SubTab`])
 */
export const verifySubTabsAndStoreCurrentLimits = (
  subTabName,
  subTabDataObj,
  outputFile = "currentLimits.json"
) => {
  const subTabData = Object.values(subTabDataObj);
  const currentLimits = {};

  cy.get(licenseSelectors.subTab(subTabName))
    .verifyVisibleElement("have.text", subTabName)
    .click();

  cy.wrap(subTabData)
    .each((label) => {
      const displayLabel = label.replace(/^Number of\s+/i, "");

      cy.get(
        licenseSelectors.numberOfTextLabel(displayLabel)
      ).verifyVisibleElement("have.text", label);

      cy.get("body").then(($body) => {
        if ($body.find(licenseSelectors.inputField(displayLabel)).length > 0) {
          cy.get(licenseSelectors.inputField(displayLabel))
            .invoke("val")
            .then((val) => {
              currentLimits[displayLabel] = parseLimitValue(val);
            });
        } else {
          cy.get(licenseSelectors.numberOfTextLabel(displayLabel))
            .invoke("text")
            .then((text) => {
              currentLimits[displayLabel] = parseLimitValue(text);
            });
        }
      });
    })
    .then(() => {
      cy.readFile(`cypress/fixtures/license/${outputFile}`, {
        log: false,
        failOnNonExisting: false,
      }).then((existingData = {}) => {
        const updatedData = { ...existingData, ...currentLimits };
        cy.writeFile(`cypress/fixtures/license/${outputFile}`, updatedData);
        cy.log(`Current limits merged into ${outputFile}`);
      });
    });
};

/**
 * @tjType   accessTab.verify
 * @tjBlock  licensing
 * @tjUsage  verifyAccessTab(true)
 */
export const verifyAccessTab = (isPlanEnabled = false) => {
  const accessTabLabels = Object.values(licenseText.accessTab);

  accessTabLabels.forEach((label) => {
    cy.get(licenseSelectors.label(label)).verifyVisibleElement(
      "have.text",
      label
    );

    const toggleIcon =
      label === "Workflows" || label === "Google SSO" || label === "GitHub SSO"
        ? licenseSelectors.circularToggleEnabledIcon
        : isPlanEnabled
          ? licenseSelectors.circularToggleEnabledIcon
          : licenseSelectors.circularToggleDisabledIcon;

    cy.get(licenseSelectors.label(label), { timeout: 10000 })
      .next(toggleIcon, { timeout: 10000 })
      .should("be.visible", { timeout: 10000 });
  });
};

/**
 * @tjType   domainTab.verify
 * @tjBlock  licensing
 * @tjUsage  verifyDomainTab()
 */
export const verifyDomainTab = () => {
  cy.get(licenseSelectors.warningIcon).should("be.visible");
  cy.get(licenseSelectors.noDomainLinkedLabel).verifyVisibleElement(
    "have.text",
    licenseText.domainTab.noDomainLinkedLabel
  );
  cy.get(licenseSelectors.noDomainInfoText).verifyVisibleElement(
    "have.text",
    licenseText.domainTab.noDomainInfoText
  );
};

/**
 * @tjType   tooltip.verify
 * @tjBlock  licensing
 * @tjUsage  verifyTooltip(commonEeSelectors.auditLogIcon, "Audit logs are available only in paid plans", true)
 */
export const verifyTooltip = (
  selector,
  expectedTooltip,
  isDisabled = false
) => {
  const hoverTarget = isDisabled
    ? cy.get(selector).parent().trigger("mouseover", { force: true })
    : cy.get(selector).trigger("mouseover", { force: true });

  cy.get(".tooltip", { timeout: 3000 })
    .should("be.visible")
    .and("contain.text", expectedTooltip);

  hoverTarget.trigger("mouseout", { force: true });
};

const normalizeText = (text) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[\u00A0\s]+/g, " ");

export const verifyFeatureBanner = (cyPrefix, expectedHeading = null) => {
  const headingSelector = licenseSelectors.limitHeading(cyPrefix);

  cy.get("body").then(($body) => {
    if ($body.find(headingSelector).length > 0) {
      cy.get(headingSelector, { timeout: 10000 })
        .should("be.visible")
        .invoke("text")
        .then((headingText) => {
          const actual = normalizeText(headingText);
          if (expectedHeading) {
            const expected = normalizeText(expectedHeading);
            expect(actual).to.include(expected);
          }
        });
    }
  });
};

export const isBannerType = (type) =>
  [
    "edit-user",
    "custom-groups",
    "invite-user",
    "add-domain",
    "audit-logs",
  ].includes(type);

export const handleFeatureBanner = (type, expectedHeading) => {
  const licenseHeadingSelector = licenseSelectors.licenseBannerHeading;

  cy.get("body").then(($body) => {
    if ($body.find(licenseHeadingSelector).length > 0) {
      cy.get(licenseHeadingSelector)
        .should("be.visible")
        .invoke("text")
        .then((text) => {
          if (expectedHeading) expect(text.trim()).to.eq(expectedHeading);
        });
    }
  });
};

export const getResourceKey = (type) => {
  const map = {
    builders: "Builders",
    "end-users": "End Users",
    users: "Total Users",
    workspaces: "Workspaces",
    apps: "Apps",
    workflows: "Workflows",
    tables: "Tables",
    superadmins: "Super Admins",
  };

  const singularToPlural = {
    app: "apps",
    workflow: "workflows",
    user: "users",
  };

  const key = singularToPlural[type.toLowerCase()] || type.toLowerCase();
  return map[key];
};

export const assertLimitState = (
  resourceKey,
  baseLabel,
  headingSelector,
  infoSelector,
  currentValue,
  planLimit
) => {
  const current = Number(currentValue);
  const limit = planLimit === "Unlimited" ? Infinity : Number(planLimit);

  if (isNaN(current)) {
    cy.log(`⚠️ Invalid current value for ${baseLabel}: ${currentValue}`);
    return;
  }

  cy.get("body").then(($body) => {
    const bannerExists = $body.find(headingSelector).length > 0;

    if (!bannerExists && current < limit - 1) {
      cy.log(
        `No banner expected for ${baseLabel}, current=${current}, limit=${planLimit}`
      );
      return;
    }

    cy.get(headingSelector, { timeout: 10000 })
      .should("be.visible")
      .invoke("text")
      .then((headingText) => {
        const normalizedHeading = normalizeText(headingText);

        if (current >= limit) {
          cy.log(
            `${baseLabel} limit reached: current=${current}, limit=${planLimit}`
          );
          expect(normalizedHeading).to.include(
            `${baseLabel.toLowerCase()} limit reached`
          );
          cy.get(infoSelector)
            .invoke("text")
            .should("match", /reached/i);
        } else if (current === limit - 1) {
          cy.log(
            `${baseLabel} nearing limit: current=${current}, limit=${planLimit}`
          );
          expect(normalizedHeading).to.include(
            `${baseLabel.toLowerCase()} limit nearing`
          );
          cy.get(infoSelector)
            .invoke("text")
            .should("match", /nearing/i);
        } else {
          cy.log(
            `${baseLabel} under limit: current=${current}, limit=${planLimit}`
          );
          cy.get(headingSelector).should("not.exist");
        }
      });
  });
};

/**
 * @tjType   resourceLimit.verify
 * @tjBlock  licensing
 * @tjUsage  verifyResourceLimit("app", planName)
 */
export const verifyResourceLimit = (
  resourceType,
  planName,
  dataCyPrefix = null,
  expectedHeading = null,
  outputFile = "currentLimits.json"
) => {
  const type = resourceType.toLowerCase().trim();
  const cyPrefix = dataCyPrefix || type;
  const baseLabel =
    type.charAt(0).toUpperCase() + type.slice(1).replace(/s$/i, "");

  const headingSelector = licenseSelectors.limitHeading(cyPrefix);
  const infoSelector = licenseSelectors.limitInfo(cyPrefix);
  const resourceKey = getResourceKey(type);

  if (!resourceKey) {
    cy.log(
      `No resource key mapped for ${type}. Checking for feature banner instead.`
    );
    return verifyFeatureBanner(cyPrefix, expectedHeading);
  }

  cy.fixture(`license/${outputFile}`).then((currentLimits) => {
    const currentValue = currentLimits[resourceKey];
    cy.fixture("license/license.json").then((licenseData) => {
      const plan = licenseData[planName.toLowerCase()];
      const planLimit = plan?.[resourceKey];

      if (planLimit === undefined) {
        cy.log(`Plan limit not defined for ${resourceKey}.`);
        return verifyFeatureBanner(cyPrefix, expectedHeading);
      }

      assertLimitState(
        resourceKey,
        baseLabel,
        headingSelector,
        infoSelector,
        currentValue,
        planLimit
      );
    });
  });
  // cy.get(commonSelectors.cancelButton).click();
};

/**
 * @tjType   totalLimitsWithPlan.verify
 * @tjBlock  licensing
 * @tjUsage  verifyTotalLimitsWithPlan(["builders", "end-users", "user"], planName)
 */
export const verifyTotalLimitsWithPlan = (
  resources,
  planName,
  outputFile = "currentLimits.json"
) => {
  cy.intercept("GET", "/api/users/*").as("getUserLimits");

  cy.fixture(`license/${outputFile}`).then((currentLimits) => {
    cy.fixture("license/license.json").then((licenseData) => {
      const plan = licenseData[planName.toLowerCase()];
      expect(plan, `Plan "${planName}" should exist`).to.not.be.undefined;

      const keyMap = {
        builders: "Builders",
        "end-users": "End Users",
        user: "Total Users",
      };
      const labelMap = {
        builders: "BUILDERS",
        "end-users": "END-USERS",
        user: "TOTAL",
      };

      const normalizeLabel = (text) =>
        text
          .replace(/[-\s]+/g, "")
          .trim()
          .toUpperCase();

      resources.forEach((resource) => {
        const lowerRes = resource.toLowerCase();
        const key = keyMap[lowerRes] || resource;
        const current = currentLimits[key] ?? currentLimits[key.toLowerCase()];
        const limit = plan[key];
        const expectedLabel = labelMap[lowerRes] || resource.toUpperCase();

        cy.wait(500);
        cy.get(licenseSelectors.totalLimitLabel(resource))
          .should("be.visible")
          .invoke("text")
          .then((actualText) => {
            const normalizedActual = normalizeLabel(actualText);
            const normalizedExpected = normalizeLabel(expectedLabel);
            expect(normalizedActual).to.eq(normalizedExpected);
          });

        cy.get(licenseSelectors.totalLimitCount(resource))
          .should("be.visible")
          .invoke("text")
          .then((text) => expect(text.trim()).to.eq(`${current}/${limit}`));
      });
    });
  });
};

export const applyLicense = (licenseKey) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy.request({
      method: "POST",
      url: `${Cypress.env("server_host")}/api/license`,
      headers: headers,
      body: { license: licenseKey },
      failOnStatusCode: false,
    });
  });
};

export const getLicenseLimits = () => {
  return cy.request({
    method: "GET",
    url: `${Cypress.env("server_host")}/api/license/limits`,
    headers: {
      "tj-workspace-id": Cypress.env("workspaceId"),
    },
  });
};

/**
 * @tjType   user.create
 * @tjBlock  licensing
 * @tjUsage  createUserViaAPI(endUserEmail, "end-user")
 */
export const createUserViaAPI = (
  email,
  role = "end-user",
  firstName = "Test",
  lastName = "User"
) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy.request({
      method: "POST",
      url: `${Cypress.env("server_host")}/api/organization-users`,
      headers: headers,
      body: {
        email,
        firstName,
        lastName,
        role,
        groups: [],
        userMetadata: {},
      },
      failOnStatusCode: false,
    });
  });
};

export const archiveUser = (email) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy.getUserIdByEmail(email).then((userId) => {
      return cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/organization-users/${userId}/archive`,
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: {},
          failOnStatusCode: false,
        })
        .then((response) => {
          return response;
        });
    });
  });
};

export const unarchiveUser = (email) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy.getUserIdByEmail(email).then((userId) => {
      return cy
        .request({
          method: "POST",
          url: `${Cypress.env("server_host")}/api/organization-users/${userId}/unarchive`,
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: {},
          failOnStatusCode: false,
        })
        .then((response) => {
          return response;
        });
    });
  });
};

/**
 * @tjBlock  licensing
 * @tjUsage  changeUserRole(builderEmail, "end-user")
 */
export const changeUserRole = (email, role) => {
  return cy.getAuthHeaders().then((headers) => {
    return cy.getUserIdByEmail(email, "user").then((userId) => {
      return cy
        .request({
          method: "PUT",
          url: `${Cypress.env("server_host")}/api/v2/group-permissions/role/user`,
          headers: headers,
          body: {
            newRole: role,
            userId: userId,
          },
          failOnStatusCode: false,
        })
        .then((response) => {
          return response;
        });
    });
  });
};

export const verifyLimitPayload = (limitData, resourceType) => {
  cy.wrap(limitData).should((data) => {
    if (data.canAddUnlimited) {
      expect(data).to.have.property("canAddUnlimited", true);
      expect(data).to.have.property("licenseStatus");
    } else {
      expect(data).to.have.property("percentage");
      expect(data).to.have.property("total");
      expect(data).to.have.property("current");
      expect(data).to.have.property("canAddUnlimited", false);
      expect(data).to.have.property("licenseStatus");
      expect(data.licenseStatus).to.have.property("isLicenseValid");
      expect(data.licenseStatus).to.have.property("licenseType");
    }
  });
};

export const verifyButtonDisabledWithTooltip = (
  buttonSelector,
  tooltipText
) => {
  cy.get(buttonSelector).should("be.disabled");
  verifyTooltip(buttonSelector, tooltipText, true);
};

/**
 * @tjType   currentCount.get
 * @tjBlock  licensing
 * @tjUsage  getCurrentCountFromBanner("apps")
 */
export const getCurrentCountFromBanner = (resourceType) => {
  const cyPrefix = resourceType.toLowerCase().trim();
  const headingSelector = licenseSelectors.limitHeading(cyPrefix);

  return cy
    .get(headingSelector)
    .invoke("text")
    .then((headingText) => {
      const ratioMatch = headingText.match(/(\d+)\/(\d+)/);
      if (ratioMatch) {
        return {
          current: parseInt(ratioMatch[1]),
          total: parseInt(ratioMatch[2]),
        };
      }
      cy.log(`Warning: No ratio found in banner text: "${headingText}"`);
      return null;
    });
};

export const waitForLicenseUpdate = (timeout = 2000) => {
  cy.wait(timeout);
};

/**
 * @tjBlock  cloud
 * @tjUsage  generateBulkUsersCSV(50, "end-user", "cloudeu")
 */
export const generateBulkUsersCSV = (
  count,
  role = "end-user",
  prefix = "bulkuser",
  timestamp = Date.now()
) => {
  let csv = "First Name,Last Name,Email,User Role,Group,Metadata\n";

  // Map role to proper display name
  const roleMap = {
    "end-user": "End User",
    builder: "Builder",
    admin: "Admin",
  };
  const userRole = roleMap[role] || "End User";

  for (let i = 1; i <= count; i++) {
    const firstName = `${prefix}${i}`;
    const lastName = "User";
    const email = `${prefix}-${timestamp}-${i}@test.com`;
    csv += `${firstName},${lastName},${email},${userRole},,\n`;
  }

  return csv;
};

/**
 * @tjBlock  licensing
 * @tjUsage  bulkUploadUsersViaCSV(49, "end-user", "viewer")
 */
export const bulkUploadUsersViaCSV = (
  count,
  role = "end-user",
  prefix = "bulkuser"
) => {
  const timestamp = Date.now();
  const csvContent = generateBulkUsersCSV(count, role, prefix, timestamp);

  const emails = [];
  for (let i = 1; i <= count; i++) {
    emails.push(`${prefix}-${timestamp}-${i}@example.com`);
  }

  return cy.apiBulkUploadUsers(csvContent).then((response) => {
    return { response, emails };
  });
};

/**
 * @tjType   limitBanner.verify
 * @tjBlock  shared
 * @tjUsage  verifyLimitBanner(expectedHeading, expectedInfoText)
 */
export const verifyLimitBanner = (heading, infoText, type = "usage") => {
  cy.verifyElement(licenseSelectors.limitHeading(type), heading);
  cy.verifyElement(licenseSelectors.limitInfo(type), infoText);
};

/**
 * @tjType   upgradeModal.verify
 * @tjBlock  licensing
 * @tjUsage  verifyUpgradeModal("You have reached your limit for number of users.")
 */
export const verifyUpgradeModal = (messageText, hasAdditionalInfo = false) => {
  cy.get('[data-cy="modal-header"] .modal-title').should(
    "have.text",
    "Upgrade Your Plan"
  );
  cy.get('[data-cy="modal-close"]').should("be.visible");

  const messageAssertion = cy
    .get('[data-cy="modal-message"]')
    .should("be.visible")
    .and("contain.text", messageText);

  if (hasAdditionalInfo) {
    messageAssertion.and(
      "contain.text",
      "To add more users, please disable the personal workspace in instance settings and retry."
    );
  }

  cy.get(".modal-footer").within(() => {
    cy.get(commonEeSelectors.cancelButton).eq(0).should("be.visible");
    cy.get(commonEeSelectors.upgradeButton).should("be.visible");
    cy.get(commonEeSelectors.cancelButton).eq(0).click();
  });
};

/**
 * @tjType   userAndExpectStatus.create
 * @tjBlock  shared
 * @tjUsage  createUserAndExpectStatus(builderEmail, "builder", 201)
 */
export const createUserAndExpectStatus = (email, role, expectedStatus) => {
  return createUserViaAPI(email, role).then((response) => {
    expect(response.status).to.equal(expectedStatus);
    if (expectedStatus === 451) {
      expect(response.body.message).to.contain("limit");
    }
    return response;
  });
};

/**
 * @tjType   userAndVerify.archive
 * @tjBlock  licensing
 * @tjUsage  archiveUserAndVerify(builderEmail)
 */
export const archiveUserAndVerify = (email) => {
  return archiveUser(email).then((response) => {
    expect(response.status).to.be.oneOf([200, 201]);
    return response;
  });
};

/**
 * @tjBlock  licensing
 * @tjUsage  changeRoleAndExpectLimit(endUserEmail, "builder")
 */
export const changeRoleAndExpectLimit = (
  email,
  newRole,
  expectedStatus = 451
) => {
  return changeUserRole(email, newRole).then((roleChangeResponse) => {
    expect(roleChangeResponse.status).to.equal(expectedStatus);
    expect(roleChangeResponse.body.message).to.contain("limit");
    return roleChangeResponse;
  });
};

/**
 * @tjType   inviteUserModal.open
 * @tjBlock  licensing
 * @tjUsage  openInviteUserModal(name, email, role)
 */
export const openInviteUserModal = (name, email, role) => {
  cy.get(commonSelectors.cancelButton).click();
  cy.get(commonSelectors.manageGroupsOption).click();
  cy.get(commonSelectors.manageUsersOption).click({ force: true });
  fillUserInviteForm(name, email);
  cy.get(".css-1mlj61j").type(`${role}{enter}`);
};

/**
 * @tjBlock  licensing
 * @tjUsage  multiEnvAppSetup(appName)
 */
export const multiEnvAppSetup = (appName) => {
  cy.get(importSelectors.dropDownMenu).should("be.visible").click();
  cy.get(importSelectors.importOptionInput)
    .eq(0)
    .selectFile(
      "cypress/fixtures/templates/multi_env_licesning_test_app.json",
      { force: true }
    );
  cy.wait(2000);

  cy.clearAndType(commonSelectors.appNameInput, appName);
  cy.get(importSelectors.importAppButton).click();
  cy.wait(3000);
  cy.wait("@getAppData").then((interception) => {
    const responseData = interception.response.body;
    Cypress.env("appId", responseData.id);
    Cypress.env("editingVersionId", responseData.editing_version.id);
    Cypress.env("environmentId", responseData.editorEnvironment.id);
  });

  createAndUpdateConstant(
    "rest_api_url",
    "http://130.131.160.149:4000/development",
    ["Secret"],
    ["development", "staging", "production"],
    {
      staging: "http://130.131.160.149:4000/staging",
      production: "http://130.131.160.149:4000/production",
    }
  );

  cy.apiCreateWorkspaceConstant(
    "restapiHeaderKey",
    "customHeader",
    ["Global"],
    ["development", "staging", "production"]
  );
  cy.apiCreateWorkspaceConstant(
    "restapiHeaderValue",
    "key=value",
    ["Global"],
    ["development", "staging", "production"]
  );
};

/**
 * @tjType   upgradePlanModal.verify
 * @tjBlock  cloud
 * @tjUsage  verifyUpgradePlanModal({ currentPlan: null })
 */
export const verifyUpgradePlanModal = ({ currentPlan = null } = {}) => {
  const { plans, planNames, currentPlan: currentText } = cloudLicenseText.upgradeModal;

  cy.get(cloudLicenseSelectors.upgradePlanModal)
    .should("be.visible")
    .and("contain.text", cloudLicenseText.upgradeModal.title);
  cy.get(cloudLicenseSelectors.planColumns).should("have.length", plans.length);
  plans.forEach((plan) => {
    cy.get(cloudLicenseSelectors.planColumn(plan))
      .find("h3")
      .should("have.text", planNames[plan]);
  });

  cy.get(cloudLicenseSelectors.billingToggle("yearly"))
    .should("have.attr", "aria-checked", "true")
    .and("contain.text", cloudLicenseText.upgradeModal.yearly);
  cy.get(cloudLicenseSelectors.billingToggle("monthly"))
    .should("have.attr", "aria-checked", "false")
    .and("contain.text", cloudLicenseText.upgradeModal.monthly)
    .click()
    .should("have.attr", "aria-checked", "true");
  cy.get(cloudLicenseSelectors.billingToggle("yearly")).should("have.attr", "aria-checked", "false");

  if (currentPlan) {
    cy.get(cloudLicenseSelectors.planActionButton(currentPlan)).should("have.text", currentText);
    cy.get(cloudLicenseSelectors.upgradePlanTable)
      .find(`button:contains("${currentText}")`)
      .should("have.length", 1);
  } else {
    cy.get(cloudLicenseSelectors.upgradePlanTable).should("not.contain.text", currentText);
  }
};

/**
 * @tjType   upgradePlanModal.close
 * @tjBlock  cloud
 * @tjUsage  closeUpgradePlanModal()
 */
export const closeUpgradePlanModal = () => {
  cy.get(cloudLicenseSelectors.upgradePlanModalClose).click();
  cy.get(cloudLicenseSelectors.upgradePlanModal).should("not.exist");
};

/**
 * @tjBlock  cloud
 * @tjUsage  navBarLicenseButton(cloudLicenseText.navBar.upgrade)
 */
export const navBarLicenseButton = (text) =>
  cy.get(cloudLicenseSelectors.navBarActions).contains("button", text);
