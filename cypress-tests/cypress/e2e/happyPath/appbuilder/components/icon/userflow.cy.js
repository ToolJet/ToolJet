/**
 * SPEC — Icon — userflow facet (keyboard).
 * FOR AI: TESTING.md browser scenario:
 *   Icon-BRW-004 — records the accepted D-03 baseline: the Icon click surface is absent from the tab order and
 *                  Enter / Space do not activate it. This pins today's gap for follow-up; it is NOT a desirable
 *                  invariant — an accessibility fix must replace this test with a positive keyboard contract.
 * The click surface is the `.icon-widget` root (D-07, Icon.jsx:97-118): no role, tabIndex or key handler.
 * Tab order is proven live first (text input → text input across the Icon), so "skipped" is not a dead Tab.
 * Helpers: addIconsViaApi, openIconAppInViewer, counterEvent, counterText, expectCounter.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { iconSelector } from "Selectors/appBuilder/components/icon";
import { iconText } from "Texts/appBuilder/components/icon";
import {
    addIconsViaApi,
    openIconAppInViewer,
    counterEvent,
    counterText,
    expectCounter,
} from "Support/utils/appBuilder/components/icon";

const T = iconText;
const inputOf = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;
const activeInside = (selector) =>
    cy.document().then((doc) => {
        const a = doc.activeElement;
        return !!(a && a.closest && a.closest(selector));
    });

describe('Icon — userflow facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Icon-userflow-${Cypress._.uniqueId()}`);
        // reading order: input → Icon (with onClick) → input
        addIconsViaApi([
            { type: 'TextInput', name: 'textinput1', layout: { top: 40, left: 2, width: 8, height: 40 } },
            {
                name: 'icon1',
                layout: { top: 40, left: 12, width: 5, height: 48 },
                events: [counterEvent(T.eventOnClick, 'clicks')], // icon.js:77
            },
            { type: 'TextInput', name: 'textinput2', layout: { top: 40, left: 20, width: 8, height: 40 } },
            counterText('clickcount', 'clicks', { top: 140, left: 2 }),
        ]);
        openIconAppInViewer(iconSelector.svg('icon1'));
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Icon-BRW-004 ─────────────────────────────────────────────────────────
    it('[Icon-BRW-004] Baseline (D-03): the clickable Icon has no keyboard semantics and Tab skips it', () => {
        // no button semantics on the click surface or the glyph
        cy.get(iconSelector.root('icon1')).should(($root) => {
            expect($root.attr('role'), 'root role').to.be.undefined;
            expect($root.attr('tabindex'), 'root tabindex').to.be.undefined;
            expect($root.attr('aria-label'), 'root accessible name').to.be.undefined;
            expect($root[0].tabIndex, 'root not focusable').to.eq(-1);
            expect($root.hasClass('cursor-pointer'), 'yet it looks clickable (D-05)').to.eq(true);
        });
        cy.get(iconSelector.svg('icon1')).should(($svg) => {
            expect($svg.attr('tabindex'), 'svg tabindex').to.be.undefined;
            expect($svg[0].tabIndex, 'svg not focusable').to.eq(-1);
        });
        // focusing it programmatically does nothing either
        cy.get(iconSelector.root('icon1')).then(($root) => $root[0].focus());
        activeInside(iconSelector.root('icon1')).should('eq', false);

        // Tab works on the page: it moves input → input, straight across the Icon, and back with Shift+Tab
        cy.get(inputOf('textinput1')).click();
        cy.focused().should('match', inputOf('textinput1'));
        cy.realPress('Tab');
        cy.focused().should('match', inputOf('textinput2'));
        cy.realPress(['Shift', 'Tab']);
        cy.focused().should('match', inputOf('textinput1'));

        // a full Tab walk from the document start never lands inside the Icon
        cy.focused().blur();
        Cypress._.times(8, () => {
            cy.realPress('Tab');
            activeInside(iconSelector.root('icon1')).should('eq', false);
        });
    });

    it('[Icon-BRW-004] Baseline (D-03): Enter and Space never activate the Icon; only a pointer click does', () => {
        // keys pressed with nothing focused, and after Tab-ing past the Icon, dispatch nothing
        cy.realPress('Enter');
        cy.realPress('Space');
        cy.get(inputOf('textinput1')).click();
        cy.realPress('Tab');
        cy.focused().should('match', inputOf('textinput2'));
        cy.realPress('Enter');
        cy.wait(800); // dynamic: time for a (wrong) dispatch to land
        expectCounter('clickcount', 'clicks', 0);

        // a real pointer click fires onClick once and leaves focus off the Icon …
        cy.get(iconSelector.svg('icon1')).realClick({ scrollBehavior: false });
        expectCounter('clickcount', 'clicks', 1);
        activeInside(iconSelector.root('icon1')).should('eq', false);
        // … so Enter / Space right after the click still do not activate it
        cy.realPress('Enter');
        cy.realPress('Space');
        cy.wait(800); // dynamic
        expectCounter('clickcount', 'clicks', 1);
    });
});
