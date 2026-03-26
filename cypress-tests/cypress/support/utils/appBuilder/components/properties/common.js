export const verifyExistance = (componentSelector, state = "exist") => {
  cy.get(componentSelector).should(state);
};

export const genralProperties = (
  componentSelector,
  controllerSelector,
  options = {},
) => {
  const {
    state,
    stateValue,
    className,
    classNameState = "exist",
    target,
    attr,
    attrValue,
    attrState = "have.attr",
  } = options;

  cy.get(controllerSelector).click();

  const el = target
    ? cy.get(componentSelector).find(target)
    : cy.get(componentSelector);

  if (state && stateValue) el.should(state, stateValue);
  else if (state) el.should(state);
  if (className)
    cy.get(componentSelector).find(`.${className}`).should(classNameState);
  if (attr && attrValue !== undefined) el.should(attrState, attr, attrValue);
  else if (attr) el.should(attrState, attr);
};

export const selectDropdownOption = (dropdownSelector, label) => {
  cy.get(dropdownSelector).click();
  cy.get(".dropdown-multiselect-widget-search-box").type(label);
  cy.get(".dropdown-multiselect-widget-custom-menu-list-body")
    .contains(label)
    .click();
};

export const setColorPickerValue = (colorPickerSelector, hex) => {
  cy.get(colorPickerSelector).first().click();
  cy.get(".sketch-picker input").first().clear().type(`${hex}{enter}`);
  cy.get("body").click(0, 0);
};

export const setNumberInputValue = (inputSelector, value) => {
  cy.get(inputSelector).click().type(`{selectall}${value}{enter}`);
};

export const verifyVisibility = (componentSelector, controls) => {
  const { toggle, csa, jsSet, jsReset } = controls;

  genralProperties(componentSelector, csa, { state: "be.visible" });
  genralProperties(componentSelector, csa, { state: "not.be.visible" });
  genralProperties(componentSelector, jsSet, { state: "be.visible" });
  genralProperties(componentSelector, jsReset, { state: "not.be.visible" });
  genralProperties(componentSelector, toggle, { state: "be.visible" });
};

export const verifyLoadingState = (componentSelector, controls) => {
  const { toggle, csa, jsSet, jsReset } = controls;

  // genralProperties(componentSelector, toggle, { className: "tj-widget-loader" });
  genralProperties(componentSelector, jsSet, {
    className: "tj-widget-loader",
    classNameState: "exist",
  });
  genralProperties(componentSelector, jsReset, {
    className: "tj-widget-loader",
    classNameState: "not.exist",
  });
  genralProperties(componentSelector, csa, {
    className: "tj-widget-loader",
    classNameState: "exist",
  });
  genralProperties(componentSelector, csa, {
    className: "tj-widget-loader",
    classNameState: "not.exist",
  });
};

export const verifyDisability = (
  componentSelector,
  controls,
  options = { attr: "data-disabled" },
) => {
  const { csa, jsSet, jsReset } = controls;
  const { attr, assertClass } = options;

  const disabled = {};
  if (attr) {
    disabled.attr = attr;
    disabled.attrValue = "true";
  }
  if (assertClass) {
    disabled.assertClass = assertClass;
    disabled.assertClassState = "have.class";
  }

  const enabled = {};
  if (attr) {
    enabled.attr = attr;
    enabled.attrValue = "false";
  }
  if (assertClass) {
    enabled.assertClass = assertClass;
    enabled.assertClassState = "not.have.class";
  }

  if (attr) cy.get(componentSelector).should("have.attr", attr, "false");
  if (assertClass)
    cy.get(componentSelector).should("not.have.class", assertClass);

  genralProperties(componentSelector, jsSet, disabled);
  genralProperties(componentSelector, jsReset, enabled);
  genralProperties(componentSelector, csa, disabled);
  genralProperties(componentSelector, csa, enabled);
};
