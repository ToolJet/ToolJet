/**
 * SPEC — ProgressBar — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + the resize-geometry part of TESTING.md browser scenario:
 *   ProgressBar-BRW-001 — side/top geometry produces the documented result without layout overflow; here: when the
 *                         widget is resized on the editor canvas (and in the running app afterwards) the bar keeps
 *                         filling the width, label size and bar thickness follow the new height, nothing overflows.
 * The style-driven parts of BRW-001 (alignment/direction/padding/shadow/loading) live in styles.cy.js; device
 * visibility in contexts.cy.js.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * progressBarBoxes, readProgressBarBoxes, expectProgressBarLayout, addProgressBarsViaApi, openProgressBarAppInViewer, resizeWidgetBy.
 * Seeded layouts: `left` and `width` are grid columns (43 per row), `top`/`height` px.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { progressBarSelector } from "Selectors/appBuilder/components/progressBar";
import { progressBarText } from "Texts/appBuilder/components/progressBar";
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
import { resizeWidgetBy } from "Support/utils/appBuilder/components/svgImage";
import {
    progressBarBoxes,
    readProgressBarBoxes,
    expectProgressBarLayout,
    addProgressBarsViaApi,
    openProgressBarAppInViewer,
} from "Support/utils/appBuilder/components/progressBar";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = progressBarText.defaultWidgetName;
const T = progressBarText;
const PREFIX = T.widgetPrefix;

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app.
describe('ProgressBar — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-ProgressBar-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget with an Auto 50% label and a half-filled bar', () => {
            cy.get(progressBarSelector.root(W)).should('be.visible');
            // defaults: labelType auto, progress {{50}} (progressbar.js:247,252) → "50%" and a 50% fill
            expectProgressBarLayout(W, { context: 'dropped' });
            verifyWidgetCount(PREFIX, 1);
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 650, 450);
                verifyWidgetMoved(W, before);
            });
        });

        it('resize changes the widget dimensions', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.resizeWidget(W, before.x + before.w + 160, before.y + before.h + 90);
                verifyWidgetResized(W, before);
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

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 650, 300);
            closeQueryPanel();

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

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-ProgressBar-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        // ── ProgressBar-BRW-001 — resize keeps the geometry ──────────────────
        it('[ProgressBar-BRW-001] Resizing a side and a top ProgressBar re-lays label and bar from the new size without overflow, in the editor and the running app', () => {
            addProgressBarsViaApi([
                { name: 'sidebar', layout: { top: 40, left: 4, width: 8, height: 50 } }, // source: progressbar.js:263 side
                {
                    name: 'topbar',
                    layout: { top: 260, left: 4, width: 8, height: 80 },
                    styles: { alignment: { value: T.alignTop } },
                },
            ]);
            cy.openApp('', undefined, undefined, progressBarSelector.root('topbar'));
            closeQueryPanel();

            [
                { name: 'sidebar', alignment: T.alignSide },
                { name: 'topbar', alignment: T.alignTop },
            ].forEach(({ name, alignment }) => {
                expectProgressBarLayout(name, { alignment, context: `${name} before` });
                readProgressBarBoxes(name).then((before) => {
                    resizeWidgetBy(name, 160, 90); // dynamic: wider + taller
                    progressBarBoxes(name, (b) => {
                        expect(b.box.width, `${name}: wider`).to.be.gt(before.box.width + 100);
                        expect(b.box.height, `${name}: taller`).to.be.gt(before.box.height + 60);
                        expect(b.track.width, `${name}: bar grows with the width`).to.be.gt(before.track.width);
                        // the bar takes all the extra width the (larger) label does not
                        const labelShare = alignment === T.alignTop ? 0 : b.label.width - before.label.width;
                        expect(b.track.width - before.track.width, `${name}: bar absorbs the extra width`).to.be.closeTo(
                            b.root.width - before.root.width - labelShare,
                            1
                        );
                        expect(b.track.height, `${name}: bar thicker`).to.be.gt(before.track.height);
                        expect(b.label.fontSize, `${name}: label larger`).to.be.gt(before.label.fontSize);
                    });
                    expectProgressBarLayout(name, { alignment, context: `${name} resized (editor)` });
                });
            });

            // the saved size gives the same layout in the running app
            openProgressBarAppInViewer(progressBarSelector.root('topbar'));
            expectProgressBarLayout('sidebar', { context: 'sidebar resized (viewer)' });
            expectProgressBarLayout('topbar', { alignment: T.alignTop, context: 'topbar resized (viewer)' });
            progressBarBoxes('topbar', (b) => expect(b.box.height, 'viewer keeps the resized height').to.be.gt(80 + 60));
        });
    });
});
