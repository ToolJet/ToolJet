/**
 * SPEC — Modal (ModalV2) — canvas facet.
 * FOR AI: always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo) + the
 * geometry TESTING.md browser scenarios:
 *   ModalV2-BRW-001 — a fullscreen modal stays full width across real viewport resizes: useResizeSideEffects.js:17-43
 *                     observes `.page-container.canvas-container` and re-measures modalWidth, which sizes the
 *                     header / body / footer slot grids — so children keep their grid share of the new width. A
 *                     medium (lg) modal is the control: its dialog keeps a fixed width.
 *   ModalV2-BRW-003 — dragging a widget from the Components palette onto the open modal drops it into the header,
 *                     body or footer slot under the cursor (Header.jsx / Footer.jsx HorizontalSlot, Modal.jsx
 *                     SubContainer), and it stays there after a reload and in the viewer.
 * The trigger <button> fills the widget box, and clicking it opens the modal, so canvas selection goes through
 * selectModalBox (clicks the box padding). Dropped Modals get the defaultChildren (modalV2.js:141-212).
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetFromMenu,
 * pasteWidget, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * useMainCanvasForCanvasCommands, selectAllOnMainCanvas, addModalsViaApi, openModalAppInViewer, openModal,
 * modalBoxes, readModalBoxes, modalComponentId, selectModalBox, modalCanvasShortcut, resizeModalBy, collapseQueryPanel.
 * Seeded layouts: `left` and `width` are grid columns (43 per row), `top`/`height` px.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { modalV2Selector as S } from "Selectors/appBuilder/components/modalV2";
import { modalV2Text as T } from "Texts/appBuilder/components/modalV2";
import {
    getWidgetRect,
    verifyWidgetMoved,
    verifyWidgetResized,
    verifyWidgetCount,
    duplicateWidgetFromMenu,
    pasteWidget,
    verifySelectedWidgetCount,
    renameWidgetFromMenu,
    deleteWidgetFromMenu,
    undo,
    redo,
} from "Support/utils/commonWidget";
import { useMainCanvasForCanvasCommands, selectAllOnMainCanvas } from "Support/utils/appBuilder/components/tabs";
import {
    addModalsViaApi,
    openModalAppInViewer,
    openModal,
    modalBoxes,
    readModalBoxes,
    modalComponentId,
    selectModalBox,
    modalCanvasShortcut,
    resizeModalBy,
    collapseQueryPanel,
} from "Support/utils/appBuilder/components/modalV2";

const W = T.defaultWidgetName;
const PREFIX = T.widgetPrefix;
const GRID = 43; // grid columns per row (WidgetWrapper.jsx left * gridWidth)
const PX = 3;

const openEditor = (waitFor) => {
    cy.openApp('', undefined, undefined, waitFor);
    collapseQueryPanel();
};
const short = () => (fake.firstName.slice(0, 6) || 'text');

// sub-canvases of an open modal also carry data-cy="real-canvas": point the shared canvas commands at the main one
useMainCanvasForCanvasCommands();

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run); each test re-creates its own app.
describe('Modal (ModalV2) — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-ModalV2-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 100);
            collapseQueryPanel();
            cy.get(S.launchButton(W)).should('be.visible');
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places a Modal whose trigger opens it with the default header title and footer buttons in their slots', () => {
            cy.get(S.launchButton(W)).should('have.text', T.defaultTriggerLabel);
            cy.get(S.anyOpenModal).should('not.exist'); // closed on mount
            verifyWidgetCount(PREFIX, 1);
            modalComponentId(W).then((id) => {
                openModal(W, id);
                modalBoxes(id, (b) => {
                    const { title, cancel, confirm } = T.defaultChildNames;
                    expect(Object.keys(b.slots.header.widgets), 'header slot').to.deep.eq([title]);
                    expect(Object.keys(b.slots.footer.widgets).sort(), 'footer slot').to.deep.eq([cancel, confirm]);
                    expect(Object.keys(b.slots.body.widgets), 'body slot').to.deep.eq([]);
                    expect(b.content.height, 'default modal height').to.be.closeTo(T.defaultModalHeight, 1);
                });
                cy.get(commonWidgetSelector.draggableWidget(T.defaultChildNames.title)).should('contain.text', T.defaultHeaderTitle);
                cy.get(commonWidgetSelector.draggableWidget(T.defaultChildNames.cancel)).should('contain.text', T.defaultFooterButtons[0]);
                cy.get(commonWidgetSelector.draggableWidget(T.defaultChildNames.confirm)).should('contain.text', T.defaultFooterButtons[1]);
                cy.get(S.closeButton(id)).realClick();
                cy.get(S.content(id)).should('not.exist');
            });
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 650, 300);
                verifyWidgetMoved(W, before);
            });
            cy.get(S.anyOpenModal).should('not.exist');
        });

        it('resize changes the widget dimensions', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                resizeModalBy(W, 160, 40);
                verifyWidgetResized(W, before);
            });
        });

        it('nudge (arrow keys) moves the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                selectModalBox(W);
                Cypress._.times(12, () => cy.realPress('ArrowRight'));
                verifyWidgetMoved(W, before);
            });
        });

        it('duplicate via keyboard (Cmd/Ctrl+D)', () => {
            modalCanvasShortcut(W, 'd', T.cloneToast);
            verifyWidgetCount(PREFIX, 2);
        });

        it('duplicate via ⋮ menu', () => {
            duplicateWidgetFromMenu(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('copy-paste (Cmd/Ctrl+C then +V)', () => {
            modalCanvasShortcut(W, 'c', T.copyToast);
            cy.forceClickOnCanvas();
            pasteWidget();
            verifyWidgetCount(PREFIX, 2);
        });

        it('cut removes the widget, paste restores it', () => {
            modalCanvasShortcut(W, 'x');
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
            cy.forceClickOnCanvas();
            pasteWidget();
            cy.get(S.launchButton(W)).should('have.text', T.defaultTriggerLabel);
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 950, 100);

            selectModalBox(W);
            selectModalBox(`${PREFIX}2`, { shift: true });
            verifySelectedWidgetCount(2);

            selectAllOnMainCanvas();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'confirmdialog'); // asserts new name internally
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
            cy.get(S.launchButton('confirmdialog')).should('have.text', T.defaultTriggerLabel);
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
            cy.apiCreateApp(`${fake.companyName}-ModalV2-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        // ── ModalV2-BRW-001 — fullscreen width follows the window ────────────
        const FS = crypto.randomUUID();
        const LG = crypto.randomUUID();
        const seedResizeApp = () => {
            const child = (name, parent, layout) => ({ type: 'Text', name, parent, layout: { top: 10, height: 40, ...layout }, properties: { text: { value: short() } } });
            addModalsViaApi([
                // modalV2.js:94-99 size option 'fullscreen' / 'lg' (medium)
                { id: FS, name: 'fsmodal', layout: { top: 30, left: 2, width: 8 }, properties: { size: { value: T.sizeFullscreen } } },
                child('bodyfull', FS, { left: 0, width: GRID }),
                child('bodyright', FS, { top: 60, left: 33, width: 10 }),
                child('headright', `${FS}-header`, { left: 33, width: 10 }),
                child('footright', `${FS}-footer`, { left: 33, width: 10 }),
                // control: a medium modal keeps its own dialog width whatever the window does
                { id: LG, name: 'lgmodal', layout: { top: 100, left: 2, width: 8 }, properties: { size: { value: T.sizeMedium } } },
                child('lgright', LG, { left: 33, width: 10 }),
            ]);
        };

        // a child at grid column `col` spanning `cols` columns sits at that share of its slot canvas, inside the modal
        const expectGridShare = (b, slot, name, col, cols, tag) => {
            const c = b.slots[slot];
            const w = c.widgets[name];
            expect(w, `${tag}: ${name} rendered in the ${slot} slot`).to.not.eq(undefined);
            expect(w.left - c.left, `${tag}: ${name} left = ${col}/${GRID} of the ${slot} canvas`).to.be.closeTo((c.width * col) / GRID, PX + 1);
            expect(w.width, `${tag}: ${name} width = ${cols}/${GRID} of the ${slot} canvas`).to.be.closeTo((c.width * cols) / GRID, PX + 1);
            expect(w.right, `${tag}: ${name} inside the modal`).to.be.lte(b.content.right + 1);
        };
        const expectFullWidth = (width, where) =>
            modalBoxes(FS, (b) => {
                const tag = `${where} @${width}px`;
                expect(b.viewport.width, `${tag}: window width`).to.eq(width);
                expect(b.dialog.className, `${tag}: fullscreen dialog`).to.contain(T.fullscreenDialogClass);
                // the modal spans the whole area it is portalled into (`.tj-canvas-area`)
                expect(b.content.left, `${tag}: content starts at the modal host`).to.be.closeTo(b.host.left, 1);
                expect(b.content.width, `${tag}: content as wide as the modal host`).to.be.closeTo(b.host.width, 1);
                ['body', 'footer'].forEach((slot) => {
                    expect(b.slots[slot].left - b.content.left, `${tag}: ${slot} canvas inset left`).to.be.closeTo(5, PX);
                    expect(b.content.right - b.slots[slot].right, `${tag}: ${slot} canvas inset right`).to.be.closeTo(5, PX);
                });
                // the slot grids were re-measured: children keep their grid share of the NEW width
                expectGridShare(b, 'body', 'bodyfull', 0, GRID, tag);
                expectGridShare(b, 'body', 'bodyright', 33, 10, tag);
                expectGridShare(b, 'header', 'headright', 33, 10, tag);
                expectGridShare(b, 'footer', 'footright', 33, 10, tag);
            });
        const resize = (width, height) => {
            cy.viewport(width, height);
            cy.window().its('innerWidth').should('eq', width);
        };
        const runResize = (where, widths) => {
            openModal('fsmodal', FS);
            expectFullWidth(Cypress.config('viewportWidth'), where);
            widths.forEach(([w, h]) => {
                resize(w, h);
                expectFullWidth(w, where);
            });
            cy.realPress('Escape');
            cy.get(S.content(FS)).should('not.exist');
            resize(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));

            // control: the medium dialog keeps one width while the window narrows
            openModal('lgmodal', LG);
            readModalBoxes(LG).then((before) => {
                expect(before.dialog.className, `${where}: control is not fullscreen`).not.to.contain(T.fullscreenDialogClass);
                expect(before.content.width, `${where}: control narrower than the page`).to.be.lt(before.host.width - 100);
                resize(widths[0][0], widths[0][1]);
                modalBoxes(LG, (b) => {
                    expect(b.host.width, `${where}: page narrowed`).to.be.lt(before.host.width - 100);
                    expect(b.content.width, `${where}: control dialog width unchanged`).to.be.closeTo(before.content.width, 1);
                    expect(b.slots.body.widgets.lgright.width, `${where}: control child width unchanged`).to.be.closeTo(
                        before.slots.body.widgets.lgright.width,
                        1
                    );
                });
            });
            cy.realPress('Escape');
            cy.get(S.content(LG)).should('not.exist');
        };

        it('[ModalV2-BRW-001] A fullscreen modal stays full width and re-lays out its slots when the window is resized (running app)', () => {
            // PRODUCT BUG (red wherever scrollbars take layout space — Linux/Windows, macOS "Show scroll bars:
            // Always"; green on macOS overlay scrollbars): useResizeSideEffects.js (lines 30, 52-53) sizes the slot
            // grids from the full `.page-container.canvas-container`.offsetWidth, but the modal is portalled into
            // `.tj-canvas-area`, which sits inside the canvas scroller and loses that scroller's vertical scrollbar
            // width. With a ~10px classic scrollbar the grid is ~10px wider than the modal (CI: full-width child 1428
            // vs canvas 1420; reproduced on macOS Chrome with scrollbars set to Always: 1428 vs 1419), so children
            // shift right and a full-width child runs under the scrollbar.
            seedResizeApp();
            openModalAppInViewer(S.launchButton('fsmodal'));
            runResize('viewer', [
                [1000, 800], // dynamic: narrower window
                [1700, 960], // dynamic: wider window
            ]);
        });

        it('[ModalV2-BRW-001] A fullscreen modal stays full width and re-lays out its slots when the window is resized (editor)', () => {
            // PRODUCT BUG (stays red): in the editor the fullscreen modal fills `.tj-canvas-area`, but useResizeSideEffects.js
            // (lines 30, 52-53) sizes the slot grids from `.page-container.canvas-container`.offsetWidth, which includes
            // that container's 8px side padding — the grid is 16px wider than the modal, so children are mis-placed
            // and a full-width child runs past the modal's right edge. A classic scrollbar adds its width on top
            // (CI: 24px wider), see the running-app test above.
            seedResizeApp();
            openEditor(S.launchButton('fsmodal'));
            runResize('editor', [
                [1200, 800], // dynamic: narrower window (the editor sidebars need room)
                [1700, 960], // dynamic: wider window
            ]);
        });

        // ── ModalV2-BRW-003 — palette drop lands in the slot under the cursor ─
        it('[ModalV2-BRW-003] A widget dragged from the palette onto the open modal drops into the header, body or footer slot under the cursor', () => {
            const M = crypto.randomUUID();
            addModalsViaApi([{ id: M, name: 'dropmodal', layout: { top: 30, left: 2, width: 8 } }]);

            openEditor(S.launchButton('dropmodal'));
            openModal('dropmodal', M);

            // drop points inside the open modal's content box, one per slot (offsets from its top-left corner)
            readModalBoxes(M).then((b) => {
                // dynamic: right of the config handle that overlaps the top-left of the header, left of the close button
                const x = 300;
                const points = {
                    header: { x, y: 20 },
                    body: { x, y: b.body.top - b.content.top + 60 },
                    footer: { x, y: b.footer.top - b.content.top + 15 },
                };
                cy.wrap(points).as('points');
                // text1 → header, text2 → body, text3 → footer (computeComponentName)
                ['header', 'body', 'footer'].forEach((slot, i) => {
                    cy.dragAndDropWidget('Text', points[slot].x, points[slot].y, 'Text', S.content(M));
                    cy.get(commonWidgetSelector.draggableWidget(`text${i + 1}`)).should('exist');
                    cy.get(S.content(M)).should('be.visible'); // the drop does not close the modal
                });
            });

            const expectSlots = (where, withPoints) =>
                cy.get('@points').then((points) =>
                    modalBoxes(M, (b) => {
                        const placed = {
                            header: Object.keys(b.slots.header.widgets),
                            body: Object.keys(b.slots.body.widgets),
                            footer: Object.keys(b.slots.footer.widgets),
                        };
                        expect(placed, `${where}: each widget in the slot it was dropped on`).to.deep.eq({
                            header: ['text1'],
                            body: ['text2'],
                            footer: ['text3'],
                        });
                        ['header', 'body', 'footer'].forEach((slot, i) => {
                            const c = b.slots[slot];
                            const w = c.widgets[`text${i + 1}`];
                            const tag = `${where}: text${i + 1} in ${slot}`;
                            expect(w.top, `${tag} — inside the slot (top)`).to.be.gte(c.top - 1);
                            expect(w.bottom, `${tag} — inside the slot (bottom)`).to.be.lte(c.bottom + 1);
                            expect(w.left, `${tag} — inside the slot (left)`).to.be.gte(c.left - 1);
                            expect(w.right, `${tag} — inside the slot (right)`).to.be.lte(c.right + 1);
                            if (withPoints) {
                                // real cursor geometry: the widget lands at the drop point (within two grid columns; the
                                // drag preview's grab offset and grid snapping shift it), not at the slot's origin
                                const col = c.width / GRID;
                                expect(w.left, `${tag} — left at the cursor`).to.be.closeTo(b.content.left + points[slot].x, 2 * col + PX);
                                expect(w.left - c.left, `${tag} — not snapped to the slot origin`).to.be.gt(points[slot].x / 2);
                            }
                        });
                    })
                );

            expectSlots('editor, after the drops', true);
            cy.get(commonWidgetSelector.draggableWidget('text4')).should('not.exist'); // nothing landed twice
            cy.waitForAutoSave();

            // saved: the same slots after a reload and in the viewer
            cy.reload();
            cy.get(S.launchButton('dropmodal'), { timeout: 30000 }).should('be.visible');
            openModal('dropmodal', M);
            expectSlots('editor, after reload', true);

            openModalAppInViewer(S.launchButton('dropmodal'));
            openModal('dropmodal', M);
            expectSlots('viewer', false);
        });
    });
});
