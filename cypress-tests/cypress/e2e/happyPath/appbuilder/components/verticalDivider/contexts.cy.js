/**
 * SPEC — Vertical Divider — contexts facet.
 * FOR AI: always-on device contexts, plus TESTING.md browser scenario:
 *   VerticalDivider-BRW-001 — Show on desktop / Show on mobile gate the Vertical Divider on the matching layout
 *                             independently from widget `visibility`, across the editor and the viewer
 *                             (preview + released)
 * Device gate: WidgetWrapper.jsx — a widget whose others.showOn<Layout> is false is not rendered at all.
 * Visibility: VerticalDivider.jsx:12 sets the root display:none (the box stays rendered). So the two flags are
 * observably different: device-off ⇒ absent, visibility-off ⇒ present but not painted.
 * The viewer picks mobile when ?layout=mobile or the screen is narrower than 600px.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, addVerticalDividersViaApi,
 * openDividerAppInViewer, dividerBoxes, expectCenteredLine, releaseAndMakePublic.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { verticalDividerSelector } from "Selectors/appBuilder/components/verticalDivider";
import { verticalDividerText } from "Texts/appBuilder/components/verticalDivider";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import { openDividerAppInViewer, dividerBoxes } from "Support/utils/appBuilder/components/divider";
import { addVerticalDividersViaApi, expectCenteredLine } from "Support/utils/appBuilder/components/verticalDivider";

const W = verticalDividerText.defaultWidgetName;
const T = verticalDividerText;
const OFF = { value: '{{false}}' }; // verticalDivider.js:100-101 toggle values
const ON = { value: '{{true}}' };

// saved device × visibility combinations (others.showOnDesktop / showOnMobile — verticalDivider.js:11-12, defaults
// verticalDivider.js:100-101; properties.visibility — verticalDivider.js:15, default verticalDivider.js:104)
const DEVICE_DIVIDERS = [
    { name: 'desktoponly', others: {} }, // defaults: desktop on, mobile off
    { name: 'mobileonly', others: { showOnDesktop: OFF, showOnMobile: ON } },
    { name: 'bothdevices', others: { showOnMobile: ON } },
    { name: 'nodevice', others: { showOnDesktop: OFF } },
    // device flags on everywhere but visibility off: rendered on both layouts, never painted
    { name: 'hiddenboth', others: { showOnMobile: ON }, properties: { visibility: OFF } },
    // visibility on cannot override a device flag that is off
    { name: 'visiblenomobile', others: {}, properties: { visibility: ON } },
];
// shown = rendered + painted; hidden = rendered, root display:none; absent = not rendered at all
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
const expectState = (name, state) => {
    if (state === 'absent') {
        cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
        return;
    }
    dividerBoxes(name, (b) => {
        if (state === 'shown') {
            expectCenteredLine(b, `${name} shown`);
        } else {
            expect(b.rootDisplay, `${name}: root hidden by visibility`).to.eq('none');
            expect(b.lines, `${name}: line kept in the DOM`).to.have.length(1);
            expect(b.lines[0].height, `${name}: nothing painted`).to.eq(0);
        }
    });
};
const expectDeviceSet = (layout, context) => {
    cy.log(`device × visibility gates — ${context} (${layout})`);
    // wait on a widget that must be there, then check every combination
    cy.get(verticalDividerSelector.root('bothdevices'), { timeout: 30000 }).should('be.visible');
    Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state));
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Vertical Divider — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-VerticalDivider-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── VerticalDivider-BRW-001 (inspector toggles, editor layouts) ──────
        it('[VerticalDivider-BRW-001] Show on desktop / Show on mobile toggles gate the Vertical Divider on the matching editor layout, independently of Visibility', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults: on the desktop canvas, absent from the mobile canvas
            expectState(W, 'shown');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            expectState(W, 'shown');

            // Visibility off: still rendered on the desktop canvas (the device flag is on), but not painted
            openEditorSidebar(W);
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelTrue);
            expectState(W, 'hidden');
            // Visibility off does not make a device-off layout render: mobile stays absent
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');

            // Visibility back on, desktop off → gone from desktop
            openEditorSidebar(W);
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelFalse);
            expectState(W, 'shown');
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');

            // mobile on → shown on the mobile canvas, still absent on desktop (the flags are independent)
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            expectState(W, 'shown');
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });
    });

    // ── VerticalDivider-BRW-001 (saved values: editor ↔ preview ↔ released app) ──
    describe('saved device combinations', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-VerticalDivider-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('[VerticalDivider-BRW-001] Saved device and visibility flags give the same result in the editor, preview and released app on desktop and mobile', () => {
            const slug = `vdivider-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            addVerticalDividersViaApi(
                DEVICE_DIVIDERS.map(({ name, others, properties }, i) => ({
                    name,
                    others,
                    properties,
                    // dynamic: side-by-side slots, each wider than the registered single column so the
                    // mobile canvas (narrower grid) still gives every line room
                    layout: { top: 40, left: 2 + i * 12, width: 2, height: 60 },
                }))
            );

            // editor canvas
            cy.openApp('', undefined, undefined, commonWidgetSelector.draggableWidget('bothdevices'));
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            // preview (the editor's Preview URL); ?layout=mobile is what Preview opens from the mobile layout
            openDividerAppInViewer(null);
            expectDeviceSet('desktop', 'preview');
            openDividerAppInViewer(null, { query: '&layout=mobile' });
            expectDeviceSet('mobile', 'preview');

            // released app: desktop screen → desktop layout; a phone (screen narrower than 600px) → mobile layout.
            // The viewer reads window.screen.width, not the viewport, so the phone is a phone-sized viewport plus a
            // phone screen width.
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
