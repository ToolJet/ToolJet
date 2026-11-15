/**
 * SPEC — Multi Select (MultiselectV2) — userflow facet.
 * FOR AI: TESTING.md browser scenarios only:
 *   MultiselectV2-BRW-006 — on a touch device one tap opens the menu, a second tap closes it, a tap never toggles
 *                           twice and a tap inside the menu never closes it
 *   MultiselectV2-BRW-007 — opening puts the caret in the search box; with the search box off, focus goes to the
 *                           control so the keyboard still works
 *   MultiselectV2-BRW-008 — with two Multi Selects on a page the caret goes to the OPENED widget's search box for
 *                           every interleaving of opens (click, keyboard, touch)
 * Real input only: CDP touch (cypress-real-events realTouch) on the viewer's mobile layout with a phone viewport,
 * real keystrokes (realPress / realType). The open-focus lookup is a document-wide
 * `querySelector('.dropdown-multiselect-widget-search-box')` (DropdownV2/CustomMenuList.jsx:37-42), so whichever
 * menu is first in the document gets the caret.
 * History: 064f6fdf82a removed an option onTouchEnd that double-toggled / closed the menu on mobile.
 * Helpers: addMultiselectsViaApi, multiselectOptions, multiselectValues, visitMultiselectApp, openMultiselectMenu,
 * multiselectState, getMultiselectState, waitForStableRect, counterEvent, counterText, expectCounter,
 * resolveCssVarColor.
 */
import { fake } from "Fixtures/fake";
import { multiselectV2Selector as S } from "Selectors/appBuilder/components/multiselectV2";
import { multiselectV2Text as T } from "Texts/appBuilder/components/multiselectV2";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import { waitForStableRect } from "Support/utils/appBuilder/components/dropdownV2";
import {
    addMultiselectsViaApi,
    multiselectOptions,
    multiselectValues,
    visitMultiselectApp,
    openMultiselectMenu,
    multiselectState,
    getMultiselectState,
} from "Support/utils/appBuilder/components/multiselectV2";

// dynamic: phone viewport — small enough that the runner shows the AUT unscaled: CDP touch points are not
// corrected for the runner's AUT scale (a scaled AUT sends the tap to the wrong element)
const PHONE = { width: 375, height: 600 };
// touch emulation exposes the TouchEvent API (ontouchstart) the way a phone does, so React's onTouchEnd handlers fire
const cdp = (command, params) => Cypress.automation('remote:debugger:protocol', { command, params });
const MOBILE_ONLY = { showOnDesktop: { value: '{{false}}' }, showOnMobile: { value: '{{true}}' } }; // multiselectV2.js:11-12
const settle = () => cy.wait(500); // dynamic: let any late synthetic (compat mouse) events land

describe('Multi Select (MultiselectV2) — userflow facet', () => {
    // ── touch ────────────────────────────────────────────────────────────────
    // scrollBehavior 'center': realTouch scrolls its target per Cypress.config('scrollBehavior'); the default 'top'
    // tucks the field under the viewer's fixed mobile header, so the touch would land on the header
    describe('touch', { scrollBehavior: 'center' }, () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-MultiselectV2-userflow-${Cypress._.uniqueId()}`);
            // ?layout=mobile stacks the widgets in one column by their top — one vertical lane
            cy.then(() =>
                addMultiselectsViaApi([
                    {
                        name: 'msa',
                        layout: { top: 200, left: 2, width: 40, height: 40 },
                        others: MOBILE_ONLY,
                        events: [counterEvent('onFocus', 'opens'), counterEvent('onBlur', 'closes'), counterEvent('onSelect', 'selects')], // source: multiselectV2.js:238-241
                    },
                    { name: 'msb', layout: { top: 280, left: 2, width: 40, height: 40 }, others: MOBILE_ONLY },
                    { ...counterText('opencount', 'opens', { top: 360, left: 2, width: 40 }), others: MOBILE_ONLY },
                    { ...counterText('closecount', 'closes', { top: 440, left: 2, width: 40 }), others: MOBILE_ONLY },
                    { ...counterText('selectcount', 'selects', { top: 520, left: 2, width: 40 }), others: MOBILE_ONLY },
                ])
            );
            cy.viewport(PHONE.width, PHONE.height);
            cy.then(() => cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }));
            visitMultiselectApp(S.field('msa'), { query: '&layout=mobile' });
            // the mobile layout first paints at a placeholder width, then settles to the phone grid
            multiselectState('msa', (s) => expect(s.field.width, 'field laid out on the phone grid').to.be.gt(PHONE.width / 2));
            waitForStableRect(S.field('msa'));
        });

        afterEach(() => {
            cy.then(() => cdp('Emulation.setTouchEmulationEnabled', { enabled: false }));
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiDeleteApp();
        });

        const counts = (opens, closes, selects) => {
            expectCounter('opencount', 'opens', opens);
            expectCounter('closecount', 'closes', closes);
            expectCounter('selectcount', 'selects', selects);
        };

        it('[MultiselectV2-BRW-006] One tap opens the menu, a tap on a row toggles it once without closing, a second tap on the field closes it', () => {
            cy.get(S.summary('msa')).should('have.text', T.defaultSummary); // values ['1','2']. source: multiselectV2.js:424

            // tap → opens exactly once (MultiselectV2.jsx:569-570 click + touch end both bound)
            cy.get(S.field('msa')).realTouch();
            settle();
            multiselectState('msa', (s) => expect(s.menu, 'menu open after one tap').to.not.eq(null));
            counts(1, 0, 0);

            // tap a row inside the menu → that option toggles once, the menu stays open
            getMultiselectState('msa').then((s) => {
                const row = s.menu.options.find((o) => o.text === T.option3);
                expect(row, 'option3 row').to.exist;
                cy.get(`${S.menu(s.id)} ${S.menuBody}`).realTouch({
                    x: row.left + row.width / 2 - s.menu.body.left,
                    y: (row.top + row.bottom) / 2 - s.menu.body.top,
                });
            });
            settle();
            // option3 added once → all three selected → the "All items are selected." summary (multiselectV2.js:431);
            // a double toggle would have left "option1, option2"
            cy.get(S.summary('msa')).should('have.text', T.allSelectedSummary);
            multiselectState('msa', (s) => expect(s.menu, 'menu still open after a tap inside it').to.not.eq(null));
            counts(1, 0, 1);

            // second tap on the field → closes exactly once
            cy.get(S.field('msa')).realTouch();
            settle();
            multiselectState('msa', (s) => expect(s.menu, 'menu closed after the second tap').to.eq(null));
            counts(1, 1, 1);
            cy.get(S.summary('msa')).should('have.text', T.allSelectedSummary);
        });

        // Defect probe (TESTING.md asks QA to report any interleaving that sends the caret into another widget's menu):
        // a tap fires no mousedown, so the open menu B is not closed (its outside-click listener is mousedown-only,
        // MultiselectV2.jsx:365-378,410-415), and A's menu mounts after B's → the document-wide lookup focuses B's box.
        it('[MultiselectV2-BRW-008] Tapping a second Multi Select while one is open puts the caret in the tapped widget\'s search box', () => {
            cy.get(S.field('msb')).realTouch();
            multiselectState('msb', (s) => {
                expect(s.menu, 'msb open').to.not.eq(null);
                expect(s.focus.menuOf, 'caret in msb\'s box').to.eq('msb');
            });
            cy.get(S.field('msa')).realTouch();
            settle();
            multiselectState('msa', (s) => {
                expect(s.menu, 'msa open').to.not.eq(null);
                expect({ caretIn: s.focus.menuOf, isSearch: s.focus.isSearch }, 'caret after tapping msa').to.deep.eq({ caretIn: 'msa', isSearch: true });
            });
        });
    });

    // ── desktop ──────────────────────────────────────────────────────────────
    describe('desktop', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-MultiselectV2-userflow-${Cypress._.uniqueId()}`);
            cy.get('body').realHover({ position: 'bottomRight' });
            cy.then(() =>
                addMultiselectsViaApi([
                    { name: 'msa', layout: { top: 40, left: 2, width: 12, height: 40 } },
                    { name: 'msb', layout: { top: 40, left: 20, width: 12, height: 40 } },
                    // search box off (multiselectV2.js:166-171), nothing selected
                    {
                        name: 'msns',
                        layout: { top: 120, left: 2, width: 12, height: 40 },
                        properties: { showSearchInput: { value: '{{false}}' }, values: multiselectValues([]) },
                    },
                ])
            );
            visitMultiselectApp(S.field('msa'));
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── MultiselectV2-BRW-007 ────────────────────────────────────────────
        it('[MultiselectV2-BRW-007] Opening puts the caret in the search box and typing filters straight away', () => {
            openMultiselectMenu('msa');
            multiselectState('msa', (s) => {
                expect(s.menu.search, 'search box rendered').to.not.eq(null);
                expect({ caretIn: s.focus.menuOf, isSearch: s.focus.isSearch }, 'caret on open').to.deep.eq({ caretIn: 'msa', isSearch: true });
            });
            cy.realType(T.option3.slice(-1)); // dynamic: '3' — matches only option3
            multiselectState('msa', (s) => {
                expect(s.menu.search.value, 'typed into the search box').to.eq(T.option3.slice(-1));
                expect(s.menu.options.map((o) => o.text), 'list filtered').to.deep.eq([T.option3]);
            });
        });

        it('[MultiselectV2-BRW-007] With the search box off, opening focuses the control and the keyboard selects', () => {
            openMultiselectMenu('msns');
            multiselectState('msns', (s) => {
                expect(s.menu.search, 'no search box').to.eq(null);
                expect({ widget: s.focus.widget, isCombobox: s.focus.isCombobox }, 'focus on open').to.deep.eq({ widget: 'msns', isCombobox: true });
                expect(s.placeholder.text, 'nothing selected yet').to.eq(T.defaultPlaceholder);
            });
            cy.realPress('ArrowDown');
            resolveCssVarColor(T.optionHoverVar, S.field('msns')).then((hoverFill) =>
                getMultiselectState('msns').then((s) => {
                    const highlighted = s.menu.options.filter((o) => o.backgroundColor === hoverFill);
                    expect(highlighted, 'one keyboard-highlighted row').to.have.length(1);
                    cy.realPress('Enter');
                    cy.get(S.summary('msns')).should('have.text', highlighted[0].text);
                    multiselectState('msns', (after) => {
                        expect(after.menu, 'menu stays open').to.not.eq(null);
                        expect(after.focus.widget, 'focus kept on the control').to.eq('msns');
                    });
                })
            );
        });

        // ── MultiselectV2-BRW-008 ────────────────────────────────────────────
        it('[MultiselectV2-BRW-008] Clicking one Multi Select, then another, puts the caret in each opened widget\'s own box', () => {
            openMultiselectMenu('msa');
            multiselectState('msa', (s) => expect(s.focus.menuOf, 'caret in msa\'s box').to.eq('msa'));
            // clicking msb: msa's outside-mousedown listener closes msa before msb's menu mounts
            openMultiselectMenu('msb');
            multiselectState('msb', (s) => {
                expect(s.openMenus, 'only msb open').to.deep.eq(['msb']);
                expect({ caretIn: s.focus.menuOf, isSearch: s.focus.isSearch }).to.deep.eq({ caretIn: 'msb', isSearch: true });
            });
            cy.realType(T.option1.slice(-1)); // dynamic: '1'
            multiselectState('msb', (s) => expect(s.menu.search.value, 'typed text lands in msb').to.eq(T.option1.slice(-1)));
        });

        // Defect probe: keyboard focus can reach msa while msb's menu stays open (no mousedown); Enter opens msa
        // (MultiselectV2.jsx:622-627), msa's menu mounts after msb's, and the document-wide lookup focuses msb's box.
        it('[MultiselectV2-BRW-008] Opening a second Multi Select from the keyboard while one is open puts the caret in the opened widget\'s box', () => {
            openMultiselectMenu('msb');
            multiselectState('msb', (s) => expect(s.focus.menuOf, 'caret in msb\'s box').to.eq('msb'));
            // Shift+Tab back from msb's search box through msb's control to msa's control (no mousedown → msb stays open)
            shiftTabUntilFocused('msa');
            multiselectState('msa', (s) => {
                expect({ widget: s.focus.widget, isCombobox: s.focus.isCombobox }, 'keyboard focus on msa').to.deep.eq({ widget: 'msa', isCombobox: true });
                expect(s.openMenus, 'msb still open').to.deep.eq(['msb']);
            });
            cy.realPress('Enter');
            multiselectState('msa', (s) => expect(s.menu, 'msa opened').to.not.eq(null));
            cy.realType(T.option1.slice(-1)); // dynamic: '1'
            getMultiselectState('msa').then((a) =>
                getMultiselectState('msb').then((b) =>
                    expect(
                        { caretIn: a.focus.menuOf, msaSearch: a.menu.search.value, msbSearch: b.menu ? b.menu.search.value : null },
                        'caret and typed text after opening msa'
                    ).to.deep.eq({ caretIn: 'msa', msaSearch: T.option1.slice(-1), msbSearch: b.menu ? '' : null })
                )
            );
        });
    });
});

// presses Shift+Tab (real keystrokes) until keyboard focus is inside the named widget's box
function shiftTabUntilFocused(name, triesLeft = 5) {
    cy.realPress(['Shift', 'Tab']);
    getMultiselectState(name).then((s) => {
        if (s.focus.widget !== name) {
            expect(triesLeft, `Shift+Tab reaches ${name}`).to.be.gt(0);
            shiftTabUntilFocused(name, triesLeft - 1);
        }
    });
}
