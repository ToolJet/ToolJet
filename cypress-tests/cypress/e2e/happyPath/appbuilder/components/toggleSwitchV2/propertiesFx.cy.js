import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// propertiesFx facet — the fx (dynamic-binding) path for every fx-capable
// property, plus the NEGATIVE case for the one field carrying
// isFxNotRequired:true (tooltipFormat).
// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Toggle Switch — propertiesFx facet', { testIsolation: false }, () => {
    const W = 'toggleswitch1'; // computeComponentName from config name 'ToggleSwitch'
    const INNER = `[data-cy="${W}"]`; // ToggleV2.jsx:264
    const INPUT = `${INNER} input.form-check-input`; // ToggleV2.jsx:67-88
    const LABEL_WRAP = `${INNER} div:has(> label)`; // ToggleV2.jsx:270-283 — OverflowTooltip renders an UNCLASSED div (its `className` goes to the ToolTip wrapper, OverflowTooltip.jsx:64/72-74), so pin it by the <label> it contains

    beforeEach(() => {
        cy.apiLogin();
        // fake.companyName is just the first word of a company name (fake.js:19-22)
        // — a small pool, so repeat local runs collide on POST /api/apps (409
        // "This app name is already taken") and abort the suite from beforeEach.
        cy.apiCreateApp(`${fake.companyName}-ToggleSwitch-PropertiesFx-App-${Date.now().toString().slice(-6)}`);
        cy.openApp();
        cy.dragAndDropWidget('Toggle Switch', 500, 100); // source: toggleswitchv2.js:3
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // switch-type fields expose an fx button too — renderFx() only bails for
    // paramType 'query', paramLabel 'Type', or a defined isFxNotRequired
    // (SingleLineCodeEditor.jsx:698-700) — but they have no toggle button to
    // hover, so the fx control stays CSS-hidden until the row is hovered.
    // SELF-TUNE CANDIDATE: this belongs in a shared verifyAndModifySwitchFx
    // helper (see the skill's Step 7 report) rather than inline here.
    const openSwitchFx = (paramName) => {
        cy.get(commonWidgetSelector.parameterLabel(paramName)).scrollIntoView().realHover();
        cy.get(commonWidgetSelector.parameterFxButton(paramName)).click({ force: true });
    };

    // ── fx-capable CODE fields (label, tooltip, customRule) ───────────────────
    // Code fields ARE the fx/code input; exercise them with a `{{ }}` binding
    // and assert the resolved value lands on the widget.

    it('general — label fx: a {{ }} binding resolves onto the rendered label', () => {
        openEditorSidebar(W);

        // label (code, fxCapable) — source: toggleswitchv2.js:25
        const labelText = fake.companyName; // dynamic: fake
        verifyAndModifyParameter('Label', `{{"${labelText}"}}`);
        // CodeMirror commits the property on BLUR — without this the store keeps
        // the old value and the canvas renders stale (runtime-confirmed: the
        // inspector field showed the new text while <label> still read 'Label').
        cy.forceClickOnCanvas();
        cy.get(`${INNER} label`).scrollIntoView().should('have.text', labelText); // dynamic: fake resolved from the binding
    });

    it('additional — tooltip fx: a {{ }} binding resolves into the widget tooltip', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // tooltip (code, fxCapable) — source: toggleswitchv2.js:85
        const tooltipText = fake.companyName; // dynamic: fake
        verifyAndModifyParameter('Tooltip', `{{"${tooltipText}"}}`);
        cy.forceClickOnCanvas();
        cy.get(commonWidgetSelector.draggableWidget(W)).scrollIntoView().realHover();
        cy.get('[data-cy="widget-tooltip"]')
            .should('be.visible')
            .and('contain.text', tooltipText); // dynamic: fake resolved from the binding
    });

    it('validation — customRule fx: a {{ }} binding drives the invalid feedback', () => {
        openEditorSidebar(W);
        openAccordion('Validation');

        // customRule (code, fxCapable) default null — source: toggleswitchv2.js:17
        // A binding resolving to a non-empty string marks the field invalid and
        // supplies the error text (_helpers/utils.js:458-461).
        const ruleMessage = fake.companyName; // dynamic: fake
        verifyAndModifyParameter('Custom validation', `{{"${ruleMessage}"}}`);

        cy.forceClickOnCanvas();
        cy.get(`${INNER} > div > div.d-flex`).scrollIntoView().click({ force: true });
        cy.get(commonWidgetSelector.validationFeedbackMessage(W))
            .should('be.visible')
            .and('have.text', ruleMessage); // dynamic: fake resolved from the binding
    });

    // ── fx-capable TOGGLE fields ──────────────────────────────────────────────
    // verifyAndModifyToggleFx opens the fx editor, asserts the braced fx default
    // in .cm-line, closes it, then flips the toggle. Assert the flipped effect.

    it('additional — loadingState fx: {{false}} default → flip ON → loader visible', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // source: toggleswitchv2.js:43 (default toggleswitchv2.js:219)
        verifyAndModifyToggleFx('Loading state', '{{false}}');
        cy.get(`${INNER} .tj-widget-loader`).should('be.visible');
    });

    it('additional — visibility fx: {{true}} default → flip OFF → widget hidden', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // source: toggleswitchv2.js:49 (default toggleswitchv2.js:215)
        verifyAndModifyToggleFx('Visibility', '{{true}}');
        cy.get(INNER).should('not.be.visible');
    });

    it('additional — collapseWhenHidden fx: {{false}} default → flip ON', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // Layout reflow only applies in view mode (RenderWidget.jsx:280-289), so
        // the fx-default verification + flip IS the fx-path exercise here.
        // source: toggleswitchv2.js:56 (default toggleswitchv2.js:217)
        verifyAndModifyToggleFx('Collapse when hidden', '{{false}}');
        // parameterTogglebutton resolves to the <input> ITSELF — CodeBuilder/Elements/
        // Toggle.jsx:25 puts data-cy on the input, so do NOT .find('input') inside it.
        cy.get(commonWidgetSelector.parameterTogglebutton('Collapse when hidden')).should('be.checked');
    });

    it('additional — disabledState fx: {{false}} default → flip ON → input disabled', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // source: toggleswitchv2.js:62 (default toggleswitchv2.js:218)
        verifyAndModifyToggleFx('Disable', '{{false}}');
        cy.get(INNER).should('have.attr', 'data-disabled', 'true');
        cy.get(INPUT).should('be.disabled');
    });

    it('validation — mandatory fx: {{false}} default → flip ON → * marker', () => {
        openEditorSidebar(W);
        openAccordion('Validation');

        // source: toggleswitchv2.js:16 (default toggleswitchv2.js:209)
        verifyAndModifyToggleFx('Make this field mandatory', '{{false}}');
        cy.get(LABEL_WRAP).scrollIntoView().should('contain.text', '*'); // source: ToggleV2.jsx:282
    });

    // ── fx-capable SWITCH field (defaultValue) ────────────────────────────────
    it('general — defaultValue fx: a {{ }} binding checks the switch', () => {
        openEditorSidebar(W);

        // defaultValue is type 'switch' with no isFxNotRequired, so it renders an
        // fx button (SingleLineCodeEditor.jsx:698-700).
        // source: toggleswitchv2.js:33 (default toggleswitchv2.js:214)
        cy.get(INPUT).should('not.be.checked');
        openSwitchFx('Default state');
        cy.get(commonWidgetSelector.parameterInputField('Default state'))
            .find('.cm-line')
            .should('have.text', '{{false}}'); // source: toggleswitchv2.js:214

        cy.get(commonWidgetSelector.parameterInputField('Default state'))
            .clearAndTypeOnCodeMirror('{{true}}'); // source: toggleswitchv2.js:38
        // CodeMirror commits on BLUR — without this the editor keeps focus and the
        // store never sees the typed value (runtime-confirmed).
        cy.forceClickOnCanvas();
        cy.get(INPUT).should('be.checked');
    });

    // ── NEGATIVE — tooltipFormat carries isFxNotRequired:true ─────────────────
    it('additional — tooltipFormat (isFxNotRequired) exposes NO fx button', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // tooltipFormat renders its options as a togglr ToggleGroup; its default
        // option is 'Plain text' (source: toggleswitchv2.js:71,75,80). It is
        // isFxNotRequired:true, so SingleLineCodeEditor renders no FxButton for
        // it — assert no fx button lives in the switch's own control row.
        // ToggleGroupItem.jsx:33 builds data-cy from the option VALUE ('plainText'),
        // NOT the kebab-cased displayName — source: toggleswitchv2.js:75
        cy.get('[data-cy="togglr-button-plainText"]').scrollIntoView().should('exist');

        // tooltipFormat and the `tooltip` code field BOTH carry displayName
        // 'Tooltip' (toggleswitchv2.js:73 / :87), so they share the fx-button
        // data-cy namespace. The code field contributes exactly ONE fx button;
        // if tooltipFormat were fx-capable there would be two. Asserting the
        // count is the unambiguous isFxNotRequired check.
        cy.get(commonWidgetSelector.parameterFxButton('Tooltip'))
            .should('have.length', 1); // source: toggleswitchv2.js:79 (isFxNotRequired: true)
    });
});
