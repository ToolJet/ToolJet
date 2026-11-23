/**
 * SPEC — Text Area — userflow facet (scenario-scoped).
 * FOR AI: real keyboard interaction from TESTING.md:
 *   TextArea-BRW-004 — Tab moves out of the field (no tab character), Enter inserts a newline, and a disabled
 *                      Text Area accepts neither keyboard entry nor tab focus (BaseInput.jsx:290 `disabled`,
 *                      added by 4f159069c7).
 * Real CDP key events (cypress-real-events realPress/realType) — synthetic cy.type('{tab}') does not move focus.
 * Fixture tab order: textinput1 → textarea1 → textinput2 → textarea2 (disabled) → textinput3.
 * Helpers: importAppFixture, openAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { textAreaSelector } from "Selectors/appBuilder/components/textArea";
import { textAreaText } from "Texts/appBuilder/components/textArea";
import { importAppFixture } from "Support/utils/appBuilder/components/baseInput";
import { openAppInViewer } from "Support/utils/appBuilder/components/textArea";

const T = textAreaText;
const textInput = (name) => `[data-cy="${name}-input"]`;

describe('Text Area — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        importAppFixture(T.keyboardFixture, `${fake.companyName}-TextArea-userflow-${Cypress._.uniqueId()}`);
        openAppInViewer(textAreaSelector.input('textarea1'));
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── TextArea-BRW-004 ─────────────────────────────────────────────────────
    it('[TextArea-BRW-004] Tab enters and leaves the field without inserting a tab; Enter inserts a newline', () => {
        const first = fake.firstName; // dynamic: fake
        const second = fake.lastName; // dynamic: fake

        cy.get(textInput('textinput3')).should('be.visible');
        cy.get(textInput('textinput1')).focus(); // start point only — the guarantee is what Tab does next
        cy.focused().should('have.attr', 'data-cy', 'textinput1-input');
        cy.realPress('Tab');
        cy.focused().should('have.attr', 'data-cy', 'textarea1-input');

        cy.realType(first);
        cy.realPress('Enter');
        cy.realType(second);
        cy.get(textAreaSelector.input('textarea1')).should('have.value', `${first}\n${second}`);

        cy.realPress('Tab');
        cy.focused().should('have.attr', 'data-cy', 'textinput2-input');
        cy.get(textAreaSelector.input('textarea1'))
            .should('have.value', `${first}\n${second}`)
            .and(($el) => expect($el.val(), 'no tab character inserted').not.to.include('\t'));

        // Shift+Tab walks back into the field, value intact
        cy.realPress(['Shift', 'Tab']);
        cy.focused().should('have.attr', 'data-cy', 'textarea1-input');
        cy.get(textAreaSelector.input('textarea1')).should('have.value', `${first}\n${second}`);
    });

    it('[TextArea-BRW-004] A disabled Text Area is skipped by Tab and ignores keyboard entry', () => {
        const disabled = textAreaSelector.input('textarea2');
        // disabledState {{true}}. source: textAreaKeyboard.json textarea2
        cy.get(disabled).should('be.disabled').and('have.attr', 'aria-disabled', 'true').and('have.value', '');

        // Tab from the preceding input skips the disabled field
        cy.get(textInput('textinput2')).focus();
        cy.focused().should('have.attr', 'data-cy', 'textinput2-input');
        cy.realPress('Tab');
        cy.focused().should('have.attr', 'data-cy', 'textinput3-input');

        // Shift+Tab from the following input skips it too
        cy.realPress(['Shift', 'Tab']);
        cy.focused().should('have.attr', 'data-cy', 'textinput2-input');

        // a real click + typing cannot focus or fill it
        cy.get(disabled).realClick();
        cy.document().should((doc) =>
            expect(doc.activeElement?.getAttribute('data-cy'), 'focused element').not.to.eq('textarea2-input'));
        cy.realType(fake.firstName); // dynamic: fake
        cy.realPress('Enter');
        cy.get(disabled).should('have.value', '');
    });
});
