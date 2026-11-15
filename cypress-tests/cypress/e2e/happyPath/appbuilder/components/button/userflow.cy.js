/**
 * SPEC — Button — userflow facet (keyboard).
 * FOR AI: TESTING.md browser scenario:
 *   Button-BRW-009 — the button is focusable and activates on Enter/Space; a disabled (or loading) button is not
 *                    focusable and never activates.
 * Button.jsx:212-237 renders a real <button> with native `disabled={disable || loading}` (removes it from the tab
 * order and blocks Enter/Space) and a `focus-visible` outline. Tab order is proven live first (text input → button
 * → text input), so "skipped" is never a dead Tab. onClick dispatches are counted through an app variable.
 * Helpers: addButtonsViaApi, openIconAppInViewer, counterEvent, counterText, expectCounter, pointerAway.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { buttonSelector } from "Selectors/appBuilder/components/button";
import { buttonText } from "Texts/appBuilder/components/button";
import { addButtonsViaApi, pointerAway } from "Support/utils/appBuilder/components/button";
import {
    openIconAppInViewer,
    counterEvent,
    counterText,
    expectCounter,
} from "Support/utils/appBuilder/components/icon";

const T = buttonText;
const SEL = buttonSelector;
const inputOf = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;

describe('Button — userflow facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Button-userflow-${Cypress._.uniqueId()}`);
        // reading order on one row: input → enabled button → input → disabled button → input → loading button → input
        const row = (left, width = 5) => ({ top: 40, left, width, height: 40 });
        addButtonsViaApi([
            { type: 'TextInput', name: 'textinput1', layout: row(0) },
            { name: 'enabled', layout: row(5), events: [counterEvent(T.eventOnClick, 'clicks')] }, // button.js:70
            { type: 'TextInput', name: 'textinput2', layout: row(11) },
            {
                name: 'disabled',
                layout: row(16),
                properties: { disabledState: { value: '{{true}}' } },
                events: [counterEvent(T.eventOnClick, 'dclicks')],
            },
            { type: 'TextInput', name: 'textinput3', layout: row(22) },
            {
                name: 'loading',
                layout: row(27),
                properties: { loadingState: { value: '{{true}}' } },
                events: [counterEvent(T.eventOnClick, 'lclicks')],
            },
            { type: 'TextInput', name: 'textinput4', layout: row(33) },
            counterText('clickcount', 'clicks', { top: 140, left: 0 }),
            counterText('dclickcount', 'dclicks', { top: 140, left: 10 }),
            counterText('lclickcount', 'lclicks', { top: 140, left: 20 }),
        ]);
        openIconAppInViewer(SEL.button('enabled'));
        pointerAway();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Button-BRW-009 (enabled) ─────────────────────────────────────────────
    it('[Button-BRW-009] Tab focuses the button with a visible focus ring; Enter and Space activate it', () => {
        cy.get(inputOf('textinput1')).click();
        cy.focused().should('match', inputOf('textinput1'));
        cy.realPress('Tab');
        cy.focused().should('match', SEL.button('enabled'));
        // keyboard focus paints the focus-visible outline (Button.jsx:216)
        cy.get(SEL.button('enabled')).should(($b) => {
            const cs = $b[0].ownerDocument.defaultView.getComputedStyle($b[0]);
            expect($b[0].matches(':focus-visible'), ':focus-visible').to.eq(true);
            expect({ style: cs.outlineStyle, width: cs.outlineWidth }, 'focus outline').to.deep.eq({ style: 'solid', width: '2px' });
        });

        cy.realPress('Enter');
        expectCounter('clickcount', 'clicks', 1);
        cy.focused().should('match', SEL.button('enabled'));
        cy.realPress('Space');
        expectCounter('clickcount', 'clicks', 2);

        // Tab moves on to the next input, Shift+Tab comes back to the button
        cy.realPress('Tab');
        cy.focused().should('match', inputOf('textinput2'));
        cy.realPress(['Shift', 'Tab']);
        cy.focused().should('match', SEL.button('enabled'));
        cy.realPress('Enter');
        expectCounter('clickcount', 'clicks', 3);
    });

    // ── Button-BRW-009 (disabled / loading) ──────────────────────────────────
    it('[Button-BRW-009] A disabled or loading button is skipped by Tab and never activates from the keyboard', () => {
        cy.get(SEL.button('disabled')).should('be.disabled').and('have.attr', 'aria-disabled', 'true');
        cy.get(SEL.button('loading')).should('be.disabled').and('have.attr', 'aria-busy', 'true');

        // Tab walks input → input straight across the disabled button …
        cy.get(inputOf('textinput2')).click();
        cy.realPress('Tab');
        cy.focused().should('match', inputOf('textinput3'));
        // … and across the loading button
        cy.realPress('Tab');
        cy.focused().should('match', inputOf('textinput4'));
        cy.realPress(['Shift', 'Tab']);
        cy.focused().should('match', inputOf('textinput3'));

        // programmatic focus cannot land on them either, so Enter / Space go nowhere
        ['disabled', 'loading'].forEach((name) => {
            cy.get(SEL.button(name)).then(($b) => $b[0].focus());
            cy.document().should((doc) =>
                expect(!!doc.activeElement && doc.activeElement.matches(SEL.button(name)), `${name} focused`).to.eq(false)
            );
            cy.realPress('Enter');
            cy.realPress('Space');
        });
        cy.wait(800); // dynamic: time for a (wrong) dispatch to land
        expectCounter('dclickcount', 'dclicks', 0);
        expectCounter('lclickcount', 'lclicks', 0);

        // control: the same keys on the enabled button do dispatch
        cy.get(SEL.button('enabled')).then(($b) => $b[0].focus());
        cy.focused().should('match', SEL.button('enabled'));
        cy.realPress('Enter');
        expectCounter('clickcount', 'clicks', 1);
    });
});
