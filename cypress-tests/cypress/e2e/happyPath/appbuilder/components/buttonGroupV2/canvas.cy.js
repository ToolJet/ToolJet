/**
 * SPEC — ButtonGroupV2 (Button Group) — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo), plus the reflow / measurement / geometry halves of the TESTING.md browser scenarios:
 *   ButtonGroupV2-BRW-001 — in a running app, column and wrap layouts with dynamic height grow and shrink with the
 *                           real button content and siblings reflow; row stays fixed (ButtonGroupV2.jsx:107 gates
 *                           row out); a hidden ancestor / self-hide defers the measurement until shown.
 *   ButtonGroupV2-BRW-003 — row scrolls horizontally and falls back to start alignment on overflow
 *                           (ButtonGroupV2.jsx:308-331); a fixed column scrolls vertically; wrap creates rows;
 *                           button alignment and label direction hold; native Tab order follows button order.
 * (Editor-vs-running-app split of BRW-001 and BRW-002 device/collapse live in contexts.cy.js.)
 * Dynamic height only runs in view mode, so these apps are seeded through the components API
 * (addButtonGroupsViaApi) and opened in the viewer. Seeded layouts: `left` and `width` are grid columns
 * (43 per row), `top`/`height` px.
 * Helpers: addButtonGroupsViaApi, mappedButtons, buttonGroupBoxes, expectHugsButtons, expectFixedButtons,
 * tabSequence, addTimelinesViaApi, expectStackedBelow, widgetTop, openDividerAppInViewer, getWidgetRect,
 * verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard, duplicateWidgetFromMenu,
 * copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets, multiSelectWidgets,
 * verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { buttonGroupV2Selector } from "Selectors/appBuilder/components/buttonGroupV2";
import { buttonGroupV2Text } from "Texts/appBuilder/components/buttonGroupV2";
import {
    addButtonGroupsViaApi,
    mappedButtons,
    buttonGroupBoxes,
    expectHugsButtons,
    expectFixedButtons,
    tabSequence,
} from "Support/utils/appBuilder/components/buttonGroupV2";
import { addTimelinesViaApi, expectStackedBelow, widgetTop } from "Support/utils/appBuilder/components/timeline";
import { openDividerAppInViewer } from "Support/utils/appBuilder/components/divider";
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

const W = buttonGroupV2Text.defaultWidgetName;
const T = buttonGroupV2Text;
const S = buttonGroupV2Selector;
const PREFIX = T.widgetPrefix;
const PX = 1.5; // sub-pixel layout tolerance
const ON = { value: '{{true}}' }; // buttonGroupV2.js:431 toggle value
const NO_LABEL = { value: '' }; // dynamic: no label, the content wrapper spans the whole widget
const GAP = 10; // dynamic: authored gap between a group and the widget under it
const AUTHORED = 80; // buttonGroupV2.js:114 default height
const input = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;
const word = () => fake.firstName.replace(/\W/g, '').slice(0, 6) || 'Go';
const layoutOf = (value) => ({ value }); // properties.layout (buttonGroupV2.js:42-55)
const align = (value) => ({ btnAlignment: { value } }); // styles.btnAlignment (buttonGroupV2.js:318-326)
// group height for n stacked buttons: n × 36 + (n - 1) × 10 (buttonGroupV2.scss:10,17)
const columnHeight = (n) => n * T.buttonHeight + (n - 1) * T.buttonGap;

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('ButtonGroupV2 — canvas facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-ButtonGroupV2-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places a 12-column, 80px Button Group with the three default buttons, Button1 selected', () => {
            verifyWidgetCount(PREFIX, 1);
            cy.get('#real-canvas').then(($c) => {
                const column = $c[0].getBoundingClientRect().width / T.gridColumns;
                buttonGroupBoxes(W, (b) => {
                    expect(b.grid.width, 'registered width').to.be.closeTo(column * T.defaultGridWidth, 1.5);
                    expectFixedButtons(b, T.defaultHeight, 'dropped');
                    expect(b.buttons.map((x) => x.text), 'default buttons').to.deep.eq(T.defaultButtonLabels);
                    expect(b.buttons[0].color, 'Button1 selected').to.eq(T.selectedTextColor);
                    expect(b.buttons[1].color, 'Button2 not selected').to.not.eq(T.selectedTextColor);
                });
            });
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 650, 450);
                verifyWidgetMoved(W, before);
            });
        });

        it('resize changes the widget dimensions and the content wrapper follows', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.resizeWidget(W, before.x + before.w + 160, before.y + before.h + 90);
                verifyWidgetResized(W, before);
                buttonGroupBoxes(W, (b) => {
                    expect(b.wrapper.height, 'wrapper grew with the widget').to.be.gt(before.h);
                    expect(b.wrapper.height, 'wrapper = box - padding').to.be.closeTo(b.box.height - 2 * T.boxPadding, 1.5);
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
            buttonGroupBoxes(`${PREFIX}2`, (b) =>
                expect(b.buttons.map((x) => x.text), 'duplicate keeps the buttons').to.deep.eq(T.defaultButtonLabels)
            );
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
            buttonGroupBoxes(W, (b) =>
                expect(b.buttons.map((x) => x.text), 'pasted buttons').to.deep.eq(T.defaultButtonLabels)
            );
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 650, 400);
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'choices'); // asserts new name internally
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
            cy.apiCreateApp(`${fake.companyName}-ButtonGroupV2-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── ButtonGroupV2-BRW-001: column grows / shrinks, row is gated out ──
        // `count` drives the number of mapped buttons. `coldyn` (column, dynamic height) must hug its buttons and
        // push `below1`; `colfixed` (same data, dynamic off — buttonGroupV2.js:431 default) and `rowdyn` (row with
        // dynamic height ON — ButtonGroupV2.jsx:107 `layout !== 'row'`) are the controls that never grow.
        it('[ButtonGroupV2-BRW-001] Column dynamic height grows with the buttons, pushes the sibling down and shrinks back, while a fixed column and a dynamic row keep the authored height', () => {
            const buttons = mappedButtons('Number(components.count.value) || 1', word());
            addButtonGroupsViaApi([
                { type: 'TextInput', name: 'count', layout: { top: 10, left: 2, width: 8, height: 40 } },
                {
                    name: 'coldyn',
                    layout: { top: 70, left: 2, width: 10, height: AUTHORED },
                    properties: { ...buttons, layout: layoutOf(T.layoutColumn), dynamicHeight: ON },
                },
                {
                    type: 'Text',
                    name: 'below1',
                    layout: { top: 70 + AUTHORED + GAP, left: 2, width: 10, height: 40 },
                    properties: { text: { value: word() } },
                },
                {
                    name: 'colfixed',
                    layout: { top: 70, left: 15, width: 10, height: AUTHORED },
                    properties: { ...buttons, layout: layoutOf(T.layoutColumn) },
                },
                {
                    name: 'rowdyn',
                    layout: { top: 70, left: 28, width: 10, height: AUTHORED },
                    properties: { ...buttons, label: NO_LABEL, dynamicHeight: ON },
                },
                {
                    type: 'Text',
                    name: 'below3',
                    layout: { top: 70 + AUTHORED + GAP, left: 28, width: 10, height: 40 },
                    properties: { text: { value: word() } },
                },
            ]);
            openDividerAppInViewer(S.button('coldyn', 0));

            // one button fits: the authored height is the floor
            buttonGroupBoxes('coldyn', (b) => {
                expect(b.buttons, 'one button').to.have.length(1);
                expectHugsButtons(b, AUTHORED, 'one button');
                expect(b.grid.height, 'authored height kept').to.be.closeTo(AUTHORED, PX);
            });
            expectStackedBelow('coldyn', 'below1', GAP, 'one button');
            widgetTop('below1').as('belowTop0');

            // six buttons: the column grows to the real stack height and pushes the sibling down
            cy.get(input('count')).type('6');
            buttonGroupBoxes('coldyn', (b) => {
                expect(b.buttons, 'six buttons').to.have.length(6);
                expect(b.groupDirection, 'column layout').to.eq('column');
                expect(b.group.height, 'real stack height').to.be.closeTo(columnHeight(6), PX);
                expectHugsButtons(b, AUTHORED, 'six buttons');
                expect(b.grid.height, 'grew past the authored height').to.be.gt(AUTHORED * 3);
            });
            expectStackedBelow('coldyn', 'below1', GAP, 'six buttons');
            // control: dynamic height off → the same stack scrolls inside the authored box
            buttonGroupBoxes('colfixed', (b) => {
                expect(b.buttons, 'control: six buttons').to.have.length(6);
                expectFixedButtons(b, AUTHORED, 'fixed column');
                expect(b.scrollHeight, 'fixed column overflows').to.be.gt(b.clientHeight + 100);
            });
            // control: row ignores dynamic height — fixed, the buttons overflow sideways, the sibling stays
            buttonGroupBoxes('rowdyn', (b) => {
                expect(b.buttons, 'row: six buttons').to.have.length(6);
                expectFixedButtons(b, AUTHORED, 'dynamic row');
                expect(b.rowTops, 'row: one line').to.have.length(1);
                expect(b.overflowX, 'row scrolls sideways').to.eq(T.rowOverflowX);
            });
            expectStackedBelow('rowdyn', 'below3', GAP, 'dynamic row');

            // back to one button: shrinks to the authored height, the sibling returns
            cy.get(input('count')).clear();
            buttonGroupBoxes('coldyn', (b) => {
                expect(b.buttons, 'one button again').to.have.length(1);
                expectHugsButtons(b, AUTHORED, 'shrunk');
                expect(b.grid.height, 'back to the authored height').to.be.closeTo(AUTHORED, PX);
            });
            expectStackedBelow('coldyn', 'below1', GAP, 'shrunk');
            cy.get('@belowTop0').then((top0) =>
                widgetTop('below1').should((top) => expect(top, 'sibling back at its authored top').to.be.closeTo(top0, PX))
            );
        });

        // ── ButtonGroupV2-BRW-001: wrap grows by rows ─────────────────────────
        it('[ButtonGroupV2-BRW-001] Wrap dynamic height grows by whole rows as buttons wrap and shrinks back, while a fixed wrap keeps the authored height and scrolls', () => {
            const buttons = mappedButtons('Number(components.count.value) || 2', word());
            addButtonGroupsViaApi([
                { type: 'TextInput', name: 'count', layout: { top: 10, left: 2, width: 8, height: 40 } },
                {
                    name: 'wrapdyn',
                    layout: { top: 70, left: 2, width: 8, height: AUTHORED },
                    properties: { ...buttons, label: NO_LABEL, layout: layoutOf(T.layoutWrap), dynamicHeight: ON },
                },
                {
                    type: 'Text',
                    name: 'below',
                    layout: { top: 70 + AUTHORED + GAP, left: 2, width: 8, height: 40 },
                    properties: { text: { value: word() } },
                },
                {
                    name: 'wrapfixed',
                    layout: { top: 70, left: 15, width: 8, height: AUTHORED },
                    properties: { ...buttons, label: NO_LABEL, layout: layoutOf(T.layoutWrap) },
                },
            ]);
            openDividerAppInViewer(S.button('wrapdyn', 0));

            buttonGroupBoxes('wrapdyn', (b) => {
                expect(b.buttons, 'two buttons').to.have.length(2);
                expect(b.rowTops, 'two buttons share one row').to.have.length(1);
                expectHugsButtons(b, AUTHORED, 'one row');
                expect(b.grid.height, 'authored height kept').to.be.closeTo(AUTHORED, PX);
            });
            expectStackedBelow('wrapdyn', 'below', GAP, 'one row');

            // ten buttons: they wrap into several rows inside the widget width and the widget grows row by row
            cy.get(input('count')).type('10');
            buttonGroupBoxes('wrapdyn', (b) => {
                expect(b.buttons, 'ten buttons').to.have.length(10);
                expect(b.groupWrap, 'wrap layout').to.eq('wrap');
                expect(b.rowTops.length, 'several rows').to.be.gte(3);
                b.buttons.forEach((x, i) => {
                    expect(x.left, `button ${i} inside (left)`).to.be.gte(b.group.left - PX);
                    expect(x.right, `button ${i} inside (right)`).to.be.lte(b.group.right + PX);
                });
                const rows = b.rowTops.length;
                expect(b.group.height, 'group = whole rows').to.be.closeTo(columnHeight(rows), PX);
                expectHugsButtons(b, AUTHORED, 'wrapped');
            });
            expectStackedBelow('wrapdyn', 'below', GAP, 'wrapped');
            buttonGroupBoxes('wrapfixed', (b) => {
                expect(b.rowTops.length, 'control: several rows').to.be.gte(3);
                expectFixedButtons(b, AUTHORED, 'fixed wrap');
                expect(b.overflowY, 'fixed wrap scrolls vertically').to.eq(T.fixedOverflowY);
                expect(b.scrollHeight, 'fixed wrap overflows').to.be.gt(b.clientHeight + 20);
            });

            cy.get(input('count')).clear();
            buttonGroupBoxes('wrapdyn', (b) => {
                expect(b.buttons, 'two buttons again').to.have.length(2);
                expectHugsButtons(b, AUTHORED, 'shrunk');
                expect(b.grid.height, 'back to the authored height').to.be.closeTo(AUTHORED, PX);
            });
            expectStackedBelow('wrapdyn', 'below', GAP, 'shrunk');
        });

        // ── ButtonGroupV2-BRW-001: hidden ancestor / self-hide ───────────────
        // The Container's visibility hides its subtree (display:none) so the group mounts with offsetParent null;
        // useDynamicHeight defers the reflow until it is shown. Then the group hides itself (its own visibility),
        // the data changes while hidden, and showing it again must re-measure (no stale observer height).
        it('[ButtonGroupV2-BRW-001] Mounted under a hidden container or hidden itself, the group measures its real height once shown and pushes its sibling down', () => {
            const containerId = crypto.randomUUID();
            const authoredIn = 80; // dynamic: authored height inside the container
            addTimelinesViaApi([
                { type: 'TextInput', name: 'show', layout: { top: 10, left: 30, width: 8, height: 40 } },
                { type: 'TextInput', name: 'count', layout: { top: 60, left: 30, width: 8, height: 40 } },
                { type: 'TextInput', name: 'selfhide', layout: { top: 110, left: 30, width: 8, height: 40 } },
                {
                    type: 'Container',
                    id: containerId,
                    name: 'box',
                    layout: { top: 40, left: 2, width: 25, height: 700 },
                    properties: { visibility: { value: "{{components.show.value === 'yes'}}" } },
                },
                {
                    type: T.componentType,
                    name: 'bgin',
                    parent: containerId,
                    layout: { top: 10, left: 1, width: 30, height: authoredIn },
                    properties: {
                        ...T.definition.properties,
                        ...mappedButtons('Number(components.count.value) || 2', word()),
                        layout: layoutOf(T.layoutColumn),
                        dynamicHeight: ON,
                        visibility: { value: "{{components.selfhide.value !== 'yes'}}" },
                    },
                    styles: T.definition.styles,
                    others: T.definition.others,
                },
                {
                    type: 'Text',
                    name: 'belowin',
                    parent: containerId,
                    layout: { top: 10 + authoredIn + GAP, left: 1, width: 30, height: 40 },
                    properties: { text: { value: word() } },
                },
            ]);
            openDividerAppInViewer(input('show'));

            // hidden ancestor: nothing is measured yet; the data changes while hidden
            buttonGroupBoxes('bgin', (b) => {
                expect(b.buttons, 'mounted with two buttons').to.have.length(2);
                expect(b.wrapper.height, 'hidden: no layout box').to.eq(0);
            });
            cy.get(input('count')).type('6');
            buttonGroupBoxes('bgin', (b) => expect(b.buttons, 'six buttons while hidden').to.have.length(6));

            // show the container: the deferred reflow runs with a real measurement
            cy.get(input('show')).type('yes');
            buttonGroupBoxes('bgin', (b) => {
                expect(b.group.height, 'real stack height').to.be.closeTo(columnHeight(6), PX);
                expectHugsButtons(b, authoredIn, 'container shown');
                expect(b.grid.height, 'grew past the authored height').to.be.gt(authoredIn * 3);
            });
            expectStackedBelow('bgin', 'belowin', GAP, 'container shown');

            // the group hides itself, shrinks to three buttons while hidden, then shows again: measured again
            cy.get(input('selfhide')).type('yes');
            buttonGroupBoxes('bgin', (b) => {
                expect(b.rootClass, 'self-hidden').to.contain(T.hiddenClass);
                expect(b.root.height, 'nothing painted').to.eq(0);
            });
            cy.get(input('count')).clear().type('3');
            cy.get(input('selfhide')).clear();
            buttonGroupBoxes('bgin', (b) => {
                expect(b.rootClass, 'shown again').to.not.contain(T.hiddenClass);
                expect(b.buttons, 'three buttons').to.have.length(3);
                expect(b.group.height, 'real stack height').to.be.closeTo(columnHeight(3), PX);
                expectHugsButtons(b, authoredIn, 'self shown');
            });
            expectStackedBelow('bgin', 'belowin', GAP, 'self shown');
        });

        // ── ButtonGroupV2-BRW-003: row overflow ──────────────────────────────
        // ButtonGroupV2.jsx:308-331: in row layout the wrapper's justify-content falls back to `start` when the
        // group is wider than the wrapper, otherwise it follows btnAlignment (left→start, center, right→end).
        // `rowcenter` / `rowright` overflow; `fitcenter` / `fitright` (three short buttons) are the controls.
        it('[ButtonGroupV2-BRW-003] An overflowing row scrolls horizontally from its first button whatever the alignment, while a row that fits honours center and right alignment', () => {
            const many = mappedButtons(6, word()); // dynamic: six buttons overflow 8 columns
            addButtonGroupsViaApi([
                { name: 'rowcenter', layout: { top: 40, left: 2, width: 8, height: 60 }, properties: { ...many, label: NO_LABEL }, styles: align(T.alignCenter) },
                { name: 'rowright', layout: { top: 120, left: 2, width: 8, height: 60 }, properties: { ...many, label: NO_LABEL }, styles: align(T.alignRight) },
                { name: 'fitcenter', layout: { top: 200, left: 2, width: 25, height: 60 }, properties: { label: NO_LABEL }, styles: align(T.alignCenter) },
                { name: 'fitright', layout: { top: 280, left: 2, width: 25, height: 60 }, properties: { label: NO_LABEL }, styles: align(T.alignRight) },
            ]);
            openDividerAppInViewer(S.button('fitright', 2));

            ['rowcenter', 'rowright'].forEach((name) => {
                buttonGroupBoxes(name, (b) => {
                    expect(b.buttons, `${name}: six buttons`).to.have.length(6);
                    expect(b.rowTops, `${name}: one line`).to.have.length(1);
                    expect(b.overflowX, `${name}: horizontal scroll`).to.eq(T.rowOverflowX);
                    expect(b.overflowY, `${name}: no vertical scroll`).to.eq(T.rowOverflowY);
                    expect(b.scrollWidth, `${name}: content wider than the wrapper`).to.be.gt(b.clientWidth + 50);
                    expect(b.justify, `${name}: falls back to start`).to.eq(T.justifyStart);
                    expect(b.scrollLeft, `${name}: starts scrolled left`).to.eq(0);
                    expect(b.buttons[0].left, `${name}: first button reachable at the left edge`).to.be.closeTo(b.wrapper.left, PX);
                    expect(b.buttons[5].right, `${name}: last button beyond the right edge`).to.be.gt(b.wrapper.right + 20);
                    expectFixedButtons(b, 60, name);
                });
                // a real wheel scrolls the row to its end; the last button comes into view, the height is unchanged
                cy.get(S.contentWrapper(name)).realMouseWheel({ deltaX: 2000, scrollBehavior: false });
                buttonGroupBoxes(name, (b) => {
                    expect(b.scrollLeft, `${name}: scrolled to the end`).to.be.closeTo(b.scrollWidth - b.clientWidth, PX);
                    expect(b.buttons[5].right, `${name}: last button inside`).to.be.closeTo(b.wrapper.right, PX);
                    expect(b.buttons[0].right, `${name}: first button scrolled out`).to.be.lt(b.wrapper.left + PX);
                    expectFixedButtons(b, 60, `${name} after scroll`);
                });
            });

            // controls: no overflow → the alignment applies
            buttonGroupBoxes('fitcenter', (b) => {
                expect(b.scrollWidth, 'fits').to.be.lte(b.clientWidth);
                expect(b.justify, 'center').to.eq(T.justifyCenter);
                const leftGap = b.buttons[0].left - b.wrapper.left;
                const rightGap = b.wrapper.right - b.buttons[2].right;
                expect(leftGap, 'centred: real gap on the left').to.be.gt(50);
                expect(leftGap, 'centred: equal gaps').to.be.closeTo(rightGap, 2);
            });
            buttonGroupBoxes('fitright', (b) => {
                expect(b.justify, 'end').to.eq(T.justifyEnd);
                expect(b.buttons[2].right, 'last button at the right edge').to.be.closeTo(b.wrapper.right, PX);
                expect(b.buttons[0].left - b.wrapper.left, 'gap on the left').to.be.gt(100);
            });
        });

        // ── ButtonGroupV2-BRW-003: fixed column scroll + column / wrap alignment ──
        it('[ButtonGroupV2-BRW-003] A fixed column scrolls vertically; column and wrap honour left, center and right alignment and wrap creates rows inside the widget', () => {
            const tall = mappedButtons(5, word()); // dynamic: five stacked buttons overflow 100px
            const seven = mappedButtons(7, word()); // dynamic: seven buttons wrap into rows in 10 columns
            const column = layoutOf(T.layoutColumn);
            const wrap = layoutOf(T.layoutWrap);
            addButtonGroupsViaApi([
                { name: 'colscroll', layout: { top: 40, left: 2, width: 8, height: 100 }, properties: { ...tall, label: NO_LABEL, layout: column } },
                { name: 'colcenter', layout: { top: 160, left: 2, width: 12, height: 150 }, properties: { label: NO_LABEL, layout: column }, styles: align(T.alignCenter) },
                { name: 'colright', layout: { top: 330, left: 2, width: 12, height: 150 }, properties: { label: NO_LABEL, layout: column }, styles: align(T.alignRight) },
                { name: 'wrapleft', layout: { top: 40, left: 20, width: 10, height: 200 }, properties: { ...seven, label: NO_LABEL, layout: wrap }, styles: align(T.alignLeft) },
                { name: 'wrapcenter', layout: { top: 260, left: 20, width: 10, height: 200 }, properties: { ...seven, label: NO_LABEL, layout: wrap }, styles: align(T.alignCenter) },
                { name: 'wrapright', layout: { top: 480, left: 20, width: 10, height: 200 }, properties: { ...seven, label: NO_LABEL, layout: wrap }, styles: align(T.alignRight) },
            ]);
            openDividerAppInViewer(S.button('wrapright', 6));

            // fixed column: vertical scroll only, a real wheel reaches the last button
            buttonGroupBoxes('colscroll', (b) => {
                expect(b.groupDirection, 'column').to.eq('column');
                expect(b.overflowY, 'vertical scroll').to.eq(T.fixedOverflowY);
                expect(b.overflowX, 'no horizontal scroll').to.eq(T.fixedOverflowX);
                expect(b.scrollHeight, 'stack taller than the wrapper').to.be.gt(b.clientHeight + 50);
                expect(b.buttons[4].top, 'last button below the visible area').to.be.gt(b.wrapper.bottom);
                expectFixedButtons(b, 100, 'column');
            });
            cy.get(S.contentWrapper('colscroll')).realMouseWheel({ deltaY: 2000, scrollBehavior: false });
            buttonGroupBoxes('colscroll', (b) => {
                expect(b.scrollTop, 'scrolled to the end').to.be.closeTo(b.scrollHeight - b.clientHeight, PX);
                expect(b.buttons[4].bottom, 'last button inside').to.be.lte(b.wrapper.bottom + PX);
                expectFixedButtons(b, 100, 'column after scroll');
            });

            // column alignment moves the whole stack horizontally
            buttonGroupBoxes('colcenter', (b) => {
                const leftGap = b.group.left - b.wrapper.left;
                expect(leftGap, 'column centred: real gap').to.be.gt(50);
                expect(leftGap, 'column centred: equal gaps').to.be.closeTo(b.wrapper.right - b.group.right, 2);
            });
            buttonGroupBoxes('colright', (b) => {
                expect(b.group.right, 'column right-aligned').to.be.closeTo(b.wrapper.right, PX);
                expect(b.group.left - b.wrapper.left, 'gap on the left').to.be.gt(100);
            });

            // wrap: several rows, every button inside the widget width, rows aligned as configured
            const rowsOf = (b) => b.rowTops.map((top) => b.buttons.filter((x) => Math.round(x.top) === top));
            const expectWrapped = (b, name) => {
                expect(b.groupWrap, `${name}: wraps`).to.eq('wrap');
                expect(b.rowTops.length, `${name}: several rows`).to.be.gte(2);
                expect(b.group.width, `${name}: group spans the wrapper`).to.be.closeTo(b.wrapper.width, PX);
                b.buttons.forEach((x, i) => {
                    expect(x.left, `${name}: button ${i} inside (left)`).to.be.gte(b.group.left - PX);
                    expect(x.right, `${name}: button ${i} inside (right)`).to.be.lte(b.group.right + PX);
                });
                // reading order is preserved row by row
                const flat = rowsOf(b).flat().map((x) => x.text);
                expect(flat, `${name}: button order kept across rows`).to.deep.eq(b.buttons.map((x) => x.text));
            };
            buttonGroupBoxes('wrapleft', (b) => {
                expectWrapped(b, 'wrapleft');
                rowsOf(b).forEach((row, r) => expect(row[0].left, `left row ${r}`).to.be.closeTo(b.group.left, PX));
            });
            buttonGroupBoxes('wrapcenter', (b) => {
                expectWrapped(b, 'wrapcenter');
                rowsOf(b).forEach((row, r) => {
                    const leftGap = row[0].left - b.group.left;
                    const rightGap = b.group.right - row[row.length - 1].right;
                    expect(leftGap, `centre row ${r}: equal gaps`).to.be.closeTo(rightGap, 2);
                });
                // the last (short) row really moved off the left edge
                const last = rowsOf(b).pop();
                expect(last[0].left - b.group.left, 'short last row centred').to.be.gt(10);
            });
            buttonGroupBoxes('wrapright', (b) => {
                expectWrapped(b, 'wrapright');
                rowsOf(b).forEach((row, r) =>
                    expect(row[row.length - 1].right, `right row ${r}`).to.be.closeTo(b.group.right, PX)
                );
            });
        });

        // ── ButtonGroupV2-BRW-003: label direction ───────────────────────────
        // ButtonGroupV2.jsx:336-345: side + left → label before the buttons; side + right → tw-flex-row-reverse
        // (label after); top → flex-column (label above).
        it('[ButtonGroupV2-BRW-003] The label sits left, right or above the buttons as its alignment and direction say', () => {
            const label = { value: word() };
            addButtonGroupsViaApi([
                { name: 'lblleft', layout: { top: 40, left: 2, width: 20, height: 60 }, properties: { label } },
                {
                    name: 'lblright',
                    layout: { top: 120, left: 2, width: 20, height: 60 },
                    properties: { label },
                    styles: { direction: { value: T.directionRight } },
                },
                {
                    name: 'lbltop',
                    layout: { top: 200, left: 2, width: 20, height: 100 },
                    properties: { label },
                    styles: { alignment: { value: T.labelTop } },
                },
            ]);
            openDividerAppInViewer(S.button('lbltop', 0));

            buttonGroupBoxes('lblleft', (b) => {
                expect(b.label.left, 'label at the left edge').to.be.closeTo(b.root.left, PX);
                expect(b.label.right, 'label before the buttons').to.be.lte(b.wrapper.left + PX);
                expect(b.buttons[0].left, 'buttons right of the label').to.be.gte(b.label.right - PX);
            });
            buttonGroupBoxes('lblright', (b) => {
                expect(b.rootClass, 'row-reverse').to.contain(T.rowReverseClass);
                expect(b.label.right, 'label at the right edge').to.be.closeTo(b.root.right, PX);
                expect(b.label.left, 'label after the buttons').to.be.gte(b.wrapper.right - PX);
                expect(b.buttons[0].left, 'buttons start at the left edge').to.be.closeTo(b.root.left, PX);
            });
            buttonGroupBoxes('lbltop', (b) => {
                expect(b.rootClass, 'stacked').to.contain(T.columnClass);
                expect(b.label.bottom, 'label above the buttons').to.be.lte(b.wrapper.top + PX);
                expect(b.label.left, 'label at the left edge').to.be.closeTo(b.root.left, PX);
                expect(b.buttons[0].top, 'buttons under the label').to.be.gte(b.label.bottom - PX);
            });
        });

        // ── ButtonGroupV2-BRW-003: native focus order ────────────────────────
        it('[ButtonGroupV2-BRW-003] Tab moves through the buttons in button order in row, column and wrap layouts, scrolling an overflowing row to the focused button', () => {
            addButtonGroupsViaApi([
                { type: 'TextInput', name: 'start', layout: { top: 10, left: 2, width: 8, height: 40 } },
                { name: 'rowfocus', layout: { top: 70, left: 2, width: 8, height: 60 }, properties: { ...mappedButtons(6, word()), label: NO_LABEL } },
                { name: 'colfocus', layout: { top: 150, left: 2, width: 8, height: 150 }, properties: { label: NO_LABEL, layout: layoutOf(T.layoutColumn) } },
                { name: 'wrapfocus', layout: { top: 320, left: 2, width: 8, height: 150 }, properties: { ...mappedButtons(4, word()), label: NO_LABEL, layout: layoutOf(T.layoutWrap) } },
            ]);
            openDividerAppInViewer(S.button('wrapfocus', 3));
            const ids = (name, n) => Array.from({ length: n }, (_, i) => `${name}-button-${i}`);

            // the row first: Tab reaches it from the input and walks its six buttons left to right
            tabSequence(input('start'), 6).should('deep.equal', ids('rowfocus', 6));
            // focusing the off-screen last button scrolls the row so it is inside the visible area
            buttonGroupBoxes('rowfocus', (b) => {
                expect(b.scrollLeft, 'row scrolled to the focused button').to.be.gt(0);
                expect(b.buttons[5].right, 'focused button visible').to.be.lte(b.wrapper.right + PX);
                expect(b.buttons[5].left, 'focused button visible (left)').to.be.gte(b.wrapper.left - PX);
            });
            // then the column top to bottom and the wrap row by row
            tabSequence(S.button('rowfocus', 5), 7).should('deep.equal', [...ids('colfocus', 3), ...ids('wrapfocus', 4)]);
        });
    });
});
