// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// imageComponent.js
//   verifyZoomFeature                -                    → properties
//   verifyRotateFeature              -                    → properties
//   verifyBorderType                 -                    → properties
//   verifyImageLabel                 -                    → properties
//   verifyImageBackgroundColor       -                    → properties
//   verifyImageFit                   -                    → properties
//   verifyImageFitAndBorderType      -                    → properties
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/components/properties/imageComponent: **Image widget** specific
 * property-behaviour assertions.
 * FOR AI: verify the rendered Image component reacts to its own properties. Route by feature:
 *   Zoom toggle          → verifyZoomFeature (asserts transform scale)
 *   Rotate button        → verifyRotateFeature (asserts transform rotate)
 *   Border type dropdown → verifyBorderType (per option → CSS)
 *   Label / padding input→ verifyImageLabel (per value → img style)
 *   Background color     → verifyImageBackgroundColor (per hex → background-color)
 *   Image fit dropdown   → verifyImageFit (per option → object-fit)
 *   Fit × border matrix  → verifyImageFitAndBorderType
 * Reuses input setters from ./common (selectDropdownOption / setColorPickerValue / setNumberInputValue).
 * NOT here: shared visibility/loading/disable behaviour → ./common.js · right-panel field
 *   editing → appBuilder/properties.js · styles → appBuilder/styles.js.
 */
import { selectDropdownOption, setColorPickerValue, setNumberInputValue } from "./common";

/**
 * @tjBlock  properties
 * @tjUsage  verifyZoomFeature(compSel, zoomToggleSel)
 * @tjDom    enables zoom toggle → dblclick .react-transform-component → asserts style includes 'scale'
 */
export const verifyZoomFeature = (componentSelector, zoomToggle) => {
    cy.get(zoomToggle).click();
    cy.get(componentSelector).find('.react-transform-component').dblclick();
    cy.get(componentSelector).find('.react-transform-component')
        .should('have.attr', 'style')
        .and('include', 'scale');
    cy.get(zoomToggle).click();
}

/**
 * @tjBlock  properties
 * @tjUsage  verifyRotateFeature(compSel, rotateToggleSel)
 * @tjDom    enables rotate toggle → hover → .img-control-btn → asserts img style includes 'rotate'
 */
export const verifyRotateFeature = (componentSelector, rotateToggle) => {
    cy.get(rotateToggle).click();
    cy.get(componentSelector).first().click();
    cy.get(componentSelector).first().realHover();
    cy.get(componentSelector).find('.img-control-btn').click();
    cy.get(componentSelector).find('img')
        .should('have.attr', 'style')
        .and('include', 'rotate');
    cy.get(rotateToggle).click();
}

/**
 * @tjBlock  properties
 * @tjUsage  verifyBorderType(compSel, dropdownSel, [{ label: 'Rounded', css: { 'border-radius': '8px' } }])
 * @tjDom    per option → selectDropdownOption → asserts each css prop on the img
 */
export const verifyBorderType = (componentSelector, dropdownSelector, borderOptions) => {
    borderOptions.forEach(({ label, css }) => {
        selectDropdownOption(dropdownSelector, label);
        const imgEl = cy.get(componentSelector).first().find('img');
        Object.entries(css).forEach(([prop, value]) => {
            imgEl.should('have.css', prop, value);
        });
    });
}

/**
 * @tjBlock  properties
 * @tjUsage  verifyImageLabel(compSel, inputSel, [{ input: 10, styles: ['padding'] }])
 * @tjDom    per value → setNumberInputValue → asserts each style substring on the img style attr
 */
export const verifyImageLabel = (componentSelector, inputSelector, labelValues) => {
    labelValues.forEach(({ input, styles }) => {
        setNumberInputValue(inputSelector, input);
        styles.forEach((style) => {
            cy.get(componentSelector).first().find('img')
                .should('have.attr', 'style')
                .and('include', style);
        });
    });
}

/**
 * @tjBlock  properties
 * @tjUsage  verifyImageBackgroundColor(compSel, pickerSel, [{ hex: '#FF0000', expectedBg: 'rgb(255, 0, 0)' }])
 * @tjDom    per option → setColorPickerValue → asserts img background-color
 */
export const verifyImageBackgroundColor = (componentSelector, colorPickerSelector, colorOptions) => {
    colorOptions.forEach(({ hex, expectedBg }) => {
        setColorPickerValue(colorPickerSelector, hex);
        cy.get(componentSelector).first().find('img')
            .should('have.css', 'background-color', expectedBg);
    });
}

/**
 * @tjBlock  properties
 * @tjUsage  verifyImageFit(compSel, dropdownSel, [{ label: 'Cover', value: 'cover' }])
 * @tjDom    per option → selectDropdownOption → asserts img object-fit
 */
export const verifyImageFit = (componentSelector, dropdownSelector, fitOptions) => {
    fitOptions.forEach(({ label, value }) => {
        selectDropdownOption(dropdownSelector, label);
        cy.get(componentSelector)
            .first()
            .find('img')
            .should('have.css', 'object-fit', value);
    });
}

/**
 * @tjBlock  properties
 * @tjUsage  verifyImageFitAndBorderType(compSel, fitSel, borderSel, fitOptions, borderOptions)
 * @tjDom    for each fit × border combination → asserts img object-fit + each border css prop
 */
export const verifyImageFitAndBorderType = (componentSelector, fitDropdown, borderDropdown, fitOptions, borderOptions) => {
    fitOptions.forEach(({ label: fitLabel, value: fitValue }) => {
        selectDropdownOption(fitDropdown, fitLabel);
        borderOptions.forEach(({ label: borderLabel, css: borderCss }) => {
            selectDropdownOption(borderDropdown, borderLabel);
            const imgEl = cy.get(componentSelector).first().find('img');
            imgEl.should('have.css', 'object-fit', fitValue);
            Object.entries(borderCss).forEach(([prop, value]) => {
                imgEl.should('have.css', prop, value);
            });
        });
    });
}
