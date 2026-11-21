/**
 * SPEC — Icon — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   Icon-BRW-001 — Show on desktop / Show on mobile independently gate the Icon on the matching layout, and the
 *                  saved values behave the same in the editor canvas, the preview and the released app
 * Device gate: WidgetWrapper.jsx:127 reads others.showOnMobile on the mobile layout, showOnDesktop otherwise;
 * the viewer picks mobile when ?layout=mobile or the window is narrower than 600px (Viewer.jsx:140-143).
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openAndVerifyNode,
 * verifyNodeData, addIconsViaApi, openIconAppInViewer, releaseAndMakePublic.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { iconSelector } from "Selectors/appBuilder/components/icon";
import { iconText } from "Texts/appBuilder/components/icon";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = iconText.defaultWidgetName;
const T = iconText;

// four saved device combinations (others.showOnDesktop / showOnMobile — icon.js:11-12, defaults icon.js:147-148)
const DEVICE_ICONS = [
    { name: 'desktoponly', others: {} }, // defaults: desktop on, mobile off
    { name: 'mobileonly', others: { showOnDesktop: { value: '{{false}}' }, showOnMobile: { value: '{{true}}' } } },
    { name: 'bothdevices', others: { showOnMobile: { value: '{{true}}' } } },
    { name: 'nodevice', others: { showOnDesktop: { value: '{{false}}' } } },
];
const EXPECTED = {
    desktop: { desktoponly: true, mobileonly: false, bothdevices: true, nodevice: false },
    mobile: { desktoponly: false, mobileonly: true, bothdevices: true, nodevice: false },
};
const expectDeviceSet = (layout, context) => {
    cy.log(`device gates — ${context} (${layout})`);
    // wait on a widget that must be there, then check every combination
    cy.get(iconSelector.svg('bothdevices'), { timeout: 30000 }).should('be.visible');
    Object.entries(EXPECTED[layout]).forEach(([name, shown]) => {
        if (shown) cy.get(iconSelector.svg(name)).should('be.visible');
        else cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
    });
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Icon — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Icon-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── Icon-BRW-001 (inspector toggles, editor layouts) ─────────────────
        it('[Icon-BRW-001] Show on desktop / Show on mobile toggles gate the Icon on the matching editor layout', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults: on the desktop canvas, absent from the mobile canvas
            cy.get(iconSelector.svg(W)).should('be.visible');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            cy.get(widget).should('exist');

            // desktop off → gone from desktop
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');

            // mobile on → shown on the mobile canvas, still hidden on desktop (the flags are independent)
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            cy.get(iconSelector.svg(W)).should('be.visible');
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });

        it('exposed-value context — state flags observable in the inspector tree', () => {
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'isVisible', type: 'Boolean', value: 'true' }, // icon.js:154, Icon.jsx:66
                { key: 'isLoading', type: 'Boolean', value: 'false' }, // icon.js:152, Icon.jsx:67
                { key: 'isDisabled', type: 'Boolean', value: 'false' }, // icon.js:153, Icon.jsx:68
            ], verifyNodeData);
        });
    });

    // ── Icon-BRW-001 (saved values: editor ↔ preview ↔ released app) ─────────
    describe('saved device combinations', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Icon-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('[Icon-BRW-001] Saved device flags give the same result in the editor, preview and released app on desktop and mobile', () => {
            const slug = `icon-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            addIconsViaApi(DEVICE_ICONS.map(({ name, others }, i) => ({ name, others, layout: { top: 40 + i * 70, left: 4 } })));

            // editor canvas
            cy.then(() =>
                cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), commonWidgetSelector.draggableWidget('bothdevices'))
            );
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            // preview (the editor's Preview URL); ?layout=mobile is what Preview opens from the mobile layout
            openIconAppInViewer(null);
            expectDeviceSet('desktop', 'preview');
            openIconAppInViewer(null, { query: '&layout=mobile' });
            expectDeviceSet('mobile', 'preview');

            // released app: desktop screen → desktop layout; a phone (screen narrower than 600px) → mobile layout.
            // The viewer reads window.screen.width, not the viewport (Viewer.jsx:88,142), so the phone is a
            // phone-sized viewport plus a phone screen width.
            releaseAndMakePublic(slug);
            cy.visit(`/applications/${slug}`);
            expectDeviceSet('desktop', 'released app');
            cy.viewport(390, 844); // dynamic: phone viewport
            cy.visit(`/applications/${slug}`, {
                onBeforeLoad(win) {
                    Object.defineProperty(win.screen, 'width', { configurable: true, get: () => 390 }); // dynamic: phone
                },
            });
            expectDeviceSet('mobile', 'released app (phone)');
        });
    });
});
