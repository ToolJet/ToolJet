/**
 * SPEC — Dropdown (DropdownV2) — userflow facet.
 * FOR AI: TESTING.md browser scenario only:
 *   DropdownV2-BRW-006 — on mobile, a touch scroll of the option list does not close it, a tap selects exactly
 *                        once, and focusing the search box on iOS does not zoom the page
 * Real touch input via CDP (cypress-real-events realTouch / realSwipe) on the viewer's mobile layout with a phone
 * viewport; the iOS guard (CustomMenuList.jsx:76 — 16px font on iPhone/iPad/iPod user agents, the size below
 * which iOS Safari zooms a focused input) is driven by overriding navigator.userAgent before the app boots.
 * History: 064f6fdf82a removed an option onTouchEnd that selected on touch end (double select / closing on
 * scroll); 4f4805721ff added the iOS 16px font.
 * Helpers: addDropdownsViaApi, dropdownOptions, visitDropdownApp, expectDropdownValue, dropdownState,
 * getDropdownState, counterEvent, counterText, expectCounter.
 */
import { fake } from "Fixtures/fake";
import { dropdownV2Selector as S } from "Selectors/appBuilder/components/dropdownV2";
import { dropdownV2Text as T } from "Texts/appBuilder/components/dropdownV2";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import {
    addDropdownsViaApi,
    dropdownOptions,
    visitDropdownApp,
    expectDropdownValue,
    dropdownState,
    getDropdownState,
    waitForStableRect,
} from "Support/utils/appBuilder/components/dropdownV2";

// dynamic: phone viewport — small enough that the runner shows the AUT unscaled: CDP touch points are not
// corrected for the runner's AUT scale (a scaled AUT sends the tap to the wrong element)
const PHONE = { width: 375, height: 600 };
// touch emulation exposes the TouchEvent API (ontouchstart) the way a phone does, so React's onTouchEnd handlers fire
const cdp = (command, params) => Cypress.automation('remote:debugger:protocol', { command, params });
const MOBILE_ONLY = { showOnDesktop: { value: '{{false}}' }, showOnMobile: { value: '{{true}}' } }; // dropdownV2.js:11-12

// scrollBehavior 'center': realTouch / realSwipe scroll their target per Cypress.config('scrollBehavior'); the default
// 'top' tucks the field under the viewer's fixed mobile header, so the touch would land on the header
describe('Dropdown (DropdownV2) — userflow facet', { scrollBehavior: 'center' }, () => {
    let labels;

    beforeEach(() => {
        labels = Array.from({ length: 60 }, (_, i) => `${i} ${fake.firstName.slice(0, 8)}`); // dynamic: long list
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DropdownV2-userflow-${Cypress._.uniqueId()}`);
        cy.then(() =>
            addDropdownsViaApi([
                {
                    name: 'ddm',
                    layout: { top: 200, left: 2, width: 40, height: 40 }, // below the viewer's fixed mobile header
                    others: MOBILE_ONLY,
                    properties: { options: dropdownOptions(labels) },
                    events: [counterEvent('onSelect', 'selects')], // source: dropdownV2.js:160
                },
                { ...counterText('selectcount', 'selects', { top: 280, left: 2, width: 40 }), others: MOBILE_ONLY },
            ])
        );
        cy.viewport(PHONE.width, PHONE.height);
        cy.then(() => cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }));
    });

    // the mobile layout first paints at a placeholder width, then settles to the phone grid
    const waitForMobileLayout = () => {
        dropdownState('ddm', (s) => expect(s.field.width, 'field laid out on the phone grid').to.be.gt(PHONE.width / 2));
        waitForStableRect(S.field('ddm'));
    };

    afterEach(() => {
        cy.then(() => cdp('Emulation.setTouchEmulationEnabled', { enabled: false }));
        cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
        cy.apiDeleteApp();
    });

    it('[DropdownV2-BRW-006] On an iPhone, the menu opens by tap, touch-scrolls without closing, a tap selects once, and the focused search box is 16px (no zoom)', () => {
        visitDropdownApp(S.field('ddm'), { query: '&layout=mobile', userAgent: T.iPhoneUserAgent });
        expectDropdownValue('ddm', T.defaultPlaceholder); // no default option. source: dropdownV2.js:439
        waitForMobileLayout();

        // tap opens the menu (DropdownV2.jsx:568 onTouchEnd)
        cy.get(S.field('ddm')).realTouch();
        cy.get(S.menuList).should('be.visible');
        dropdownState('ddm', (s) => {
            // CustomMenuList.jsx:37-42 focuses the search box on open; iOS zooms inputs under 16px
            expect(s.menu.search.focused, 'search box focused on open').to.eq(true);
            expect(s.menu.search.fontSize, 'search font size on iOS').to.eq(T.iosSearchFontSize);
            expect(s.menu.fontSize, 'menu font size on iOS').to.eq(T.iosSearchFontSize);
            expect(s.viewport.scale, 'page not zoomed').to.eq(1);
        });

        // touch-scroll the option list: it scrolls and stays open
        cy.get(S.menuBody).realSwipe('toTop', { length: 200, step: 20, touchPosition: 'center' });
        dropdownState('ddm', (s) => {
            expect(s.menu, 'menu still open after a touch scroll').to.not.eq(null);
            expect(s.menu.body.scrollTop, 'list scrolled by touch').to.be.gt(40);
        });
        expectCounter('selectcount', 'selects', 0);

        // tap a row that is fully in view → selected exactly once, menu closes
        cy.wait(1000); // dynamic: let the touch fling come to rest before reading row positions
        getDropdownState('ddm').then((s) => {
            const row = s.menu.options.find((o) => o.top >= s.menu.body.top && o.bottom <= s.menu.body.bottom && o.index > 0);
            expect(row, 'a fully visible row').to.exist;
            // touch the row's centre through the scroller (no scrollIntoView of the row itself, which would move
            // the list under the finger while the coordinates are taken)
            cy.get(S.menuBody).realTouch({
                x: row.left + row.width / 2 - s.menu.body.left,
                y: (row.top + row.bottom) / 2 - s.menu.body.top,
            });
            cy.get(S.menuList).should('not.exist');
            expectDropdownValue('ddm', labels[row.index]);
            expectCounter('selectcount', 'selects', 1);
            // the single tap did not toggle the selection off again (a double select clears it, DropdownV2.jsx:583-585)
            cy.wait(500); // dynamic: let any late synthetic events land
            expectDropdownValue('ddm', labels[row.index]);
            expectCounter('selectcount', 'selects', 1);
        });
    });

    it('[DropdownV2-BRW-006] The 16px search font is iOS-only: a non-iOS phone keeps the default size', () => {
        // control for the iOS assertion above — without an iPhone user agent the guard must not apply
        visitDropdownApp(S.field('ddm'), { query: '&layout=mobile' });
        waitForMobileLayout();
        cy.get(S.field('ddm')).realTouch();
        cy.get(S.menuList).should('be.visible');
        dropdownState('ddm', (s) => {
            expect(s.menu.search.fontSize, 'default search font size').to.not.eq(T.iosSearchFontSize);
        });
    });
});
