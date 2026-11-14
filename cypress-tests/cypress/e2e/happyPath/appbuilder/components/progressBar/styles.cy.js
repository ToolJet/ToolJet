/**
 * SPEC — ProgressBar — styles facet (label alignment/direction geometry, padding, box shadow, loading animation).
 * FOR AI: TESTING.md browser scenario:
 *   ProgressBar-BRW-001 — in the editor and the viewer, side/top/left/right geometry, padding, box shadow and the
 *                         loading keyframe animation produce the documented visual result without layout overflow
 *                         (device visibility lives in contexts.cy.js, resize geometry in canvas.cy.js).
 * All of these are style inputs (alignment / direction / padding / boxShadow) or the loading state's CSS animation,
 * so they live here. Real layout boxes are read from apps seeded through the components API, once in the editor
 * canvas and once in the viewer; one editor test drives the Styles panel live.
 * Layout contract: Progressbar.jsx:120-175 (flex root, label, bar container, track); padding: RenderWidget.jsx:343
 * + Progressbar.jsx:33; loading strip: Progressbar.jsx:186-206 + progressbar.scss:1-8.
 * Helpers: addProgressBarsViaApi, openProgressBarAppInViewer, progressBarBoxes, readProgressBarBoxes, expectProgressBarLayout,
 * progressBarMetrics, loadingStripFrames, stripLeftOverTime, dividerHitAt, resolveCssVarColor, selectStyleSwitch,
 * openEditorSidebar.
 * Seeded layouts: `left` and `width` are grid columns (43 per row), `top`/`height` px.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { progressBarSelector } from "Selectors/appBuilder/components/progressBar";
import { progressBarText } from "Texts/appBuilder/components/progressBar";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { resolveCssVarColor, selectStyleSwitch } from "Support/utils/appBuilder/components/baseInput";
import { dividerHitAt } from "Support/utils/appBuilder/components/divider";
import {
    addProgressBarsViaApi,
    openProgressBarAppInViewer,
    progressBarBoxes,
    readProgressBarBoxes,
    expectProgressBarLayout,
    progressBarMetrics,
    loadingStripFrames,
    stripLeftOverTime,
} from "Support/utils/appBuilder/components/progressBar";

const T = progressBarText;
const PX = 1; // sub-pixel layout tolerance
const SHADOW = '4px 6px 8px 2px #ff0000'; // dynamic: test shadow
const SHADOW_COMPUTED = 'rgb(255, 0, 0) 4px 6px 8px 2px';

// the four label placements (styles.alignment progressbar.js:97-106 × styles.direction progressbar.js:107-119)
const PLACEMENTS = [
    { name: 'sideleft', alignment: T.alignSide, direction: T.directionLeft, height: 50 },
    { name: 'sideright', alignment: T.alignSide, direction: T.directionRight, height: 50 },
    { name: 'topleft', alignment: T.alignTop, direction: T.directionLeft, height: 80 },
    { name: 'topright', alignment: T.alignTop, direction: T.directionRight, height: 80 },
];

// opens the seeded app in the editor canvas, runs the check, then in the viewer and runs it again
const inEditorAndViewer = (waitName, check) => {
    cy.openApp('', undefined, undefined, progressBarSelector.root(waitName));
    check('editor');
    openProgressBarAppInViewer(progressBarSelector.root(waitName));
    check('viewer');
};

// testIsolation:false for cypress-real-dnd (the Styles panel test drops a widget); each test creates its own app.
describe('ProgressBar — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-ProgressBar-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── ProgressBar-BRW-001 — side / top × left / right geometry ─────────────
    it('[ProgressBar-BRW-001] Side and top label alignment with left and right direction place label and bar without overflow in the editor and the viewer', () => {
        addProgressBarsViaApi(
            PLACEMENTS.map(({ name, alignment, direction, height }, i) => ({
                name,
                layout: { top: 40 + i * 100, left: 4, width: 10, height }, // dynamic: stacked slots
                styles: { alignment: { value: alignment }, direction: { value: direction } },
            }))
        );
        inEditorAndViewer('topright', (context) =>
            PLACEMENTS.forEach(({ name, alignment, direction }) =>
                expectProgressBarLayout(name, { alignment, direction, context })
            )
        );
    });

    // ── ProgressBar-BRW-001 — padding ────────────────────────────────────────
    it('[ProgressBar-BRW-001] Padding Default insets the bar by 2px and None draws it edge to edge, sizing label and bar from the padding-aware height', () => {
        const sized = { textSize: { value: '{{40}}' }, progressBarThickness: { value: '{{40}}' } }; // dynamic: within 1–50
        addProgressBarsViaApi([
            { name: 'paddefault', layout: { top: 40, left: 4, width: 10, height: 60 } }, // source: progressbar.js:272
            { name: 'padnone', layout: { top: 130, left: 4, width: 10, height: 60 }, styles: { padding: { value: T.paddingNone } } },
            { name: 'sizeddefault', layout: { top: 220, left: 4, width: 10, height: 60 }, styles: sized },
            {
                name: 'sizednone',
                layout: { top: 310, left: 4, width: 10, height: 60 },
                styles: { ...sized, padding: { value: T.paddingNone } },
            },
        ]);
        inEditorAndViewer('sizednone', (context) => {
            expectProgressBarLayout('paddefault', { context });
            expectProgressBarLayout('padnone', { padding: T.paddingNone, context });
            expectProgressBarLayout('sizeddefault', { textSize: 40, thickness: 40, context });
            expectProgressBarLayout('sizednone', { padding: T.paddingNone, textSize: 40, thickness: 40, context });
            // None is thicker than Default by exactly the 2 × BOX_PADDING it no longer subtracts
            readProgressBarBoxes('paddefault').then((d) => {
                progressBarBoxes('padnone', (n) => {
                    const gain = (2 * T.boxPadding * T.defaultThickness) / 100;
                    expect(n.track.height - d.track.height, `${context}: None bar thicker by 4px × 20%`).to.be.closeTo(gain, 0.2);
                    expect(n.root.width - d.root.width, `${context}: None root wider by 2 × 2px`).to.be.closeTo(2 * T.boxPadding, PX);
                });
            });
        });
    });

    // ── ProgressBar-BRW-001 — box shadow ─────────────────────────────────────
    it('[ProgressBar-BRW-001] Box shadow paints on the progress bar root, is not clipped by the widget box, and leaves the layout and a neighbouring component intact', () => {
        const neighbourText = fake.fullName.slice(0, 10).trim();
        addProgressBarsViaApi([
            { name: 'shadowed', layout: { top: 40, left: 4, width: 10, height: 50 }, styles: { boxShadow: { value: SHADOW } } },
            { name: 'plain', layout: { top: 200, left: 4, width: 10, height: 50 } }, // source: progressbar.js:271 default
            {
                type: 'Text',
                name: 'neighbour',
                layout: { top: 96, left: 4, width: 10, height: 40 }, // dynamic: right below the shadowed bar
                properties: { text: { value: neighbourText } },
            },
        ]);
        inEditorAndViewer('shadowed', (context) => {
            progressBarBoxes('shadowed', (b) => {
                expect(b.root.boxShadow, `${context}: shadow on the root`).to.eq(SHADOW_COMPUTED);
                // the shadow paints outside the root: nothing between it and the canvas clips it
                expect(b.boxOverflow, `${context}: widget box does not clip`).to.eq('visible');
                expect(b.wrapperOverflow, `${context}: widget wrapper does not clip`).to.eq('visible');
            });
            progressBarBoxes('plain', (b) =>
                expect(b.root.boxShadow, `${context}: default shadow paints nothing`).to.eq(T.defaultBoxShadowComputed)
            );
            // the shadow does not change the bar's own geometry
            expectProgressBarLayout('shadowed', { context: `${context} shadowed` });
            cy.get(progressBarSelector.draggableWidget('shadowed')).then(($p) => {
                const pr = $p[0].getBoundingClientRect();
                cy.get(commonWidgetSelector.draggableWidget('neighbour')).should(($n) => {
                    const nr = $n[0].getBoundingClientRect();
                    expect(nr.top, `${context}: neighbour below the bar`).to.be.gte(pr.bottom - PX);
                    expect($n.text().trim(), `${context}: neighbour text intact`).to.eq(neighbourText);
                });
            });
            dividerHitAt(commonWidgetSelector.draggableWidget('neighbour'), 0.5, 0.3).then((hit) =>
                expect(hit.insideSelector, `${context}: neighbour receives the pointer (hit ${hit.tag})`).to.eq(true)
            );
        });
    });

    // ── ProgressBar-BRW-001 — loading keyframe animation ─────────────────────
    it('[ProgressBar-BRW-001] Loading runs the progressLoading keyframes: a 21% strip sweeps the track from -21% to 100%, clipped by the track, with label and track unchanged', () => {
        addProgressBarsViaApi([
            { name: 'loading', layout: { top: 40, left: 4, width: 10, height: 50 }, properties: { loadingState: { value: '{{true}}' } } },
            // completed + loading: still the progress-track colour, never the completion colour (Progressbar.jsx:122,201)
            {
                name: 'loadingdone',
                layout: { top: 120, left: 4, width: 10, height: 50 },
                properties: { loadingState: { value: '{{true}}' }, progress: { value: '{{100}}' } },
            },
        ]);
        inEditorAndViewer('loadingdone', (context) => {
            resolveCssVarColor('--cc-primary-brand', progressBarSelector.root('loading')).then((brand) => {
                ['loading', 'loadingdone'].forEach((name) =>
                    progressBarBoxes(name, (b) => {
                        expect(b.fill, `${context} ${name}: static fill replaced`).to.eq(null);
                        expect(b.strip, `${context} ${name}: loading strip`).to.not.eq(null);
                        expect(b.strip.animationName, `${context} ${name}: keyframes`).to.eq(T.loadingAnimation);
                        expect(b.strip.animationDuration, `${context} ${name}: 1.5s`).to.eq(`${T.loadingDurationMs / 1000}s`);
                        expect(b.strip.animationTiming, `${context} ${name}: easing`).to.eq(T.loadingEasing);
                        expect(b.strip.animationIterations, `${context} ${name}: loops forever`).to.eq('infinite');
                        expect(b.strip.width, `${context} ${name}: strip is 21% of the track`).to.be.closeTo(b.track.width * T.loadingStripShare, PX);
                        expect(b.strip.height, `${context} ${name}: strip as thick as the track`).to.be.closeTo(b.track.height, 0.5);
                        expect(b.strip.bgColor, `${context} ${name}: progress-track colour`).to.eq(brand);
                        expect(b.track.overflow, `${context} ${name}: track clips`).to.eq('hidden');
                        expect(b.strip.clipOverflow, `${context} ${name}: strip holder clips`).to.eq('hidden');
                    })
                );
            });
            // label and track stay as in the static bar (no overflow, same size formula)
            expectProgressBarLayout('loading', { context });
            expectProgressBarLayout('loadingdone', { progress: 100, context });

            // the keyframes: start fully left of the track, end fully right of it, cross it in between
            loadingStripFrames('loading', [0, T.loadingDurationMs / 2, T.loadingDurationMs - 1]).then((a) => {
                expect(a.name, `${context}: animation`).to.eq(T.loadingAnimation);
                expect(a.playState, `${context}: running`).to.eq('running');
                expect(a.duration, `${context}: duration`).to.eq(T.loadingDurationMs);
                expect(a.iterations, `${context}: infinite`).to.eq(Infinity);
                expect(a.keyframes.map((k) => k.left), `${context}: from -21% to 100%`).to.deep.eq([
                    T.loadingKeyframeFrom,
                    T.loadingKeyframeTo,
                ]);
                a.keyframes.forEach((k) => expect(k.easing, `${context}: keyframe easing`).to.eq(T.loadingEasing));
                const [start, mid, end] = a.frames;
                expect(start.strip.right, `${context}: t=0 strip ends at the track start`).to.be.closeTo(start.track.left, PX);
                expect(mid.strip.left, `${context}: mid strip inside the track (left)`).to.be.gt(mid.track.left);
                expect(mid.strip.right, `${context}: mid strip inside the track (right)`).to.be.lt(mid.track.right);
                expect(end.strip.left, `${context}: end strip at the track end`).to.be.closeTo(end.track.right, 2);
            });
            // and they actually play: the strip moves on its own
            stripLeftOverTime('loading', 300).then(([a, b]) =>
                expect(a, `${context}: strip moved within 300ms`).to.not.be.closeTo(b, 0.5)
            );
        });
    });

    // ── ProgressBar-BRW-001 — Styles panel drives the live editor canvas ─────
    it('[ProgressBar-BRW-001] Switching Alignment, direction and Padding in the Styles panel re-lays the bar live on the editor canvas', () => {
        const W = T.defaultWidgetName;
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
        expectProgressBarLayout(W, { context: 'dropped' });

        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        selectStyleSwitch(T.directionRight);
        expectProgressBarLayout(W, { direction: T.directionRight, context: 'side/right' });
        selectStyleSwitch(T.alignTop);
        expectProgressBarLayout(W, { alignment: T.alignTop, direction: T.directionRight, context: 'top/right' });
        selectStyleSwitch(T.paddingNone);
        expectProgressBarLayout(W, {
            alignment: T.alignTop,
            direction: T.directionRight,
            padding: T.paddingNone,
            context: 'top/right/none',
        });
        selectStyleSwitch(T.directionLeft);
        selectStyleSwitch(T.alignSide);
        selectStyleSwitch(T.paddingDefault);
        expectProgressBarLayout(W, { context: 'back to side/left/default' });
        // the size formula really used the live box height
        progressBarBoxes(W, (b) => {
            const m = progressBarMetrics({ boxHeight: b.box.height });
            expect(b.track.height, 'default thickness 20% of the padded height').to.be.closeTo(m.barHeight, 0.5);
        });
    });
});
