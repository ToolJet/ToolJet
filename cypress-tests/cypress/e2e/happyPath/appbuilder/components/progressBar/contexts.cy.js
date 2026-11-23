/**
 * SPEC — ProgressBar — contexts facet.
 * FOR AI: always-on device contexts, plus the device-visibility part of TESTING.md browser scenario:
 *   ProgressBar-BRW-001 — in the editor and the viewer, device visibility (Show on desktop / Show on mobile)
 *                         produces the documented result, independently from the widget's Visibility property.
 * Device gate: WidgetWrapper.jsx:125-128 — a widget whose others.showOn<Layout> is false is not rendered at all.
 * Visibility: Progressbar.jsx:116-118 returns null (no root) while WidgetWrapper keeps the box (collapsed with a
 * dashed marker in edit, display:none in view). So device-off ⇒ absent, visibility-off ⇒ box present, no bar.
 * The viewer picks mobile when ?layout=mobile or the screen is narrower than 600px.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, addProgressBarsViaApi,
 * openProgressBarAppInViewer, progressBarBoxes, releaseAndMakePublic.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { progressBarSelector } from "Selectors/appBuilder/components/progressBar";
import { progressBarText } from "Texts/appBuilder/components/progressBar";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import {
    addProgressBarsViaApi,
    openProgressBarAppInViewer,
    progressBarBoxes,
} from "Support/utils/appBuilder/components/progressBar";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = progressBarText.defaultWidgetName;
const T = progressBarText;
const OFF = { value: '{{false}}' }; // progressbar.js:243-244 toggle values
const ON = { value: '{{true}}' };

// saved device × visibility combinations (others.showOnDesktop / showOnMobile — progressbar.js:11-12, defaults
// progressbar.js:243-244; properties.visibility — progressbar.js:79-84, default progressbar.js:256)
const DEVICE_BARS = [
    { name: 'desktoponly', others: {} }, // defaults: desktop on, mobile off
    { name: 'mobileonly', others: { showOnDesktop: OFF, showOnMobile: ON } },
    { name: 'bothdevices', others: { showOnMobile: ON } },
    { name: 'nodevice', others: { showOnDesktop: OFF } },
    // device flags on everywhere but visibility off: rendered box on both layouts, never a bar
    { name: 'hiddenboth', others: { showOnMobile: ON }, properties: { visibility: OFF } },
    // visibility on cannot override a device flag that is off
    { name: 'visiblenomobile', others: {}, properties: { visibility: ON } },
];
// shown = rendered bar; hidden = widget box rendered, bar not; absent = not rendered at all
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
    progressBarBoxes(name, (b) => {
        if (state === 'shown') {
            expect(b.root, `${name}: bar rendered`).to.not.eq(null);
            expect(b.label.text, `${name}: auto label`).to.eq(`${T.defaultProgress}%`);
            expect(b.track.width, `${name}: track painted`).to.be.gt(0);
            expect(b.fill.width, `${name}: half filled`).to.be.closeTo(b.track.width / 2, 1);
        } else {
            expect(b.root, `${name}: visibility off renders no bar`).to.eq(null);
        }
    });
};
const expectDeviceSet = (layout, context) => {
    cy.log(`device × visibility gates — ${context} (${layout})`);
    // wait on a widget that must be there, then check every combination
    cy.get(progressBarSelector.root('bothdevices'), { timeout: 30000 }).should('be.visible');
    Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state));
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('ProgressBar — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-ProgressBar-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── ProgressBar-BRW-001 (inspector toggles, editor layouts) ──────────
        it('[ProgressBar-BRW-001] Show on desktop / Show on mobile toggles gate the ProgressBar on the matching editor layout, independently of Visibility', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults: on the desktop canvas, absent from the mobile canvas
            expectState(W, 'shown');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            expectState(W, 'shown');

            // Visibility off: the box stays on the desktop canvas (the device flag is on), the bar is gone
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

    // ── ProgressBar-BRW-001 (saved values: editor ↔ preview ↔ released app) ──
    describe('saved device combinations', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-ProgressBar-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('[ProgressBar-BRW-001] Saved device and visibility flags give the same result in the editor, preview and released app on desktop and mobile', () => {
            const slug = `progressbar-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            addProgressBarsViaApi(
                DEVICE_BARS.map(({ name, others, properties }, i) => ({
                    name,
                    others,
                    properties,
                    layout: { top: 40 + i * 70, left: 4, width: 10, height: 50 }, // dynamic: stacked slots
                }))
            );

            // editor canvas
            cy.openApp('', undefined, undefined, progressBarSelector.root('bothdevices'));
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            // preview (the editor's Preview URL); ?layout=mobile is what Preview opens from the mobile layout
            openProgressBarAppInViewer(null);
            expectDeviceSet('desktop', 'preview');
            openProgressBarAppInViewer(null, { query: '&layout=mobile' });
            expectDeviceSet('mobile', 'preview');

            // released app: desktop screen → desktop layout; a phone (screen narrower than 600px) → mobile layout.
            // The viewer reads window.screen.width, not the viewport.
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
