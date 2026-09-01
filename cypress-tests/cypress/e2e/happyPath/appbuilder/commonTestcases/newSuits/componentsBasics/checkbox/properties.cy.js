import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import {
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
    verifyAndModifySwitch,
    verifyLayout,
    openEditorSidebar,
    openAccordion,
} from "Support/utils/commonWidget";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid. Each test still re-logs-in + creates its own
// app in beforeEach, so shared browser state is not relied upon.
describe('Checkbox — properties facet', { testIsolation: false }, () => {
    const W = 'checkbox1'; // runtimeCandidate from checkbox-surface.yaml

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Checkbox-Properties-App`);
        cy.openApp();
        cy.dragAndDropWidget('Checkbox', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // ── General ──────────────────────────────────────────────────────────────
    it('general — label (code) + defaultValue (switch)', () => {
        openEditorSidebar(W);

        // label (code) → widget renders typed text
        // source: checkbox.js:15
        const labelText = fake.randomSentence; // dynamic: fake
        verifyAndModifyParameter('Label', labelText);
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .find('.form-check-label')
            .should('contain.text', labelText); // dynamic: fake echoed label (checkbox label = .form-check-label)

        // defaultValue (switch) — Default state On/Off; default '{{false}}'
        // source: checkbox.js:22
        verifyAndModifySwitch('Default state', 'On'); // source: checkbox.js:22
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .find('input')
            .should('be.checked'); // On → checkbox checked
    });

    // ── Additional Actions ────────────────────────────────────────────────────
    it('additional — loadingState, visibility, collapseWhenHidden, disabledState (toggles) + tooltipFormat (switch) + tooltip (code)', () => {
        openEditorSidebar(W);
        openAccordion('Additional Actions');

        // loadingState (toggle) fx default false → verify+flip ON → loader visible
        // source: checkbox.js:32
        verifyAndModifyToggleFx('Loading state', '{{false}}'); // source: checkbox.js:32 (flips ON)
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .parent()
            .within(() => {
                cy.get('.tj-widget-loader').should('be.visible');
            });

        // visibility (toggle) fx default true → verify+flip OFF → widget hidden
        // source: checkbox.js:38
        verifyAndModifyToggleFx('Visibility', '{{true}}'); // source: checkbox.js:38 (flips OFF)
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .should('not.be.visible'); // source: checkbox.js:38

        // collapseWhenHidden (toggle) fx default false → verify+flip ON
        // layout-only side-effect (widget already hidden above); verify fx default only
        // source: checkbox.js:45
        verifyAndModifyToggleFx('Collapse when hidden', '{{false}}'); // source: checkbox.js:45 (flips ON)

        // disabledState (toggle) fx default false → verify+flip ON → .disabled class
        // source: checkbox.js:51
        verifyAndModifyToggleFx('Disable', '{{false}}'); // source: checkbox.js:51 (flips ON)
        // widget hidden by visibility toggle above; re-enable read via flipped default
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .should('have.class', 'disabled'); // checkbox uses .disabled class, not data-disabled attr (runtime-confirmed)

        // tooltipFormat (switch) — Tooltip Plain text/Markdown/HTML; default plainText
        // source: checkbox.js:60
        verifyAndModifySwitch('Tooltip', 'Markdown'); // source: checkbox.js:60

        // tooltip (code) — text input; fake value
        // source: checkbox.js:74
        const tooltipText = fake.randomSentence; // dynamic: fake
        verifyAndModifyParameter('Tooltip', tooltipText); // source: checkbox.js:74
    });

    // ── Validation ────────────────────────────────────────────────────────────
    it('validation — mandatory (toggle) + customRule (code)', () => {
        openEditorSidebar(W);
        openAccordion('Validation');

        // mandatory (toggle) fx default false → verify+flip ON → mandatory marker (*)
        // source: checkbox.js:84
        verifyAndModifyToggleFx('Make this field mandatory', '{{false}}'); // source: checkbox.js:84 (flips ON)
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .parent()
            .should('contain.text', '*'); // mandatory marker

        // customRule (code) default null → custom validation expression
        // source: checkbox.js:85
        verifyAndModifyParameter('Custom validation', '{{false}}'); // dynamic: fake (test expression)
    });

    // ── Layout (others) ───────────────────────────────────────────────────────
    it('layout — showOnDesktop + showOnMobile via verifyLayout', () => {
        // covers others.showOnDesktop ({{true}}) + showOnMobile ({{false}})
        // source: checkbox.js:11 (showOnDesktop) / checkbox.js:12 (showOnMobile)
        verifyLayout(W);
    });
});
