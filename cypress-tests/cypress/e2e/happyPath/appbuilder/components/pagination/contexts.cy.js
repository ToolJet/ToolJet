/**
 * SPEC — Pagination — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   Pagination-BRW-001 — Pagination appears only on the layouts enabled by Show on desktop / Show on mobile,
 *                        including expression-resolved values; here: inspector toggles and expressions on the editor
 *                        layouts, saved literal / expression / bound flags in the editor, preview and released app on
 *                        desktop and a phone, and a bound flag re-resolving live in the running app.
 * Device gate: WidgetWrapper — a widget whose resolved others.showOn<Layout> is falsy is not rendered at all.
 * Visibility (a *property* on Pagination, pagination.js:37-42) is separate: Pagination.jsx:139-142,165-174 hides the
 * row (display:none) while the box stays. So device-off ⇒ absent, visibility-off ⇒ box rendered, no control painted.
 * The viewer picks mobile with ?layout=mobile or a screen narrower than 600px.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, setToggleExpression,
 * releaseAndMakePublic, addPaginationsViaApi, openPaginationAppInViewer, paginationBoxes, openNode,
 * openAndVerifyNode, verifyNodeData.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { paginationSelector } from "Selectors/appBuilder/components/pagination";
import { paginationText } from "Texts/appBuilder/components/pagination";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import { setToggleExpression } from "Support/utils/appBuilder/components/spinner";
import {
    addPaginationsViaApi,
    openPaginationAppInViewer,
    paginationBoxes,
} from "Support/utils/appBuilder/components/pagination";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = paginationText.defaultWidgetName;
const T = paginationText;
const OFF = { value: '{{false}}' }; // pagination.js:110-111 toggle values
const ON = { value: '{{true}}' };
const HIDE_WORD = 'hide'; // dynamic: arbitrary gate value typed into the TextInput
const BOUND = { value: `{{components.gate.value !== "${HIDE_WORD}"}}` }; // live binding to the gate TextInput

// saved device combinations (others.showOnDesktop / showOnMobile — pagination.js:10-13, defaults pagination.js:110-111;
// properties.visibility — pagination.js:37-42, default pagination.js:121)
const DEVICE_PAGINATIONS = [
    { name: 'desktoponly', others: {} }, // defaults: desktop on, mobile off
    { name: 'mobileonly', others: { showOnDesktop: OFF, showOnMobile: ON } },
    { name: 'bothdevices', others: { showOnMobile: ON } },
    { name: 'nodevice', others: { showOnDesktop: OFF } },
    // expression-resolved flags (not literal {{true}}/{{false}})
    { name: 'exprdesktop', others: { showOnDesktop: { value: '{{"a" === "a"}}' }, showOnMobile: { value: '{{2 < 1}}' } } },
    { name: 'exprmobile', others: { showOnDesktop: { value: '{{[].length > 0}}' }, showOnMobile: { value: '{{"x".length === 1}}' } } },
    // bound to the gate TextInput: shown on both layouts until the gate holds HIDE_WORD
    { name: 'bound', others: { showOnDesktop: BOUND, showOnMobile: BOUND } },
    // device flags on everywhere but visibility off: rendered on both layouts, never painted
    { name: 'hiddenboth', others: { showOnMobile: ON }, properties: { visibility: OFF } },
];
const GATE = { type: 'TextInput', name: 'gate', others: { showOnDesktop: ON, showOnMobile: ON } };
// shown = rendered + row painted; hidden = box rendered, row display:none; absent = not rendered at all
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
const expectState = (name, state, context = '') => {
    if (state === 'absent') {
        cy.get(commonWidgetSelector.draggableWidget(name)).should('not.exist');
        return;
    }
    paginationBoxes(name, (b) => {
        if (state === 'shown') {
            expect(b.list.display, `${name}: row displayed ${context}`).to.not.eq('none');
            expect(b.root.ariaHidden, `${name}: exposed to assistive tech`).to.eq('false');
            // the four operators and at least one page number are painted (the page window itself depends on the
            // layout's width — the mobile canvas is much narrower — so it is not pinned here)
            expect(b.items.filter((i) => i.kind === 'operator'), `${name}: operators`).to.have.length(4);
            expect(b.items.filter((i) => i.kind === 'page').length, `${name}: page numbers`).to.be.gte(1);
            b.items.forEach((i) => expect(i.width, `${name}: "${i.label}" painted`).to.be.gt(0));
        } else {
            expect(b.list.display, `${name}: visibility off hides the row ${context}`).to.eq('none');
            expect(b.root.ariaHidden, `${name}: hidden from assistive tech`).to.eq('true');
            b.items.forEach((i) => expect(i.width, `${name}: "${i.label}" not painted`).to.eq(0));
        }
    });
};
const expectDeviceSet = (layout, context) => {
    cy.log(`device gates — ${context} (${layout})`);
    // wait on a widget that must be there, then check every combination
    cy.get(paginationSelector.items('bothdevices'), { timeout: 30000 }).should('have.length.gte', 5);
    Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state, `(${context} ${layout})`));
};
const typeIntoGate = (value) => {
    const input = `${commonWidgetSelector.draggableWidget('gate')} input`;
    // centre-scroll: the viewer's fixed header covers elements scrolled to the top edge
    cy.get(input).clear({ scrollBehavior: 'center' });
    if (value) cy.get(input).type(value, { scrollBehavior: 'center' });
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Pagination — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Pagination-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // Exposed-value context: the defaults are observable in the app's component tree.
        it('exposed-value context — page state observable in the inspector tree', () => {
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'totalPages', type: 'Number', value: `${T.defaultNumberOfPages}` }, // pagination.js:115, Pagination.jsx:65
                { key: 'currentPageIndex', type: 'Number', value: `${T.defaultPageIndex}` }, // pagination.js:118, Pagination.jsx:57
                { key: 'isVisible', type: 'Boolean', value: 'true' }, // pagination.js:121
                { key: 'isDisabled', type: 'Boolean', value: 'false' }, // pagination.js:122
                { key: 'isLoading', type: 'Boolean', value: 'false' }, // pagination.js:120
            ], verifyNodeData);
        });

        // ── Pagination-BRW-001 (inspector toggles + expressions, editor layouts) ──
        it('[Pagination-BRW-001] Show on desktop / Show on mobile toggles and expressions select the editor layout the Pagination appears on, independently of Visibility', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults (pagination.js:110-111): on the desktop canvas, absent from the mobile canvas
            expectState(W, 'shown', 'default');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            expectState(W, 'shown', 'back on desktop');

            // Visibility off: the box stays on the desktop canvas (the device flag is on), the row is not painted;
            // it does not make the device-off mobile layout render either
            openEditorSidebar(W);
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelTrue);
            expectState(W, 'hidden', 'visibility off');
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            openEditorSidebar(W);
            verifyAndModifyToggleFx(commonWidgetText.parameterVisibility, commonWidgetText.codeMirrorLabelFalse);
            expectState(W, 'shown', 'visibility back on');

            // desktop toggle off → gone from desktop
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');

            // mobile toggle on → shown on the mobile canvas, still absent on desktop (the flags are independent)
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            expectState(W, 'shown', 'mobile canvas');

            // expression-resolved: from the mobile canvas (where the widget exists) set Show on desktop to a truthy
            // expression → it comes back on the desktop canvas
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            setToggleExpression(commonWidgetText.parameterShowOnDesktop, '{{Math.max(3, 2) === 3}}');
            cy.waitForAutoSave();
            switchLayout('desktop');
            expectState(W, 'shown', 'desktop expression true');

            // a falsy expression removes it from desktop again; a falsy Show on mobile expression from mobile too
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            setToggleExpression(commonWidgetText.parameterShowOnDesktop, '{{"a" === "b"}}');
            cy.get(widget).should('not.exist');
            setToggleExpression(commonWidgetText.parameterShowOnMobile, '{{[1, 2].length === 5}}');
            cy.waitForAutoSave();
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });
    });

    // ── Pagination-BRW-001 (saved values: editor ↔ preview ↔ released app) ──
    describe('saved device combinations', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Pagination-contexts-${Cypress._.uniqueId()}`);
            addPaginationsViaApi([
                ...DEVICE_PAGINATIONS.map(({ name, others, properties }, i) => ({
                    name,
                    others,
                    properties,
                    layout: { top: 40 + i * 50, left: 2, width: 10, height: 30 }, // dynamic: stacked slots
                })),
                { ...GATE, layout: { top: 40, left: 20, width: 8, height: 40 } }, // dynamic: beside the stack
            ]);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('[Pagination-BRW-001] Saved literal, expression and bound device flags give the same layouts in the editor, preview and released app on desktop and a phone', () => {
            const slug = `pagination-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug

            // editor canvas
            cy.openApp('', undefined, undefined, paginationSelector.items('bothdevices'));
            expectDeviceSet('desktop', 'editor canvas');
            switchLayout('mobile');
            expectDeviceSet('mobile', 'editor canvas');
            switchLayout('desktop');

            // preview (the editor's Preview URL); ?layout=mobile is what Preview opens from the mobile layout
            openPaginationAppInViewer(null);
            expectDeviceSet('desktop', 'preview');
            openPaginationAppInViewer(null, { query: '&layout=mobile' });
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

        it('[Pagination-BRW-001] A device flag bound to another component re-resolves live in the running app on desktop and mobile', () => {
            ['', '&layout=mobile'].forEach((query) => {
                openPaginationAppInViewer(paginationSelector.items('bound'), { query });
                // gate empty → binding true → shown
                expectState('bound', 'shown', query);
                typeIntoGate(HIDE_WORD);
                expectState('bound', 'absent');
                // any other value → true again → back
                typeIntoGate(fake.firstName.slice(0, 8).replace(new RegExp(HIDE_WORD, 'gi'), 'x'));
                expectState('bound', 'shown', query);
                typeIntoGate(HIDE_WORD);
                expectState('bound', 'absent');
                typeIntoGate('');
                expectState('bound', 'shown', query);
                // the literal-flag widgets are unaffected by the gate
                expectState('bothdevices', 'shown', query);
            });
        });
    });
});
