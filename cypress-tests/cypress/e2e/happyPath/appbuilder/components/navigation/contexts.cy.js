/**
 * SPEC — Navigation — contexts facet.
 * FOR AI: always-on contexts (no TESTING.md browser scenario lands here): Show on desktop / Show on mobile vs
 * Visibility on the editor layouts and in the editor, preview and released app on desktop and a phone, plus the
 * exposed selectedItem / previousSelectedItem values resolving in a binding in the editor and the running app.
 * Device gate: WidgetWrapper.jsx — a widget whose others.showOn<Layout> is false is not rendered at all.
 * Visibility: Navigation.jsx:568 sets the `.navigation-widget` root display:none (the RenderWidget box stays).
 * Overflow (BRW-001) in canvas.cy.js; caption tooltip (BRW-003) in styles.cy.js; Inspector drag (BRW-002) in
 * userflow.cy.js.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, releaseAndMakePublic,
 * addNavigationsViaApi, openNavigationAppInViewer, navRowBoxes, expectGroupMenu.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { navigationSelector } from "Selectors/appBuilder/components/navigation";
import { navigationText } from "Texts/appBuilder/components/navigation";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import {
    addNavigationsViaApi,
    openNavigationAppInViewer,
    navRowBoxes,
} from "Support/utils/appBuilder/components/navigation";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = navigationText;
const W = T.defaultWidgetName;
const OFF = { value: '{{false}}' }; // navigation.js:237-238 toggle values
const ON = { value: '{{true}}' };

// saved device × visibility combinations (others.showOnDesktop / showOnMobile — navigation.js:10-13, defaults
// navigation.js:237-238; properties.visibility — navigation.js:21-26, default navigation.js:292)
const DEVICE_WIDGETS = [
    { name: 'desktoponly', others: {} }, // defaults: desktop on, mobile off
    { name: 'mobileonly', others: { showOnDesktop: OFF, showOnMobile: ON } },
    { name: 'bothdevices', others: { showOnMobile: ON } },
    { name: 'nodevice', others: { showOnDesktop: OFF } },
    // device flags on everywhere but visibility off: rendered on both layouts, never shown
    { name: 'hiddenboth', others: { showOnMobile: ON }, properties: { visibility: OFF } },
    // visibility on cannot override a device flag that is off
    { name: 'visiblenomobile', others: {}, properties: { visibility: ON } },
];
// shown = rendered + displayed; hidden = rendered, root display:none; absent = not rendered at all
const EXPECTED = {
    desktop: {
        desktoponly: 'shown', mobileonly: 'absent', bothdevices: 'shown', nodevice: 'absent',
        hiddenboth: 'hidden', visiblenomobile: 'shown',
    },
    mobile: {
        desktoponly: 'absent', mobileonly: 'shown', bothdevices: 'shown', nodevice: 'absent',
        hiddenboth: 'hidden', visiblenomobile: 'absent',
    },
};
const expectState = (name, state, context = '') => {
    if (state === 'absent') {
        cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
        return;
    }
    navRowBoxes(name, (b) => {
        expect(b.root, `${name}: navigation root rendered (${context})`).to.not.eq(null);
        if (state === 'shown') {
            expect(b.display, `${name}: displayed (${context})`).to.eq('flex');
            expect(b.root.height, `${name}: painted`).to.be.gt(0);
            // every default top-level entry is reachable: in the row, or behind "More" on a narrow layout
            expect(b.visible.length, `${name}: row has items`).to.be.gt(0);
            expect(T.defaultTopLevelIds.slice(0, b.visible.length), `${name}: row order`).to.deep.eq(b.visible);
            if (b.visible.length < T.defaultTopLevelIds.length) expect(b.more, `${name}: rest behind More`).to.not.eq(null);
        } else {
            expect(b.display, `${name}: root hidden by visibility (${context})`).to.eq('none');
            expect(b.root.height, `${name}: nothing painted`).to.eq(0);
        }
    });
};
const expectDeviceSet = (layout, context) => {
    cy.log(`device × visibility gates — ${context} (${layout})`);
    // wait on a widget that must be there, then check every combination
    cy.get(navigationSelector.root('bothdevices'), { timeout: 30000 }).should('be.visible');
    Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state, `${context} ${layout}`));
};
const visitPhone = (slug) => {
    cy.viewport(390, 844); // dynamic: phone viewport
    cy.visit(`/applications/${slug}`, {
        onBeforeLoad(win) {
            Object.defineProperty(win.screen, 'width', { configurable: true, get: () => 390 }); // dynamic: phone
        },
    });
};
const probeText = (name, context, expected) =>
    cy
        .get(commonWidgetSelector.draggableWidget(name), { timeout: 30000 })
        .should(($el) => expect($el.text().trim(), `${context}: ${name}`).to.eq(expected));

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Navigation — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Navigation-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('Show on desktop / Show on mobile toggles gate the Navigation on the matching editor layout, independently of Visibility', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults: on the desktop canvas, absent from the mobile canvas
            expectState(W, 'shown', 'default');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            expectState(W, 'shown', 'back on desktop');

            // Visibility off: still rendered on the desktop canvas (the device flag is on), but not shown
            openEditorSidebar(W);
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelTrue);
            expectState(W, 'hidden', 'visibility off');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');

            // Visibility back on, desktop off → gone from desktop
            openEditorSidebar(W);
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelFalse);
            expectState(W, 'shown', 'visibility back on');
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');

            // mobile on → shown on the mobile canvas, still absent on desktop (the flags are independent)
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            expectState(W, 'shown', 'mobile canvas');
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });
    });

    describe('saved apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Navigation-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('Saved device and visibility flags give the same result in the editor, preview and released app on desktop and a phone', () => {
            const slug = `navigation-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            addNavigationsViaApi(
                DEVICE_WIDGETS.map(({ name, others, properties }, i) => ({
                    name,
                    others,
                    properties,
                    layout: { top: 40 + i * 70, left: 2, width: 20, height: 60 }, // dynamic: stacked rows
                }))
            );

            // editor canvas
            cy.openApp('', undefined, undefined, navigationSelector.root('bothdevices'));
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            // preview (the editor's Preview URL); ?layout=mobile is what Preview opens from the mobile layout
            openNavigationAppInViewer(null);
            expectDeviceSet('desktop', 'preview');
            openNavigationAppInViewer(null, { query: '&layout=mobile' });
            expectDeviceSet('mobile', 'preview');

            // released app: desktop screen → desktop layout; a phone (screen narrower than 600px) → mobile layout.
            releaseAndMakePublic(slug);
            cy.visit(`/applications/${slug}`);
            expectDeviceSet('desktop', 'released app');
            visitPhone(slug);
            expectDeviceSet('mobile', 'released app (phone)');
        });

        // Exposed value context: Navigation seeds selectedItem / previousSelectedItem on mount (Navigation.jsx:464-496)
        // and updates both on every click (applySelection, Navigation.jsx:393-419). The Text reads only the Navigation.
        it('The exposed selectedItem and previousSelectedItem resolve in a binding in the editor and the running app, and follow real clicks on an item and a group child', () => {
            const probe = (selected, previous) => `${selected}|${previous}`;
            addNavigationsViaApi([
                { name: 'navvalue', layout: { top: 40, left: 2, width: 20, height: 60 } },
                {
                    type: 'Text',
                    name: 'navprobe',
                    layout: { top: 140, left: 2, width: 40, height: 40 },
                    properties: {
                        text: {
                            value: '{{JSON.stringify(components.navvalue.selectedItem) + "|" + JSON.stringify(components.navvalue.previousSelectedItem)}}',
                        },
                    },
                },
            ]);
            const option2 = T.selectedItem('item2', 'Option 2'); // navigation.js:253-254
            const option3 = T.selectedItem('item3', 'Option 3', 'group1', 'Group 1'); // navigation.js:262-272

            cy.openApp('', undefined, undefined, commonWidgetSelector.draggableWidget('navprobe'));
            probeText('navprobe', 'editor', probe(T.selectedItemNull, T.selectedItemNull));

            openNavigationAppInViewer(navigationSelector.root('navvalue'));
            probeText('navprobe', 'viewer', probe(T.selectedItemNull, T.selectedItemNull));

            // a top-level item
            cy.get(navigationSelector.item('navvalue', 'item2')).realClick({ scrollBehavior: false });
            probeText('navprobe', 'viewer after clicking Option 2', probe(option2, T.selectedItemNull));
            cy.get(navigationSelector.item('navvalue', 'item2')).should('have.class', 'tj-list-item-selected');

            // a child inside the group's sub-menu: selectedItem names its group, previousSelectedItem the last pick
            cy.get(navigationSelector.group('navvalue', 'group1')).realClick({ scrollBehavior: false });
            cy.get(navigationSelector.popupItem('item3')).realClick({ scrollBehavior: false });
            probeText('navprobe', 'viewer after clicking Option 3', probe(option3, option2));
            cy.get(navigationSelector.group('navvalue', 'group1')).should('have.class', 'page-group-selected');
        });
    });
});
