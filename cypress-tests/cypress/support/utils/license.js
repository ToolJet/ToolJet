import { licenseSelectors } from "Selectors/license";
import { licenseText } from "Texts/license";

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

export const switchTabs = (tabTitle) => {
  cy.get(licenseSelectors.listOfItems(tabTitle)).should("be.visible").click();
  cy.get(licenseSelectors.tabTitle(tabTitle)).should("have.text", tabTitle);
};

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

export const verifySubTabsAndStoreCurrentLimits = (
  subTabName,
  subTabDataObj,
  outputFile = "currentLimits.json"
) => {
  const subTabData = Object.values(subTabDataObj);
  const currentLimits = {};

  cy.get(licenseSelectors.subTab(subTabName))
    .should("be.visible")
    .and("have.text", subTabName)
    .click();

  cy.wrap(subTabData)
    .each((label) => {
      const displayLabel = label.replace(/^Number of\s+/i, "");

      cy.get(licenseSelectors.numberOfTextLabel(displayLabel))
        .should("be.visible")
        .and("have.text", label);

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

export const verifyAccessTab = (isPlanEnabled = false) => {
  const accessTabLabels = Object.values(licenseText.accessTab);
  accessTabLabels.forEach((label) => {
    cy.get(licenseSelectors.label(label)).verifyVisibleElement(
      "have.text",
      label
    );

    const toggleIcon = isPlanEnabled
      ? licenseSelectors.circularToggleEnabledIcon
      : licenseSelectors.circularToggleDisabledIcon;

    cy.get(licenseSelectors.label(label)).next(toggleIcon).should("be.visible");
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
    .toLowerCase()
    .replace(/[\u00A0\s]+/g, " ");

export const verifyFeatureBanner = (cyPrefix, expectedHeading = null) => {
  const headingSelector = licenseSelectors.limitHeading(cyPrefix);

  cy.get("body").then(($body) => {
    if ($body.find(headingSelector).length > 0) {
      cy.get(headingSelector)
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
  return map[type];
};

export const assertLimitState = (
  resourceKey,
  baseLabel,
  headingSelector,
  infoSelector,
  currentValue,
  planLimit,
  planName
) => {
  if (/unlimited/i.test(planLimit)) {
    cy.get(headingSelector).should("contain.text", "unlimited");
    return;
  }

  const current = Number(currentValue);
  const limit = Number(planLimit);

  if (current >= limit) {
    cy.get(headingSelector)
      .invoke("text")
      .then((t) =>
        expect(normalizeText(t)).to.include(
          `${baseLabel.toLowerCase()} limit reached`
        )
      );
    cy.get(infoSelector)
      .invoke("text")
      .should("match", /reached/i);
  } else if (current === limit - 1) {
    cy.get(headingSelector)
      .invoke("text")
      .then((t) =>
        expect(normalizeText(t)).to.include(
          `${baseLabel.toLowerCase()} limit nearing`
        )
      );
    cy.get(infoSelector)
      .invoke("text")
      .should("match", /nearing/i);
  }
};

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

  if (isBannerType(type)) {
    handleFeatureBanner(type, expectedHeading);
    return;
  }

  const headingSelector = licenseSelectors.limitHeading(cyPrefix);
  const infoSelector = licenseSelectors.limitInfo(cyPrefix);
  const resourceKey = getResourceKey(type);

  if (!resourceKey) return verifyFeatureBanner(cyPrefix, expectedHeading);

  cy.fixture(`license/${outputFile}`).then((currentLimits) => {
    const currentValue = currentLimits[resourceKey];
    cy.fixture("license/license.json").then((licenseData) => {
      const plan = licenseData[planName.toLowerCase()];
      const planLimit = plan?.[resourceKey];
      if (planLimit === undefined)
        return verifyFeatureBanner(cyPrefix, expectedHeading);

      assertLimitState(
        resourceKey,
        baseLabel,
        headingSelector,
        infoSelector,
        currentValue,
        planLimit,
        planName
      );
    });
  });
};

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
