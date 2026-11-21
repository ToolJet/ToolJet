/**
 * SPEC — Text — userflow facet.
 * FOR AI: TESTING.md browser scenario only:
 *   Text-BRW-005 — a Text wired to an On click handler can be reached and activated without a mouse
 * Text.jsx:204-217 renders the clickable Text as a plain `div` with onClick (no role, no tabIndex, no key handler —
 * D-11). The app places the Text between two TextInputs in tab order; real Tab presses (CDP) walk the focus and
 * Enter / Space must run the On click handler (an app-variable counter).
 * Helpers: addTextsViaApi, counterEvent, counterText, expectCounter, openIconAppInViewer, tabFrom.
 */
import { fake } from "Fixtures/fake";
import { textSelector } from "Selectors/appBuilder/components/text";
import { textText } from "Texts/appBuilder/components/text";
import { counterEvent, counterText, expectCounter, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import { tabFrom } from "Support/utils/appBuilder/components/html";
import { addTextsViaApi } from "Support/utils/appBuilder/components/text";

const T = textText;

describe('Text — userflow facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Text-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Text-BRW-005 ─────────────────────────────────────────────────────────
    it('[Text-BRW-005] A clickable Text is reached with Tab and activated with Enter and Space', () => {
        const label = fake.firstName.replace(/[^A-Za-z]/g, '').slice(0, 10) || 'Open'; // dynamic: Text content
        addTextsViaApi([
            { type: 'TextInput', name: 'first', layout: { top: 20, left: 2, width: 8, height: 40 } },
            {
                name: 'clickable',
                layout: { top: 20, left: 12, width: 8, height: 40 },
                properties: { textFormat: { value: T.formats.plainText }, text: { value: label } },
                events: [counterEvent('onClick', 'clicks')], // source: text.js:106
            },
            { type: 'TextInput', name: 'last', layout: { top: 20, left: 22, width: 8, height: 40 } },
            counterText('clickcount', 'clicks', { top: 100, left: 2 }),
        ]);
        openIconAppInViewer(textSelector.root('clickable'));
        cy.get(textSelector.scroller('clickable')).should('have.text', label);

        // control: the handler is wired — a pointer click counts
        cy.get(textSelector.root('clickable')).realClick();
        expectCounter('clickcount', 'clicks', 1);

        // keyboard: Tab from the first input reaches the clickable Text before the next input
        // (reaching `last` proves the Tab presses themselves work)
        tabFrom(textSelector.textInput('first'), 2).should('deep.equal', ['clickable', 'last']);

        // Enter and Space on the focused Text run On click
        tabFrom(textSelector.textInput('first'), 1).should('deep.equal', ['clickable']);
        cy.realPress('Enter');
        expectCounter('clickcount', 'clicks', 2);
        cy.realPress('Space');
        expectCounter('clickcount', 'clicks', 3);
    });
});
