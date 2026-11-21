/**
 * SPEC — Circular Progressbar — styles facet (alignment, padding, box shadow, loading rotation).
 * FOR AI: TESTING.md browser scenario:
 *   CircularProgressBar-BRW-001 — in editor and viewer, left/center/right alignment, padding, box shadow and the
 *                                 loading rotation produce the documented visual result without layout overflow.
 * (Responsive SVG sizing lives in canvas.cy.js; device flags in contexts.cy.js.)
 * Alignment → inner flex justify-content (CirularProgressbar.jsx:49-54); padding → RenderWidget box padding
 * BOX_PADDING / 0 (RenderWidget.jsx:343); box shadow → outer root (CirularProgressbar.jsx:44-47); loading →
 * `rotate-forever` on the INNER container (CirularProgressbar.jsx:133, circularProgressbar.scss:1-13: spin 1.2s linear
 * infinite) so the root and its shadow stay still (commit 51a57d433f4), with the hard-coded 25 / blank-label
 * presentation (CirularProgressbar.jsx:56-61).
 * Helpers: addCircularProgressBarsViaApi, cpbBoxes, expectCircleFits, sampleCpb, expectDiscInsideBox,
 * rootShadowClip, openDividerAppInViewer, dividerHitAt, selectStyleSwitch, openEditorSidebar.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { circularProgressBarSelector } from "Selectors/appBuilder/components/circularProgressBar";
import { circularProgressBarText } from "Texts/appBuilder/components/circularProgressBar";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { selectStyleSwitch } from "Support/utils/appBuilder/components/baseInput";
import { openDividerAppInViewer, dividerHitAt } from "Support/utils/appBuilder/components/divider";
import {
    addCircularProgressBarsViaApi,
    cpbBoxes,
    expectCircleFits,
    sampleCpb,
    expectDiscInsideBox,
    rootShadowClip,
} from "Support/utils/appBuilder/components/circularProgressBar";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = circularProgressBarText;
const PX = 0.75; // sub-pixel layout tolerance
const SHADOW = '4px 6px 8px 2px #ff0000'; // dynamic: authored shadow
const SHADOW_COMPUTED = 'rgb(255, 0, 0) 4px 6px 8px 2px';
const SLOT = { width: 12, height: 80 }; // dynamic: wide enough for left/right to differ from centre
const LOADING = { loadingState: { value: '{{true}}' } }; // circularProgressbar.js:79-83 toggle
const shortText = () => fake.fullName.slice(0, 10).trim();
const mid = (r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });

// alignment × padding grid (circularProgressbar.js:174-189 alignment, :205-213 padding)
const ALIGN_GRID = [
    { name: 'leftpad', alignment: T.alignLeft, padding: T.paddingDefault, left: 2, top: 40 },
    { name: 'centerpad', alignment: T.alignCenter, padding: T.paddingDefault, left: 15, top: 40 },
    { name: 'rightpad', alignment: T.alignRight, padding: T.paddingDefault, left: 28, top: 40 },
    { name: 'leftnone', alignment: T.alignLeft, padding: T.paddingNone, left: 2, top: 140 },
    { name: 'centernone', alignment: T.alignCenter, padding: T.paddingNone, left: 15, top: 140 },
    { name: 'rightnone', alignment: T.alignRight, padding: T.paddingNone, left: 28, top: 140 },
];
const expectAlignGrid = (context) =>
    ALIGN_GRID.forEach(({ name, alignment, padding }) =>
        cpbBoxes(name, (b) =>
            expectCircleFits(b, `${context}: ${name}`, {
                alignment,
                padding: padding === T.paddingNone ? 0 : T.boxPadding,
            })
        )
    );

// loading rotation: spins the inner container, ring stays in place inside the box, root + shadow do not move
const expectSpinsInPlace = (name, context) => {
    cpbBoxes(name, (b) => {
        expect(b.innerClass, `${context}: loading class on the inner container`).to.contain(T.loadingClass);
        expect(b.innerAnimation, `${context}: spin animation`).to.eq(T.loadingAnimation);
        expect(b.label, `${context}: blank loading label`).to.eq(T.loadingLabel);
    });
    sampleCpb(name, 6, 170).then((snaps) => {
        const [first] = snaps;
        const transforms = new Set(snaps.map((s) => s.innerTransform));
        expect(transforms.size, `${context}: inner container keeps rotating (${[...transforms].join(' | ')})`).to.be.gt(2);
        // measured against the widget box: the editor canvas may still settle its width while sampling
        const rel = (s) => ({
            left: s.root.left - s.box.left,
            top: s.root.top - s.box.top,
            right: s.box.right - s.root.right,
            bottom: s.box.bottom - s.root.bottom,
        });
        snaps.forEach((s, i) => {
            Object.entries(rel(s)).forEach(([edge, gap]) =>
                expect(gap, `${context} #${i}: root does not move (${edge} gap to the box)`).to.be.closeTo(rel(first)[edge], 0.5)
            );
            expect(s.root.height, `${context} #${i}: root keeps its size`).to.be.closeTo(first.root.height, 0.5);
            expect(s.rootShadow, `${context} #${i}: root shadow stays`).to.eq(first.rootShadow);
            expect(mid(s.ring).x, `${context} #${i}: ring centre x fixed at the root centre`).to.be.closeTo(mid(s.root).x, 1);
            expect(mid(s.ring).y, `${context} #${i}: ring centre y fixed at the root centre`).to.be.closeTo(mid(s.root).y, 1);
            expectDiscInsideBox(s, `${context} #${i}`);
        });
    });
};

// testIsolation:false for cypress-real-dnd (the editor test drops a widget); each test creates its own app.
describe('Circular Progressbar — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-CircularProgressBar-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── alignment × padding geometry ──────────────────────────────────────────
    it('[CircularProgressBar-BRW-001] Left / center / right alignment with default and none padding place the fitted ring at the root edge or centre, in the editor and the viewer', () => {
        addCircularProgressBarsViaApi(
            ALIGN_GRID.map(({ name, alignment, padding, left, top }) => ({
                name,
                layout: { top, left, ...SLOT },
                styles: { alignment: { value: alignment }, padding: { value: padding } },
            }))
        );
        cy.openApp('', undefined, undefined, circularProgressBarSelector.svg('rightnone'));
        expectAlignGrid('editor');
        openDividerAppInViewer(circularProgressBarSelector.svg('rightnone'));
        expectAlignGrid('viewer');
        // the three alignments really differ
        cpbBoxes('leftpad', (l) => {
            expect(l.svg.right, 'left-aligned SVG ends well before the root centre').to.be.lt(mid(l.root).x - 20);
        });
        cpbBoxes('rightpad', (r) => {
            expect(r.svg.left, 'right-aligned SVG starts well after the root centre').to.be.gt(mid(r.root).x + 20);
        });
        // padding none: the root touches the box edge; default: inset by BOX_PADDING
        cpbBoxes('leftnone', (b) => expect(b.svg.left, 'none: SVG flush with the box').to.be.closeTo(b.box.left, PX));
        cpbBoxes('leftpad', (b) =>
            expect(b.svg.left, 'default: SVG inset by the box padding').to.be.closeTo(b.box.left + T.boxPadding, PX)
        );
    });

    // ── Styles panel drives the live editor canvas ────────────────────────────
    it('[CircularProgressBar-BRW-001] Switching Alignment and Padding in the Styles panel repositions the ring live on the editor canvas', () => {
        const W = T.defaultWidgetName;
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
        cpbBoxes(W, (b) => expectCircleFits(b, 'default'));

        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        selectStyleSwitch(T.alignLeft);
        cpbBoxes(W, (b) => expectCircleFits(b, 'left', { alignment: T.alignLeft }));
        selectStyleSwitch(T.alignRight);
        cpbBoxes(W, (b) => expectCircleFits(b, 'right', { alignment: T.alignRight }));
        selectStyleSwitch(T.paddingNone);
        cpbBoxes(W, (b) => {
            expectCircleFits(b, 'right + none', { alignment: T.alignRight, padding: 0 });
            expect(b.svg.right, 'flush with the box right edge').to.be.closeTo(b.box.right, PX);
        });
        selectStyleSwitch(T.paddingDefault);
        selectStyleSwitch(T.alignCenter);
        cpbBoxes(W, (b) => expectCircleFits(b, 'back to centre'));
    });

    // ── box shadow ────────────────────────────────────────────────────────────
    it('[CircularProgressBar-BRW-001] Box shadow paints on the root without being clipped, leaves the ring in place, and neighbours keep their place, content and pointer', () => {
        const leftText = shortText();
        const belowText = shortText();
        addCircularProgressBarsViaApi([
            {
                type: 'Text',
                name: 'leftneighbour',
                layout: { top: 40, left: 2, width: 6, height: 40 }, // dynamic: directly left of the widget
                properties: { text: { value: leftText } },
            },
            {
                name: 'shadowed',
                layout: { top: 40, left: 8, ...SLOT },
                styles: { boxShadow: { value: SHADOW } },
            },
            {
                type: 'Text',
                name: 'belowneighbour',
                layout: { top: 120, left: 8, width: 6, height: 40 }, // dynamic: directly below
                properties: { text: { value: belowText } },
            },
            { name: 'plain', layout: { top: 200, left: 8, ...SLOT } }, // source: circularProgressbar.js:270 default
        ]);
        cy.openApp('', undefined, undefined, circularProgressBarSelector.svg('plain'));
        cpbBoxes('shadowed', (b) => {
            expect(b.rootShadow, 'editor: root shadow').to.eq(SHADOW_COMPUTED);
            expectCircleFits(b, 'editor: shadowed');
        });

        openDividerAppInViewer(circularProgressBarSelector.svg('plain'));
        cpbBoxes('shadowed', (b) => {
            expect(b.rootShadow, 'viewer: root shadow').to.eq(SHADOW_COMPUTED);
            expectCircleFits(b, 'viewer: shadowed');
        });
        cpbBoxes('plain', (b) => expect(b.rootShadow, 'default shadow paints nothing').to.eq(T.defaultShadowComputed));
        // no ancestor with overflow other than visible cuts the shadow's painted extent
        rootShadowClip('shadowed').then((s) => {
            expect(s.extent.bottom, 'shadow reaches below the root').to.be.gt(s.root.bottom + 8);
            expect(s.clippedBy, `shadow ${s.shadow} not clipped by any ancestor`).to.deep.eq([]);
        });
        // probe sensitivity: the shadow reaches past the widget box, so a clipping box would be reported
        cy.get(circularProgressBarSelector.draggableWidget('shadowed')).first().invoke('css', 'overflow', 'hidden');
        rootShadowClip('shadowed').then((s) =>
            expect(s.clippedBy.map((c) => c.cy), 'probe detects a clipping box').to.include('draggable-widget-shadowed')
        );
        cy.get(circularProgressBarSelector.draggableWidget('shadowed')).first().invoke('css', 'overflow', '');
        // neighbours keep their slots and text, and take the pointer
        cy.get(circularProgressBarSelector.draggableWidget('shadowed')).then(($w) => {
            const wr = $w[0].getBoundingClientRect();
            cy.get(commonWidgetSelector.draggableWidget('leftneighbour')).should(($n) => {
                expect($n[0].getBoundingClientRect().right, 'left neighbour ends before the widget').to.be.lte(wr.left + PX);
                expect($n.text().trim(), 'left neighbour text intact').to.eq(leftText);
            });
            cy.get(commonWidgetSelector.draggableWidget('belowneighbour')).should(($n) => {
                expect($n[0].getBoundingClientRect().top, 'below neighbour starts after the widget').to.be.gte(wr.bottom - PX);
                expect($n.text().trim(), 'below neighbour text intact').to.eq(belowText);
            });
        });
        ['leftneighbour', 'belowneighbour'].forEach((name) =>
            dividerHitAt(commonWidgetSelector.draggableWidget(name), 0.5, 0.5).then((hit) =>
                expect(hit.insideSelector, `${name} receives the pointer (hit ${hit.tag})`).to.eq(true)
            )
        );
    });

    // ── loading rotation, centred ─────────────────────────────────────────────
    it('[CircularProgressBar-BRW-001] Loading spins the centred ring in place inside the widget while the root and its shadow stay still, in the editor and the viewer', () => {
        addCircularProgressBarsViaApi([
            { name: 'spinner', layout: { top: 40, left: 2, ...SLOT }, properties: LOADING, styles: { boxShadow: { value: SHADOW } } },
            { name: 'idle', layout: { top: 140, left: 2, ...SLOT } }, // control: not loading
        ]);
        cy.openApp('', undefined, undefined, circularProgressBarSelector.svg('idle'));
        expectSpinsInPlace('spinner', 'editor');
        cpbBoxes('spinner', (b) => expect(b.rootShadow, 'editor: shadow on the still root').to.eq(SHADOW_COMPUTED));
        cpbBoxes('idle', (b) => {
            expect(b.innerAnimation, 'control: no animation').to.eq('none');
            expect(b.label, 'control: value label').to.eq(T.defaultLabel);
        });

        openDividerAppInViewer(circularProgressBarSelector.svg('idle'));
        expectSpinsInPlace('spinner', 'viewer');
        cpbBoxes('spinner', (b) => expect(b.rootShadow, 'viewer: shadow on the still root').to.eq(SHADOW_COMPUTED));
    });

    // ── loading rotation, left / right aligned ────────────────────────────────
    it('[CircularProgressBar-BRW-001] Loading with left or right alignment keeps the spinning ring inside its widget box', () => {
        addCircularProgressBarsViaApi([
            { name: 'loadleft', layout: { top: 40, left: 2, ...SLOT }, properties: LOADING, styles: { alignment: { value: T.alignLeft } } },
            { name: 'loadright', layout: { top: 200, left: 2, ...SLOT }, properties: LOADING, styles: { alignment: { value: T.alignRight } } },
        ]);
        openDividerAppInViewer(circularProgressBarSelector.svg('loadright'));
        ['loadleft', 'loadright'].forEach((name) => {
            cpbBoxes(name, (b) => expect(b.innerAnimation, `${name}: spinning`).to.eq(T.loadingAnimation));
            sampleCpb(name, 6, 170).then((snaps) => snaps.forEach((s, i) => expectDiscInsideBox(s, `${name} #${i}`)));
        });
    });
});
