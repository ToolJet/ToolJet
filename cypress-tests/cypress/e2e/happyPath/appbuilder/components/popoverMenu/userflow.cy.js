/**
 * SPEC — Popover Menu — userflow facet.
 * FOR AI: TESTING.md browser scenario:
 *   PopoverMenu-BRW-003 — tabbing to the trigger shows an accessible focus-visible outline (commits a4794ef3c8 /
 *                         0a85c3ae58): CustomButton.jsx:160 focus-visible:tw-outline tw-outline-2
 *                         tw-outline-interactive-focus-outline tw-outline-offset-2.
 * The ring is checked as painted: :focus-visible matches, a solid 2px outline 2px off the button in the
 * --interactive-focus-outline colour, the 4px ring band fully inside the nearest overflow-clipping ancestor; with control
 * steps proving it is absent before focus, moves with focus and goes away on blur; a second case checks the Enter → Escape round trip
 * hands focus (and the ring) back to the trigger.
 * Helpers: addPopoverMenusViaApi, openPopoverMenuInViewer, popoverMenuState, tabToPopoverMenu,
 * moveMouseAway, resolveCssVarColor.
 */
import { fake } from "Fixtures/fake";
import { popoverMenuSelector as S } from "Selectors/appBuilder/components/popoverMenu";
import { popoverMenuText as T } from "Texts/appBuilder/components/popoverMenu";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";
import {
    addPopoverMenusViaApi,
    openPopoverMenuInViewer,
    popoverMenuState,
    tabToPopoverMenu,
} from "Support/utils/appBuilder/components/popoverMenu";

const PX = 1; // sub-pixel: at column 0 the ring has 3.5px of room for its 4px band (outer 0.5px antialiased)
const RING = parseFloat(T.focusOutlineWidth) + parseFloat(T.focusOutlineOffset); // band the outline paints outside the box

const expectRing = (name, ringColor, at) =>
    popoverMenuState(name, (s) => {
        const t = s.trigger;
        expect(t.focused, `${at}: ${name} trigger has focus`).to.eq(true);
        expect(t.focusVisible, `${at}: :focus-visible`).to.eq(true);
        expect(t.outlineStyle, `${at}: outline style`).to.eq('solid'); // source: CustomButton.jsx:160
        expect(t.outlineWidth, `${at}: outline width`).to.eq(T.focusOutlineWidth);
        expect(t.outlineOffset, `${at}: outline offset`).to.eq(T.focusOutlineOffset);
        expect(t.outlineColor, `${at}: outline colour`).to.eq(ringColor);
        // the whole ring band lies inside the nearest clipping ancestor (it is not cut off)
        expect(t.clip, `${at}: clipping ancestor`).to.not.eq(null);
        expect(t.left - RING, `${at}: ring left edge visible`).to.be.gte(t.clip.left - PX);
        expect(t.right + RING, `${at}: ring right edge visible`).to.be.lte(t.clip.right + PX);
        expect(t.top - RING, `${at}: ring top edge visible`).to.be.gte(t.clip.top - PX);
        expect(t.bottom + RING, `${at}: ring bottom edge visible`).to.be.lte(t.clip.bottom + PX);
    });

const expectNoRing = (name, at) =>
    popoverMenuState(name, (s) => {
        expect(s.trigger.focusVisible, `${at}: ${name} not :focus-visible`).to.eq(false);
        expect(s.trigger.outlineStyle, `${at}: ${name} no outline`).to.eq('none');
    });

describe('Popover Menu — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PopoverMenu-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        moveMouseAway();
        cy.apiDeleteApp();
    });

    // ── PopoverMenu-BRW-003 ──────────────────────────────────────────────────
    it('[PopoverMenu-BRW-003] Tabbing to the trigger paints a visible, unclipped focus-visible outline that follows focus', () => {
        addPopoverMenusViaApi([
            // left column 0 → the trigger sits as close to the canvas edge as a widget can (worst case for clipping)
            { name: 'pmfirst', layout: { top: 20, left: 0 } },
            { name: 'pmoutline', layout: { top: 20, left: 10 }, properties: { buttonType: { value: T.buttonTypeOutline } } }, // source: popoverMenu.js:27
        ]);
        openPopoverMenuInViewer(S.trigger('pmoutline'));
        moveMouseAway();

        resolveCssVarColor(T.tokens.focusOutline, S.draggableWidget('pmfirst')).then((ring) => {
            expect(ring, 'focus-outline token resolves').to.match(/^rgb/);
            expect(ring, 'ring is not transparent').to.not.eq(T.transparent);

            // control: no ring before the keyboard reaches the widget
            expectNoRing('pmfirst', 'before focus');
            expectNoRing('pmoutline', 'before focus');

            tabToPopoverMenu('pmfirst');
            expectRing('pmfirst', ring, 'Tab → primary');
            expectNoRing('pmoutline', 'Tab → primary');

            // the ring moves with focus
            cy.realPress('Tab');
            expectRing('pmoutline', ring, 'Tab → outline');
            expectNoRing('pmfirst', 'Tab → outline');
            cy.realPress(['Shift', 'Tab']);
            expectRing('pmfirst', ring, 'Shift+Tab → primary');

            // control: clicking empty canvas blurs the trigger and the ring goes away
            cy.get('body').realClick({ x: 1000, y: 700 });
            expectNoRing('pmfirst', 'after blur');
        });
    });

    // ── PopoverMenu-BRW-003 — keyboard round trip ────────────────────────────
    // KNOWN PRODUCT BUG (kept red): Escape closes the menu but focus drops to <body> — Radix returns focus to the
    // Popover.Trigger, which is the non-focusable `popover-menu-button-container` div (PopoverMenu.jsx:191 asChild →
    // CustomButton.jsx:145 ref), not the <button>; the next Tab restarts from the top of the page.
    it('[PopoverMenu-BRW-003] After Enter opens the menu from the keyboard, Escape hands focus back to the trigger with its focus-visible outline', () => {
        addPopoverMenusViaApi([
            { name: 'pmfirst', layout: { top: 20, left: 2 } },
            { name: 'pmnext', layout: { top: 20, left: 12 } },
        ]);
        openPopoverMenuInViewer(S.trigger('pmnext'));
        moveMouseAway();
        resolveCssVarColor(T.tokens.focusOutline, S.draggableWidget('pmfirst')).then((ring) => {
            tabToPopoverMenu('pmfirst');
            expectRing('pmfirst', ring, 'Tab → trigger');

            // Enter activates the native button (CustomButton.jsx:166-178) → the menu opens and focus moves into it
            cy.realPress('Enter');
            popoverMenuState('pmfirst', (s) => {
                expect(s.menu, 'Enter opened the menu').to.not.eq(null);
                expect(s.trigger.focused, 'focus moved into the menu').to.eq(false);
            });
            cy.focused().should('have.attr', 'role', 'option');

            // Escape closes it (PopoverMenu.jsx:225) — focus must come back to the trigger, ring painted
            cy.realPress('Escape');
            cy.get(S.content).should('not.exist');
            cy.document().should((doc) => {
                const el = doc.activeElement;
                const where = el === doc.body ? 'body' : `${el.tagName.toLowerCase()} in ${el.closest('[data-cy^="draggable-widget-"]')?.getAttribute('data-cy')}`;
                expect(where, 'focus after Escape').to.eq('button in draggable-widget-pmfirst');
            });
            expectRing('pmfirst', ring, 'after Escape');
            // and keyboard navigation continues from there
            cy.realPress('Tab');
            expectRing('pmnext', ring, 'Tab after Escape');
        });
    });
});
