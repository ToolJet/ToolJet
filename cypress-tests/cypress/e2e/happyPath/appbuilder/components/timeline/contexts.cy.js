/**
 * SPEC — Timeline — contexts facet.
 * FOR AI: always-on device contexts (Show on desktop / Show on mobile vs Visibility across the editor, preview and
 * released app; the exposed `value` in each context), plus the editor-vs-running-app half of TESTING.md browser
 * scenario:
 *   Timeline-BRW-001 — dynamic height applies only in a running app (preview + released, desktop and mobile
 *                      layouts): there the widget measures its real content and the sibling below reflows; the
 *                      editor canvas keeps the authored height and scrolls (Timeline.jsx:24 `currentMode === 'view'`).
 * (Reflow / hidden-ancestor / scrolling details in canvas.cy.js; box shadow in styles.cy.js.)
 * Device gate: WidgetWrapper.jsx — a widget whose others.showOn<Layout> is false is not rendered at all.
 * Visibility: Timeline.jsx:43 sets the card display:none (the RenderWidget box stays).
 * KNOWN PRODUCT BUG (kept red): a binding that depends ONLY on components.<timeline>.value renders blank on load
 * (editor + viewer) — it resolves before the default exposed values are seeded and nothing re-resolves it, because
 * Timeline never calls setExposedVariable. The same expression also depending on a TextInput shows {}.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, releaseAndMakePublic,
 * openDividerAppInViewer, addTimelinesViaApi, timelineDataExpr, timelineBoxes, expectHugsContent,
 * expectFixedHeight, expectStackedBelow.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { timelineSelector } from "Selectors/appBuilder/components/timeline";
import { timelineText } from "Texts/appBuilder/components/timeline";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import { openDividerAppInViewer } from "Support/utils/appBuilder/components/divider";
import {
    addTimelinesViaApi,
    timelineDataExpr,
    timelineBoxes,
    expectHugsContent,
    expectFixedHeight,
    expectStackedBelow,
} from "Support/utils/appBuilder/components/timeline";

const W = timelineText.defaultWidgetName;
const T = timelineText;
const OFF = { value: '{{false}}' }; // timeline.js:89-90 toggle values
const ON = { value: '{{true}}' };
const GAP = 10; // dynamic: authored gap between the timeline and the Text under it
const AUTHORED = 150; // dynamic: authored timeline height (px)
const word = () => fake.firstName.replace(/\W/g, '').slice(0, 8) || 'Item';

// saved device × visibility combinations (others.showOnDesktop / showOnMobile — timeline.js:69-70, defaults
// timeline.js:89-90; properties.visibility — timeline.js:35-40, default timeline.js:100)
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
// shown = rendered + displayed; hidden = rendered, card display:none; absent = not rendered at all
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
    timelineBoxes(name, (b) => {
        if (state === 'shown') {
            expect(b.cardDisplay, `${name}: card displayed`).to.eq('flex');
            expect(b.card.height, `${name}: card painted`).to.be.gt(0);
            expect(b.itemCount, `${name}: default items`).to.eq(T.defaultItemCount);
        } else {
            expect(b.cardDisplay, `${name}: card hidden by visibility`).to.eq('none');
            expect(b.card.height, `${name}: nothing painted`).to.eq(0);
        }
    });
};
const probeText = (name, context, expected) =>
    cy
        .get(commonWidgetSelector.draggableWidget(name), { timeout: 30000 })
        .should(($el) => expect($el.text().trim(), `${context}: ${name}`).to.eq(expected));
const expectDeviceSet = (layout, context) => {
    cy.log(`device × visibility gates — ${context} (${layout})`);
    // wait on a widget that must be there, then check every combination
    cy.get(timelineSelector.card('bothdevices'), { timeout: 30000 }).should('be.visible');
    Object.entries(EXPECTED[layout]).forEach(([name, state]) => expectState(name, state));
};

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Timeline — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Timeline-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('Show on desktop / Show on mobile toggles gate the Timeline on the matching editor layout, independently of Visibility', () => {
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
            cy.apiCreateApp(`${fake.companyName}-Timeline-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('Saved device and visibility flags give the same result in the editor, preview and released app on desktop and mobile', () => {
            const slug = `timeline-devices-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            addTimelinesViaApi(
                DEVICE_WIDGETS.map(({ name, others, properties }, i) => ({
                    name,
                    others,
                    properties,
                    // dynamic: stacked rows so each widget keeps its own slot on the narrower mobile grid too
                    layout: { top: 40 + i * 110, left: 2, width: 20, height: 100 },
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

        // Exposed value context: timeline.js:84-86 registers `value: {}` (seeded for every instance, never updated by
        // Timeline.jsx). `withinput` also depends on a TextInput, whose mount re-resolves it (control: the store
        // holds {}); `timelineonly` depends on nothing but the Timeline.
        it('The exposed value resolves to {} in a binding in the editor and the running app', () => {
            const both = { showOnDesktop: ON, showOnMobile: ON };
            addTimelinesViaApi([
                { name: 'tlvalue', layout: { top: 40, left: 2, width: 12, height: AUTHORED }, others: both },
                { type: 'TextInput', name: 'trigger', layout: { top: 40, left: 30, width: 8, height: 40 } },
                {
                    type: 'Text',
                    name: 'withinput',
                    layout: { top: 220, left: 2, width: 12, height: 40 },
                    properties: { text: { value: "{{components.trigger.value + JSON.stringify(components.tlvalue.value)}}" } },
                },
                {
                    type: 'Text',
                    name: 'timelineonly',
                    layout: { top: 280, left: 2, width: 12, height: 40 },
                    properties: { text: { value: '{{JSON.stringify(components.tlvalue.value)}}' } },
                },
            ]);
            cy.openApp('', undefined, undefined, commonWidgetSelector.draggableWidget('timelineonly'));
            probeText('withinput', 'editor', T.emptyValueJson);
            probeText('timelineonly', 'editor', T.emptyValueJson);
            openDividerAppInViewer(timelineSelector.card('tlvalue'));
            probeText('withinput', 'viewer', T.emptyValueJson);
            probeText('timelineonly', 'viewer', T.emptyValueJson);
        });

        // ── Timeline-BRW-001: editor vs running app ──────────────────────────
        it('[Timeline-BRW-001] Dynamic height measures the real content in preview and the released app on desktop and mobile, while the editor canvas keeps the authored height and scrolls', () => {
            const slug = `timeline-dynamic-${Cypress._.uniqueId()}-${Date.now()}`; // dynamic: unique slug
            const both = { showOnDesktop: ON, showOnMobile: ON };
            addTimelinesViaApi([
                {
                    name: 'tldyn',
                    layout: { top: 40, left: 2, width: 15, height: AUTHORED },
                    mobileLayout: { width: 40 }, // dynamic: full-width on the mobile grid
                    others: both,
                    properties: { data: { value: timelineDataExpr(7, word()) }, dynamicHeight: ON }, // dynamic: overflows 150px
                },
                {
                    type: 'Text',
                    name: 'below',
                    layout: { top: 40 + AUTHORED + GAP, left: 2, width: 15, height: 40 },
                    mobileLayout: { width: 40 },
                    others: both,
                    properties: { text: { value: word() } },
                },
            ]);
            const expectGrown = (context) => {
                timelineBoxes('tldyn', (b) => {
                    expect(b.itemCount, `${context}: items`).to.eq(7);
                    expectHugsContent(b, AUTHORED, context);
                    expect(b.wrapper.height, `${context}: grew past the authored height`).to.be.gt(AUTHORED * 2);
                });
                expectStackedBelow('tldyn', 'below', GAP, context);
            };
            const expectAuthored = (context) => {
                timelineBoxes('tldyn', (b) => {
                    expectFixedHeight(b, AUTHORED, context);
                    expect(b.scrollHeight, `${context}: content scrolls inside`).to.be.gt(b.clientHeight + 100);
                });
                expectStackedBelow('tldyn', 'below', GAP, context);
            };

            // editor canvas, both layouts: authored height, the content scrolls
            cy.openApp('', undefined, undefined, timelineSelector.card('tldyn'));
            expectAuthored('editor desktop');
            switchLayout('mobile');
            expectAuthored('editor mobile');
            switchLayout('desktop');

            // preview, both layouts
            openDividerAppInViewer(timelineSelector.card('tldyn'));
            expectGrown('preview desktop');
            openDividerAppInViewer(timelineSelector.card('tldyn'), { query: '&layout=mobile' });
            expectGrown('preview mobile');

            // released app, desktop screen and phone
            releaseAndMakePublic(slug);
            cy.visit(`/applications/${slug}`);
            expectGrown('released desktop');
            cy.viewport(390, 844); // dynamic: phone viewport
            cy.visit(`/applications/${slug}`, {
                onBeforeLoad(win) {
                    Object.defineProperty(win.screen, 'width', { configurable: true, get: () => 390 }); // dynamic: phone
                },
            });
            expectGrown('released phone');
        });
    });
});
