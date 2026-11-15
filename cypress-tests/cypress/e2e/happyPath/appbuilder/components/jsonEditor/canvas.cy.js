/**
 * SPEC — JSON Editor — canvas facet.
 * FOR AI: always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo)
 * + browser-only geometry scenarios from TESTING.md (frontend/ee/test/app-builder/widgets/JSONEditor):
 *   JSONEditor-BRW-001 — Dynamic height resizes the editor and reflows the canvas (viewer)
 *   JSONEditor-BRW-002 — Folding and unfolding resize a dynamic-height editor (viewer)
 *   JSONEditor-BRW-005 — The gutter fits its line numbers at any document length (D-09)
 *   JSONEditor-BRW-006 — A long line scrolls horizontally under an opaque gutter (D-08)
 * Dynamic height only runs in view mode (JSONEditor.jsx:56), so those apps are seeded through the components API
 * (addJsonWidgetsViaApi) and opened in the viewer.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * openLinkAppInViewer, addJsonWidgetsViaApi, jsonEditorMetrics, readJsonEditorMetrics, typeIntoJsonEditor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { jsonEditorSelector as SEL } from "Selectors/appBuilder/components/jsonEditor";
import { jsonEditorText } from "Texts/appBuilder/components/jsonEditor";
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
    addJsonWidgetsViaApi,
    jsonEditorMetrics,
    readJsonEditorMetrics,
    typeIntoJsonEditor,
} from "Support/utils/appBuilder/components/jsonEditor";

const T = jsonEditorText;
const W = T.defaultWidgetName;
const PX = 2; // layout tolerance (px)
const GAP = T.layoutGap;

const box = (name) => {
    const el = Cypress.$(commonWidgetSelector.draggableWidget(name))[0];
    expect(el, `widget ${name}`).to.exist;
    return el.getBoundingClientRect();
};
// an array document of `countExpr` numbers → JSON.stringify(…, null, 2) renders count + 2 lines
const numbersDoc = (countExpr) => `{{Array.from({ length: ${countExpr} }, (_, i) => i)}}`;

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('JSON Editor — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-JSONEditor-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
            // the definition document renders, pretty-printed. source: jsonEditor.js:186
            cy.get(SEL.content(W)).should('contain.text', T.defaultDocumentText);
            cy.get(SEL.content(W)).should('have.attr', 'data-language', 'json'); // JSONEditor.jsx:181 json()
            cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
                expect($w[0].getBoundingClientRect().height, 'default height').to.be.closeTo(T.defaultSize.height, PX)); // source: jsonEditor.js:8
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
            renameWidgetFromMenu(W, 'payload'); // asserts new name internally
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

    describe('seeded apps (viewer)', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-JSONEditor-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── JSONEditor-BRW-001 ───────────────────────────────────────────────
        // JSONEditor.jsx:56 dynamic height = properties.dynamicHeight && view mode; the container goes height:100%
        // (:117), CodeMirror gets minHeight = authored height and maxHeight none (:317-318), and every document change
        // toggles forceDynamicHeightUpdate (:90,:217) so useDynamicHeight writes the new grid height back.
        // `grow` follows its document; `fixed` (dynamic height off — the jsonEditor.js:195 default) is the control.
        it('[JSONEditor-BRW-001] Dynamic height grows and shrinks the editor with its document and reflows the widgets below', () => {
            const authored = 120; // dynamic: authored widget height (px)
            const many = 20; // dynamic: array length that overflows the authored height
            const docExpr = numbersDoc('Number(components.count.value) || 1');
            addJsonWidgetsViaApi([
                { type: 'TextInput', name: 'count', layout: { top: 10, left: 32, width: 8, height: 40 } },
                { name: 'grow', layout: { top: 80, left: 2, width: 12, height: authored }, properties: { dynamicHeight: { value: '{{true}}' }, value: { value: docExpr } } },
                { type: 'Text', name: 'below', layout: { top: 80 + authored + GAP, left: 2, width: 12, height: 40 }, properties: { text: { value: 'below' } } },
                { name: 'fixed', layout: { top: 80, left: 16, width: 12, height: authored }, properties: { value: { value: docExpr } } },
                { type: 'Text', name: 'belowfixed', layout: { top: 80 + authored + GAP, left: 16, width: 12, height: 40 }, properties: { text: { value: 'fixed' } } },
            ]);
            openLinkAppInViewer(SEL.content('grow'));

            const expectFitsDocument = (name) =>
                jsonEditorMetrics(name, (m) => {
                    // nothing scrolls inside: the whole document is on screen, inside the widget box
                    expect(m.scroller.scrollHeight, `${name}: no inner vertical scroll`).to.be.lte(m.scroller.clientHeight + 1);
                    expect(m.scroller.bottom, `${name}: scroller inside the widget`).to.be.lte(m.widget.bottom + 1);
                });
            const expectGapBelow = (upper, lower) =>
                cy.document().should(() => expect(box(lower).top - box(upper).bottom, `${lower} keeps its gap under ${upper}`).to.be.closeTo(GAP, PX));

            // short document (3 lines): authored height is the floor
            jsonEditorMetrics('grow', (m) => expect(m.lines, 'one-element array').to.eq(3));
            expectFitsDocument('grow');
            cy.document().should(() => expect(box('grow').height, 'authored height').to.be.closeTo(authored, PX));
            expectGapBelow('grow', 'below');
            cy.document().then(() => cy.wrap({ below: box('below').top, belowFixed: box('belowfixed').top }).as('tops0'));

            // property-driven growth: 20 elements → 22 lines, the editor grows past the authored height
            cy.get(SEL.textInput('count')).type(String(many));
            jsonEditorMetrics('grow', (m) => {
                expect(m.lines, 'grown document rendered').to.eq(many + 2);
                expect(m.widget.height, 'grew with the document').to.be.gte((many + 2) * m.lineHeight);
            });
            expectFitsDocument('grow');
            expectGapBelow('grow', 'below');
            // control: dynamic height off keeps the authored box and scrolls instead, its sibling stays put
            cy.get('@tops0').then((tops0) => {
                jsonEditorMetrics('fixed', (m) => {
                    expect(m.widget.height, 'fixed: authored height').to.be.closeTo(authored, PX);
                    expect(m.scroller.scrollHeight, 'fixed: scrolls instead').to.be.gt(m.scroller.clientHeight + 100);
                });
                cy.document().should(() => expect(box('belowfixed').top, 'fixed sibling did not move').to.be.closeTo(tops0.belowFixed, PX));
            });

            // shrink back: the document returns to one element, the editor to its floor, the sibling to its place
            cy.get(SEL.textInput('count')).clear();
            jsonEditorMetrics('grow', (m) => expect(m.lines).to.eq(3));
            cy.get('@tops0').then((tops0) =>
                cy.document().should(() => {
                    expect(box('grow').height, 'back to the authored height').to.be.closeTo(authored, PX);
                    expect(box('below').top, 'sibling back in place').to.be.closeTo(tops0.below, PX);
                }));

            // user-driven growth: typing six new lines into the editor grows it by six lines
            readJsonEditorMetrics('grow').then((before) => {
                const added = 6; // dynamic: typed lines
                const keys = Array.from({ length: added }, (_, i) => `{enter}${100 + i},`).join('');
                typeIntoJsonEditor('grow', 1, keys);
                jsonEditorMetrics('grow', (m) => {
                    expect(m.lines, 'typed lines rendered').to.eq(before.lines + added);
                    expect(m.widget.height, 'grew by the typed lines').to.be.gte((before.lines + added) * m.lineHeight);
                    expect(m.widget.height, 'past the authored height').to.be.gt(authored + PX);
                });
                expectFitsDocument('grow');
                expectGapBelow('grow', 'below');
            });
        });

        // ── JSONEditor-BRW-002 ───────────────────────────────────────────────
        // JSONEditor.jsx:166-178: a foldEffect/unfoldEffect transaction toggles forceDynamicHeightUpdate while dynamic
        // height is on, so the grid height follows the visible line count. Covers the gutter fold markers, the inline
        // placeholder, and the Expand-entire-JSON property (foldAll/unfoldAll — :231-248) bound to a TextInput.
        it('[JSONEditor-BRW-002] Folding and unfolding resize a dynamic-height editor and reflow the widget below', () => {
            const authored = 120; // dynamic: authored widget height (px)
            // 16 lines expanded: root, a, list (+6 items +close), obj (+3 keys +close), root close
            const doc = '{{{ a: 1, list: [1, 2, 3, 4, 5, 6], obj: { x: 1, y: 2, z: 3 } }}}'; // dynamic
            const expandExpr = '{{components.expand.value !== "no"}}'; // dynamic: typing "no" collapses everything
            addJsonWidgetsViaApi([
                { type: 'TextInput', name: 'expand', layout: { top: 10, left: 32, width: 8, height: 40 } },
                {
                    name: 'fold',
                    layout: { top: 80, left: 2, width: 12, height: authored },
                    properties: { dynamicHeight: { value: '{{true}}' }, value: { value: doc }, shouldExpandEntireJSON: { value: expandExpr } },
                },
                { type: 'Text', name: 'below', layout: { top: 80 + authored + GAP, left: 2, width: 12, height: 40 }, properties: { text: { value: 'below' } } },
                { name: 'fixedfold', layout: { top: 80, left: 16, width: 12, height: authored }, properties: { value: { value: doc } } },
            ]);
            openLinkAppInViewer(SEL.content('fold'));

            const expectHugs = (lines, label) =>
                jsonEditorMetrics('fold', (m) => {
                    expect(m.lines, `${label}: visible lines`).to.eq(lines);
                    expect(m.scroller.scrollHeight, `${label}: no inner scroll`).to.be.lte(m.scroller.clientHeight + 1);
                    // the box follows the visible lines, with the authored height as its floor
                    expect(m.widget.height, `${label}: height follows the lines`).to.be.closeTo(Math.max(authored, m.scroller.scrollHeight + 6), 4);
                    expect(box('below').top - m.widget.bottom, `${label}: below keeps its gap`).to.be.closeTo(GAP, PX);
                });

            // expanded (shouldExpandEntireJSON default true — jsonEditor.js:189)
            expectHugs(16, 'expanded');
            readJsonEditorMetrics('fold').as('open');

            // fold `list` from the gutter: 7 lines disappear, the editor shrinks, `below` moves up by the same amount
            cy.get(SEL.foldMarker('fold')).eq(1).click();
            expectHugs(9, 'list folded');
            cy.get('@open').then((open) =>
                jsonEditorMetrics('fold', (m) => {
                    expect(m.foldPlaceholders, 'one placeholder').to.eq(1);
                    expect(open.widget.height - m.widget.height, 'shrank by the folded lines').to.be.closeTo(7 * m.lineHeight, 4);
                }));

            // the placeholder unfolds it again — back to the expanded height
            cy.get(SEL.foldPlaceholder('fold')).click();
            expectHugs(16, 'list unfolded');
            cy.get('@open').then((open) =>
                jsonEditorMetrics('fold', (m) => expect(m.widget.height, 'expanded height restored').to.be.closeTo(open.widget.height, PX)));

            // fold the root: one line left, the editor drops to its authored floor; unfold restores it
            cy.get(SEL.foldMarker('fold')).eq(0).click();
            expectHugs(1, 'root folded');
            cy.document().should(() => expect(box('fold').height, 'authored floor').to.be.closeTo(authored, PX));
            cy.get(SEL.unfoldMarker('fold')).last().click();
            expectHugs(16, 'root unfolded');

            // Expand entire JSON flipped at runtime: foldAll collapses and resizes, unfoldAll grows it back
            cy.get(SEL.textInput('expand')).type('no');
            jsonEditorMetrics('fold', (m) => expect(m.foldPlaceholders, 'everything folded').to.be.gte(1));
            cy.document().should(() => {
                expect(box('fold').height, 'collapsed to the floor').to.be.closeTo(authored, PX);
                expect(box('below').top - box('fold').bottom, 'below follows').to.be.closeTo(GAP, PX);
            });
            cy.get(SEL.textInput('expand')).clear();
            expectHugs(16, 'expand-all restored');

            // control: folding a fixed-height editor changes what it shows, never its box
            readJsonEditorMetrics('fixedfold').then((f0) => {
                cy.get(SEL.foldMarker('fixedfold')).eq(1).click();
                jsonEditorMetrics('fixedfold', (m) => {
                    expect(m.foldPlaceholders).to.eq(1);
                    expect(m.widget.height, 'fixed height unchanged').to.be.closeTo(f0.widget.height, PX);
                });
            });
        });

        // ── JSONEditor-BRW-005 ───────────────────────────────────────────────
        // D-09: jsonEditor.scss:13-15 gives `.cm-gutters` width:auto + a 42px floor (beating the leaked global
        // `width: 42px` rule), so the gutter grows with the widest line number. Four- (short), five- and six-digit
        // documents; the in-test control re-pins the gutter to 42px and must make the numbers spill.
        it('[JSONEditor-BRW-005] The gutter widens to fit five- and six-digit line numbers and never lets them spill into the code', () => {
            addJsonWidgetsViaApi([
                { name: 'short', layout: { top: 40, left: 2, width: 12, height: 200 }, properties: { value: { value: '{{{ a: 1 }}}' } } },
                { name: 'five', layout: { top: 40, left: 15, width: 12, height: 200 }, properties: { value: { value: numbersDoc(12000) } } }, // dynamic: 12,002 lines
                { name: 'six', layout: { top: 40, left: 28, width: 12, height: 200 }, properties: { value: { value: numbersDoc(100000) } } }, // dynamic: 100,002 lines
            ]);
            // the six-digit document's `.cm-content` is ~2M px tall, so Cypress never calls it "visible" — wait on the box
            openLinkAppInViewer(SEL.box('six'));
            cy.get(SEL.line('six'), { timeout: 30000 }).should('exist');

            // wait until each editor is fully up (async theme applied — JSONEditor.jsx:250-262), then keep each one
            // scrolled to its last line while measuring, so the widest number is the one rendered. Re-applying the
            // scroll on every retry absorbs a late re-render that resets it (seen while the 100k-line doc settles).
            const ready = (name) =>
                jsonEditorMetrics(name, (m) => expect(m.editorBackground, `${name}: editor up`).to.eq(T.themes.solarized.background)); // source: jsonEditor.js:188
            const atEnd = (name, assertFn) =>
                jsonEditorMetrics(name, (m) => {
                    const s = Cypress.$(SEL.scroller(name))[0];
                    s.scrollTop = s.scrollHeight;
                    assertFn(m);
                });
            const fits = (m) => ({
                // the painted digits end inside the line-number column, which ends inside the gutter
                digitsInsideColumn: m.lastNumber.textRight <= m.lineNumbers.right + 0.5,
                columnInsideGutter: m.lineNumbers.right <= m.gutters.right - m.gutters.borderRight + 0.5,
                notClipped: m.lastNumber.scrollWidth <= m.lastNumber.clientWidth,
                codeStartsAfterGutter: m.content.left >= m.gutters.right - 0.5,
            });
            const ALL_FIT = { digitsInsideColumn: true, columnInsideGutter: true, notClipped: true, codeStartsAfterGutter: true };
            const widths = {};
            [
                ['short', '3'],
                ['five', '12002'],
                ['six', '100002'],
            ].forEach(([name, last]) => {
                ready(name);
                atEnd(name, (m) => {
                    expect(m.lastNumber && m.lastNumber.text, `${name}: last line number rendered`).to.eq(last);
                    expect(fits(m), `${name}: line numbers fit the gutter`).to.deep.eq(ALL_FIT);
                    expect(m.gutters.width, `${name}: 42px floor`).to.be.gte(T.gutter.minWidth - 0.5); // source: jsonEditor.scss:15
                    widths[name] = m.gutters.width;
                });
            });
            cy.then(() => {
                expect(widths.five, 'five digits widen the gutter').to.be.gt(widths.short + 10);
                expect(widths.six, 'six digits widen it further').to.be.gt(widths.five + 4);
            });

            // control: the pre-D-09 pinned width makes the same check fail, so the assertion can catch a regression
            cy.document().then((doc) => {
                const style = doc.createElement('style');
                style.id = 'je-pin-gutter';
                style.textContent = T.gutter.pinnedWidthCss;
                doc.head.appendChild(style);
            });
            atEnd('six', (m) => {
                expect(m.lastNumber.text).to.eq('100002');
                expect(fits(m), 'pinned 42px gutter lets numbers spill').to.not.deep.eq(ALL_FIT);
            });
            cy.document().then((doc) => doc.getElementById('je-pin-gutter').remove());
            atEnd('six', (m) => expect(fits(m), 'fits again').to.deep.eq(ALL_FIT));
        });

        // ── JSONEditor-BRW-006 ───────────────────────────────────────────────
        // D-08: jsonEditor.scss:23-28 — `.cm-scroller` overflow-x:auto (mouse/trackpad can scroll), overscroll-behavior-x
        // none (hard scrolling past the end doesn't drag the sticky gutter away), and an opaque gutter background
        // (:16 --cc-surface3-surface) so text scrolled under the sticky gutter is hidden by it.
        it('[JSONEditor-BRW-006] A long line scrolls horizontally by wheel/trackpad under a pinned, opaque gutter', () => {
            const tail = 'END'; // dynamic: marker at the end of the long value
            addJsonWidgetsViaApi([
                { name: 'long', layout: { top: 40, left: 2, width: 10, height: 150 }, properties: { value: { value: `{{{ long: 'abc'.repeat(150) + '${tail}' }}}` } } },
            ]);
            openLinkAppInViewer(SEL.content('long'));

            const tailRect = (doc) => {
                const span = [...doc.querySelectorAll(`${SEL.line('long')} span`)].find((s) => s.textContent.includes(tail));
                const node = span.firstChild;
                const range = doc.createRange();
                const at = node.textContent.lastIndexOf(tail);
                range.setStart(node, at);
                range.setEnd(node, at + tail.length);
                return range.getBoundingClientRect();
            };
            const pinned = (m, label) => {
                expect(m.gutters.left, `${label}: gutter pinned to the scroller's left edge`).to.be.closeTo(m.scroller.left, 0.5);
                expect(m.gutters.position, `${label}: sticky gutter`).to.eq(T.gutter.position);
            };

            // one logical line stays one row and overflows horizontally; the scroller allows horizontal scrolling
            jsonEditorMetrics('long', (m) => {
                expect(m.lines, 'not wrapped').to.eq(3);
                expect(m.scroller.overflowX).to.eq(T.scroller.overflowX); // source: jsonEditor.scss:25
                expect(m.scroller.overscrollBehaviorX).to.eq(T.scroller.overscrollBehaviorX); // source: jsonEditor.scss:27
                expect(m.scroller.scrollWidth, 'line wider than the editor').to.be.gt(m.scroller.clientWidth * 3);
                expect(m.scroller.scrollLeft).to.eq(0);
                pinned(m, 'at rest');
            });
            cy.document().then((doc) => {
                jsonEditorMetrics('long', (m) => expect(tailRect(doc).left, 'tail starts off-screen').to.be.gt(m.scroller.right));
            });

            // a real horizontal wheel (trackpad swipe) scrolls the line, not just cursor navigation
            cy.get(SEL.scroller('long')).realMouseWheel({ deltaX: 300, scrollBehavior: false });
            cy.get(SEL.scroller('long')).realMouseWheel({ deltaX: 300, scrollBehavior: false });
            cy.document().then((doc) => {
                jsonEditorMetrics('long', (m) => {
                    expect(m.scroller.scrollLeft, 'wheel scrolled horizontally').to.be.gt(0);
                    pinned(m, 'scrolled');
                    expect(parseFloat(m.gutters.background.split(',')[3] || '1'), 'gutter background opaque').to.eq(1);
                    // the scrolled code now runs under the gutter…
                    const line = doc.querySelectorAll(SEL.line('long'))[1].getBoundingClientRect();
                    expect(line.left, 'line passes behind the gutter').to.be.lt(m.gutters.left);
                    // …and the gutter is what the user sees there: it sits on top of the text
                    const hit = doc.elementFromPoint(m.gutters.left + m.gutters.width / 2, line.top + line.height / 2);
                    expect(hit && !!hit.closest('.cm-gutters'), 'gutter painted over the scrolled text').to.eq(true);
                });
            });

            // scroll hard past the end: the scroll clamps, the tail is readable, the gutter stays attached
            Cypress._.times(8, () => cy.get(SEL.scroller('long')).realMouseWheel({ deltaX: 1200, scrollBehavior: false }));
            cy.document().then((doc) => {
                jsonEditorMetrics('long', (m) => {
                    expect(m.scroller.scrollLeft, 'reached the end').to.be.closeTo(m.scroller.scrollWidth - m.scroller.clientWidth, 1);
                    pinned(m, 'past the end');
                    const r = tailRect(doc);
                    expect(r.right, 'tail visible (right)').to.be.lte(m.scroller.right + 0.5);
                    expect(r.left, 'tail visible right of the gutter').to.be.gte(m.gutters.right - 0.5);
                });
            });
        });
    });
});
