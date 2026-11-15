/**
 * SPEC — Radio Button (V2) — contexts facet.
 * FOR AI: always-on device contexts — Show on desktop / Show on mobile vs Visibility across the editor, preview and
 * released app, and the exposed `value` in a binding in each context. No RadioButtonV2 browser scenario maps here
 * (overflow / collapse → canvas.cy.js, tooltip → properties.cy.js, paint / focus ring → styles.cy.js).
 * Device gate: WidgetWrapper.jsx — a widget whose others.showOn<Layout> is false is not rendered at all.
 * Visibility: RadioButtonV2.jsx:246-247 puts `invisible` (visibility: hidden) on the radiogroup; the box stays.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, releaseAndMakePublic,
 * addRadioButtonsViaApi, openRadioAppInViewer, radioBoxes.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { radioButtonV2Selector } from "Selectors/appBuilder/components/radioButtonV2";
import { radioButtonV2Text } from "Texts/appBuilder/components/radioButtonV2";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import {
    addRadioButtonsViaApi,
    openRadioAppInViewer,
    radioBoxes,
} from "Support/utils/appBuilder/components/radioButtonV2";

const T = radioButtonV2Text;
const S = radioButtonV2Selector;
const W = T.defaultWidgetName;
const OFF = { value: '{{false}}' }; // radioButtonV2.js:312-313 toggle values
const ON = { value: '{{true}}' };

// saved device × visibility combinations (others.showOnDesktop / showOnMobile — radioButtonV2.js:11-12, defaults
// radioButtonV2.js:312-313; properties.visibility — default radioButtonV2.js:347)
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
// shown = rendered + visible; hidden = rendered, radiogroup visibility:hidden; absent = not rendered at all
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
    radioBoxes(name, (b) => {
        expect(b.options, `${name}: default options rendered`).to.have.length(T.defaultOptionCount);
        if (state === 'shown') {
            expect(b.rootVisibility, `${name}: radio group visible`).to.eq('visible');
            expect(b.root.height, `${name}: radio group painted`).to.be.gt(0);
        } else {
            expect(b.rootVisibility, `${name}: radio group hidden by visibility`).to.eq('hidden');
        }
    });
};
const probeText = (name, context, expected) =>
    cy
        .get(commonWidgetSelector.draggableWidget(name), { timeout: 30000 })
        .should(($el) => expect($el.text().trim(), `${context}: ${name}`).to.eq(expected));
const expectDeviceSet = (layout, context) => {
    cy.log(`device × visibility gates — ${context} (${layout})`);
    cy.get(S.options('bothdevices'), { timeout: 30000 }).should('be.visible');
    Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state));
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Radio Button (V2) — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-RadioButtonV2-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('Show on desktop / Show on mobile toggles gate the Radio Button on the matching editor layout, independently of Visibility', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults: on the desktop canvas, absent from the mobile canvas
            expectState(W, 'shown');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            expectState(W, 'shown');

            // Visibility off: still rendered on the desktop canvas (the device flag is on), but not shown
            openEditorSidebar(W);
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelTrue);
            expectState(W, 'hidden');
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

    describe('saved apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-RadioButtonV2-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('Saved device and visibility flags give the same result in the editor, preview and released app on desktop and mobile', () => {
            const slug = `radio-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            addRadioButtonsViaApi(
                DEVICE_WIDGETS.map(({ name, others, properties }, i) => ({
                    name,
                    others,
                    properties,
                    // dynamic: stacked rows so each widget keeps its own slot on the narrower mobile grid too
                    layout: { top: 40 + i * 70, left: 2, width: 20, height: T.defaultHeight },
                }))
            );

            cy.openApp('', undefined, undefined, S.options('bothdevices'));
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            openRadioAppInViewer(null);
            expectDeviceSet('desktop', 'preview');
            openRadioAppInViewer(null, { query: '&layout=mobile' });
            expectDeviceSet('mobile', 'preview');

            // released app: desktop screen → desktop layout; a phone (screen narrower than 600px) → mobile layout.
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

        // Exposed value context: radioButtonV2.js:336 makes option2 ("2") the default; a click updates `value`.
        it('The exposed value resolves to the default option in the editor and the running app, and follows a selection', () => {
            const both = { showOnDesktop: ON, showOnMobile: ON };
            addRadioButtonsViaApi([
                { name: 'rbvalue', layout: { top: 40, left: 2, width: 15, height: T.defaultHeight }, others: both },
                {
                    type: 'Text',
                    name: 'probe',
                    layout: { top: 120, left: 2, width: 12, height: 40 },
                    properties: { text: { value: '{{"v:" + components.rbvalue.value}}' } },
                },
            ]);
            cy.openApp('', undefined, undefined, S.options('rbvalue'));
            probeText('probe', 'editor', `v:${T.defaultValue}`);
            cy.get(S.optionLabel('rbvalue', 2)).click();
            probeText('probe', 'editor after click', 'v:3');

            openRadioAppInViewer(S.options('rbvalue'));
            probeText('probe', 'viewer', `v:${T.defaultValue}`);
            cy.get(S.optionLabel('rbvalue', 0)).click();
            probeText('probe', 'viewer after click', 'v:1');
            cy.get(S.optionInput('rbvalue', 0)).should('be.checked');
        });
    });
});
