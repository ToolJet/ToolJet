/**
 * SPEC — Timeline — styles facet (box shadow).
 * FOR AI: the box-shadow half of TESTING.md browser scenario:
 *   Timeline-BRW-001 — `boxShadow` renders the configured computed CSS on the card, in the editor and the running
 *                      app, including on a dynamic-height card that grew with its content and on a scrolling card,
 *                      without being clipped by an ancestor and without moving neighbours.
 * (Reflow / scrolling in canvas.cy.js; editor-vs-running-app in contexts.cy.js.)
 * boxShadow (timeline.js:74-82, accordian `container`, default timeline.js:106) → `.card` inline box-shadow
 * (Timeline.jsx:49); Timeline is in SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY, so its own styles.boxShadow wins over the
 * universal generalStyles one (RenderWidget.jsx).
 * Helpers: openEditorSidebar, openAccordion, fillBoxShadowParams, selectColourFromColourPicker, addTimelinesViaApi,
 * timelineDataExpr, timelineBoxes, expectHugsContent, expectFixedHeight, expectStackedBelow, rootShadowClip,
 * dividerHitAt, openDividerAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { timelineSelector } from "Selectors/appBuilder/components/timeline";
import { timelineText } from "Texts/appBuilder/components/timeline";
import {
    openEditorSidebar,
    openAccordion,
    fillBoxShadowParams,
    selectColourFromColourPicker,
} from "Support/utils/commonWidget";
import { openDividerAppInViewer, dividerHitAt } from "Support/utils/appBuilder/components/divider";
import { rootShadowClip } from "Support/utils/appBuilder/components/circularProgressBar";
import {
    addTimelinesViaApi,
    timelineDataExpr,
    timelineBoxes,
    expectHugsContent,
    expectFixedHeight,
    expectStackedBelow,
} from "Support/utils/appBuilder/components/timeline";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = timelineText.defaultWidgetName;
const T = timelineText;
const ON = { value: '{{true}}' }; // timeline.js:98 toggle value
const SHADOW = '4px 6px 8px 2px #ff0000'; // dynamic: authored shadow
const SHADOW_COMPUTED = 'rgb(255, 0, 0) 4px 6px 8px 2px';
const PANEL_PARAMS = [2, 4, 6, 0]; // dynamic: X / Y / Blur / Spread typed in the Styles panel
const PANEL_COLOR = ['255', '0', '0', '90']; // dynamic: shadow colour (alpha < 100 keeps the rgba form)
const PANEL_COMPUTED = 'rgba(255, 0, 0, 0.9) 2px 4px 6px 0px';
const AUTHORED = 150; // dynamic: authored timeline height (px)
const GAP = 10; // dynamic: authored gap to the widget below
const word = () => fake.firstName.replace(/\W/g, '').slice(0, 8) || 'Item';

const expectUnclipped = (name, context) => {
    rootShadowClip(name).then((s) => {
        expect(s.shadow, `${context}: computed shadow`).to.eq(SHADOW_COMPUTED);
        expect(s.extent.bottom, `${context}: shadow reaches below the card`).to.be.gt(s.root.bottom + 8);
        expect(s.clippedBy, `${context}: shadow ${s.shadow} not clipped by any ancestor`).to.deep.eq([]);
    });
};

// testIsolation:false for cypress-real-dnd (the editor test drops a widget); each test creates its own app.
describe('Timeline — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Timeline-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Styles panel drives the live editor canvas and the running app ───────
    it('[Timeline-BRW-001] Box shadow set in the Styles panel renders the configured computed CSS on the card in the editor and the running app', () => {
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
        timelineBoxes(W, (b) => expect(b.cardShadow, 'default paints nothing').to.eq(T.defaultShadowComputed));

        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        openAccordion(T.containerAccordion);
        cy.get(commonWidgetSelector.stylePicker(T.boxShadowLabel)).click();
        fillBoxShadowParams(commonWidgetSelector.boxShadowDefaultParam, PANEL_PARAMS);
        selectColourFromColourPicker(T.boxShadowColorLabel, PANEL_COLOR, 0);
        cy.forceClickOnCanvas();
        timelineBoxes(W, (b) => {
            expect(b.cardShadow, 'editor: card shadow').to.eq(PANEL_COMPUTED);
            expectFixedHeight(b, T.defaultHeight, 'editor: shadow leaves the card geometry alone');
        });
        cy.waitForAutoSave();

        openDividerAppInViewer(timelineSelector.card(W));
        timelineBoxes(W, (b) => {
            expect(b.cardShadow, 'viewer: card shadow').to.eq(PANEL_COMPUTED);
            expect(b.itemCount, 'viewer: items').to.eq(T.defaultItemCount);
        });
    });

    // ── shadow on grown and scrolling cards, clipping, neighbours ───────────
    it('[Timeline-BRW-001] Box shadow follows a dynamic-height card that grew with its content and a scrolling card, is not clipped, and neighbours keep their place and pointer', () => {
        const belowText = word();
        addTimelinesViaApi([
            {
                name: 'grown',
                layout: { top: 40, left: 2, width: 12, height: AUTHORED },
                properties: { data: { value: timelineDataExpr(6, word()) }, dynamicHeight: ON }, // dynamic: overflows
                styles: { boxShadow: { value: SHADOW } },
            },
            {
                type: 'Text',
                name: 'below',
                layout: { top: 40 + AUTHORED + GAP, left: 2, width: 12, height: 40 },
                properties: { text: { value: belowText } },
            },
            {
                name: 'scrolling',
                layout: { top: 40, left: 16, width: 12, height: AUTHORED },
                properties: { data: { value: timelineDataExpr(6, word()) } },
                styles: { boxShadow: { value: SHADOW } },
            },
            { name: 'plain', layout: { top: 40, left: 30, width: 12, height: AUTHORED } }, // source: timeline.js:106 default
        ]);

        // editor: the configured shadow on both cards (authored height there)
        cy.openApp('', undefined, undefined, timelineSelector.card('plain'));
        ['grown', 'scrolling'].forEach((name) =>
            timelineBoxes(name, (b) => {
                expect(b.cardShadow, `editor: ${name} shadow`).to.eq(SHADOW_COMPUTED);
                expectFixedHeight(b, AUTHORED, `editor: ${name}`);
            })
        );
        timelineBoxes('plain', (b) => expect(b.cardShadow, 'editor: default paints nothing').to.eq(T.defaultShadowComputed));

        // running app
        openDividerAppInViewer(timelineSelector.card('plain'));
        timelineBoxes('grown', (b) => {
            expectHugsContent(b, AUTHORED, 'viewer: grown');
            expect(b.wrapper.height, 'viewer: grew past the authored height').to.be.gt(AUTHORED * 2);
            expect(b.cardShadow, 'viewer: grown shadow').to.eq(SHADOW_COMPUTED);
        });
        timelineBoxes('scrolling', (b) => {
            expectFixedHeight(b, AUTHORED, 'viewer: scrolling');
            expect(b.scrollHeight, 'viewer: scrolling content overflows').to.be.gt(b.clientHeight + 100);
            expect(b.cardShadow, 'viewer: scrolling shadow').to.eq(SHADOW_COMPUTED);
        });
        timelineBoxes('plain', (b) => expect(b.cardShadow, 'viewer: default paints nothing').to.eq(T.defaultShadowComputed));

        // the shadow is drawn around the whole grown card (its painted extent tracks the card's real bottom)
        // and no ancestor with overflow other than visible cuts it
        expectUnclipped('grown', 'viewer: grown');
        expectUnclipped('scrolling', 'viewer: scrolling');
        // probe sensitivity: the shadow reaches past the widget box, so a clipping box would be reported
        cy.get(timelineSelector.draggableWidget('grown')).first().invoke('css', 'overflow', 'hidden');
        rootShadowClip('grown').then((s) =>
            expect(s.clippedBy.map((c) => c.cy), 'probe detects a clipping box').to.include('draggable-widget-grown')
        );
        cy.get(timelineSelector.draggableWidget('grown')).first().invoke('css', 'overflow', '');

        // the neighbour below keeps its gap, its text and the pointer
        expectStackedBelow('grown', 'below', GAP, 'viewer: shadowed');
        cy.get(commonWidgetSelector.draggableWidget('below')).should(($n) =>
            expect($n.text().trim(), 'below neighbour text intact').to.eq(belowText)
        );
        dividerHitAt(commonWidgetSelector.draggableWidget('below'), 0.5, 0.5).then((hit) =>
            expect(hit.insideSelector, `below receives the pointer (hit ${hit.tag})`).to.eq(true)
        );
        // the shadowed cards themselves still take the pointer at their centre (the shadow is paint only)
        dividerHitAt(timelineSelector.card('scrolling'), 0.5, 0.5).then((hit) =>
            expect(hit.insideSelector, `scrolling card receives the pointer (hit ${hit.tag})`).to.eq(true)
        );
    });
});
