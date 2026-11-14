/**
 * SPEC — Circular Progressbar — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo), plus the responsive-sizing half of TESTING.md browser scenario:
 *   CircularProgressBar-BRW-001 — in editor and viewer the SVG is a square of the widget height - 4, shrinks to the
 *                                 root width when the widget is narrower than tall, and the drawn ring stays centred
 *                                 inside the widget without layout overflow.
 * (Alignment / padding / shadow / loading rotation halves of BRW-001 live in styles.cy.js; device flags in
 * contexts.cy.js.)
 * Geometry: RenderWidget.jsx:339-356 (box padding BOX_PADDING, height={widgetHeight - 4}); CirularProgressbar.jsx:
 * 132-140 (root flex, inner flex width/height 100% justify-content alignment, svg styles.root.height);
 * circularProgressbar.scss:15-18 (`.canvas-component .CircularProgressbar { width: unset }` → square SVG, flex-shrinks
 * in a narrow root); react-circular-progressbar ring radius 50 - strokeWidth/2 in a 100 viewBox.
 * Helpers: cpbBoxes, expectCircleFits, addCircularProgressBarsViaApi, openDividerAppInViewer, resizeWidgetBy,
 * getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { circularProgressBarSelector } from "Selectors/appBuilder/components/circularProgressBar";
import { circularProgressBarText } from "Texts/appBuilder/components/circularProgressBar";
import {
    addCircularProgressBarsViaApi,
    cpbBoxes,
    expectCircleFits,
} from "Support/utils/appBuilder/components/circularProgressBar";
import { openDividerAppInViewer } from "Support/utils/appBuilder/components/divider";
import { resizeWidgetBy } from "Support/utils/appBuilder/components/svgImage";
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
    nudgeWidget,
    selectAllWidgets,
    multiSelectWidgets,
    verifySelectedWidgetCount,
    renameWidgetFromMenu,
    deleteWidgetFromMenu,
    undo,
    redo,
} from "Support/utils/commonWidget";

const W = circularProgressBarText.defaultWidgetName;
const T = circularProgressBarText;
const PREFIX = T.widgetPrefix;

// Seeded shapes for the responsive-sizing check (grid columns × px rows)
const SHAPES = [
    { name: 'wideshort', layout: { top: 40, left: 2, width: 14, height: 60 } }, // dynamic: wider than tall
    { name: 'squareish', layout: { top: 40, left: 18, width: 5, height: 160 } }, // dynamic: about as wide as tall
    { name: 'tallnarrow', layout: { top: 40, left: 26, width: 2, height: 220 } }, // dynamic: much taller than wide
    // dynamic: thick stroke keeps the ring inside the shrunk SVG
    { name: 'thickstroke', layout: { top: 300, left: 2, width: 3, height: 140 }, styles: { strokeWidth: { value: '{{30}}' } } },
];
const expectShapes = (context) =>
    SHAPES.forEach(({ name, styles }) =>
        cpbBoxes(name, (b) => {
            expectCircleFits(b, `${context}: ${name}`, {
                strokeWidth: styles ? 30 : T.defaultStrokeWidth, // dynamic: thickstroke's authored width
            });
            expect(b.label, `${context}: ${name} label`).to.eq(T.defaultLabel);
        })
    );

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Circular Progressbar — canvas facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-CircularProgressBar-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('[CircularProgressBar-BRW-001] Drag-and-drop places a 7-column widget whose square SVG fills the height and centres the ring', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            verifyWidgetCount(PREFIX, 1);
            cy.get('#real-canvas').then(($c) => {
                const column = $c[0].getBoundingClientRect().width / T.gridColumns;
                cpbBoxes(W, (b) => {
                    expect(b.box.width, 'registered width').to.be.closeTo(column * T.defaultGridWidth, 1.5);
                    expect(b.box.height, 'registered height').to.be.closeTo(T.defaultHeight, 1.5);
                    expectCircleFits(b, 'dropped');
                    expect(b.svg.width, 'square SVG').to.be.closeTo(T.defaultHeight - T.svgHeightInset, 1);
                    expect(b.label, 'Auto label').to.eq(T.defaultLabel);
                });
            });
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 650, 450);
                verifyWidgetMoved(W, before);
            });
            cpbBoxes(W, (b) => expectCircleFits(b, 'moved'));
        });

        it('[CircularProgressBar-BRW-001] Resizing grows the SVG with the widget height and, when narrower than tall, shrinks it to the width without overflow', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                // taller and wider: SVG follows the height, still a centred square
                resizeWidgetBy(W, 160, 110); // dynamic: drag distance
                verifyWidgetResized(W, before);
                cpbBoxes(W, (b) => {
                    expect(b.box.height, 'taller').to.be.gt(before.h + 60);
                    expect(b.svg.width, 'square SVG').to.be.closeTo(b.svg.height, 1);
                    expect(b.svg.height, 'SVG grew with the widget').to.be.gt(before.h + 60);
                    expectCircleFits(b, 'grown');
                });
            });
            // now much narrower than tall: SVG keeps the height but flex-shrinks to the root width
            getWidgetRect(W).then((grown) => {
                resizeWidgetBy(W, -(grown.w - 70), 60); // dynamic: ~2 columns wide, taller
                cpbBoxes(W, (b) => {
                    expect(b.box.width, 'narrow').to.be.lt(b.box.height / 2);
                    expect(b.svg.width, 'SVG shrinks to the root width').to.be.closeTo(b.root.width, 1);
                    expect(b.svg.height, 'SVG keeps the widget height').to.be.closeTo(b.box.height - T.svgHeightInset, 1);
                    expectCircleFits(b, 'narrow');
                });
            });
        });

        it('nudge (arrow keys) moves the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                nudgeWidget(W, 'ArrowRight', 12);
                verifyWidgetMoved(W, before);
            });
        });

        it('duplicate via keyboard (Cmd/Ctrl+D)', () => {
            duplicateWidgetByKeyboard(W);
            verifyWidgetCount(PREFIX, 2);
            cpbBoxes(`${PREFIX}2`, (b) => expectCircleFits(b, 'duplicate'));
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
            cpbBoxes(W, (b) => expectCircleFits(b, 'pasted'));
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 650, 300);
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'uploadprogress'); // asserts new name internally
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

    describe('saved shapes', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-CircularProgressBar-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('[CircularProgressBar-BRW-001] Wide, square, tall-narrow and thick-stroke widgets size the SVG to fit and keep the ring inside, in the editor and the viewer', () => {
            addCircularProgressBarsViaApi(SHAPES);
            cy.openApp('', undefined, undefined, circularProgressBarSelector.root('thickstroke'));
            expectShapes('editor');
            // narrow shapes really exercise the shrink path
            cpbBoxes('tallnarrow', (b) => expect(b.svg.width, 'tall-narrow SVG shrunk').to.be.lt(b.svg.height - 50));
            openDividerAppInViewer(circularProgressBarSelector.root('thickstroke'));
            expectShapes('viewer');
            cpbBoxes('wideshort', (b) => expect(b.svg.width, 'wide-short SVG square').to.be.closeTo(b.svg.height, 1));
        });
    });
});
