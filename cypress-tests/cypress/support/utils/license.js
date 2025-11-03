import { commonSelectors } from "Selectors/common";
import { licenseSelectors } from "Selectors/license";
import { fillUserInviteForm } from "Support/utils/manageUsers";
import { licenseText } from "Texts/license";

export const switchTabs = (tabTitle) => {
  cy.get(licenseSelectors.listOfItems(tabTitle)).should("be.visible").click();
  cy.get(licenseSelectors.tabTitle(tabTitle)).should("have.text", tabTitle);
};

export const verifylicenseTab = () => {
  cy.get(licenseSelectors.label(licenseText.licenseKeyTab.licenseLabel)).should(
    "be.visible"
  );
  cy.get(licenseSelectors.licenseTextArea).should(
    "have.attr",
    "placeholder",
    licenseText.licenseKeyTab.enterLicenseKeyPlaceholder
  );
};

export const verifySubTabs = (subTabName, subTabDataObj, valuesObj) => {
  const subTabData = Object.values(subTabDataObj);

  cy.get(licenseSelectors.subTab(subTabName))
    .verifyVisibleElement("have.text", subTabName)
    .click();

  subTabData.forEach((label) => {
    const displayLabel = /^Number of\s+/i.test(label)
      ? label.replace(/^Number of\s+/i, "")
      : label;

    cy.get(
      licenseSelectors.numberOfTextLabel(displayLabel)
    ).verifyVisibleElement("have.text", label);

    if (valuesObj && valuesObj[displayLabel] !== undefined) {
      cy.get(licenseSelectors.inputField(displayLabel)).verifyVisibleElement(
        "have.value",
        valuesObj[displayLabel]
      );
    }
  });
};

export const verifyAccessTab = () => {
  const accessTabLabels = Object.values(licenseText.accessTab);
  accessTabLabels.forEach((accessTabLabel) => {
    cy.get(licenseSelectors.label(accessTabLabel)).verifyVisibleElement(
      "have.text",
      accessTabLabel
    );
    cy.get(licenseSelectors.label(accessTabLabel))
      .next(licenseSelectors.circularToggleDisabledIcon)
      .should("be.visible");
  });
};

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
    .replace(/[\u00A0\s]+/g, " ")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

const verifyLimitUI = (
  type,
  baseLabel,
  headingSelector,
  infoSelector,
  limit
) => {
  cy.get(headingSelector)
    .invoke("text")
    .then((headingText) => {
      cy.log(`Heading: ${headingText}`);
      cy.get(infoSelector)
        .invoke("text")
        .then((infoText) => {
          cy.log(`Info: ${infoText}`);

          const ratioMatch = headingText.match(/(\d+)\/(\d+)/);

          if (ratioMatch) {
            const [_, currentCount, headingLimit] = ratioMatch.map(Number);
            cy.log(`Current ${type}: ${currentCount}`);

            expect(headingLimit).to.equal(limit);
            expect(headingText).to.match(
              new RegExp(`${baseLabel}\\s+limit\\s+nearing`, "i")
            );
            expect(infoText).to.match(/nearing/i);
          } else {
            expect(headingText).to.match(
              new RegExp(`${baseLabel}\\s+limit\\s+reached`, "i")
            );
            expect(infoText).to.contain(
              `reached your limit for number of ${type}`
            );
          }
        });
    });
};

const verifyFeatureBanner = (cyPrefix, expectedHeading = null) => {
  const isSmallBanner = cyPrefix === "edit-user";
  const headingSelector = isSmallBanner
    ? licenseSelectors.licenseBannerHeading
    : licenseSelectors.limitHeading(cyPrefix);
  const infoSelector = isSmallBanner
    ? licenseSelectors.licenseBannerInfo
    : licenseSelectors.limitInfo(cyPrefix);

  cy.get(headingSelector)
    .should("be.visible")
    .invoke("text")
    .then((headingText) => {
      const actual = normalizeText(headingText);
      if (expectedHeading) {
        const expected = normalizeText(expectedHeading);
        expect(actual).to.equal(expected);
      }
    });
  cy.get("body").then(($body) => {
    if ($body.find(infoSelector).length > 0) {
      cy.get(infoSelector).then(($el) => {
        const text = $el.text().trim();
        if ($el.is(":visible") && text) cy.log(`Feature banner info: ${text}`);
      });
    }
  });
};

const getLimitFromPlan = (planName, type) => {
  return cy.fixture("license/license.json").then((licenseData) => {
    const planKey = planName.toLowerCase();
    const plan = licenseData[planKey];
    expect(plan, `Plan "${planName}" should exist in license.json`).to.not.be
      .undefined;

    const resourceKeyMap = {
      workspaces: "Workspaces",
      apps: "Apps",
      tables: "Tables",
      workflows: "Workflows",
      users: "Total Users",
      builders: "Builders",
      endusers: "End Users",
      superadmins: "Super Admins",
    };

    const resourceKey = resourceKeyMap[type];
    if (!resourceKey) return cy.wrap(null);

    const limit = plan[resourceKey];
    expect(limit, `Limit for "${resourceKey}" should exist in ${planName} plan`)
      .to.not.be.undefined;

    cy.log(`Using limit from ${planName} plan: ${resourceKey} = ${limit}`);
    return cy.wrap(limit);
  });
};

export const verifyResourceLimit = (
  resourceType,
  limitOrPlan = null,
  dataCyPrefix = null,
  expectedHeading = null
) => {
  const type = resourceType.toLowerCase().trim();
  const cyPrefix = dataCyPrefix || type;
  const typeCapitalized = type.charAt(0).toUpperCase() + type.slice(1);
  const baseLabel = typeCapitalized.slice(0, -1);
  const headingSelector = licenseSelectors.limitHeading(cyPrefix);
  const infoSelector = licenseSelectors.limitInfo(cyPrefix);

  const isNumber = typeof limitOrPlan === "number";
  const planName = isNumber ? null : limitOrPlan;

  if (isNumber) {
    return verifyLimitUI(
      type,
      baseLabel,
      headingSelector,
      infoSelector,
      limitOrPlan
    );
  }

  getLimitFromPlan(planName, type).then((limit) => {
    if (limit === null) {
      verifyFeatureBanner(cyPrefix, expectedHeading);
    } else {
      verifyLimitUI(type, baseLabel, headingSelector, infoSelector, limit);
    }
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

export const getCurrentCountFromBanner = (resourceType) => {
  const cyPrefix = resourceType.toLowerCase().trim();
  const headingSelector = `[data-cy="${cyPrefix}-limit-heading"]`;

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

export const bulkUploadUsersViaCSV = (
  count,
  role = "end-user",
  prefix = "bulkuser"
) => {
  const timestamp = Date.now();
  const csvContent = generateBulkUsersCSV(count, role, prefix, timestamp);

  const emails = [];
  for (let i = 1; i <= count; i++) {
    emails.push(`${prefix}-${timestamp}-${i}@test.com`);
  }

  return cy.apiBulkUploadUsers(csvContent).then((response) => {
    return { response, emails };
  });
};

export const verifyLimitBanner = (heading, infoText) => {
  cy.verifyElement('[data-cy="usage-limit-heading"]', heading);
  cy.verifyElement('[data-cy="usage-limit-info"]', infoText);
};

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
    cy.get('[data-cy="cancel-button"]').eq(0).should("be.visible");
    cy.get('[data-cy="upgrade-button"]').should("be.visible");
    cy.get('[data-cy="cancel-button"]').eq(0).click();
  });
};

export const createUserAndExpectStatus = (email, role, expectedStatus) => {
  return createUserViaAPI(email, role).then((response) => {
    expect(response.status).to.equal(expectedStatus);
    if (expectedStatus === 451) {
      expect(response.body.message).to.contain("limit");
    }
    return response;
  });
};

export const archiveUserAndVerify = (email) => {
  return archiveUser(email).then((response) => {
    expect(response.status).to.be.oneOf([200, 201]);
    return response;
  });
};

export const changeRoleAndExpectLimit = (email, newRole) => {
  return changeUserRole(email, newRole).then((roleChangeResponse) => {
    expect(roleChangeResponse.status).to.equal(451);
    expect(roleChangeResponse.body.message).to.contain("limit");
    return roleChangeResponse;
  });
};

export const openInviteUserModal = (name, email, role) => {
  cy.get(commonSelectors.cancelButton).click();
  cy.get(commonSelectors.manageGroupsOption).click();
  cy.get(commonSelectors.manageUsersOption).click({ force: true });
  fillUserInviteForm(name, email);
  cy.get(".css-1mlj61j").type(`${role}{enter}`);
};
