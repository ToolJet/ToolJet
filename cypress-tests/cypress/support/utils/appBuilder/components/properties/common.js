// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// common.js
//   verifyExistance                  -                    → properties
//   genralProperties                 -                    → properties
//   selectDropdownOption             -                    → properties
//   setColorPickerValue              -                    → properties
//   setNumberInputValue              -                    → properties
//   verifyVisibility                 -                    → properties
//   verifyLoadingState               -                    → properties
//   verifyDisability                 -                    → properties
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/components/properties/common: **shared property-behaviour**
 * assertions used across component property specs.
 * FOR AI: verify how a rendered component reacts to its property controls, driving
 * a controller (toggle / CSA button / JS set-reset) then asserting the widget.
 *   presence / generic state → verifyExistance · genralProperties (the primitive)
 *   Visibility property       → verifyVisibility
 *   Loading property          → verifyLoadingState
 *   Disable property          → verifyDisability
 * Also small property-editor input setters: selectDropdownOption,
 *   setColorPickerValue, setNumberInputValue.
 * `controls` = { toggle, csa, jsSet, jsReset } — data-cy selectors for each way the
 *   property can be driven. Selectors are passed in by the caller (component-specific).
 * NOT here: right-panel property field editing → appBuilder/properties.js · styles →
 *   styles.js · component-specific image checks → ./imageComponent.js.
 */
/**
 * @tjBlock  properties
 * @tjUsage  verifyExistance('[data-cy="draggable-widget-image1"]', 'exist')
 * @tjDom    asserts the given component selector satisfies a Cypress state (exist / be.visible …)
 */
export const verifyExistance = (componentSelector, state = 'exist') => {
    cy.get(componentSelector).should(state);
}


/**
 * @tjBlock  properties
 * @tjUsage  genralProperties(compSel, controllerSel, { state: 'be.visible' })
 * @tjDom    clicks controllerSelector, then asserts componentSelector (or a `target`
 *           descendant) for state / className / attr — primitive behind the verify* helpers
 */
export const genralProperties = (componentSelector, controllerSelector, options = {}) => {
    const { state, stateValue, className, classNameState = 'exist', target, attr, attrValue, attrState = 'have.attr' } = options;

    cy.get(controllerSelector).click();

    const el = target
        ? cy.get(componentSelector).find(target)
        : cy.get(componentSelector);

    if (state && stateValue) el.should(state, stateValue);
    else if (state) el.should(state);
    if (className) cy.get(componentSelector).find(`.${className}`).should(classNameState);
    if (attr && attrValue !== undefined) el.should(attrState, attr, attrValue);
    else if (attr) el.should(attrState, attr);
}

/**
 * @tjBlock  properties
 * @tjUsage  selectDropdownOption(dropdownSel, 'Cover')
 * @tjDom    dropdown → dropdown-multiselect-widget search box → menu item matching label
 */
export const selectDropdownOption = (dropdownSelector, label) => {
    cy.get(dropdownSelector).click();
    cy.get('.dropdown-multiselect-widget-search-box').type(label);
    cy.get('.dropdown-multiselect-widget-custom-menu-list-body').contains(label).click();
}

/**
 * @tjBlock  properties
 * @tjUsage  setColorPickerValue(pickerSel, '#FF0000')
 * @tjDom    color picker → sketch-picker hex input, then clicks body to dismiss
 */
export const setColorPickerValue = (colorPickerSelector, hex) => {
    cy.get(colorPickerSelector).first().click();
    cy.get('.sketch-picker input').first().clear().type(`${hex}{enter}`);
    cy.get('body').click(0, 0);
}

/**
 * @tjBlock  properties
 * @tjUsage  setNumberInputValue(inputSel, 24)
 * @tjDom    selects all + types value + {enter} into a number property input
 */
export const setNumberInputValue = (inputSelector, value) => {
    cy.get(inputSelector).click().type(`{selectall}${value}{enter}`);
}

/**
 * @tjBlock  properties
 * @tjUsage  verifyVisibility(compSel, { toggle, csa, jsSet, jsReset })
 * @tjDom    drives each Visibility control (csa/jsSet/jsReset/toggle) and asserts be.visible / not.be.visible
 */
export const verifyVisibility = (componentSelector, controls) => {
    const { toggle, csa, jsSet, jsReset } = controls;

    genralProperties(componentSelector, csa, { state: "be.visible" });
    genralProperties(componentSelector, csa, { state: "not.be.visible" });
    genralProperties(componentSelector, jsSet, { state: "be.visible" });
    genralProperties(componentSelector, jsReset, { state: "not.be.visible" });
    genralProperties(componentSelector, toggle, { state: "be.visible" });
}

/**
 * @tjBlock  properties
 * @tjUsage  verifyLoadingState(compSel, { toggle, csa, jsSet, jsReset })
 * @tjDom    drives each Loading control and asserts the .tj-widget-loader spinner appears / disappears
 */
export const verifyLoadingState = (componentSelector, controls) => {
    const { toggle, csa, jsSet, jsReset } = controls;

    genralProperties(componentSelector, jsSet, { className: "tj-widget-loader", classNameState: "exist" });
    genralProperties(componentSelector, jsReset, { className: "tj-widget-loader", classNameState: "not.exist" });
    genralProperties(componentSelector, csa, { className: "tj-widget-loader", classNameState: "exist" });
    genralProperties(componentSelector, csa, { className: "tj-widget-loader", classNameState: "not.exist" });
}

/**
 * @tjBlock  properties
 * @tjUsage  verifyDisability(compSel, { csa, jsSet, jsReset })
 * @tjDom    drives each Disable control and asserts data-disabled toggles true / false on the component
 */
export const verifyDisability = (componentSelector, controls) => {
    const { csa, jsSet, jsReset } = controls;
    const disabled = { attr: 'data-disabled', attrValue: 'true' };
    const enabled = { attr: 'data-disabled', attrValue: 'false' };

    cy.get(componentSelector).should('have.attr', 'data-disabled', 'false');

    genralProperties(componentSelector, jsSet, disabled);
    genralProperties(componentSelector, jsReset, enabled);
    genralProperties(componentSelector, csa, disabled);
    genralProperties(componentSelector, csa, enabled);
}