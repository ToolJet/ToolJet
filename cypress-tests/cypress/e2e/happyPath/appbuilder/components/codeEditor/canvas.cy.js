/**
 * SPEC — Code Editor — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only geometry scenarios from TESTING.md:
 *   CodeEditor-BRW-001 — Dynamic height grows the editor with its lines and pushes siblings down in the running app;
 *                        hiding the editor does not corrupt neighbours' positions
 *   CodeEditor-BRW-002 — without Dynamic height a long file scrolls inside the editor box, gutter scrolling with it
 *   CodeEditor-BRW-005 — a long line scrolls horizontally under an opaque, pinned gutter that widens for its numbers
 * Dynamic height only runs in a running app (CodeEditor.jsx:38 `dynamicHeight && currentMode === 'view'`), so the
 * scenario apps are seeded through the components API (addCodeEditorsViaApi) and opened in the viewer. The widget has
 * no default-value property (codeEditor.js:14-54), so content is pasted (pasteCode) or really typed.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * openLinkAppInViewer, addCodeEditorsViaApi, pasteCode, editorMetrics, alphaOf.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { codeEditorSelector } from "Selectors/appBuilder/components/codeEditor";
import { codeEditorText } from "Texts/appBuilder/components/codeEditor";
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
    addCodeEditorsViaApi,
    pasteCode,
    editorMetrics,
    alphaOf,
} from "Support/utils/appBuilder/components/codeEditor";

const W = codeEditorText.defaultWidgetName;
const T = codeEditorText;
const S = codeEditorSelector;
const PX = 2; // layout tolerance (px)
const GAP = T.layoutGap;

const box = (name) => {
    const el = Cypress.$(commonWidgetSelector.draggableWidget(name))[0];
    expect(el, `widget ${name}`).to.exist;
    return el.getBoundingClientRect();
};
// n numbered source lines — distinct text per line so a line can be matched to its gutter number
const numberedLines = (n) => Array.from({ length: n }, (_, i) => `const v${i + 1} = ${i};`).join('\n');
// a visible line's 1-based number, read from its own text (`const v<n> = …`)
const lineNo = (l) => (l.text.match(/^const v(\d+) /) || [])[1];

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app.
describe('Code Editor — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-CodeEditor-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
            cy.get(S.content(W)).should('have.attr', 'data-language', T.modes.javascript); // default mode. source: codeEditor.js:123
            cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
                expect($w[0].getBoundingClientRect().height, 'default height').to.be.closeTo(T.defaultSize.height, PX)); // source: codeEditor.js:8
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
            renameWidgetFromMenu(W, 'snippet'); // asserts new name internally
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
            cy.apiCreateApp(`${fake.companyName}-CodeEditor-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── CodeEditor-BRW-001 ───────────────────────────────────────────────
        // Lane A: codeeditor1 (dynamic height + collapse when hidden) above text1; lane B: codeeditor2 (dynamic height,
        // no collapse — the codeEditor.js:121 default) above text2. Both visibilities are bound to textinput1.
        const authored = 120; // dynamic: authored editor height (px)
        const editorTop = 80; // dynamic: authored editor top (px)
        const seedDynamicLanes = (hideWord) => {
            const visibility = { value: `{{components.textinput1.value !== "${hideWord}"}}` };
            const below = editorTop + authored + GAP;
            addCodeEditorsViaApi([
                { type: 'TextInput', name: 'textinput1', layout: { top: 10, left: 30, width: 8, height: 40 } },
                {
                    name: 'codeeditor1',
                    layout: { top: editorTop, left: 2, width: 12, height: authored },
                    properties: { dynamicHeight: { value: '{{true}}' }, collapseWhenHidden: { value: '{{true}}' } },
                    styles: { visibility },
                },
                { type: 'Text', name: 'text1', layout: { top: below, left: 2, width: 12, height: 40 }, properties: { text: { value: 'A' } } },
                {
                    name: 'codeeditor2',
                    layout: { top: editorTop, left: 16, width: 12, height: authored },
                    properties: { dynamicHeight: { value: '{{true}}' } },
                    styles: { visibility },
                },
                { type: 'Text', name: 'text2', layout: { top: below, left: 16, width: 12, height: 40 }, properties: { text: { value: 'B' } } },
            ]);
            openLinkAppInViewer(S.content('codeeditor2'));
        };

        it('[CodeEditor-BRW-001] Dynamic height grows the editor with its lines, pushes the widget below, and shrinks back to the authored height', () => {
            seedDynamicLanes(fake.firstName.toLowerCase());
            let grown;
            let laneB;

            cy.document().should(() => {
                expect(box('codeeditor1').height, 'authored height while empty').to.be.closeTo(authored, PX);
                expect(box('text1').top - box('codeeditor1').bottom, 'text1 gap').to.be.closeTo(GAP, PX);
                laneB = { editor: box('codeeditor2').height, text2: box('text2').top };
            });

            // 10 lines: the editor grows past its authored height and text1 keeps its authored gap below it
            pasteCode('codeeditor1', numberedLines(10));
            cy.document().should(() => {
                grown = box('codeeditor1').height;
                expect(grown, 'grew with the content').to.be.gt(authored + 50);
                expect(box('text1').top - box('codeeditor1').bottom, 'text1 pushed down, gap kept').to.be.closeTo(GAP, PX);
                // the other lane does not move
                expect(box('codeeditor2').height, 'lane B editor untouched').to.be.closeTo(laneB.editor, PX);
                expect(box('text2').top, 'lane B text untouched').to.be.closeTo(laneB.text2, PX);
            });
            // all ten lines are shown inside the editor: nothing scrolls, the last line sits inside the box
            editorMetrics('codeeditor1', (m) => {
                expect(m.scroller.scrollHeight - m.scroller.clientHeight, 'no inner vertical scroll').to.be.at.most(1);
                expect(m.lines.map(lineNo), 'every line rendered').to.deep.eq(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
                expect(m.lines[9].bottom, 'last line inside the box').to.be.lte(m.box.bottom + 1);
            });

            // adding lines by keyboard grows it further (caret is at the end after the paste)
            cy.realPress('Enter');
            cy.realPress('Enter');
            cy.realPress('Enter');
            cy.realPress('Enter');
            cy.realPress('Enter');
            cy.document().should(() => {
                expect(box('codeeditor1').height, 'grew by the 5 new lines').to.be.gt(grown + 60);
                expect(box('text1').top - box('codeeditor1').bottom, 'gap kept').to.be.closeTo(GAP, PX);
            });

            // removing them shrinks it back to the 10-line height
            cy.realPress('Backspace');
            cy.realPress('Backspace');
            cy.realPress('Backspace');
            cy.realPress('Backspace');
            cy.realPress('Backspace');
            cy.document().should(() => {
                expect(box('codeeditor1').height, 'shrank with the content').to.be.closeTo(grown, PX);
                expect(box('text1').top - box('codeeditor1').bottom, 'gap kept').to.be.closeTo(GAP, PX);
            });

            // emptied → back to exactly the authored height, never smaller
            cy.get(S.content('codeeditor1')).type('{selectall}', { scrollBehavior: false });
            cy.realPress('Backspace');
            cy.get(S.line('codeeditor1')).should('have.length', 1).and('have.text', '');
            cy.document().should(() => {
                expect(box('codeeditor1').height, 'back to the authored height').to.be.closeTo(authored, PX);
                expect(box('text1').top - box('codeeditor1').bottom, 'gap kept').to.be.closeTo(GAP, PX);
            });
        });

        it('[CodeEditor-BRW-001] Hiding a grown editor does not corrupt neighbours: collapse reclaims the space, no collapse keeps it, showing restores both', () => {
            const hideWord = fake.firstName.toLowerCase(); // dynamic: typed to hide both editors
            const textInput = S.textInput('textinput1');
            seedDynamicLanes(hideWord);
            pasteCode('codeeditor1', numberedLines(10));
            pasteCode('codeeditor2', numberedLines(10));

            let grown;
            cy.document().should(() => {
                grown = {
                    ce1Top: box('codeeditor1').top,
                    ce1Height: box('codeeditor1').height,
                    text1: box('text1').top,
                    text2: box('text2').top,
                };
                expect(grown.ce1Height, 'lane A grown').to.be.gt(authored + 50);
                expect(box('codeeditor2').height, 'lane B grown').to.be.gt(authored + 50);
                expect(grown.text1 - box('codeeditor1').bottom, 'text1 gap').to.be.closeTo(GAP, PX);
                expect(grown.text2 - box('codeeditor2').bottom, 'text2 gap').to.be.closeTo(GAP, PX);
            });

            const expectHidden = () => {
                cy.get(S.root('codeeditor1')).should('have.css', 'display', 'none');
                cy.get(S.root('codeeditor2')).should('have.css', 'display', 'none');
                cy.document().should(() => {
                    // lane A collapses: text1 moves up into the editor's place — not above it, not part-way
                    expect(box('text1').top, 'text1 takes the collapsed editor place').to.be.closeTo(grown.ce1Top, PX);
                    // lane B does not collapse: text2 stays exactly where it was
                    expect(box('text2').top, 'text2 unchanged').to.be.closeTo(grown.text2, PX);
                });
            };
            const expectShown = () => {
                cy.get(S.root('codeeditor1')).should('have.css', 'display', 'block');
                cy.get(S.root('codeeditor2')).should('have.css', 'display', 'block');
                cy.document().should(() => {
                    // both editors come back at their grown size and the neighbours return to exactly their places
                    expect(box('codeeditor1').top, 'editor top kept').to.be.closeTo(grown.ce1Top, PX);
                    expect(box('codeeditor1').height, 'grown height kept').to.be.closeTo(grown.ce1Height, PX);
                    expect(box('text1').top, 'text1 restored').to.be.closeTo(grown.text1, PX);
                    expect(box('text2').top, 'text2 unchanged').to.be.closeTo(grown.text2, PX);
                });
                editorMetrics('codeeditor1', (m) => expect(m.lines.length, 'content survived the hide').to.eq(10));
            };

            cy.get(textInput).type(hideWord);
            expectHidden();
            cy.get(textInput).clear();
            expectShown();
            // a second cycle drifts nothing
            cy.get(textInput).type(hideWord);
            expectHidden();
            cy.get(textInput).clear();
            expectShown();
        });

        // ── CodeEditor-BRW-002 ───────────────────────────────────────────────
        // CodeEditor.jsx:105-120: without dynamic height the box is the widget height with overflow auto and the
        // CodeMirror scroller (`.cm-scroller`) owns the vertical scroll; the gutter is part of the scrolled content.
        it('[CodeEditor-BRW-002] Without Dynamic height a long file scrolls inside the editor box and the gutter scrolls with it', () => {
            const total = 40; // dynamic: lines ≫ the visible box
            addCodeEditorsViaApi([
                { name: 'codeeditor1', layout: { top: 40, left: 2, width: 12, height: T.defaultSize.height } },
                { type: 'Text', name: 'text1', layout: { top: 40 + T.defaultSize.height + GAP, left: 2, width: 12, height: 40 }, properties: { text: { value: 'A' } } },
                { name: 'codeeditor2', layout: { top: 40, left: 16, width: 12, height: 420 } }, // dynamic: taller widget
            ]);
            openLinkAppInViewer(S.content('codeeditor2'));

            const expectGutterAligned = (m, at) => {
                // every rendered line has its own number beside it, at the same height
                const visible = m.lines.filter((l) => lineNo(l));
                expect(visible.length, `${at}: lines rendered`).to.be.gt(3);
                visible.forEach((l) => {
                    const n = m.numbers.find((x) => x.text === lineNo(l));
                    expect(n, `${at}: number for line ${lineNo(l)}`).to.exist;
                    expect(n.top, `${at}: number ${lineNo(l)} level with its line`).to.be.closeTo(l.top, 1);
                });
            };
            const expectContained = (name, m) => {
                expect(m.scroller.scrollHeight, `${name}: content far taller than the box`).to.be.gt(m.scroller.clientHeight + 300);
                expect(m.box.scrollHeight - m.box.clientHeight, `${name}: the box itself does not overflow`).to.be.at.most(1);
                expect(m.scroller.bottom, `${name}: scroller inside the box`).to.be.lte(m.box.bottom + 1);
                expect(m.box.bottom, `${name}: box inside the widget`).to.be.lte(m.widget.bottom + 1);
            };

            pasteCode('codeeditor1', numberedLines(total));
            pasteCode('codeeditor2', numberedLines(total));

            // the widgets keep their authored size: nothing below is pushed
            cy.document().should(() => {
                expect(box('codeeditor1').height, 'widget height kept').to.be.closeTo(T.defaultSize.height, PX);
                expect(box('text1').top - box('codeeditor1').bottom, 'text1 gap kept').to.be.closeTo(GAP, PX);
            });
            editorMetrics('codeeditor1', (m) => {
                expectContained('codeeditor1', m);
                expect(m.box.bottom, 'the box fills the widget').to.be.closeTo(m.widget.bottom - PX, PX + 1);
            });
            editorMetrics('codeeditor2', (m) => expectContained('codeeditor2', m));

            // wheel: hard up → first line at the top, numbers aligned
            cy.get(S.scroller('codeeditor1')).realMouseWheel({ deltaY: -5000, scrollBehavior: false });
            editorMetrics('codeeditor1', (m) => {
                expect(m.scroller.scrollTop, 'at the top').to.eq(0);
                expect(m.lines[0].text, 'first line shown').to.eq('const v1 = 0;');
                expect(m.numbers[0].top, 'number 1 at the top of the box').to.be.closeTo(m.lines[0].top, 1);
                expectGutterAligned(m, 'top');
            });

            // wheel down: the code AND the gutter move together
            cy.get(S.scroller('codeeditor1')).realMouseWheel({ deltaY: 200, scrollBehavior: false });
            editorMetrics('codeeditor1', (m) => {
                expect(m.scroller.scrollTop, 'scrolled').to.be.gt(100);
                expect(m.gutter.top, 'the gutter scrolled with the content').to.be.lt(m.scroller.top - 100);
                expectGutterAligned(m, 'scrolled');
            });

            // wheel to the end: the last line is reachable and visible inside the box
            cy.get(S.scroller('codeeditor1')).realMouseWheel({ deltaY: 5000, scrollBehavior: false });
            editorMetrics('codeeditor1', (m) => {
                expect(m.scroller.scrollTop + m.scroller.clientHeight, 'reached the end').to.be.closeTo(m.scroller.scrollHeight, PX);
                const last = m.lines.find((l) => lineNo(l) === String(total));
                expect(last, 'last line rendered').to.exist;
                expect(last.bottom, 'last line inside the box').to.be.lte(m.box.bottom + 1);
                expect(last.top, 'last line not clipped at the top').to.be.gte(m.box.top);
                expectGutterAligned(m, 'end');
            });

            // the taller editor scrolls its own content the same way
            cy.get(S.scroller('codeeditor2')).realMouseWheel({ deltaY: -5000, scrollBehavior: false });
            editorMetrics('codeeditor2', (m) => expect(m.scroller.scrollTop).to.eq(0));
            cy.get(S.scroller('codeeditor2')).realMouseWheel({ deltaY: 200, scrollBehavior: false });
            editorMetrics('codeeditor2', (m) => {
                expect(m.scroller.scrollTop, 'tall editor scrolled').to.be.gt(100);
                expectGutterAligned(m, 'tall scrolled');
            });
        });

        // ── CodeEditor-BRW-005 ───────────────────────────────────────────────
        // D-07: no forced wrapping (CodeEditor.jsx), codeEditor.scss:18-31 — opaque `--cc-surface3-surface` gutter,
        // `overflow-x: auto` + `overscroll-behavior-x: none` on the scroller, `max-width: none` on the content,
        // `width: auto; min-width: 42px` on the gutter. CodeMirror pins the gutter with `position: sticky`.
        it('[CodeEditor-BRW-005] A long line scrolls horizontally by wheel under an opaque gutter that stays pinned to the edge', () => {
            const longLine = `const longLine = "${'abcdefghij'.repeat(30)}";`; // dynamic: ~320 chars ≫ the box width
            addCodeEditorsViaApi([{ name: 'codeeditor1', layout: { top: 40, left: 2, width: 12, height: T.defaultSize.height } }]);
            openLinkAppInViewer(S.content('codeeditor1'));
            pasteCode('codeeditor1', `${longLine}\nsecond line`);
            cy.get(S.scroller('codeeditor1')).realMouseWheel({ deltaX: -20000, scrollBehavior: false });

            let rowHeight;
            editorMetrics('codeeditor1', (m) => {
                // one logical line = one row: the long line is as tall as the short one, and it overflows sideways
                expect(m.lines.map((l) => l.text), 'two rows').to.deep.eq([longLine, 'second line']);
                expect(m.lines[0].height, 'long line not reflowed').to.be.closeTo(m.lines[1].height, 1);
                rowHeight = m.lines[1].height;
                expect(m.scroller.scrollWidth, 'content wider than the box').to.be.gt(m.scroller.clientWidth + 1000);
                expect(m.scroller.scrollLeft, 'starts at the left').to.eq(0);
                expect(m.lines[0].left, 'text starts right of the gutter').to.be.gte(m.gutter.right - 1);
                // the gutter is painted opaque, so nothing can show through it
                expect(alphaOf(m.gutter.background), `opaque gutter (${m.gutter.background})`).to.eq(1);
            });

            // a real horizontal wheel (trackpad / shift-wheel) scrolls the line sideways
            cy.get(S.scroller('codeeditor1')).realMouseWheel({ deltaX: 300, scrollBehavior: false });
            editorMetrics('codeeditor1', (m) => {
                expect(m.scroller.scrollLeft, 'scrolled horizontally').to.be.gt(100);
                expect(m.scroller.scrollTop, 'not vertically').to.eq(0);
                expect(m.gutter.left, 'gutter pinned to the container edge').to.be.closeTo(m.scroller.left, 1);
                // the scrolled text now runs underneath the gutter
                expect(m.lines[0].left, 'text passes under the gutter').to.be.lt(m.gutter.left - 50);
                expect(m.lines[0].height, 'still one row').to.be.closeTo(rowHeight, 1);
            });

            // what a user sees over the gutter is the gutter, not the scrolled text…
            const hitAtGutter = () =>
                cy.get(S.gutters('codeeditor1')).then(($g) => {
                    const doc = $g[0].ownerDocument;
                    const g = $g[0].getBoundingClientRect();
                    const line = doc.querySelector(S.line('codeeditor1')).getBoundingClientRect();
                    const hit = doc.elementFromPoint(g.left + g.width / 2, line.top + line.height / 2);
                    return { inGutter: !!(hit && hit.closest('.cm-gutters')), inLine: !!(hit && hit.closest('.cm-line')) };
                });
            hitAtGutter().should('deep.equal', { inGutter: true, inLine: false });
            // …control: with the gutter taken out of hit-testing, the same point IS the scrolled text
            cy.get(S.gutters('codeeditor1')).invoke('css', 'visibility', 'hidden');
            hitAtGutter().should('deep.equal', { inGutter: false, inLine: true });
            cy.get(S.gutters('codeeditor1')).invoke('css', 'visibility', '');

            // scrolling hard past the end stops at the end with the gutter still on the edge
            cy.get(S.scroller('codeeditor1')).realMouseWheel({ deltaX: 20000, scrollBehavior: false });
            editorMetrics('codeeditor1', (m) => {
                expect(m.scroller.scrollLeft, 'at the right end').to.be.closeTo(m.scroller.scrollWidth - m.scroller.clientWidth, 1);
                expect(m.gutter.left, 'gutter not detached at the end').to.be.closeTo(m.scroller.left, 1);
                expect(m.scroller.overscrollX, 'no horizontal overscroll bounce').to.eq(T.overscrollX); // source: codeEditor.scss:26
                expect(m.lines[0].right, 'line end reached').to.be.closeTo(m.scroller.right, 30);
            });
            cy.get(S.scroller('codeeditor1')).realMouseWheel({ deltaX: -20000, scrollBehavior: false });
            editorMetrics('codeeditor1', (m) => {
                expect(m.scroller.scrollLeft, 'back at the start').to.eq(0);
                expect(m.gutter.left, 'gutter on the edge').to.be.closeTo(m.scroller.left, 1);
                expect(m.lines[0].left, 'text clear of the gutter again').to.be.gte(m.gutter.right - 1);
            });
        });

        it('[CodeEditor-BRW-005] The gutter widens to fit five-digit line numbers and keeps the text clear of them', () => {
            const total = 10000; // dynamic: five-digit line numbers
            addCodeEditorsViaApi([{ name: 'codeeditor1', layout: { top: 40, left: 2, width: 12, height: T.defaultSize.height } }]);
            openLinkAppInViewer(S.content('codeeditor1'));

            // short document: the gutter sits at its floor width
            pasteCode('codeeditor1', 'a\nb');
            editorMetrics('codeeditor1', (m) => expect(m.gutter.width, 'floor width').to.be.closeTo(T.gutterMinWidth, 1)); // source: codeEditor.scss:20

            pasteCode('codeeditor1', Array.from({ length: total }, (_, i) => `n${i + 1}`).join('\n'));
            cy.get(S.scroller('codeeditor1')).realMouseWheel({ deltaY: 1e6, scrollBehavior: false });
            editorMetrics('codeeditor1', (m) => {
                const last = m.numbers.find((n) => n.text === String(total));
                expect(last, 'line number 10000 rendered').to.exist;
                expect(last.scrollWidth, '10000 not clipped').to.be.at.most(last.clientWidth);
                expect(last.left, '10000 inside the gutter (left)').to.be.gte(m.gutter.left - 1);
                expect(last.right, '10000 inside the gutter (right)').to.be.lte(m.gutter.right + 1);
                expect(m.gutter.width, 'gutter grew past its floor').to.be.gt(T.gutterMinWidth);
                const lastLine = m.lines.find((l) => l.text === `n${total}`);
                expect(lastLine, 'last line rendered').to.exist;
                expect(lastLine.left, 'text clear of the wider gutter').to.be.gte(m.gutter.right - 1);
                expect(m.gutter.left, 'gutter on the edge').to.be.closeTo(m.scroller.left, 1);
            });
        });
    });
});
