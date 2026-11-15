import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { checkboxSelector } from "Selectors/appBuilder/components/checkbox";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";

// Checkbox-BRW-002 — four saved device combinations (others.showOnDesktop / showOnMobile — checkbox.js:11-12,
// defaults checkbox.js:210-211: desktop on, mobile off). The device gate reads others.showOnMobile on the
// mobile layout and showOnDesktop otherwise; the viewer picks mobile for ?layout=mobile or a phone screen.
const DEVICE_CHECKBOXES = [
    // the definition defaults, saved as-is: desktop on, mobile off. source: checkbox.js:210-211
    { name: 'desktoponly', others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{false}}' } } },
    { name: 'mobileonly', others: { showOnDesktop: { value: '{{false}}' }, showOnMobile: { value: '{{true}}' } } },
    { name: 'bothdevices', others: { showOnDesktop: { value: '{{true}}' }, showOnMobile: { value: '{{true}}' } } },
    { name: 'nodevice', others: { showOnDesktop: { value: '{{false}}' }, showOnMobile: { value: '{{false}}' } } },
];
const DEVICE_EXPECTED = {
    desktop: { desktoponly: true, mobileonly: false, bothdevices: true, nodevice: false },
    mobile: { desktoponly: false, mobileonly: true, bothdevices: true, nodevice: false },
};
const expectDeviceSet = (layout, context) => {
    cy.log(`device gates — ${context} (${layout})`);
    // wait on a checkbox that must be there, then check every combination
    cy.get(checkboxSelector.row('bothdevices'), { timeout: 30000 }).should('be.visible');
    Object.entries(DEVICE_EXPECTED[layout]).forEach(([name, shown]) => {
        if (shown) cy.get(checkboxSelector.row(name)).should('be.visible');
        else cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
    });
};

// Contexts facet — the checkbox across device + data-binding contexts.
// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Checkbox — contexts facet', { testIsolation: false }, () => {
    const W = 'checkbox1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Checkbox-Contexts`);
        cy.openApp();
        cy.dragAndDropWidget('Checkbox', 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    // Device-visibility context matrix: Show on Desktop / Show on Mobile.
    it('device context — show on desktop / mobile toggles visibility', () => {
        verifyLayout(W);
    });

    // covers [Checkbox-BRW-002] (editor toggles); the defaults and the running app are checked below.
    it('[Checkbox-BRW-002] defaults: a dropped Checkbox shows on the desktop canvas and is absent from the mobile canvas', () => {
        cy.get(checkboxSelector.row(W)).should('be.visible'); // showOnDesktop default {{true}}. source: checkbox.js:210
        switchLayout('mobile');
        cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist'); // showOnMobile default {{false}}. source: checkbox.js:211
        switchLayout('desktop');
        cy.get(checkboxSelector.row(W)).should('be.visible');
    });

    // Exposed-value context: components.checkbox1.value is observable in the
    // app's component tree (default state Off → false). Uses the same
    // inspector-tree navigation proven green in inspector.cy.js.
    it('exposed-value context — value observable in the inspector tree', () => {
        cy.get(commonWidgetSelector.sidebarinspector).click(); // open the left inspector
        cy.hideTooltip();
        openNode('components');
        openAndVerifyNode('checkbox1', [
            { key: 'value', type: 'Boolean', value: 'false' }, // source: checkbox.js:170
        ], verifyNodeData);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});

// ── Checkbox-BRW-002 (saved values: editor ↔ preview ↔ released app) ─────────
describe('Checkbox — saved device combinations', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Checkbox-contexts`);
    });

    afterEach(() => {
        cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    it('[Checkbox-BRW-002] Saved device flags give the same result in the editor, preview and released app on desktop and mobile', () => {
        const slug = `checkbox-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
        addIconsViaApi(
            DEVICE_CHECKBOXES.map(({ name, others }, i) => ({
                type: 'Checkbox',
                name,
                others,
                layout: { top: 40 + i * 70, left: 4, width: 10, height: 40 },
            }))
        );

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
        // The viewer reads window.screen.width, not the viewport, so the phone is a phone-sized viewport plus
        // a phone screen width.
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
