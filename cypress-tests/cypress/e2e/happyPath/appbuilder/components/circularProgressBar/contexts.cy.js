/**
 * SPEC — Circular Progressbar — contexts facet.
 * FOR AI: always-on device contexts, plus the device-visibility half of TESTING.md browser scenario:
 *   CircularProgressBar-BRW-001 — Show on desktop / Show on mobile gate the widget on the matching layout,
 *                                 independently from widget `visibility`, in the editor and the viewer (preview +
 *                                 released app), and a shown widget keeps its fitted, centred ring on both layouts.
 * Device gate: WidgetWrapper.jsx — a widget whose others.showOn<Layout> is false is not rendered at all.
 * Visibility: CirularProgressbar.jsx:45,50 set the root and inner display:none (the RenderWidget box stays).
 * So device-off ⇒ absent, visibility-off ⇒ present but not painted.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, addCircularProgressBarsViaApi,
 * openDividerAppInViewer, cpbBoxes, expectCircleFits, releaseAndMakePublic.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { circularProgressBarSelector } from "Selectors/appBuilder/components/circularProgressBar";
import { circularProgressBarText } from "Texts/appBuilder/components/circularProgressBar";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import { openDividerAppInViewer } from "Support/utils/appBuilder/components/divider";
import {
    addCircularProgressBarsViaApi,
    cpbBoxes,
    expectCircleFits,
} from "Support/utils/appBuilder/components/circularProgressBar";

const W = circularProgressBarText.defaultWidgetName;
const T = circularProgressBarText;
const OFF = { value: '{{false}}' }; // circularProgressbar.js:241-242 toggle values
const ON = { value: '{{true}}' };

// saved device × visibility combinations (others.showOnDesktop / showOnMobile — circularProgressbar.js:11-12,
// defaults circularProgressbar.js:241-242; properties.visibility — circularProgressbar.js:85-89, default :255)
const DEVICE_WIDGETS = [
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
    cpbBoxes(name, (b) => {
        if (state === 'shown') {
            expectCircleFits(b, `${name} shown`);
            expect(b.label, `${name}: label`).to.eq(T.defaultLabel);
        } else {
            expect(b.rootDisplay, `${name}: root hidden by visibility`).to.eq('none');
            expect(b.svg, `${name}: SVG kept in the DOM`).to.not.eq(null);
            expect(b.svg.width * b.svg.height, `${name}: nothing painted`).to.eq(0);
        }
    });
};
const expectDeviceSet = (layout, context) => {
    cy.log(`device × visibility gates — ${context} (${layout})`);
    // wait on a widget that must be there, then check every combination
    cy.get(circularProgressBarSelector.svg('bothdevices'), { timeout: 30000 }).should('be.visible');
    Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state));
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Circular Progressbar — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-CircularProgressBar-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── CircularProgressBar-BRW-001 (inspector toggles, editor layouts) ──
        it('[CircularProgressBar-BRW-001] Show on desktop / Show on mobile toggles gate the widget on the matching editor layout, independently of Visibility', () => {
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

    // ── CircularProgressBar-BRW-001 (saved values: editor ↔ preview ↔ released app) ──
    describe('saved device combinations', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-CircularProgressBar-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('[CircularProgressBar-BRW-001] Saved device and visibility flags give the same result in the editor, preview and released app on desktop and mobile', () => {
            const slug = `cpb-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            addCircularProgressBarsViaApi(
                DEVICE_WIDGETS.map(({ name, others, properties }, i) => ({
                    name,
                    others,
                    properties,
                    // dynamic: stacked rows so each widget keeps its own slot on the narrower mobile grid too
                    layout: { top: 40 + i * 70, left: 2, width: 12, height: 60 },
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
