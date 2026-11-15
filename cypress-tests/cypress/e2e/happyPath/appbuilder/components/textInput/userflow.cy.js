/**
 * SPEC — Text Input — userflow facet.
 * FOR AI: end-to-end happy path — drop, type a value, verify exposed value + clear via CSA.
 * TESTING.md browser scenario TextInput-BRW-006 — Tab skips a disabled or loading Text Input (BaseInput.jsx:290
 * `disabled={disable || loading}`, added by 4f159069c7) in both directions; a control step re-enables them via
 * CSA and proves Tab then stops on each. Real CDP key events (realPress) — synthetic `{tab}` does not move focus.
 * Helpers: openEditorSidebar, addTextInputsViaApi, csaEvent, openAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { textInputSelector as SEL } from "Selectors/appBuilder/components/textInput";
import { addTextInputsViaApi } from "Support/utils/appBuilder/components/textInput";
import { csaEvent } from "Support/utils/appBuilder/components/dateTimeCommon";
import { openAppInViewer } from "Support/utils/appBuilder/components/textArea";

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec
// run; testIsolation's per-test AUT reset leaves that client stale, so 2nd+
// test drags throw "No dragIntercepted". Keeping the AUT stable across tests
// keeps the drag intercept valid.
describe('Text Input — userflow facet', { testIsolation: false }, () => {
    const W = 'textinput1'; // runtimeCandidate

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TIUserflow-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget('Text Input', 500, 100);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // Happy path: a user types a number → the input reflects it.
    it('user types a value → input reflects the typed text', () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.draggableWidget(W))
            .scrollIntoView()
            .find('input')
            .clear()
            .type('42')
            .should('have.value', '42');
    });
});

// ── TextInput-BRW-006 ────────────────────────────────────────────────────────
// Tab order (one vertical lane): tifirst → tidisabled → tiloading → tilast; a Button below re-enables both.
describe('Text Input — userflow facet (keyboard)', { testIsolation: false }, () => {
    const focusedIs = (name) => cy.focused().should('have.attr', 'data-cy', `${name}-input`);

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TextInput-userflow-${Cypress._.uniqueId()}`);
        addTextInputsViaApi([
            { name: 'tifirst', layout: { top: 40, left: 2, width: 12 } },
            { name: 'tidisabled', layout: { top: 110, left: 2, width: 12 }, properties: { disabledState: { value: '{{true}}' } } }, // source: textinput.js:70
            { name: 'tiloading', layout: { top: 180, left: 2, width: 12 }, properties: { loadingState: { value: '{{true}}' } } }, // source: textinput.js:51
            { name: 'tilast', layout: { top: 250, left: 2, width: 12 } },
            {
                type: 'Button',
                name: 'enableall',
                layout: { top: 330, left: 2, width: 8, height: 40 },
                properties: { text: { value: 'Enable' } }, // dynamic: button text
                events: [
                    csaEvent('onClick', 'tidisabled', 'setDisable', [{ handle: 'disable', displayName: 'Value', value: '{{false}}' }]), // source: textinput.js:327
                    csaEvent('onClick', 'tiloading', 'setLoading', [{ handle: 'loading', displayName: 'Value', value: '{{false}}' }]), // source: textinput.js:332
                ],
            },
        ]);
        openAppInViewer(SEL.input('tilast'));
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('[TextInput-BRW-006] Tab and Shift+Tab skip a disabled and a loading Text Input', () => {
        cy.get(SEL.input('tidisabled')).should('be.disabled').and('have.attr', 'aria-disabled', 'true');
        cy.get(SEL.input('tiloading')).should('be.disabled').and('have.attr', 'aria-busy', 'true');

        cy.get(SEL.input('tifirst')).focus(); // start point only — the guarantee is what Tab does next
        focusedIs('tifirst');
        cy.realPress('Tab');
        focusedIs('tilast');
        cy.realPress(['Shift', 'Tab']);
        focusedIs('tifirst');

        // a real click + typing cannot focus or fill the disabled field
        cy.get(SEL.input('tidisabled')).realClick();
        cy.document().should((doc) =>
            expect(doc.activeElement?.getAttribute('data-cy'), 'focused element').not.to.eq('tidisabled-input'));
        cy.realType(fake.firstName); // dynamic: fake
        cy.get(SEL.input('tidisabled')).should('have.value', '');

        // control: once enabled through CSA, Tab stops on each of them — so the skip above is the disabled state
        cy.contains(`${SEL.draggableWidget('enableall')} button`, 'Enable').click();
        cy.get(SEL.input('tidisabled')).should('not.be.disabled');
        cy.get(SEL.input('tiloading')).should('not.be.disabled');
        cy.get(SEL.input('tifirst')).focus();
        cy.realPress('Tab');
        focusedIs('tidisabled');
        cy.realPress('Tab');
        focusedIs('tiloading');
        cy.realPress('Tab');
        focusedIs('tilast');
    });
});
