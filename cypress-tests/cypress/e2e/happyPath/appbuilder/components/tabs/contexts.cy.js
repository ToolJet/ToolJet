/**
 * SPEC — Tabs — contexts facet.
 * FOR AI: always-on device and exposed-value contexts (no TESTING.md browser scenario is context-owned for Tabs):
 *   - inspector Show on desktop / Show on mobile toggles gate the Tabs per editor layout, independently of Visibility;
 *   - saved device × visibility flags give the same result in the editor and the preview on desktop and mobile;
 *   - currentTab / currentTabTitle reach a bound Text, and tab children follow the active tab, in editor and viewer.
 * Device gate: WidgetWrapper — a widget whose others.showOn<Layout> is false is not rendered at all. Visibility off:
 * Tabs.jsx:309 hides its own root (display:none) while the RenderWidget box stays. The viewer picks mobile with
 * ?layout=mobile.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, addTabsViaApi, tabsData,
 * openTabsAppInViewer, tabsBoxes, useMainCanvasForCanvasCommands.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { tabsSelector } from "Selectors/appBuilder/components/tabs";
import { tabsText } from "Texts/appBuilder/components/tabs";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import {
    addTabsViaApi,
    tabsData,
    openTabsAppInViewer,
    tabsBoxes,
    useMainCanvasForCanvasCommands,
} from "Support/utils/appBuilder/components/tabs";

const W = tabsText.defaultWidgetName;
const T = tabsText;
const OFF = { value: '{{false}}' }; // tabs.js:402-403 toggle values
const ON = { value: '{{true}}' };

// shown = laid-out Tabs with its headers and the active pane; hidden = box rendered, Tabs root not displayed;
// absent = not rendered at all
const expectState = (name, state, titles, context) => {
    if (state === 'absent') {
        cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
        return;
    }
    tabsBoxes(name, (b) => {
        const tag = `${name} (${context})`;
        if (state === 'shown') {
            expect(b.root.display, `${tag}: root shown`).to.eq('flex');
            expect(b.headers.map((h) => h.text), `${tag}: headers`).to.deep.eq(titles);
            expect(b.headers[0].active, `${tag}: first tab active`).to.eq(true);
            expect(b.headers[0].width, `${tag}: headers laid out`).to.be.gt(0);
            expect(b.headers[b.headers.length - 1].right, `${tag}: headers inside the widget`).to.be.lte(b.box.right + 1);
            expect(b.panes[0].height, `${tag}: active pane has height`).to.be.gt(0);
        } else {
            expect(b.root.display, `${tag}: visibility off hides the Tabs root`).to.eq('none');
            b.headers.forEach((h, i) => expect(h.width, `${tag}: header ${i} not painted`).to.eq(0));
        }
    });
};

const SEEDED = [{ title: 'Alpha', id: 'a' }, { title: 'Beta', id: 'b' }];
const SEEDED_TITLES = SEEDED.map((t) => t.title);
const DEVICE_TABS = [
    { name: 'desktoponly', others: {} }, // defaults: desktop on, mobile off (tabs.js:402-403)
    { name: 'mobileonly', others: { showOnDesktop: OFF, showOnMobile: ON } },
    { name: 'bothdevices', others: { showOnMobile: ON } },
    { name: 'nodevice', others: { showOnDesktop: OFF } },
    { name: 'hiddenboth', others: { showOnMobile: ON }, properties: { visibility: OFF } }, // tabs.js:32-40
];
const EXPECTED = {
    desktop: { desktoponly: 'shown', mobileonly: 'absent', bothdevices: 'shown', nodevice: 'absent', hiddenboth: 'hidden' },
    mobile: { desktoponly: 'absent', mobileonly: 'shown', bothdevices: 'shown', nodevice: 'absent', hiddenboth: 'hidden' },
};
const expectDeviceSet = (layout, context) => {
    cy.get(tabsSelector.headers('bothdevices'), { timeout: 30000 }).should('have.length', SEEDED.length);
    Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state, SEEDED_TITLES, `${context} ${layout}`));
};

// sub-canvases of the Tabs panes also carry data-cy="real-canvas": point the shared canvas commands at the main one
useMainCanvasForCanvasCommands();

describe('Tabs — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Tabs-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 100);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('Show on desktop / Show on mobile toggles gate the Tabs on the matching editor layout, independently of Visibility', () => {
            const widget = commonWidgetSelector.draggableWidget(W);
            expectState(W, 'shown', T.defaultTabTitles, 'default');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            expectState(W, 'shown', T.defaultTabTitles, 'back on desktop');

            openEditorSidebar(W);
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelTrue);
            expectState(W, 'hidden', T.defaultTabTitles, 'visibility off');
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelFalse);
            expectState(W, 'shown', T.defaultTabTitles, 'visibility back on');

            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            expectState(W, 'shown', T.defaultTabTitles, 'mobile canvas');
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });
    });

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Tabs-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('Saved device and visibility flags give the same result in the editor and the preview on desktop and mobile', () => {
            addTabsViaApi(
                DEVICE_TABS.map(({ name, others, properties }, i) => ({
                    name,
                    others,
                    properties: { ...tabsData(SEEDED, 'a'), ...properties },
                    layout: { top: 30 + i * 170, left: 2, width: 14, height: 150 }, // dynamic: stacked slots
                }))
            );

            cy.openApp('', undefined, undefined, tabsSelector.headers('bothdevices'));
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            openTabsAppInViewer(null);
            expectDeviceSet('desktop', 'preview');
            openTabsAppInViewer(null, { query: '&layout=mobile' });
            expectDeviceSet('mobile', 'preview');
        });

        it('currentTab / currentTabTitle reach a bound Text and tab children follow the active tab, in the editor and the viewer', () => {
            const ID = crypto.randomUUID();
            const tabs = [
                { title: fake.firstName.slice(0, 8) || 'first', id: 'a' },
                { title: fake.lastName.slice(0, 8) || 'second', id: 'b' },
            ];
            const childText = [fake.firstName.slice(0, 6) || 'childa', fake.lastName.slice(0, 6) || 'childb'];
            addTabsViaApi([
                { id: ID, name: 'tb', layout: { top: 30, left: 2, width: 20, height: 240 }, properties: tabsData(tabs, 'a') },
                { type: 'Text', name: 'childa', parent: `${ID}-a`, properties: { text: { value: childText[0] } } },
                { type: 'Text', name: 'childb', parent: `${ID}-b`, properties: { text: { value: childText[1] } } },
                {
                    type: 'Text',
                    name: 'probe',
                    layout: { top: 300, left: 2, width: 14, height: 40 },
                    // tabs.js:394-395 exposed currentTab / currentTabTitle
                    properties: { text: { value: '{{"tab:" + components.tb.currentTab + "|" + components.tb.currentTabTitle}}' } },
                },
            ]);
            const expectExposed = (i, where) => {
                cy.get(commonWidgetSelector.draggableWidget('probe')).should(($el) =>
                    expect($el.text().trim(), `exposed (${where})`).to.eq(`tab:${tabs[i].id}|${tabs[i].title}`)
                );
                cy.get(commonWidgetSelector.draggableWidget(i === 0 ? 'childa' : 'childb')).should('be.visible').and('contain.text', childText[i]);
                cy.get(commonWidgetSelector.draggableWidget(i === 0 ? 'childb' : 'childa')).should('not.be.visible');
            };
            const run = (where) => {
                expectExposed(0, `${where}, on load`);
                cy.get(tabsSelector.headers('tb')).eq(1).realClick({ scrollBehavior: false });
                expectExposed(1, `${where}, after switching`);
                cy.get(tabsSelector.headers('tb')).eq(0).realClick({ scrollBehavior: false });
                expectExposed(0, `${where}, switched back`);
            };

            cy.openApp('', undefined, undefined, commonWidgetSelector.draggableWidget('probe'));
            cy.get('[data-cy="query-manager-toggle-button"]').click();
            run('editor');
            openTabsAppInViewer(commonWidgetSelector.draggableWidget('probe'));
            run('viewer');
        });
    });
});
