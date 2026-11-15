/**
 * SPEC — ButtonGroupV2 (Button Group) — contexts facet.
 * FOR AI: always-on device contexts (Show on desktop / Show on mobile vs Visibility across the editor, preview and
 * released app; the exposed `selected` value in each context), plus TESTING.md browser scenarios:
 *   ButtonGroupV2-BRW-002 — desktop/mobile visibility settings select the right surface in the editor, preview and
 *                           released app; collapse-when-hidden reflows the running layout on desktop and mobile
 *                           without destroying the user's selection (RenderWidget.jsx:295-311 + gridSlice.js).
 *   ButtonGroupV2-BRW-001 — editor-vs-running-app half: dynamic height applies only in a running app (preview +
 *                           released, desktop and mobile layouts); the editor canvas keeps the authored height
 *                           (ButtonGroupV2.jsx:107 `currentMode === 'view'`).
 * (Reflow / layout / overflow details in canvas.cy.js.)
 * Device gate: WidgetWrapper.jsx — a widget whose others.showOn<Layout> is false is not rendered at all.
 * Visibility: ButtonGroupV2.jsx:343 puts `d-none` on the role=group root (the RenderWidget box stays).
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, releaseAndMakePublic,
 * openDividerAppInViewer, addButtonGroupsViaApi, mappedButtons, buttonGroupBoxes, expectHugsButtons,
 * expectFixedButtons, expectStackedBelow.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { buttonGroupV2Selector } from "Selectors/appBuilder/components/buttonGroupV2";
import { buttonGroupV2Text } from "Texts/appBuilder/components/buttonGroupV2";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import { openDividerAppInViewer } from "Support/utils/appBuilder/components/divider";
import { expectStackedBelow } from "Support/utils/appBuilder/components/timeline";
import {
    addButtonGroupsViaApi,
    mappedButtons,
    buttonGroupBoxes,
    expectHugsButtons,
    expectFixedButtons,
} from "Support/utils/appBuilder/components/buttonGroupV2";

const W = buttonGroupV2Text.defaultWidgetName;
const T = buttonGroupV2Text;
const S = buttonGroupV2Selector;
const PX = 1.5; // sub-pixel layout tolerance
const OFF = { value: '{{false}}' }; // buttonGroupV2.js:385-386 toggle values
const ON = { value: '{{true}}' };
const BOTH = { showOnDesktop: ON, showOnMobile: ON };
const NO_LABEL = { value: '' }; // dynamic: no label
const GAP = 10; // dynamic: authored gap between a group and the Text under it
const AUTHORED = 80; // buttonGroupV2.js:114 default height
const word = () => fake.firstName.replace(/\W/g, '').slice(0, 6) || 'Go';
const input = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;
const columnHeight = (n) => n * T.buttonHeight + (n - 1) * T.buttonGap; // buttonGroupV2.scss:10,17

// saved device × visibility combinations (others.showOnDesktop / showOnMobile — buttonGroupV2.js:116-119,
// defaults buttonGroupV2.js:385-386; properties.visibility — buttonGroupV2.js:62-67, default buttonGroupV2.js:429)
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
// shown = rendered + displayed; hidden = rendered, root display:none; absent = not rendered at all
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
    buttonGroupBoxes(name, (b) => {
        if (state === 'shown') {
            expect(b.rootDisplay, `${name}: group displayed`).to.eq('flex');
            expect(b.root.height, `${name}: group painted`).to.be.gt(0);
            expect(b.buttons.map((x) => x.text), `${name}: default buttons`).to.deep.eq(T.defaultButtonLabels);
        } else {
            expect(b.rootClass, `${name}: hidden by visibility`).to.contain(T.hiddenClass);
            expect(b.rootDisplay, `${name}: group not displayed`).to.eq('none');
            expect(b.root.height, `${name}: nothing painted`).to.eq(0);
        }
    });
};
const probeText = (name, context, expected) =>
    cy
        .get(commonWidgetSelector.draggableWidget(name), { timeout: 30000 })
        .should(($el) => expect($el.text().trim(), `${context}: ${name}`).to.eq(expected));
const expectDeviceSet = (layout, context) => {
    cy.log(`device × visibility gates — ${context} (${layout})`);
    cy.get(S.button('bothdevices', 0), { timeout: 30000 }).should('be.visible');
    Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state));
};
const visitAsPhone = (slug) => {
    cy.viewport(390, 844); // dynamic: phone viewport
    cy.visit(`/applications/${slug}`, {
        onBeforeLoad(win) {
            Object.defineProperty(win.screen, 'width', { configurable: true, get: () => 390 }); // dynamic: phone
        },
    });
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('ButtonGroupV2 — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-ButtonGroupV2-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('[ButtonGroupV2-BRW-002] Show on desktop / Show on mobile toggles gate the Button Group on the matching editor layout, independently of Visibility', () => {
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
            cy.apiCreateApp(`${fake.companyName}-ButtonGroupV2-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('[ButtonGroupV2-BRW-002] Saved device and visibility flags give the same result in the editor, preview and released app on desktop and mobile', () => {
            const slug = `buttongroup-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            addButtonGroupsViaApi(
                DEVICE_WIDGETS.map(({ name, others, properties }, i) => ({
                    name,
                    others,
                    properties: { label: NO_LABEL, ...properties },
                    // dynamic: stacked rows so each widget keeps its own slot on the narrower mobile grid too
                    layout: { top: 40 + i * 90, left: 2, width: 30, height: 60 },
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

            // released app: desktop screen → desktop layout; a phone (screen narrower than 600px) → mobile layout
            releaseAndMakePublic(slug);
            cy.visit(`/applications/${slug}`);
            expectDeviceSet('desktop', 'released app');
            visitAsPhone(slug);
            expectDeviceSet('mobile', 'released app (phone)');
        });

        // ── ButtonGroupV2-BRW-002: collapse when hidden keeps the selection ──
        // One vertical lane (hide, probe, bgcollapse, below1, bgkeep, below2) so the desktop grid and the page's
        // auto-computed mobile layout (which stacks widgets into one column) have the same order. `bgcollapse` has
        // properties.collapseWhenHidden on (buttonGroupV2.js:74-79): hiding it in a running app takes it out of
        // flow and everything under it moves up. `bgkeep` (collapse off — buttonGroupV2.js:432) is the control: it
        // keeps its slot, so `below2` moves by exactly the same amount as `below1`. Both are hidden through their
        // visibility binding, so they stay mounted and keep the user's selection (`probe` reads both `selected`).
        it('[ButtonGroupV2-BRW-002] Collapse when hidden reclaims the space in the running app on desktop and mobile, and showing again restores the layout with the selection intact', () => {
            const hideWord = 'yes'; // dynamic: typed to hide both groups
            const visibility = { value: `{{components.hide.value !== '${hideWord}'}}` };
            const lane = (top, height) => ({ top, left: 2, width: 20, height }); // dynamic: one 20-column lane
            const text = (name, top) => ({ type: 'Text', name, layout: lane(top, 40), others: BOTH, properties: { text: { value: word() } } });
            addButtonGroupsViaApi([
                { type: 'TextInput', name: 'hide', layout: lane(10, 40), others: BOTH },
                {
                    type: 'Text',
                    name: 'probe',
                    layout: lane(60, 40),
                    others: BOTH,
                    properties: { text: { value: '{{JSON.stringify(components.bgcollapse.selected) + JSON.stringify(components.bgkeep.selected)}}' } },
                },
                { name: 'bgcollapse', layout: lane(110, AUTHORED), others: BOTH, properties: { label: NO_LABEL, visibility, collapseWhenHidden: ON } },
                text('below1', 110 + AUTHORED + GAP),
                { name: 'bgkeep', layout: lane(260, AUTHORED), others: BOTH, properties: { label: NO_LABEL, visibility } },
                text('below2', 260 + AUTHORED + GAP),
            ]);
            // tops relative to the `hide` input (never moves): clicks/typing scroll the page, so viewport tops drift
            const rawTop = (doc, name) => doc.querySelector(`[data-cy="draggable-widget-${name}"]`).getBoundingClientRect().top;
            const top = (doc, name) => rawTop(doc, name) - rawTop(doc, 'hide');
            const NAMES = ['bgcollapse', 'below1', 'bgkeep', 'below2'];
            const selectedJson = '["2"]["3"]'; // dynamic: Button2 on bgcollapse, Button3 on bgkeep (values '2' / '3' — buttonGroupV2.js:411,420)

            const runCollapse = (context, query) => {
                openDividerAppInViewer(S.button('bgcollapse', 0), { query });
                probeText('probe', `${context} default`, `${T.defaultSelectedJson}${T.defaultSelectedJson}`);
                cy.get(S.button('bgcollapse', 1)).click();
                cy.get(S.button('bgkeep', 2)).click();
                probeText('probe', `${context} selected`, selectedJson);

                const before = {};
                cy.document().should((doc) => {
                    NAMES.forEach((n) => (before[n] = top(doc, n)));
                    expect(before.below1, `${context}: below1 under bgcollapse`).to.be.gt(before.bgcollapse + AUTHORED - PX);
                    expect(before.below2, `${context}: below2 under bgkeep`).to.be.gt(before.bgkeep + AUTHORED - PX);
                });

                cy.get(input('hide')).type(hideWord, { scrollBehavior: 'center' }); // the viewer's fixed header can cover the top input
                buttonGroupBoxes('bgcollapse', (b) => expect(b.rootClass, `${context}: collapsed group hidden`).to.contain(T.hiddenClass));
                buttonGroupBoxes('bgkeep', (b) => expect(b.rootClass, `${context}: control hidden`).to.contain(T.hiddenClass));
                cy.document().should((doc) => {
                    const shift1 = before.below1 - top(doc, 'below1');
                    // collapse on: below1 moves up into the reclaimed space (by at least the group's height)
                    expect(shift1, `${context}: below1 moved up`).to.be.gte(AUTHORED - PX);
                    expect(top(doc, 'below1'), `${context}: below1 not above the group's old top`).to.be.gte(before.bgcollapse - PX);
                    // collapse off: bgkeep keeps its slot, so below2 only follows the shift above it
                    // (a hidden widget's box is display:none in the viewer — its own rect reads 0, so measure below2)
                    expect(before.below2 - top(doc, 'below2'), `${context}: below2 shifted like below1 (bgkeep kept its space)`).to.be.closeTo(shift1, PX);
                });
                probeText('probe', `${context} hidden`, selectedJson);

                cy.get(input('hide')).clear({ scrollBehavior: 'center' });
                buttonGroupBoxes('bgcollapse', (b) => {
                    expect(b.rootClass, `${context}: shown again`).to.not.contain(T.hiddenClass);
                    expect(b.buttons[1].color, `${context}: Button2 still selected`).to.eq(T.selectedTextColor);
                    expect(b.buttons[0].color, `${context}: Button1 still unselected`).to.not.eq(T.selectedTextColor);
                });
                buttonGroupBoxes('bgkeep', (b) =>
                    expect(b.buttons[2].color, `${context}: control Button3 still selected`).to.eq(T.selectedTextColor)
                );
                cy.document().should((doc) => {
                    NAMES.forEach((n) => expect(top(doc, n), `${context}: ${n} restored`).to.be.closeTo(before[n], PX));
                });
                probeText('probe', `${context} restored`, selectedJson);
            };

            runCollapse('desktop', '');
            runCollapse('mobile', '&layout=mobile');
        });

        // Exposed value context: buttonGroupV2.js:403,407 — Button1 (value '1') is the default, so `selected` is
        // ['1'] (ButtonGroupV2.jsx:87-91,165-168) in the editor and the running app.
        it('The exposed selected value resolves to ["1"] in a binding in the editor and the running app', () => {
            addButtonGroupsViaApi([
                { name: 'bgvalue', layout: { top: 40, left: 2, width: 12, height: AUTHORED } },
                {
                    type: 'Text',
                    name: 'valueprobe',
                    layout: { top: 140, left: 2, width: 12, height: 40 },
                    properties: { text: { value: '{{JSON.stringify(components.bgvalue.selected)}}' } },
                },
            ]);
            cy.openApp('', undefined, undefined, commonWidgetSelector.draggableWidget('valueprobe'));
            probeText('valueprobe', 'editor', T.defaultSelectedJson);
            openDividerAppInViewer(S.button('bgvalue', 0));
            probeText('valueprobe', 'viewer', T.defaultSelectedJson);
            cy.get(S.button('bgvalue', 2)).click();
            probeText('valueprobe', 'viewer after click', '["3"]'); // dynamic: Button3 value '3' (buttonGroupV2.js:420)
        });

        // ── ButtonGroupV2-BRW-001: editor vs running app ─────────────────────
        it('[ButtonGroupV2-BRW-001] Column dynamic height measures the real buttons in preview and the released app on desktop and mobile, while the editor canvas keeps the authored height', () => {
            const slug = `buttongroup-dynamic-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            addButtonGroupsViaApi([
                {
                    name: 'bgdyn',
                    layout: { top: 40, left: 2, width: 15, height: AUTHORED },
                    mobileLayout: { width: 40 }, // dynamic: full-width on the mobile grid
                    others: BOTH,
                    properties: { ...mappedButtons(6, word()), layout: { value: T.layoutColumn }, dynamicHeight: ON }, // dynamic: six stacked buttons overflow 80px
                },
                {
                    type: 'Text',
                    name: 'below',
                    layout: { top: 40 + AUTHORED + GAP, left: 2, width: 15, height: 40 },
                    mobileLayout: { width: 40 },
                    others: BOTH,
                    properties: { text: { value: word() } },
                },
            ]);
            const expectGrown = (context) => {
                buttonGroupBoxes('bgdyn', (b) => {
                    expect(b.buttons, `${context}: buttons`).to.have.length(6);
                    expect(b.group.height, `${context}: real stack height`).to.be.closeTo(columnHeight(6), PX);
                    expectHugsButtons(b, AUTHORED, context);
                    expect(b.grid.height, `${context}: grew past the authored height`).to.be.gt(AUTHORED * 3);
                });
                expectStackedBelow('bgdyn', 'below', GAP, context);
            };
            const expectAuthored = (context) => {
                buttonGroupBoxes('bgdyn', (b) => {
                    expectFixedButtons(b, AUTHORED, context);
                    expect(b.overflowY, `${context}: scrolls inside`).to.eq(T.fixedOverflowY);
                    expect(b.scrollHeight, `${context}: content overflows`).to.be.gt(b.clientHeight + 100);
                });
                expectStackedBelow('bgdyn', 'below', GAP, context);
            };

            // editor canvas, both layouts: authored height, the content scrolls
            cy.openApp('', undefined, undefined, S.button('bgdyn', 0));
            expectAuthored('editor desktop');
            switchLayout('mobile');
            expectAuthored('editor mobile');
            switchLayout('desktop');

            // preview, both layouts
            openDividerAppInViewer(S.button('bgdyn', 0));
            expectGrown('preview desktop');
            openDividerAppInViewer(S.button('bgdyn', 0), { query: '&layout=mobile' });
            expectGrown('preview mobile');

            // released app, desktop screen and phone
            releaseAndMakePublic(slug);
            cy.visit(`/applications/${slug}`);
            expectGrown('released desktop');
            visitAsPhone(slug);
            expectGrown('released phone');
        });
    });
});
