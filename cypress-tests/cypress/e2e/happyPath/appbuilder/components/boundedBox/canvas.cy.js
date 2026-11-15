/**
 * SPEC — Bounded Box — canvas facet.
 * FOR AI: always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/rename/delete+undo) + browser-only
 * geometry scenarios from TESTING.md:
 *   BoundedBox-BRW-001 — landscape/portrait/narrow/resized widgets keep the image inside the authored box and keep
 *                        saved and drawn rectangle/point overlays on the same image locations (editor + viewer)
 *   BoundedBox-BRW-002 — create/relabel label controls at every image edge stay inside the widget, stay usable and
 *                        do not cover neighbouring components
 *   BoundedBox-BRW-003 — (collapse side) hiding a collapse-when-hidden box reflows the widget below; showing it
 *                        again restores the same annotations (device flags live in contexts.cy.js)
 * Apps are seeded through the components API with SVG data-URI images (no network); the dropped widget's default
 * external image is served locally. Overlay positions are measured relative to the <img> box (annotation space is
 * percent of the image, Box.jsx:8-11).
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, openEditorSidebar, renameWidgetFromMenu,
 * deleteWidgetFromMenu, undo, redo, stubDefaultImageSource, resizeWidgetBy, openIconAppInViewer, expectLayout,
 * addBoundedBoxesViaApi, annotationsProbe, expectAnnotations, readAnnotations, bboxState, getBboxState,
 * waitForImage, drawRectangle, clickPoint, chooseLabel, svgDataUri, rectInside, rectsOverlap, relativeBox.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { boundedBoxSelector as S } from "Selectors/appBuilder/components/boundedBox";
import { boundedBoxText as T } from "Texts/appBuilder/components/boundedBox";
import {
    getWidgetRect,
    verifyWidgetMoved,
    verifyWidgetResized,
    verifyWidgetCount,
    duplicateWidgetByKeyboard,
    duplicateWidgetFromMenu,
    copyPasteWidget,
    cutWidget,
    pasteWidget,
    openEditorSidebar,
    renameWidgetFromMenu,
    deleteWidgetFromMenu,
    undo,
    redo,
} from "Support/utils/commonWidget";
import { stubDefaultImageSource } from "Support/utils/appBuilder/components/image";
import { resizeWidgetBy } from "Support/utils/appBuilder/components/svgImage";
import { openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import { expectLayout } from "Support/utils/appBuilder/components/textArea";
import {
    addBoundedBoxesViaApi,
    annotationsProbe,
    expectAnnotations,
    readAnnotations,
    bboxState,
    getBboxState,
    waitForImage,
    drawRectangle,
    clickPoint,
    chooseLabel,
    svgDataUri,
    rectInside,
    rectsOverlap,
    relativeBox,
} from "Support/utils/appBuilder/components/boundedBox";

const PX = 2; // layout tolerance (px)
const PCT = 1.5; // overlay registration tolerance (% of the image)
const EMPTY_DEFAULT = { value: '{{[]}}' };

const textWidget = (name, layout, text = name) => ({
    type: 'Text',
    name,
    layout: { height: 40, ...layout },
    properties: { text: { value: text } },
});

// is the centre of a widget's box hit by the widget itself (nothing painted over it)?
const ownsItsCentre = (doc, name) => {
    const el = doc.querySelector(commonWidgetSelector.draggableWidget(name));
    const r = el.getBoundingClientRect();
    const hit = doc.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && el.contains(hit);
};

const openEditor = (waitForSelector) =>
    cy.openApp('', undefined, undefined, waitForSelector);

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run); each test re-creates its app.
describe('Bounded Box — canvas facet', { testIsolation: false }, () => {
    let labels;

    beforeEach(() => {
        labels = [fake.firstName.slice(0, 8) || 'alpha', fake.lastName.slice(0, 8) || 'beta']; // dynamic label texts
        if (labels[0] === labels[1]) labels[1] = `${labels[1]}2`;
    });

    describe('editor canvas', () => {
        const W = T.defaultWidgetName;
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            stubDefaultImageSource(T.defaultImageUrlGlob);
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-BoundedBox-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget with its default image', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
            cy.get(S.img(W)).should('have.attr', 'src', T.defaultImageUrl); // source: boundedBox.js:121
            waitForImage(W);
            verifyWidgetCount(PREFIX, 1);
        });

        // BY DESIGN (triage B-26): Grid.jsx (966c208333) makes BoundedBox handle-only — onDragStart rejects a drag
        // unless it starts on the drag handle, so drawing on the body never drags the widget (like Table/Calendar/
        // Kanban inner content). A real drag on the body must leave the widget where it is.
        it('move: a real drag on the widget body does not move it (handle-only by design)', () => {
            waitForImage(W);
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                // start below the image (no annotation surface there) and drag 150px right, 100px down
                const x = before.w / 2;
                const y = before.h - 12;
                cy.get(commonWidgetSelector.draggableWidget(W)).realMouseDown({ position: { x, y }, scrollBehavior: false });
                for (let i = 1; i <= 10; i++) {
                    cy.get(commonWidgetSelector.draggableWidget(W)).realMouseMove(x + i * 15, y + i * 10, { position: 'topLeft', scrollBehavior: false });
                }
                cy.get(commonWidgetSelector.draggableWidget(W)).realMouseUp({ position: { x: x + 150, y: y + 100 }, scrollBehavior: false });
                cy.wait(800); // proving a negative: let any drag end / snap / autosave land before reading the box
                getWidgetRect(W).then((after) => {
                    expect(Math.abs(after.x - before.x), 'body drag leaves x').to.be.lte(PX);
                    expect(Math.abs(after.y - before.y), 'body drag leaves y').to.be.lte(PX);
                });
            });
        });

        // The designed way to move a handle-only widget is its drag handle — the config handle's name badge.
        // PRODUCT BUG (kept red, B-57): Grid.jsx:1097-1105 only lets the drag through when the pointer is over a
        // `.handle-content` element, which nothing renders any more (84b8d29f49 removed it from ConfigHandle), so the
        // badge drag is rejected too and BoundedBox cannot be moved by mouse at all (a Text moves by its badge).
        it('move: a real drag on the name badge (drag handle) repositions it', () => {
            waitForImage(W);
            getWidgetRect(W).as('r0');
            cy.get(commonWidgetSelector.draggableWidget(W)).realHover({ scrollBehavior: false });
            cy.get(commonWidgetSelector.draggableWidget(W))
                .closest('[component-type]')
                .find('.config-handle .component-name-btn')
                .should('be.visible')
                .as('badge');
            cy.get('@r0').then((before) => {
                cy.get('@badge').then(($b) => {
                    const b = $b[0].getBoundingClientRect();
                    const x0 = b.left + b.width / 2;
                    const y0 = b.top + b.height / 2;
                    cy.get('@badge').realMouseDown({ position: 'center', scrollBehavior: false });
                    // move in viewport coordinates (the badge travels with the widget, so don't anchor on it)
                    for (let i = 1; i <= 10; i++) {
                        cy.get('body').realMouseMove(x0 + i * 15, y0 + i * 10, { position: 'topLeft', scrollBehavior: false });
                    }
                    cy.get('body').realMouseUp({ position: { x: x0 + 150, y: y0 + 100 }, scrollBehavior: false });
                });
                verifyWidgetMoved(W, before);
            });
        });

        it('resize changes the widget dimensions', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                resizeWidgetBy(W, -120, -90);
                verifyWidgetResized(W, before);
            });
        });

        it('nudge (arrow keys) moves the selected widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                // select through the config handle: a click on the body never reaches the grid (BoundedBox.jsx:185)
                openEditorSidebar(W);
                for (let i = 0; i < 12; i++) cy.realPress('ArrowRight');
                verifyWidgetMoved(W, before);
            });
        });

        it('duplicate via keyboard (Cmd/Ctrl+D)', () => {
            duplicateWidgetByKeyboard(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('duplicate via ⋮ menu', () => {
            duplicateWidgetFromMenu(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('copy-paste (Cmd/Ctrl+C then +V)', () => {
            copyPasteWidget(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('cut removes the widget, paste restores it', () => {
            cutWidget(W); // asserts removal internally
            cy.forceClickOnCanvas();
            pasteWidget();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'annotator'); // asserts new name internally
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });

        it('delete via ⋮ menu, undo restores, redo removes', () => {
            deleteWidgetFromMenu(W);
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
            undo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            redo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });
    });

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-BoundedBox-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.get('body').realMouseMove(0, 0, { position: 'topLeft', scrollBehavior: false });
            cy.apiDeleteApp();
        });

        // ── BoundedBox-BRW-001 ─────────────────────────────────────────────
        // PRODUCT BUG (kept red): the <img> is laid out at width 100% / height auto, so a portrait image is taller
        // than its authored box and paints over the widget below. The fitting rule in theme.scss (`.bounded-box
        // .sc-dxgOiQ.jcdOkx { height: 100%; width: max-content }`) is keyed on generated styled-components class
        // hashes that this build does not emit (the container renders as another hash), so it never applies.
        it('[BoundedBox-BRW-001] Landscape, portrait and narrow images stay inside the authored widget box in the viewer and the editor', () => {
            const boxes = ['landscape', 'portrait', 'narrow'];
            addBoundedBoxesViaApi([
                { name: 'landscape', layout: { top: 40, left: 2, width: 12, height: 300 }, properties: { imageUrl: { value: svgDataUri(400, 200) }, defaultValue: EMPTY_DEFAULT } },
                { name: 'portrait', layout: { top: 40, left: 16, width: 8, height: 300 }, properties: { imageUrl: { value: svgDataUri(200, 400, '#2a9d4a') }, defaultValue: EMPTY_DEFAULT } },
                { name: 'narrow', layout: { top: 40, left: 26, width: 4, height: 300 }, properties: { imageUrl: { value: svgDataUri(400, 200, '#d9904a') }, defaultValue: EMPTY_DEFAULT } },
                textWidget('belowlandscape', { top: 350, left: 2, width: 12 }),
                textWidget('belowportrait', { top: 350, left: 16, width: 8 }),
                textWidget('belownarrow', { top: 350, left: 26, width: 4 }),
            ]);

            const expectContained = (context) => {
                boxes.forEach(waitForImage);
                cy.document().should((doc) => {
                    const result = {};
                    boxes.forEach((name) => {
                        const w = doc.querySelector(commonWidgetSelector.draggableWidget(name)).getBoundingClientRect();
                        const img = doc.querySelector(S.img(name)).getBoundingClientRect();
                        result[name] = {
                            imageInsideWidget: rectInside(img, w, 1),
                            widgetBelowUncovered: ownsItsCentre(doc, `below${name}`),
                        };
                    });
                    const ok = { imageInsideWidget: true, widgetBelowUncovered: true };
                    expect(result, `${context}: image inside its box, nothing covered`).to.deep.eq({ landscape: ok, portrait: ok, narrow: ok });
                });
            };

            openIconAppInViewer(S.root('portrait'));
            expectContained('viewer');
            openEditor(S.root('portrait'));
            expectContained('editor');
        });

        // PRODUCT BUG (kept red): saved defaults are only installed after BoundedBox.jsx:28-50 finds the image and its
        // wrapper through hard-coded generated class names (`.hIIYQM` / `.jcdOkx`). This build renders other hashes,
        // so the load listener is never attached: no saved rectangle or point is drawn and `annotations` stays unset.
        it('[BoundedBox-BRW-001] Saved rectangle and point annotations render on their image coordinates in the viewer and the editor', () => {
            const saved = [
                { type: T.selectorRectangle, x: 41, y: 62, width: 40, height: 24, text: 'Car' }, // source: boundedBox.js:118
                { type: T.selectorPoint, x: 20, y: 30, width: 0, height: 0, text: 'Tree' },
            ];
            addBoundedBoxesViaApi([
                {
                    name: 'saved',
                    properties: {
                        imageUrl: { value: svgDataUri(400, 200) },
                        defaultValue: { value: `{{${JSON.stringify(saved)}}}` },
                    },
                },
                annotationsProbe('probe', 'saved'),
            ]);

            const expectRegistered = (context) => {
                waitForImage('saved');
                expectAnnotations('probe', (list) => {
                    expect(list, `${context}: saved annotations published`).to.be.an('array').with.length(2);
                    list.forEach((a, i) => {
                        expect(a, `${context}: annotation ${i}`).to.include({ type: saved[i].type, x: saved[i].x, y: saved[i].y, text: saved[i].text });
                    });
                });
                bboxState('saved', (s) => {
                    expect(s.highlights, `${context}: two overlays drawn`).to.have.length(2);
                    const rect = relativeBox(s.highlights[0].box, s.img);
                    expect(rect.x, 'rectangle x').to.be.closeTo(saved[0].x, PCT);
                    expect(rect.y, 'rectangle y').to.be.closeTo(saved[0].y, PCT);
                    expect(rect.width, 'rectangle width').to.be.closeTo(saved[0].width, PCT);
                    expect(rect.height, 'rectangle height').to.be.closeTo(saved[0].height, PCT);
                    const dot = relativeBox(s.highlights[1].box, s.img);
                    expect(dot.x, 'point x').to.be.closeTo(saved[1].x, PCT);
                    expect(dot.y, 'point y').to.be.closeTo(saved[1].y, PCT);
                });
            };

            openIconAppInViewer(S.root('saved'));
            expectRegistered('viewer');
            openEditor(S.root('saved'));
            expectRegistered('editor');
        });

        it('[BoundedBox-BRW-001] A drawn rectangle and point stay on the same image location when the widget is resized', () => {
            addBoundedBoxesViaApi([
                {
                    name: 'resized',
                    properties: {
                        imageUrl: { value: svgDataUri(400, 200) },
                        defaultValue: EMPTY_DEFAULT,
                        labels: { value: `{{${JSON.stringify(labels)}}}` },
                    },
                },
                {
                    name: 'points',
                    layout: { top: 360, left: 2, width: 12, height: 300 },
                    properties: {
                        imageUrl: { value: svgDataUri(400, 200) },
                        defaultValue: EMPTY_DEFAULT,
                        selector: { value: T.selectorPoint },
                        labels: { value: `{{${JSON.stringify(labels)}}}` },
                    },
                },
            ]);
            openIconAppInViewer(S.root('resized'));
            waitForImage('resized');
            waitForImage('points');
            drawRectangle('resized', [0.25, 0.3], [0.55, 0.7]);
            chooseLabel(S.editorControl('resized'), labels[0]);
            clickPoint('points', [0.6, 0.4]);
            chooseLabel(S.editorControl('points'), labels[1]);

            const expectOnImage = (context) => {
                bboxState('resized', (s) => {
                    expect(s.highlights, `${context}: rectangle kept`).to.have.length(1);
                    const r = relativeBox(s.highlights[0].box, s.img);
                    expect(r.x, `${context}: x`).to.be.closeTo(25, PCT);
                    expect(r.y, `${context}: y`).to.be.closeTo(30, PCT);
                    expect(r.width, `${context}: width`).to.be.closeTo(30, PCT);
                    expect(r.height, `${context}: height`).to.be.closeTo(40, PCT);
                    expect(rectInside(s.highlights[0].box, s.img, 1), `${context}: inside the image`).to.eq(true);
                });
                bboxState('points', (s) => {
                    expect(s.highlights, `${context}: point kept`).to.have.length(1);
                    const p = relativeBox(s.highlights[0].box, s.img);
                    expect(p.x, `${context}: point x`).to.be.closeTo(60, PCT);
                    expect(p.y, `${context}: point y`).to.be.closeTo(40, PCT);
                });
            };
            expectOnImage('1440px viewer');

            // a narrower real window shrinks the grid columns → both widgets and their images get narrower
            getBboxState('resized').then((before) => {
                cy.viewport(1000, 960);
                bboxState('resized', (s) => expect(s.img.width, 'image narrower').to.be.lt(before.img.width - 50));
            });
            expectOnImage('1000px viewer');
        });

        // ── BoundedBox-BRW-002 ─────────────────────────────────────────────
        // PRODUCT BUG (kept red): RenderEditor.jsx:25-34 / RenderHighlight.jsx:34-45 place the label control
        // absolutely at the annotation's left/bottom with `minWidth: 125px` and no clamping, so near the right edge
        // it sticks out of the widget over the component beside it (whose box then takes the pointer), and near
        // the bottom edge it hangs below the widget over the component underneath.
        const EDGES = {
            rectangle: {
                top: [[0.4, 0.02], [0.5, 0.1]],
                left: [[0.02, 0.4], [0.1, 0.5]],
                right: [[0.9, 0.25], [0.98, 0.35]],
                bottom: [[0.4, 0.88], [0.5, 0.98]],
            },
            point: { top: [0.5, 0.02], left: [0.02, 0.5], right: [0.98, 0.3], bottom: [0.5, 0.98] },
        };

        const edgeApp = (selector) =>
            addBoundedBoxesViaApi([
                {
                    name: 'edges',
                    layout: { top: 40, left: 2, width: 12, height: 300 },
                    properties: {
                        imageUrl: { value: svgDataUri(400, 300) }, // dynamic: 4:3 — the image fills the box height
                        defaultValue: EMPTY_DEFAULT,
                        selector: { value: selector },
                        labels: { value: `{{${JSON.stringify(labels)}}}` },
                    },
                },
                textWidget('beside', { top: 40, left: 14, width: 8, height: 300 }),
                textWidget('below', { top: 350, left: 2, width: 12 }),
            ]);

        const controlVerdict = (control, hits, s, doc) => {
            const near = (name) => doc.querySelector(commonWidgetSelector.draggableWidget(name)).getBoundingClientRect();
            return {
                insideWidget: rectInside(control, s.widget, 1),
                coversNeighbour: rectsOverlap(control, near('beside')) || rectsOverlap(control, near('below')),
                fullyClickable: hits.every(Boolean),
            };
        };
        const OK = { insideWidget: true, coversNeighbour: false, fullyClickable: true };

        const checkEdges = (create) => {
            const results = {};
            ['top', 'left', 'right', 'bottom'].forEach((edge) => {
                create(edge);
                bboxState('edges', (s) => expect(s.editor, `${edge}: label editor open`).to.not.eq(null));
                cy.document().then((doc) =>
                    getBboxState('edges').then((s) => {
                        results[`${edge} (create)`] = controlVerdict(s.editor.rect, s.editor.hits, s, doc);
                    })
                );
                // force: the control may be partly covered (that is what is measured above)
                cy.get(S.editorControl('edges')).first().click({ force: true, scrollBehavior: false });
                cy.get(S.option).filter((i, el) => el.textContent === labels[0]).first().click({ force: true, scrollBehavior: false });
                bboxState('edges', (s) => expect(s.editor, `${edge}: committed`).to.eq(null));
                cy.document().then((doc) =>
                    getBboxState('edges').then((s) => {
                        const h = s.highlights[s.highlights.length - 1];
                        results[`${edge} (relabel)`] = controlVerdict(h.control, h.hits, s, doc);
                    })
                );
            });
            cy.then(() => {
                const expected = {};
                Object.keys(results).forEach((k) => (expected[k] = OK));
                expect(results, 'label controls at each image edge').to.deep.eq(expected);
            });
        };

        it('[BoundedBox-BRW-002] Rectangle label controls at every image edge stay inside the widget and off its neighbours', () => {
            edgeApp(T.selectorRectangle);
            openIconAppInViewer(S.root('edges'));
            waitForImage('edges');
            checkEdges((edge) => drawRectangle('edges', ...EDGES.rectangle[edge]));
        });

        it('[BoundedBox-BRW-002] Point label controls at every image edge stay inside the widget and off its neighbours', () => {
            edgeApp(T.selectorPoint);
            openIconAppInViewer(S.root('edges'));
            waitForImage('edges');
            checkEdges((edge) => clickPoint('edges', EDGES.point[edge]));
        });

        // ── BoundedBox-BRW-003 (collapse side) ─────────────────────────────
        it('[BoundedBox-BRW-003] Hiding a collapse-when-hidden box reflows the widget below; showing it restores the same annotations', () => {
            const hideWord = fake.firstName.toLowerCase() || 'hide'; // dynamic: typed to hide both boxes
            const visibleUnless = { visibility: { value: `{{components.textinput1.value !== "${hideWord}"}}` } };
            addBoundedBoxesViaApi([
                {
                    name: 'collapsing',
                    layout: { top: 40, left: 2, width: 12, height: 300 },
                    properties: {
                        imageUrl: { value: svgDataUri(400, 200) },
                        defaultValue: EMPTY_DEFAULT,
                        labels: { value: `{{${JSON.stringify(labels)}}}` },
                        collapseWhenHidden: { value: '{{true}}' }, // source: boundedBox.js:50-55
                    },
                    styles: visibleUnless,
                },
                textWidget('text1', { top: 350, left: 2, width: 12 }),
                {
                    name: 'keeping',
                    layout: { top: 40, left: 16, width: 12, height: 300 },
                    properties: {
                        imageUrl: { value: svgDataUri(400, 200, '#2a9d4a') },
                        defaultValue: EMPTY_DEFAULT,
                        labels: { value: `{{${JSON.stringify(labels)}}}` },
                    },
                    styles: visibleUnless,
                },
                textWidget('text2', { top: 350, left: 16, width: 12 }),
                { type: 'TextInput', name: 'textinput1', layout: { top: 40, left: 32, width: 8, height: 40 } },
                annotationsProbe('probe1', 'collapsing', { top: 100, left: 32, width: 10 }),
                annotationsProbe('probe2', 'keeping', { top: 280, left: 32, width: 10 }),
            ]);
            openIconAppInViewer(S.root('collapsing'));
            waitForImage('collapsing');
            waitForImage('keeping');

            drawRectangle('collapsing', [0.1, 0.1], [0.4, 0.5]);
            chooseLabel(S.editorControl('collapsing'), labels[0]);
            drawRectangle('keeping', [0.5, 0.2], [0.8, 0.6]);
            chooseLabel(S.editorControl('keeping'), labels[1]);
            expectAnnotations('probe1', (l) => expect(l).to.have.length(1));
            expectAnnotations('probe2', (l) => expect(l).to.have.length(1));

            // authored layout: both texts 10px under their 300px boxes (source: layout tops 40 / 350)
            const authored = (box) => {
                expect(box('text1').top - box('collapsing').bottom, 'text1 gap').to.be.closeTo(10, PX);
                expect(box('text2').top - box('keeping').bottom, 'text2 gap').to.be.closeTo(10, PX);
            };
            expectLayout(authored);

            readAnnotations('probe1').then((before1) => {
                readAnnotations('probe2').then((before2) => {
                    // offsets from the text input, a widget that never moves (typing may scroll the page)
                    const offsets = (doc) => {
                        const top = (n) => doc.querySelector(commonWidgetSelector.draggableWidget(n)).getBoundingClientRect().top;
                        const anchor = top('textinput1');
                        return { text1: top('text1') - anchor, text2: top('text2') - anchor };
                    };
                    cy.document().then((doc) => {
                        const shown = offsets(doc);
                        cy.get('[data-cy="draggable-widget-textinput1"] input').first().type(hideWord);
                        cy.document().should((d) => {
                            const now = offsets(d);
                            // collapse on: text1 slides up by the hidden box's 300px + 10px gap
                            expect(shown.text1 - now.text1, 'text1 moved up').to.be.closeTo(310, PX);
                            // collapse off: text2 keeps its place under the hidden box
                            expect(now.text2, 'text2 stays').to.be.closeTo(shown.text2, PX);
                            const hidden = d.querySelector(commonWidgetSelector.draggableWidget('collapsing'));
                            expect(hidden ? hidden.getBoundingClientRect().height : 0, 'collapsing box takes no space').to.eq(0);
                        });
                        cy.get(S.root('keeping')).should('have.css', 'display', 'none');
                        cy.get('[data-cy="draggable-widget-textinput1"] input').first().clear();
                    });
                    expectLayout(authored);
                    // the same annotations are back: identical public value and one overlay each
                    expectAnnotations('probe1', (l) => expect(l, 'collapsing annotations restored').to.deep.eq(before1));
                    expectAnnotations('probe2', (l) => expect(l, 'keeping annotations restored').to.deep.eq(before2));
                    bboxState('collapsing', (s) => {
                        expect(s.highlights).to.have.length(1);
                        expect(s.highlights[0].text).to.eq(labels[0]);
                    });
                    bboxState('keeping', (s) => {
                        expect(s.highlights).to.have.length(1);
                        expect(s.highlights[0].text).to.eq(labels[1]);
                    });
                });
            });
        });
    });
});
