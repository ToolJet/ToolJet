/**
 * SPEC — Spinner — contexts facet.
 * FOR AI: always-on device contexts, plus TESTING.md browser scenario:
 *   Spinner-BRW-001 — Show on desktop / Show on mobile select the layout(s) the Spinner appears on, including
 *                     expression-resolved and live-bound values, across the editor and the viewer (preview +
 *                     released app)
 * Device gate: WidgetWrapper.jsx:125-128,162 — the resolved others.showOn<Layout> is read from the store and a
 * falsy value returns null (the widget is not rendered at all); expressions are resolved first, so a binding to
 * another component re-evaluates live. Visibility (a *style* on Spinner, spinner.js:17-24) is separate:
 * WidgetWrapper.jsx:194,210 keeps the box (display:none in view) and Spinner.jsx:8 sets the container
 * display:none — so device-off ⇒ absent, visibility-off ⇒ rendered but not displayed.
 * The viewer picks mobile when ?layout=mobile or the screen is narrower than 600px.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, setToggleExpression,
 * addSpinnersViaApi, openSpinnerAppInViewer, spinnerBoxes, releaseAndMakePublic.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { spinnerSelector } from "Selectors/appBuilder/components/spinner";
import { spinnerText } from "Texts/appBuilder/components/spinner";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import {
    addSpinnersViaApi,
    openSpinnerAppInViewer,
    spinnerBoxes,
    setToggleExpression,
} from "Support/utils/appBuilder/components/spinner";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = spinnerText.defaultWidgetName;
const T = spinnerText;
const OFF = { value: '{{false}}' }; // spinner.js:49-50 toggle values
const ON = { value: '{{true}}' };
const HIDE_WORD = 'hide'; // dynamic: arbitrary gate value typed into the TextInput
const BOUND = { value: `{{components.gate.value !== "${HIDE_WORD}"}}` }; // live binding to the gate TextInput

// saved device combinations (others.showOnDesktop / showOnMobile — spinner.js:11-12, defaults spinner.js:49-50;
// styles.visibility — spinner.js:17, default spinner.js:55)
const DEVICE_SPINNERS = [
    { name: 'desktoponly', others: {} }, // defaults: desktop on, mobile off
    { name: 'mobileonly', others: { showOnDesktop: OFF, showOnMobile: ON } },
    { name: 'bothdevices', others: { showOnMobile: ON } },
    { name: 'nodevice', others: { showOnDesktop: OFF } },
    // expression-resolved flags (not literal {{true}}/{{false}})
    { name: 'exprdesktop', others: { showOnDesktop: { value: '{{"a" === "a"}}' }, showOnMobile: { value: '{{2 < 1}}' } } },
    { name: 'exprmobile', others: { showOnDesktop: { value: '{{[].length > 0}}' }, showOnMobile: { value: '{{"x".length === 1}}' } } },
    // bound to the gate TextInput: shown on both layouts until the gate holds HIDE_WORD
    { name: 'bound', others: { showOnDesktop: BOUND, showOnMobile: BOUND } },
    // device flags on everywhere but visibility off: rendered on both layouts, never displayed
    { name: 'hiddenboth', others: { showOnMobile: ON }, styles: { visibility: OFF } },
];
const GATE = {
    type: 'TextInput',
    name: 'gate',
    others: { showOnDesktop: ON, showOnMobile: ON },
};
// shown = rendered + displayed; hidden = rendered, container display:none; absent = not rendered at all
const EXPECTED = {
    desktop: {
        desktoponly: 'shown', mobileonly: 'absent', bothdevices: 'shown', nodevice: 'absent',
        exprdesktop: 'shown', exprmobile: 'absent', bound: 'shown', hiddenboth: 'hidden',
    },
    mobile: {
        desktoponly: 'absent', mobileonly: 'shown', bothdevices: 'shown', nodevice: 'absent',
        exprdesktop: 'absent', exprmobile: 'shown', bound: 'shown', hiddenboth: 'hidden',
    },
};
const expectState = (name, state) => {
    if (state === 'absent') {
        cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
        return;
    }
    spinnerBoxes(name, (b) => {
        if (state === 'shown') {
            expect(b.container.display, `${name}: container displayed`).to.eq('flex');
            expect(b.ring.side, `${name}: ring painted`).to.be.gt(0);
        } else {
            expect(b.container.display, `${name}: container hidden by visibility`).to.eq('none');
            expect(b.ring.side, `${name}: nothing painted`).to.eq(0);
        }
    });
};
const expectDeviceSet = (layout, context) => {
    cy.log(`device gates — ${context} (${layout})`);
    // wait on a widget that must be there, then check every combination
    cy.get(spinnerSelector.ring('bothdevices'), { timeout: 30000 }).should('be.visible');
    Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state));
};
const typeIntoGate = (value) => {
    const input = `${commonWidgetSelector.draggableWidget('gate')} input`;
    // centre-scroll: the viewer's fixed header covers elements scrolled to the top edge
    cy.get(input).clear({ scrollBehavior: 'center' });
    if (value) cy.get(input).type(value, { scrollBehavior: 'center' });
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Spinner — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Spinner-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── Spinner-BRW-001 (inspector toggles + expressions, editor layouts) ──────
        it('[Spinner-BRW-001] Show on desktop / Show on mobile toggles and expressions select the editor layout the Spinner appears on', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults (spinner.js:49-50): on the desktop canvas, absent from the mobile canvas
            expectState(W, 'shown');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            expectState(W, 'shown');

            // desktop toggle off → gone from desktop
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');

            // mobile toggle on → shown on the mobile canvas, still absent on desktop (the flags are independent)
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            expectState(W, 'shown');

            // expression-resolved: from the mobile canvas (where the widget exists) set Show on desktop to a
            // truthy expression → it comes back on the desktop canvas
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            setToggleExpression(commonWidgetText.parameterShowOnDesktop, '{{Math.max(3, 2) === 3}}');
            cy.waitForAutoSave();
            switchLayout('desktop');
            expectState(W, 'shown');

            // a falsy expression removes it from desktop again
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            setToggleExpression(commonWidgetText.parameterShowOnDesktop, '{{"a" === "b"}}');
            cy.get(widget).should('not.exist');
            // Show on mobile = a falsy expression removes it from the mobile canvas too
            setToggleExpression(commonWidgetText.parameterShowOnMobile, '{{[1, 2].length === 5}}');
            cy.waitForAutoSave();
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });
    });

    // ── Spinner-BRW-001 (saved values: editor ↔ preview ↔ released app) ──────
    describe('saved device combinations', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Spinner-contexts-${Cypress._.uniqueId()}`);
            addSpinnersViaApi([
                ...DEVICE_SPINNERS.map(({ name, others, styles }, i) => ({
                    name,
                    others,
                    styles,
                    layout: { top: 40 + i * 50, left: 4, width: 4, height: 30 }, // dynamic: stacked slots
                })),
                { ...GATE, layout: { top: 40, left: 20, width: 8, height: 40 } }, // dynamic: beside the stack
            ]);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('[Spinner-BRW-001] Saved literal, expression and bound device flags give the same layouts in the editor, preview and released app on desktop and mobile', () => {
            const slug = `spinner-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug

            // editor canvas
            cy.openApp('', undefined, undefined, commonWidgetSelector.draggableWidget('bothdevices'));
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            // preview (the editor's Preview URL); ?layout=mobile is what Preview opens from the mobile layout
            openSpinnerAppInViewer(null);
            expectDeviceSet('desktop', 'preview');
            openSpinnerAppInViewer(null, { query: '&layout=mobile' });
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

        it('[Spinner-BRW-001] A device flag bound to another component re-resolves live in the running app on desktop and mobile', () => {
            ['', '&layout=mobile'].forEach((query) => {
                openSpinnerAppInViewer(spinnerSelector.ring('bound'), { query });
                // gate empty → binding true → shown
                expectState('bound', 'shown');
                typeIntoGate(HIDE_WORD);
                expectState('bound', 'absent');
                // any other value → true again → back
                typeIntoGate(fake.firstName.slice(0, 8).replace(new RegExp(HIDE_WORD, 'gi'), 'x'));
                expectState('bound', 'shown');
                typeIntoGate(HIDE_WORD);
                expectState('bound', 'absent');
                typeIntoGate('');
                expectState('bound', 'shown');
                // the literal-flag spinners are unaffected by the gate
                expectState('bothdevices', 'shown');
            });
        });
    });
});
