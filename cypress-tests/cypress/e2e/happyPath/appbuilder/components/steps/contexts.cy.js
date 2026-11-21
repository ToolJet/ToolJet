/**
 * SPEC — Steps — contexts facet.
 * FOR AI: always-on device contexts, plus the context parts of two TESTING.md browser scenarios:
 *   Steps-BRW-001 — in the editor and the viewer, desktop/mobile flags combine with local visibility without stale
 *                   layout; here: inspector device toggles on the editor layouts, and saved device × visibility
 *                   combinations in the editor, preview and released app on desktop and a phone, each shown Steps
 *                   re-checked for a fresh layout at that layout's width. Pointer/keyboard interaction and the
 *                   setVisibility/setDisabled runtime paths live in userflow.cy.js.
 *   Steps-BRW-002 — theme colours: the default theme-token colours repaint for dark mode in the editor and the viewer.
 * Device gate: WidgetWrapper.jsx:125-128 — a widget whose others.showOn<Layout> is false is not rendered at all.
 * Visibility: Steps.jsx:169 hides its own root (display:none) while WidgetWrapper keeps the box. So device-off ⇒
 * absent, visibility-off ⇒ box present, no visible milestone. The viewer picks mobile with ?layout=mobile or a
 * screen narrower than 600px.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, addStepsViaApi,
 * openStepsAppInViewer, stepsBoxes, expectStepsGeometry, expectStepColors, resolveCssVarColor, releaseAndMakePublic.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { stepsSelector } from "Selectors/appBuilder/components/steps";
import { stepsText } from "Texts/appBuilder/components/steps";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { releaseAndMakePublic, resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import {
    addStepsViaApi,
    openStepsAppInViewer,
    stepsBoxes,
    expectStepsGeometry,
    expectStepColors,
} from "Support/utils/appBuilder/components/steps";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = stepsText.defaultWidgetName;
const T = stepsText;
const OFF = { value: '{{false}}' }; // steps.js:213-214 toggle values
const ON = { value: '{{true}}' };
const CURRENT = T.defaultCurrentStep - 1; // steps.js:231 currentStep {{3}} → index 2

// saved device × visibility combinations (others.showOnDesktop / showOnMobile — steps.js:83-84, defaults
// steps.js:213-214; properties.visibility — steps.js:54-59, default steps.js:234)
const DEVICE_STEPS = [
    { name: 'desktoponly', others: {} }, // defaults: desktop on, mobile off
    { name: 'mobileonly', others: { showOnDesktop: OFF, showOnMobile: ON } },
    { name: 'bothdevices', others: { showOnMobile: ON } },
    { name: 'nodevice', others: { showOnDesktop: OFF } },
    // device flags on everywhere but visibility off: rendered box on both layouts, never a milestone
    { name: 'hiddenboth', others: { showOnMobile: ON }, properties: { visibility: OFF } },
    // visibility on cannot override a device flag that is off
    { name: 'visiblenomobile', others: {}, properties: { visibility: ON } },
];
// shown = laid-out Steps; hidden = widget box rendered, Steps root not displayed; absent = not rendered at all
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
const expectState = (name, state, context) => {
    if (state === 'absent') {
        cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
        return;
    }
    if (state === 'shown') {
        // a fresh layout at this layout's width: equal connectors spanning the root, centred labels, no overflow
        expectStepsGeometry(name, { context: `${name} (${context})` });
        stepsBoxes(name, (b) => expect(b.milestones[CURRENT].ariaCurrent, `${name}: current step`).to.eq(T.ariaCurrentStep));
    } else {
        stepsBoxes(name, (b) => {
            expect(b.root.display, `${name}: visibility off hides the Steps root (${context})`).to.eq('none');
            expect(b.root.ariaHidden, `${name}: hidden from assistive tech`).to.eq('true');
            b.milestones.forEach((m, i) => expect(m.width, `${name}: milestone ${i} not painted`).to.eq(0));
        });
    }
};
const expectDeviceSet = (layout, context) => {
    cy.log(`device × visibility gates — ${context} (${layout})`);
    // wait on a widget that must be there, then check every combination
    cy.get(stepsSelector.milestones('bothdevices'), { timeout: 30000 }).should('have.length', T.defaultStepCount);
    Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state, `${context} ${layout}`));
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Steps — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Steps-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── Steps-BRW-001 (inspector toggles, editor layouts) ────────────────
        it('[Steps-BRW-001] Show on desktop / Show on mobile toggles gate the Steps on the matching editor layout, independently of Visibility, with a fresh layout each time', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults: on the desktop canvas, absent from the mobile canvas
            expectState(W, 'shown', 'default');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            expectState(W, 'shown', 'back on desktop');

            // Visibility off: the box stays on the desktop canvas (the device flag is on), the steps are gone
            openEditorSidebar(W);
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelTrue);
            expectState(W, 'hidden', 'visibility off');
            // Visibility off does not make a device-off layout render: mobile stays absent
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');

            // Visibility back on: the same full layout returns (no stale zero-width connectors or labels)
            openEditorSidebar(W);
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelFalse);
            expectState(W, 'shown', 'visibility back on');

            // desktop off → gone from desktop
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');

            // mobile on → shown and laid out at the mobile canvas width, still absent on desktop
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            expectState(W, 'shown', 'mobile canvas');
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });
    });

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Steps-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        // ── Steps-BRW-001 (saved values: editor ↔ preview ↔ released app) ────
        it('[Steps-BRW-001] Saved device and visibility flags give the same result in the editor, preview and released app on desktop and a phone', () => {
            const slug = `steps-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            addStepsViaApi(
                DEVICE_STEPS.map(({ name, others, properties }, i) => ({
                    name,
                    others,
                    properties,
                    layout: { top: 40 + i * 60, left: 2, width: 22, height: 38 }, // dynamic: stacked slots
                }))
            );

            // editor canvas
            cy.openApp('', undefined, undefined, stepsSelector.milestones('bothdevices'));
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            // preview (the editor's Preview URL); ?layout=mobile is what Preview opens from the mobile layout
            openStepsAppInViewer(null);
            expectDeviceSet('desktop', 'preview');
            openStepsAppInViewer(null, { query: '&layout=mobile' });
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
            // the phone layout is genuinely narrower, and the connectors were re-measured for it
            stepsBoxes('bothdevices', (b) => {
                expect(b.box.width, 'phone width').to.be.lt(390);
                expect(b.connectors[0].width, 'connectors fit the phone width').to.be.lt(b.box.width / 4);
            });
        });

        // ── Steps-BRW-002 (theme colours) ────────────────────────────────────
        it('[Steps-BRW-002] Default theme-token colours repaint for dark mode in every variant, in the editor and the viewer', () => {
            const VARIANTS = [T.variantLabel, T.variantNumber, T.variantPlain];
            addStepsViaApi(
                VARIANTS.map((variant, i) => ({
                    name: `theme${variant}`,
                    layout: { top: 40 + i * 70, left: 2, width: 22, height: 38 }, // dynamic: stacked slots
                    properties: { variant: { value: variant } },
                }))
            );
            const scope = stepsSelector.root(`theme${T.variantLabel}`);
            // resolve the theme tokens behind the default styles (steps.js:242-246) in the current theme
            const tokens = () =>
                resolveCssVarColor(T.tokenCompletedAccent, scope).then((completedAccent) =>
                    resolveCssVarColor(T.tokenIncompletedAccent, scope).then((incompletedAccent) =>
                        resolveCssVarColor(T.tokenLabel, scope).then((label) => ({
                            completedAccent,
                            incompletedAccent,
                            completedLabel: label,
                            incompletedLabel: label,
                            currentStepLabel: label,
                        }))
                    )
                );
            const expectThemed = (where) =>
                tokens().then((colors) => {
                    cy.log(`${where}: ${JSON.stringify(colors)}`);
                    VARIANTS.forEach((variant) =>
                        expectStepColors(`theme${variant}`, { variant, current: CURRENT, colors, context: where })
                    );
                    return cy.wrap(colors);
                });

            cy.openApp('', undefined, undefined, stepsSelector.milestones(`theme${T.variantPlain}`));
            cy.get('.dark-theme').should('not.exist');
            expectThemed('light editor').as('light');

            // globalSettings.appMode drives the app's dark theme (AppCanvas `dark-theme`)
            cy.apiUpdateGlobalSettings({ appMode: 'dark' });
            cy.reload();
            cy.get(stepsSelector.milestones(`theme${T.variantPlain}`), { timeout: 30000 }).should('have.length', T.defaultStepCount);
            cy.get('.dark-theme').should('exist');
            cy.get('@light').then((light) => {
                expectThemed('dark editor').then((dark) => {
                    // the theme really changed: text and the incomplete track are repainted for the dark canvas
                    expect(dark.completedLabel, 'label colour follows the dark theme').to.not.eq(light.completedLabel);
                    expect(dark.incompletedAccent, 'incomplete accent follows the dark theme').to.not.eq(light.incompletedAccent);
                });
            });

            openStepsAppInViewer(stepsSelector.milestones(`theme${T.variantPlain}`));
            cy.get('.dark-theme').should('exist');
            cy.get('@light').then((light) => {
                expectThemed('dark viewer').then((dark) => expect(dark.completedLabel).to.not.eq(light.completedLabel));
            });
        });
    });
});
