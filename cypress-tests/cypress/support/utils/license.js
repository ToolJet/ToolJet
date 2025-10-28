import { licenseSelectors } from "Selectors/license";
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
