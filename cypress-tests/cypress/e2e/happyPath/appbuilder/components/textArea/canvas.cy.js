/**
 * SPEC — Text Area — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only geometry scenarios from TESTING.md:
 *   TextArea-BRW-001 — Dynamic height grows/shrinks the field with its content, never below the authored height
 *   TextArea-BRW-002 — the resize writes a correct layout back to the grid: root, container, list view, hidden
 *   TextArea-BRW-003 — native resize grip suppressed; content past the visible height scrolls
 * Dynamic height only runs in a running app (TextArea.jsx:11), so BRW-001/002 import a fixture app and
 * measure it in the viewer. Layout relations are asserted as authored GAPS between widget boxes
 * (dynamicHeightReflow.js: T.top = V.currentBottom + canonicalGap(V, T)).
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * importAppFixture, openAppInViewer, expectLayout, typeLines, expectScrollState.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { textAreaSelector } from "Selectors/appBuilder/components/textArea";
import { textAreaText } from "Texts/appBuilder/components/textArea";
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
import { importAppFixture } from "Support/utils/appBuilder/components/baseInput";
import {
    openAppInViewer,
    expectLayout,
    typeLines,
    expectScrollState,
} from "Support/utils/appBuilder/components/textArea";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = textAreaText;
const D = textAreaText.dynamic;
const PX = 2; // layout tolerance (sub-pixel rounding of grid offsets)

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app.
describe('Text Area — canvas facet', { testIsolation: false }, () => {
    describe('canvas operations', () => {
        const W = T.defaultWidgetName;
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-TextArea-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
            cy.get(textAreaSelector.input(W)).should('match', 'textarea');
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
            cy.dragAndDropWidget(T.displayName, 650, 400);
            closeQueryPanel();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'notes'); // asserts new name internally
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

        // ── TextArea-BRW-003 (editor canvas) ────────────────────────────────
        it('[TextArea-BRW-003] Editor canvas: no native resize grip; overflowing content scrolls', () => {
            const input = textAreaSelector.input(W);
            // theme.scss `textarea.tj-text-input-widget { resize: none !important; overflow-y: auto !important }`
            cy.get(input).should('have.css', 'resize', T.resizeNone).and('have.css', 'overflow-y', T.overflowYAuto);
            typeLines(input, 20); // dynamic: 20 lines ≫ the default 100px height (textarea.js:8)
            expectScrollState(input, (el) => expect(el.scrollHeight, 'content taller than the box').to.be.gt(el.clientHeight + 100));
            // cy.type is synthetic, so the caret does not auto-scroll here — scroll with a real wheel instead
            cy.get(input).realMouseWheel({ deltaY: -3000 });
            expectScrollState(input, (el) => expect(el.scrollTop, 'wheel up → top').to.eq(0));
            cy.get(input).realMouseWheel({ deltaY: 120 });
            expectScrollState(input, (el) => expect(el.scrollTop, 'wheel down scrolls the field').to.be.gt(0));
        });
    });

    describe('running app — dynamic height', () => {
        beforeEach(() => {
            cy.apiLogin();
            importAppFixture(T.dynamicHeightFixture, `${fake.companyName}-TextArea-canvas-${Cypress._.uniqueId()}`);
            openAppInViewer(textAreaSelector.input('textarea1'));
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── TextArea-BRW-001 ─────────────────────────────────────────────────
        // resizeTextArea (TextArea.jsx:14-36): field = max(authored − container padding/border, scrollHeight).
        it('[TextArea-BRW-001] Dynamic height grows the field past the authored height and shrinks back to it', () => {
            const input = textAreaSelector.input('textarea1');
            const field = textAreaSelector.field('textarea1');
            let grownOnce;

            // authored height while the content fits. source: textAreaDynamicHeight.json textarea1 layout h 100
            expectLayout((box) => expect(box('textarea1').height).to.be.closeTo(D.authoredHeight, PX));
            cy.get(input).click().type('short'); // dynamic: fits in one line
            expectLayout((box) => expect(box('textarea1').height).to.be.closeTo(D.authoredHeight, PX));

            // grow: 10 extra lines push the content past the authored height
            cy.get(input).type('{enter}'.repeat(10));
            expectLayout((box) => {
                grownOnce = box('textarea1').height;
                expect(grownOnce, 'grew past the authored height').to.be.gt(D.authoredHeight + 50);
            });
            // the field (container) grows with the widget and the textarea shows all content without scrolling
            cy.get(field).should(($f) => {
                const f = $f[0].getBoundingClientRect();
                const w = $f[0].closest('[data-cy^="draggable-widget-"]').getBoundingClientRect();
                expect(f.height, 'field fills the grown widget').to.be.closeTo(w.height, 6);
            });
            expectScrollState(input, (el) => expect(el.scrollHeight - el.clientHeight, 'no scroll — field fits content').to.be.at.most(1));

            // grows further with more content
            cy.get(input).type('{enter}'.repeat(5));
            expectLayout((box) => expect(box('textarea1').height).to.be.gt(grownOnce + 30));

            // shrink: removing lines shrinks it again
            cy.get(input).type('{backspace}'.repeat(5));
            expectLayout((box) => expect(box('textarea1').height).to.be.closeTo(grownOnce, PX));

            // emptied → back to exactly the authored height, never smaller
            cy.get(input).clear();
            expectLayout((box) => expect(box('textarea1').height).to.be.closeTo(D.authoredHeight, PX));
            cy.get(input).should('have.value', '');
        });

        // ── TextArea-BRW-002 ─────────────────────────────────────────────────
        it('[TextArea-BRW-002] Root canvas: growth pushes the widget below by the same amount; another lane stays put', () => {
            const input = textAreaSelector.input('textarea1');
            const rootLayout = (box) => {
                // authored gap kept. source: textAreaDynamicHeight.json textarea1 (top 30 h 100) → text1 top 150
                expect(box('text1').top - box('textarea1').bottom, 'text1 gap').to.be.closeTo(D.rootGap, PX);
                // listview1 shares canonical top 30 but sits in a different horizontal lane
                expect(box('listview1').top - box('textarea1').top, 'other lane unaffected').to.be.closeTo(0, PX);
            };

            expectLayout(rootLayout);
            typeLines(input, 12);
            expectLayout((box) => {
                expect(box('textarea1').height).to.be.gt(D.authoredHeight + 50);
                rootLayout(box);
            });
            cy.get(input).clear();
            expectLayout((box) => {
                expect(box('textarea1').height).to.be.closeTo(D.authoredHeight, PX);
                rootLayout(box);
            });
        });

        it('[TextArea-BRW-002] Inside a container: pushes its sibling and grows the container, which pushes the canvas', () => {
            const input = textAreaSelector.input('textarea2');
            const containerLayout = (box) => {
                // source: textAreaDynamicHeight.json textarea2 (top 10 h 100) → text2 top 130
                expect(box('text2').top - box('textarea2').bottom, 'sibling gap in container').to.be.closeTo(D.containerChildGap, PX);
                expect(box('container1').bottom, 'container encloses its children').to.be.gte(box('text2').bottom - PX);
                // source: textAreaDynamicHeight.json container1 ends 450 → text3 top 480
                expect(box('text3').top - box('container1').bottom, 'gap below container').to.be.closeTo(D.containerTrailingGap, PX);
            };
            let containerBefore;

            expectLayout((box) => {
                containerLayout(box);
                containerBefore = box('container1').height;
            });
            typeLines(input, 12);
            expectLayout((box) => {
                expect(box('textarea2').height).to.be.gt(D.authoredHeight + 50);
                expect(box('container1').height, 'container grew').to.be.gt(containerBefore + 20);
                containerLayout(box);
            });
            cy.get(input).clear();
            expectLayout((box) => {
                expect(box('textarea2').height).to.be.closeTo(D.authoredHeight, PX);
                expect(box('container1').height, 'container back to authored').to.be.closeTo(containerBefore, PX);
                containerLayout(box);
            });
        });

        it('[TextArea-BRW-002] Inside a list view row: grows only its row, pushes the next row and the canvas below', () => {
            const rowLayout = (box) => {
                // source: textAreaDynamicHeight.json textarea3 (top 10 h 100) → text4 top 120, per row
                expect(box('text4', 0).top - box('textarea3', 0).bottom, 'row 0 sibling gap').to.be.closeTo(D.rowChildGap, PX);
                expect(box('text4', 1).top - box('textarea3', 1).bottom, 'row 1 sibling gap').to.be.closeTo(D.rowChildGap, PX);
                expect(box('textarea3', 1).top, 'row 1 starts below row 0').to.be.gt(box('text4', 0).bottom);
                expect(box('listview1').bottom, 'list encloses its last row').to.be.gte(box('text4', 1).bottom - PX);
                // source: textAreaDynamicHeight.json listview1 ends 370 → text5 top 400
                expect(box('text5').top - box('listview1').bottom, 'gap below list').to.be.closeTo(D.listTrailingGap, PX);
            };
            let listBefore;
            let row1TopOffset;

            expectLayout((box) => {
                rowLayout(box);
                listBefore = box('listview1').height;
                row1TopOffset = box('textarea3', 1).top - box('listview1').top;
            });
            typeLines(textAreaSelector.input('textarea3'), 12); // first match = row 0
            expectLayout((box) => {
                const grown = box('textarea3', 0).height - D.authoredHeight;
                expect(grown, 'row 0 text area grew').to.be.gt(50);
                expect(box('textarea3', 1).height, 'row 1 text area untouched').to.be.closeTo(D.authoredHeight, PX);
                expect(box('textarea3', 1).top - box('listview1').top, 'row 1 pushed by the growth').to.be.closeTo(row1TopOffset + grown, PX);
                expect(box('listview1').height, 'list grew').to.be.gt(listBefore + 20);
                rowLayout(box);
            });
            cy.get(textAreaSelector.input('textarea3')).first().clear();
            expectLayout((box) => {
                expect(box('textarea3', 0).height).to.be.closeTo(D.authoredHeight, PX);
                expect(box('listview1').height, 'list back to authored').to.be.closeTo(listBefore, PX);
                rowLayout(box);
            });
        });

        // textarea4 visibility = {{components.checkbox1.value}} (false) and holds 15 lines of default content.
        const checkbox = `${textAreaSelector.draggableWidget('checkbox1')} input`;
        // source: textAreaDynamicHeight.json checkbox1 top 30 → text6 top 200 (authored offset)
        const hiddenLayout = (box) =>
            expect(box('text6').top - box('checkbox1').top, 'text6 at its authored place').to.be.closeTo(D.checkboxToText6, PX);
        const shownLayout = (box) => {
            expect(box('textarea4').height, 'shown with its content height').to.be.gt(D.authoredHeight + 100);
            // source: textAreaDynamicHeight.json textarea4 (top 80 h 100) → text6 top 200
            expect(box('text6').top - box('textarea4').bottom, 'text6 pushed below it').to.be.closeTo(D.hiddenGap, PX);
        };

        it('[TextArea-BRW-002] A hidden Text Area claims no space for its content; shown, it pushes the layout', () => {
            cy.get(textAreaSelector.draggableWidget('textarea4')).should('not.be.visible');
            expectLayout(hiddenLayout);

            cy.get(checkbox).check({ force: true });
            cy.get(textAreaSelector.input('textarea4')).should('be.visible');
            expectLayout(shownLayout);
        });

        // PRODUCT BUG (kept red): hiding the grown Text Area again leaves text6 where the visible, grown field
        // pushed it (+ content − authored px) instead of releasing the space as on first load.
        it('[TextArea-BRW-002] Hiding a grown Text Area again releases the space it claimed', () => {
            cy.get(checkbox).check({ force: true });
            cy.get(textAreaSelector.input('textarea4')).should('be.visible');
            expectLayout(shownLayout);

            cy.get(checkbox).uncheck({ force: true });
            cy.get(textAreaSelector.draggableWidget('textarea4')).should('not.be.visible');
            expectLayout(hiddenLayout);
        });
    });

    // ── TextArea-BRW-003 (running app) ──────────────────────────────────────
    describe('running app — fixed height', () => {
        beforeEach(() => {
            cy.apiLogin();
            importAppFixture(T.keyboardFixture, `${fake.companyName}-TextArea-scroll-${Cypress._.uniqueId()}`);
            openAppInViewer(textAreaSelector.input('textarea1'));
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('[TextArea-BRW-003] The resize grip cannot be dragged and content past the visible height scrolls', () => {
            const input = textAreaSelector.input('textarea1');
            cy.get(input).should('have.css', 'resize', T.resizeNone).and('have.css', 'overflow-y', T.overflowYAuto);

            // a real drag on the bottom-right corner (where the native grip sits) leaves the size unchanged.
            // Measured against the field container: page width can shift by a scrollbar, the field ratio cannot.
            const sizeInField = ($el) => {
                const t = $el[0].getBoundingClientRect();
                const f = $el[0].parentElement.getBoundingClientRect();
                return { h: t.height, wGap: f.width - t.width, inlineW: $el[0].style.width };
            };
            cy.get(input).then(($el) => {
                const before = sizeInField($el);
                cy.get(input)
                    .realMouseDown({ position: 'bottomRight' })
                    .realMouseMove(120, 120, { position: 'bottomRight' })
                    .realMouseUp({ position: 'bottomRight' });
                cy.get(input).should(($after) => {
                    const after = sizeInField($after);
                    expect(after.h, 'height after corner drag').to.be.closeTo(before.h, 1);
                    expect(after.wGap, 'still fills the field width').to.be.closeTo(before.wGap, 1);
                    expect(after.inlineW, 'no inline width written by a native resize').to.eq('');
                });
            });

            // overflow scrolls: real typing keeps the caret line in view, the wheel scrolls back and forth
            cy.get(input).realClick();
            cy.realType(Array.from({ length: 20 }, (_, i) => `line${i + 1}`).join('\n')); // dynamic: 20 lines ≫ the authored 100px. source: textAreaKeyboard.json textarea1
            expectScrollState(input, (el) => {
                expect(el.scrollHeight, 'content taller than the box').to.be.gt(el.clientHeight + 100);
                expect(el.scrollTop, 'scrolled to the caret').to.be.gt(0);
            });
            cy.get(input).realMouseWheel({ deltaY: -3000 });
            expectScrollState(input, (el) => expect(el.scrollTop, 'wheel up → top').to.eq(0));
            cy.get(input).realMouseWheel({ deltaY: 120 });
            expectScrollState(input, (el) => expect(el.scrollTop, 'wheel down scrolls').to.be.gt(0));
            // the widget itself never grew (Dynamic height off). source: textAreaKeyboard.json textarea1 h 100
            expectLayout((box) => expect(box('textarea1').height).to.be.closeTo(D.authoredHeight, PX));
        });
    });
});
