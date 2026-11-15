/**
 * SPEC — Text Editor (RichTextEditor) — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo)
 * + the browser-only geometry scenario from TESTING.md:
 *   RichTextEditor-BRW-003 — with Dynamic height in view mode the widget height tracks its content (useDynamicHeight +
 *                            the controls ResizeObserver); edit-mode and view-mode geometry differ
 * Dynamic height only runs in a running app (RichTextEditor.jsx:26 `dynamicHeight && currentMode === 'view'`), so the
 * scenario apps are seeded through the components API (addRichTextEditorsViaApi) and opened in the viewer; content is
 * pasted through draft-js's own paste path or seeded as the default value.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * openLinkAppInViewer, addRichTextEditorsViaApi, valueProbe, pasteIntoEditor, focusEditor, selectAllInEditor, rteMetrics.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { richTextEditorSelector } from "Selectors/appBuilder/components/richTextEditor";
import { richTextEditorText } from "Texts/appBuilder/components/richTextEditor";
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
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    addRichTextEditorsViaApi,
    valueProbe,
    pasteIntoEditor,
    focusEditor,
    selectAllInEditor,
    rteMetrics,
} from "Support/utils/appBuilder/components/richTextEditor";

const W = richTextEditorText.defaultWidgetName;
const T = richTextEditorText;
const S = richTextEditorSelector;
const PX = 2; // layout tolerance (px)
const GAP = T.layoutGap;

const box = (name) => {
    const el = Cypress.$(commonWidgetSelector.draggableWidget(name))[0];
    expect(el, `widget ${name}`).to.exist;
    return el.getBoundingClientRect();
};
// n numbered lines (one paragraph each)
const lines = (n) => Array.from({ length: n }, (_, i) => `line ${i + 1}`).join('\n');
const paragraphs = (n) => Array.from({ length: n }, (_, i) => `<p>line ${i + 1}</p>`).join('');

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run); each test re-creates its own app.
describe('Text Editor — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-RichTextEditor-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
            cy.get(S.placeholder(W)).should('have.text', T.defaultPlaceholder); // source: richtextarea.js:111
            cy.get(S.controls(W)).should('contain.text', T.headingMenuLabel); // source: DraftEditor.jsx:90
            cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
                expect($w[0].getBoundingClientRect().height, 'default height').to.be.closeTo(T.defaultSize.height, PX)); // source: richtextarea.js:8
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
            cy.dragAndDropWidget(T.displayName, 900, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();

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
    });

    describe('running app', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-RichTextEditor-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        const authored = 200; // dynamic: authored editor height (px)
        const editorTop = 70; // dynamic: authored editor top (px)
        const below = editorTop + authored + GAP;
        const label = (name, left) => ({
            type: 'Text',
            name,
            layout: { top: below, left, width: 14, height: 40 },
            properties: { text: { value: name }, textFormat: { value: 'plainText' } },
        });

        // ── RichTextEditor-BRW-003 ───────────────────────────────────────────
        // Lane A: richtexteditor1 (Dynamic height) above text1; lane B: richtexteditor2 (no dynamic height — the
        // richtextarea.js:114 default) above text2.
        it('[RichTextEditor-BRW-003] In view mode Dynamic height grows the widget with its content, pushes the widget below and shrinks back; without it the editor stays fixed and scrolls inside', () => {
            addRichTextEditorsViaApi([
                {
                    name: 'richtexteditor1',
                    layout: { top: editorTop, left: 2, width: 14, height: authored },
                    properties: { dynamicHeight: { value: '{{true}}' } },
                },
                label('text1', 2),
                { name: 'richtexteditor2', layout: { top: editorTop, left: 20, width: 14, height: authored } },
                label('text2', 20),
                valueProbe('probe1', 'richtexteditor1', { top: 10, left: 2, width: 30, height: 40 }),
            ]);
            openLinkAppInViewer(S.content('richtexteditor2'));

            // baseline: the empty editor's height (at least the authored height — its exact value is pinned by the
            // separate empty-editor test below) with text1 its authored gap below it
            let laneB;
            let empty;
            cy.document().should(() => {
                empty = box('richtexteditor1').height;
                expect(empty, 'empty editor: at least the authored height').to.be.gte(authored - PX);
                expect(box('text1').top - box('richtexteditor1').bottom, 'text1 gap').to.be.closeTo(GAP, PX);
                laneB = { editor: box('richtexteditor2').height, text2: box('text2').top };
            });

            // 12 paragraphs: lane A grows past its authored height and text1 keeps its gap below it
            let grown;
            pasteIntoEditor('richtexteditor1', lines(12));
            cy.get(commonWidgetSelector.draggableWidget('probe1')).should('contain.text', 'line 12');
            cy.document().should(() => {
                grown = box('richtexteditor1').height;
                expect(grown, 'grew with the content').to.be.gt(empty + 100);
                expect(box('text1').top - box('richtexteditor1').bottom, 'text1 pushed down, gap kept').to.be.closeTo(GAP, PX);
                expect(box('richtexteditor2').height, 'lane B editor untouched').to.be.closeTo(laneB.editor, PX);
                expect(box('text2').top, 'lane B label untouched').to.be.closeTo(laneB.text2, PX);
            });
            // every paragraph is laid out inside the grown widget — nothing is cut off at the bottom
            rteMetrics('richtexteditor1', (m) => {
                expect(m.content.blocks, 'paragraphs').to.eq(12);
                expect(m.content.bottom, 'content inside the widget').to.be.lte(m.widget.bottom + 1);
                expect(m.editor.inlineHeight, 'editor area sized by content').to.eq('auto');
                expect(m.content.scrollHeight - m.content.clientHeight, 'no inner scroll').to.be.at.most(1);
            });

            // more lines by keyboard grow it further (caret is at the end after the paste)
            cy.realPress('Enter');
            cy.realPress('Enter');
            cy.realPress('Enter');
            cy.document().should(() => {
                expect(box('richtexteditor1').height, 'grew by the new lines').to.be.gt(grown + 30);
                expect(box('text1').top - box('richtexteditor1').bottom, 'gap kept').to.be.closeTo(GAP, PX);
            });
            cy.realPress('Backspace');
            cy.realPress('Backspace');
            cy.realPress('Backspace');
            cy.document().should(() => {
                expect(box('richtexteditor1').height, 'shrank with the content').to.be.closeTo(grown, PX);
                expect(box('text1').top - box('richtexteditor1').bottom, 'gap kept').to.be.closeTo(GAP, PX);
            });

            // emptied → back to exactly the empty height
            selectAllInEditor('richtexteditor1');
            cy.realPress('Backspace');
            cy.get(S.block('richtexteditor1')).should('have.length', 1).and('have.text', '');
            cy.document().should(() => {
                expect(box('richtexteditor1').height, 'back to the empty height').to.be.closeTo(empty, PX);
                expect(box('text1').top - box('richtexteditor1').bottom, 'gap kept').to.be.closeTo(GAP, PX);
            });

            // lane B (no dynamic height): the same content keeps the authored size and scrolls inside the editor
            pasteIntoEditor('richtexteditor2', lines(12));
            cy.document().should(() => {
                expect(box('richtexteditor2').height, 'fixed height kept').to.be.closeTo(authored, PX);
                expect(box('text2').top, 'text2 not pushed').to.be.closeTo(laneB.text2, PX);
            });
            rteMetrics('richtexteditor2', (m) => {
                expect(m.content.scrollHeight, 'content overflows into an inner scroll').to.be.gt(m.content.clientHeight + 100);
                expect(m.root.bottom, 'editor box stays inside the widget').to.be.lte(m.widget.bottom + 1);
            });
        });

        // PRODUCT BUG (kept red): with Dynamic height an EMPTY editor is taller than its authored height. The wrapper's
        // min-height is the authored height (RichTextEditor.jsx:78) but the editor area's min-height is `height - 60`
        // (DraftEditor.jsx:304) while the real chrome (root padding + border, toolbar, margins) is taller than 60px — and
        // taller still when a narrow widget wraps its toolbar (measured: 206px wide / 230px narrow for 200px authored).
        // The widget below is pushed by the extra height here; in a headless-Chromium probe it was overlapped by 4px once
        // (the reflow does not re-run when the toolbar wraps — DraftEditor's ResizeObserver only resizes the editor area).
        it('[RichTextEditor-BRW-003] An empty Dynamic-height editor keeps its authored height and never overlaps the widget below', () => {
            const lanes = [
                { name: 'richtexteditor1', text: 'text1', left: 2, width: 14 }, // wide: one-line toolbar
                { name: 'richtexteditor2', text: 'text2', left: 20, width: 7 }, // dynamic: narrow, the toolbar wraps
            ];
            addRichTextEditorsViaApi(lanes.flatMap((l) => [
                {
                    name: l.name,
                    layout: { top: editorTop, left: l.left, width: l.width, height: authored },
                    properties: { dynamicHeight: { value: '{{true}}' } },
                },
                { ...label(l.text, l.left), layout: { top: below, left: l.left, width: l.width, height: 40 } },
            ]));
            openLinkAppInViewer(S.content('richtexteditor2'));
            cy.get(S.placeholder('richtexteditor2')).should('have.text', T.defaultPlaceholder); // source: richtextarea.js:111
            cy.wait(1000); // let the toolbar ResizeObserver and the reflow settle
            cy.document().should(() => {
                const measured = lanes.map((l) => ({
                    editor: l.name,
                    height: Math.round(box(l.name).height),
                    gapBelow: Math.round(box(l.text).top - box(l.name).bottom),
                }));
                expect(measured, 'empty editors: authored height, authored gap').to.deep.eq(
                    lanes.map((l) => ({ editor: l.name, height: authored, gapBelow: GAP })));
            });
        });

        it('[RichTextEditor-BRW-003] Edit mode keeps the authored height while view mode grows to the same content', () => {
            addRichTextEditorsViaApi([
                {
                    name: 'richtexteditor1',
                    layout: { top: editorTop, left: 2, width: 14, height: authored },
                    properties: { dynamicHeight: { value: '{{true}}' }, defaultValue: { value: paragraphs(12) } },
                },
                label('text1', 2),
            ]);

            // view mode: the widget is as tall as its 12 paragraphs and the label sits below it
            openLinkAppInViewer(S.content('richtexteditor1'));
            cy.get(S.block('richtexteditor1')).should('have.length', 12);
            let viewHeight;
            cy.document().should(() => {
                viewHeight = box('richtexteditor1').height;
                expect(viewHeight, 'view: grown to the content').to.be.gt(authored + 100);
                expect(box('text1').top - box('richtexteditor1').bottom, 'view: label below, gap kept').to.be.closeTo(GAP, PX);
            });
            rteMetrics('richtexteditor1', (m) => {
                expect(m.content.bottom, 'view: content inside the widget').to.be.lte(m.widget.bottom + 1);
                expect(m.content.scrollHeight - m.content.clientHeight, 'view: no inner scroll').to.be.at.most(1);
            });

            // edit mode: same app, same content — the widget keeps its authored height and the content scrolls inside
            cy.openApp('', undefined, undefined, S.content('richtexteditor1'));
            cy.get(S.block('richtexteditor1')).should('have.length', 12);
            cy.document().should(() => {
                expect(box('richtexteditor1').height, 'edit: authored height').to.be.closeTo(authored, PX);
                expect(box('text1').top - box('richtexteditor1').bottom, 'edit: label at its authored place').to.be.closeTo(GAP, PX);
            });
            rteMetrics('richtexteditor1', (m) => {
                expect(m.content.scrollHeight, 'edit: content scrolls inside').to.be.gt(m.content.clientHeight + 100);
                expect(m.root.bottom, 'edit: editor box inside the widget').to.be.lte(m.widget.bottom + 1);
                expect(m.editor.inlineHeight, 'edit: fixed editor area').to.not.eq('auto');
            });
            cy.then(() => expect(viewHeight, 'view and edit geometry differ').to.be.gt(authored + 100));

            // typing in the editor does not grow it either
            focusEditor('richtexteditor1');
            cy.realPress('Enter');
            cy.realPress('Enter');
            cy.document().should(() => expect(box('richtexteditor1').height, 'edit: still authored').to.be.closeTo(authored, PX));
        });
    });
});
