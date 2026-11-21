/**
 * SPEC — Navigation — styles facet (hover / visual).
 * FOR AI: TESTING.md browser scenario:
 *   Navigation-BRW-003 — a builder-configured caption on a horizontal top-level item that fits in the visible row
 *                        shows as a hover tooltip, not inline text; here: a caption typed in the Inspector's item
 *                        popover, and saved captions in the editor and the running app, with the inline-caption
 *                        branches (vertical orientation, a group's sub-menu, an item overflowed into "More") as the
 *                        controls that prove the tooltip branch is chosen by position, not by the caption itself.
 * Caption branches: Navigation.jsx:42-44 — isHorizontalTopLevel → ToolTip (Navigation.jsx:94-98, react-bootstrap,
 * placement top); otherwise the inline `.nav-item-caption` (Navigation.jsx:81-85). The "More" menu re-renders
 * overflowed items with orientation="vertical" (Navigation.jsx:697-727); group children are rendered isNested.
 * Overflow bucketing in canvas.cy.js; Inspector drag in userflow.cy.js.
 * Helpers: addNavigationsViaApi, openNavigationAppInViewer, openEditorSidebar, setItemCaptionInInspector,
 * expectOverflowBucketing, expectCaptionTooltip, expectInlineCaption, expectNoTooltipOnHover, growingLabels,
 * moveMouseAway.
 */
import { fake } from "Fixtures/fake";
import { navigationSelector } from "Selectors/appBuilder/components/navigation";
import { navigationText } from "Texts/appBuilder/components/navigation";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";
import {
    addNavigationsViaApi,
    openNavigationAppInViewer,
    setItemCaptionInInspector,
    expectOverflowBucketing,
    expectCaptionTooltip,
    expectInlineCaption,
    expectNoTooltipOnHover,
    growingLabels,
} from "Support/utils/appBuilder/components/navigation";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = navigationText;
const AUTO = { navItemSize: { value: T.navItemSizeAuto } };
// captions stay under the 25-letter display cap (Navigation.jsx:29 NAV_TEXT_MAX_LENGTH)
const caption = () => `${fake.firstName} ${fake.lastName}`.replace(/[^A-Za-z ]/g, '').slice(0, 18).trim() || 'Caption';
const label = () => fake.firstName.replace(/[^A-Za-z]/g, '').slice(0, 10) || 'Item';

describe('Navigation — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Navigation-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        moveMouseAway();
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    it('[Navigation-BRW-003] A caption typed in the Inspector for a horizontal top-level item shows as a hover tooltip, not inline text, in the editor and the running app', () => {
        const cap = caption();
        // the default menu (navigation.js:241-290), horizontal (navigation.js:307), wide enough for every item
        addNavigationsViaApi([{ name: 'navcaption', layout: { top: 40, left: 2, width: 24, height: 60 } }]);
        cy.openApp('', undefined, undefined, navigationSelector.root('navcaption'));
        closeQueryPanel();
        expectOverflowBucketing('navcaption', T.defaultTopLevelIds, { context: 'fits' }).then((b) =>
            expect(b.overflow, 'Option 1 is in the visible row').to.deep.eq([])
        );

        openEditorSidebar('navcaption');
        setItemCaptionInInspector('item1', cap);

        expectCaptionTooltip(navigationSelector.item('navcaption', 'item1'), cap);
        // a sibling without a caption gets no tooltip
        expectNoTooltipOnHover(navigationSelector.item('navcaption', 'item2'));

        openNavigationAppInViewer(navigationSelector.root('navcaption'));
        expectCaptionTooltip(navigationSelector.item('navcaption', 'item1'), cap);
        expectNoTooltipOnHover(navigationSelector.item('navcaption', 'item2'));
    });

    it('[Navigation-BRW-003] Saved captions: a fitting horizontal top-level item shows a tooltip, while the same caption is inline in vertical orientation, in a group\'s sub-menu and on an item overflowed into "More"', () => {
        const capTop = caption();
        const capChild = caption();
        const capVertical = caption();
        const capOverflow = caption();
        const narrowLabels = growingLabels(fake.lastName, 4, { start: 8, step: 4 });
        addNavigationsViaApi([
            {
                // horizontal, everything fits: item "top" has a caption, "plain" has none, the group's child has one
                name: 'navhorizontal',
                layout: { top: 40, left: 2, width: 30, height: 50 },
                styles: AUTO,
                properties: {
                    menuItems: {
                        value: [
                            T.menuItem('top', label(), { caption: capTop }),
                            T.menuItem('plain', label()),
                            T.menuGroup('grp', label(), [T.menuItem('child', label(), { caption: capChild })]),
                        ],
                    },
                },
            },
            {
                // the same kind of item in vertical orientation (control: inline caption)
                name: 'navvertical',
                layout: { top: 110, left: 2, width: 10, height: 120 },
                styles: { orientation: { value: T.orientationVertical } },
                properties: { menuItems: { value: [T.menuItem('vtop', label(), { caption: capVertical })] } },
            },
            {
                // horizontal but narrow: the captioned last (widest) item overflows into "More"
                name: 'navnarrow',
                layout: { top: 250, left: 2, width: 9, height: 50 },
                styles: AUTO,
                properties: {
                    menuItems: {
                        value: narrowLabels.map((l, i) =>
                            T.menuItem(`n${i + 1}`, l, i === narrowLabels.length - 1 ? { caption: capOverflow } : {})
                        ),
                    },
                },
            },
        ]);
        const narrowIds = narrowLabels.map((_, i) => `n${i + 1}`);

        const checkAll = (context) => {
            cy.log(`captions — ${context}`);
            expectOverflowBucketing('navhorizontal', ['top', 'plain', 'grp'], { context }).then((b) =>
                expect(b.overflow, `${context}: the captioned item fits`).to.deep.eq([])
            );
            expectCaptionTooltip(navigationSelector.item('navhorizontal', 'top'), capTop);
            expectNoTooltipOnHover(navigationSelector.item('navhorizontal', 'plain'));
            expectInlineCaption(navigationSelector.item('navvertical', 'vtop'), capVertical);
        };
        const checkMenus = (context) => {
            // the group's sub-menu: the child is nested → inline caption
            cy.get(navigationSelector.group('navhorizontal', 'grp')).realClick({ scrollBehavior: false });
            expectInlineCaption(navigationSelector.popupItem('child'), capChild);
            cy.realPress('Escape');
            cy.get(navigationSelector.popup).should('not.exist');

            // the captioned item really overflowed — and in "More" its caption is inline
            expectOverflowBucketing('navnarrow', narrowIds, { context }).then((b) =>
                expect(b.overflow, `${context}: the captioned item overflowed`).to.include(narrowIds[narrowIds.length - 1])
            );
            cy.get(navigationSelector.moreButton('navnarrow')).realClick({ scrollBehavior: false });
            expectInlineCaption(navigationSelector.popupItem(narrowIds[narrowIds.length - 1]), capOverflow);
            cy.realPress('Escape');
            cy.get(navigationSelector.popup).should('not.exist');
        };

        cy.openApp('', undefined, undefined, navigationSelector.root('navnarrow'));
        closeQueryPanel();
        checkAll('editor');

        openNavigationAppInViewer(navigationSelector.root('navnarrow'));
        checkAll('viewer');
        checkMenus('viewer');
    });
});
