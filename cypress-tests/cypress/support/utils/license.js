// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// license.js
//   getLicenseExpiryDate             license.getExpiry    → licensing
//   switchTabs                       license.switchTab    → licensing
//   verifyLicenseTab                 license.verifyTab    → licensing
//   verifySubTabsAndStoreCurrentLimits license.verifyLimitsTab → licensing
//   verifyAccessTab                  license.verifyAccessTab → licensing
//   verifyDomainTab                  license.verifyDomainTab → licensing
//   verifyTooltip                    -                    → licensing
//   verifyFeatureBanner              license.verifyFeatureBanner → licensing
//   isBannerType                     -                    → licensing
//   handleFeatureBanner              license.handleBanner → licensing
//   getResourceKey                   -                    → licensing
//   assertLimitState                 license.assertLimitState → licensing
//   verifyResourceLimit              license.verifyResourceLimit → licensing
//   verifyTotalLimitsWithPlan        license.verifyTotalLimits → licensing
//   applyLicense                     license.apply        → licensing
//   getLicenseLimits                 license.getLimits    → licensing
//   createUserViaAPI                 user.createApi       → licensing
//   archiveUser                      user.archive         → licensing
//   unarchiveUser                    user.unarchive       → licensing
//   changeUserRole                   user.changeRole      → licensing
//   verifyLimitPayload               license.verifyLimitPayload → licensing
//   verifyButtonDisabledWithTooltip  -                    → licensing
//   getCurrentCountFromBanner        license.readBannerCount → licensing
//   waitForLicenseUpdate             -                    → licensing
//   generateBulkUsersCSV             user.generateBulkCsv → licensing
//   bulkUploadUsersViaCSV            user.bulkUpload      → licensing
//   verifyLimitBanner                license.verifyLimitBanner → licensing
//   verifyUpgradeModal               license.verifyUpgradeModal → licensing
//   createUserAndExpectStatus        user.createExpectStatus → licensing
//   archiveUserAndVerify             user.archiveAndVerify → licensing
//   changeRoleAndExpectLimit         user.changeRoleExpectLimit → licensing
//   openInviteUserModal              user.openInviteModal → licensing
//   multiEnvAppSetup                 app.multiEnvSetup    → licensing
// └──────────────────────────────────────────────────────────────────┘
import { commonSelectors } from "Selectors/common";
import { commonEeSelectors } from "Selectors/platform/eeCommon";
import { importSelectors } from "Selectors/platform/exportImport";
import { licenseSelectors } from "Selectors/platform/license";
import { fillUserInviteForm } from "Support/utils/manageUsers";
import { createAndUpdateConstant } from "Support/utils/workspaceConstants";
import { licenseText } from "Texts/platform/license";

/**
* @tjType   license.getExpiry
* @tjBlock  licensing
* @tjUsage  getLicenseExpiryDate()
* @tjDom    none - reads the licence expiry
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
* @tjType   license.switchTab
* @tjBlock  licensing
* @tjUsage  switchTabs('Access')
* @tjDom    licence page tab strip
*/
export const switchTabs = (tabTitle) => {
  cy.get(licenseSelectors.listOfItems(tabTitle)).scrollIntoView().should("be.visible").click();
  cy.get(licenseSelectors.tabTitle(tabTitle)).should("have.text", tabTitle);
};

/**
* @tjType   license.verifyTab
* @tjBlock  licensing
* @tjUsage  verifyLicenseTab()
* @tjDom    licence tab contents
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
* @tjType   license.verifyLimitsTab
* @tjBlock  licensing
* @tjUsage  verifySubTabsAndStoreCurrentLimits(...)
* @tjDom    limits sub-tabs; caches current counts
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
* @tjType   license.verifyAccessTab
* @tjBlock  licensing
* @tjUsage  verifyAccessTab(false)
* @tjDom    access tab, plan-enabled or not
*/
export const verifyAccessTab = (isPlanEnabled = false) => {
  const accessTabLabels = Object.values(licenseText.accessTab);

  accessTabLabels.forEach((label) => {
    cy.get(licenseSelectors.label(label)).verifyVisibleElement(
      "have.text",
      label
    );

    const toggleIcon =
      label === "Workflows" || label === "Google" || label === "GitHub"
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
* @tjType   license.verifyDomainTab
* @tjBlock  licensing
* @tjUsage  verifyDomainTab()
* @tjDom    allowed-domain tab
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
* @tjType   -
* @tjBlock  licensing
* @tjUsage  verifyTooltip(selector, message)
* @tjDom    hovers a licence control and asserts its tooltip
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

/**
* @tjType   license.verifyFeatureBanner
* @tjBlock  licensing
* @tjUsage  verifyFeatureBanner('apps', 'Upgrade')
* @tjDom    feature-gate banner
*/
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

/**
* @tjType   -
* @tjBlock  licensing
* @tjUsage  isBannerType('limit')
* @tjDom    none - predicate. [UNREFERENCED 2026-09-06]
*/
export const isBannerType = (type) =>
  [
    "edit-user",
    "custom-groups",
    "invite-user",
    "add-domain",
    "audit-logs",
  ].includes(type);

/**
* @tjType   license.handleBanner
* @tjBlock  licensing
* @tjUsage  handleFeatureBanner('limit', 'Upgrade')
* @tjDom    dismisses or asserts a banner. [UNREFERENCED 2026-09-06]
*/
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

/**
* @tjType   -
* @tjBlock  licensing
* @tjUsage  getResourceKey('apps')
* @tjDom    none - maps a resource to its payload key
*/
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

/**
* @tjType   license.assertLimitState
* @tjBlock  licensing
* @tjUsage  assertLimitState(...)
* @tjDom    asserts a resource is at/under its limit
*/
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
* @tjType   license.verifyResourceLimit
* @tjBlock  licensing
* @tjUsage  verifyResourceLimit(...)
* @tjDom    limit banner + disabled controls for a resource
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
* @tjType   license.verifyTotalLimits
* @tjBlock  licensing
* @tjUsage  verifyTotalLimitsWithPlan(...)
* @tjDom    total limits against the active plan
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
        const current = currentLimits[key];
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

/**
* @tjType   license.apply
* @tjBlock  licensing
* @tjUsage  applyLicense(licenseKey)
* @tjDom    licence page -> paste key -> save. [UNREFERENCED 2026-09-06]
*/
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

/**
* @tjType   license.getLimits
* @tjBlock  licensing
* @tjUsage  getLicenseLimits()
* @tjDom    none - GET current limits. [UNREFERENCED 2026-09-06]
*/
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
* @tjType   user.createApi
* @tjBlock  licensing
* @tjUsage  createUserViaAPI(...)
* @tjDom    none - POST user, used to approach a limit
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

/**
* @tjType   user.archive
* @tjBlock  licensing
* @tjUsage  archiveUser(userEmail)
* @tjDom    manage users -> archive
*/
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

/**
* @tjType   user.unarchive
* @tjBlock  licensing
* @tjUsage  unarchiveUser(userEmail)
* @tjDom    manage users -> unarchive. [UNREFERENCED 2026-09-06]
*/
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
* @tjType   user.changeRole
* @tjBlock  licensing
* @tjUsage  changeUserRole(userEmail, 'builder')
* @tjDom    manage users -> change role
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

/**
* @tjType   license.verifyLimitPayload
* @tjBlock  licensing
* @tjUsage  verifyLimitPayload(limitData, 'apps')
* @tjDom    none - asserts the limits API payload. [UNREFERENCED 2026-09-06]
*/
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

/**
* @tjType   -
* @tjBlock  licensing
* @tjUsage  verifyButtonDisabledWithTooltip(...)
* @tjDom    disabled button + its tooltip. [UNREFERENCED 2026-09-06]
*/
export const verifyButtonDisabledWithTooltip = (
  buttonSelector,
  tooltipText
) => {
  cy.get(buttonSelector).should("be.disabled");
  verifyTooltip(buttonSelector, tooltipText, true);
};

/**
* @tjType   license.readBannerCount
* @tjBlock  licensing
* @tjUsage  getCurrentCountFromBanner('apps')
* @tjDom    reads the current count out of the banner
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

/**
* @tjType   -
* @tjBlock  licensing
* @tjUsage  waitForLicenseUpdate(2000)
* @tjDom    none - settle wait after a licence change. [UNREFERENCED 2026-09-06]
*/
export const waitForLicenseUpdate = (timeout = 2000) => {
  cy.wait(timeout);
};

/**
* @tjType   user.generateBulkCsv
* @tjBlock  licensing
* @tjUsage  generateBulkUsersCSV(...)
* @tjDom    none - builds a CSV fixture
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
* @tjType   user.bulkUpload
* @tjBlock  licensing
* @tjUsage  bulkUploadUsersViaCSV(...)
* @tjDom    manage users -> bulk upload
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
* @tjType   license.verifyLimitBanner
* @tjBlock  licensing
* @tjUsage  verifyLimitBanner('Limit reached', 'Upgrade your plan')
* @tjDom    limit banner heading + info text
*/
export const verifyLimitBanner = (heading, infoText) => {
  cy.verifyElement(licenseSelectors.limitHeading("usage"), heading);
  cy.verifyElement(licenseSelectors.limitInfo("usage"), infoText);
};

/**
* @tjType   license.verifyUpgradeModal
* @tjBlock  licensing
* @tjUsage  verifyUpgradeModal('Upgrade to add more', false)
* @tjDom    upgrade modal copy
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
* @tjType   user.createExpectStatus
* @tjBlock  licensing
* @tjUsage  createUserAndExpectStatus(userEmail, 'builder', 201)
* @tjDom    none - POST user asserting a status code
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
* @tjType   user.archiveAndVerify
* @tjBlock  licensing
* @tjUsage  archiveUserAndVerify(userEmail)
* @tjDom    archive then assert the row status
*/
export const archiveUserAndVerify = (email) => {
  return archiveUser(email).then((response) => {
    expect(response.status).to.be.oneOf([200, 201]);
    return response;
  });
};

/**
* @tjType   user.changeRoleExpectLimit
* @tjBlock  licensing
* @tjUsage  changeRoleAndExpectLimit(...)
* @tjDom    role change blocked by a plan limit
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
* @tjType   user.openInviteModal
* @tjBlock  licensing
* @tjUsage  openInviteUserModal('QA', userEmail, 'builder')
* @tjDom    manage users -> invite modal
*/
export const openInviteUserModal = (name, email, role) => {
  cy.get(commonSelectors.cancelButton).click();
  cy.get(commonSelectors.manageGroupsOption).click();
  cy.get(commonSelectors.manageUsersOption).click({ force: true });
  fillUserInviteForm(name, email);
  cy.get(".css-1mlj61j").type(`${role}{enter}`);
};

/**
* @tjType   app.multiEnvSetup
* @tjBlock  licensing
* @tjUsage  multiEnvAppSetup('MyApp')
* @tjDom    creates an app wired for multi-environment checks
*/
export const multiEnvAppSetup = (appName) => {
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
