/**
 * SPEC — Radio Button (V2) — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo), plus TESTING.md browser scenario:
 *   RadioButtonV2-BRW-001 — with layout 'row' and more options than fit, the options scroller scrolls sideways
 *                           (RadioButtonV2.jsx:234 `overflow: auto hidden`) instead of clipping content, and
 *                           collapseWhenHidden removes the widget's reserved space in the running app's layout.
 * Collapse only runs in view mode (RenderWidget.jsx:302-311 scheduleReflow), so those apps are seeded through the
 * components API (addRadioButtonsViaApi) and opened in the viewer.
 * KNOWN PRODUCT BUG (kept red): multi-word option captions in a crowded row shrink and wrap onto several lines, so
 * the row's `overflow-y: hidden` cuts them (and their radio circles) off at the top and bottom instead of the row
 * scrolling sideways.
 * KNOWN PRODUCT BUG (kept red): delete → undo → redo does not remove the widget again. When undo restores it, the
 * Inspector's options editor remounts and its mount effect (Inspector/Components/Select.jsx:299-303) re-writes
 * `options` (booleans → '{{false}}'), a new history entry that clears the redo stack. TextInput redoes fine.
 * Helpers: addRadioButtonsViaApi, openRadioAppInViewer, radioBoxes, readRadioBoxes, expectRectWithin, getWidgetRect,
 * verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard, duplicateWidgetFromMenu,
 * copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets, multiSelectWidgets,
 * verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { radioButtonV2Selector } from "Selectors/appBuilder/components/radioButtonV2";
import { radioButtonV2Text } from "Texts/appBuilder/components/radioButtonV2";
import {
    addRadioButtonsViaApi,
    openRadioAppInViewer,
    radioBoxes,
    readRadioBoxes,
    expectRectWithin,
} from "Support/utils/appBuilder/components/radioButtonV2";
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

const T = radioButtonV2Text;
const W = T.defaultWidgetName;
const PREFIX = T.widgetPrefix;
const PX = 1.5; // sub-pixel layout tolerance
const GAP = 10; // dynamic: authored gap between a radio button and the widget under it
const ON = { value: '{{true}}' }; // radioButtonV2.js:347-349 toggle value
const input = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;
// dynamic: single-word captions (no spaces, so a caption can never wrap)
const word = (i) => `${(fake.firstName.replace(/\W/g, '') || 'Item').slice(0, 8)}${i}`;
const singleWordOptions = (n) => Array.from({ length: n }, (_, i) => T.option(word(i + 1), String(i + 1), i === 0));
// dynamic: three-word captions (realistic labels with spaces)
const multiWordOptions = (n) =>
    Array.from({ length: n }, (_, i) => T.option(`${word(i + 1)} ${fake.firstName.slice(0, 6)} option`, String(i + 1), i === 0));

// every option sits in the scroller's visible height, its caption on one line and its circle whole
const expectOptionsUncut = (b, context) => {
    b.options.forEach((o, i) => {
        expect(o.rect.top, `${context}: option ${i} top inside the row`).to.be.gte(b.scroller.top - 0.5);
        expect(o.rect.bottom, `${context}: option ${i} bottom inside the row`).to.be.lte(b.scroller.bottom + 0.5);
        expect(o.mark.top, `${context}: option ${i} circle top visible`).to.be.gte(b.scroller.top - 0.5);
        expect(o.mark.bottom, `${context}: option ${i} circle bottom visible`).to.be.lte(b.scroller.bottom + 0.5);
        expect(o.caption.height, `${context}: option ${i} caption on one line`).to.be.lte(o.mark.height + 8);
    });
};

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Radio Button (V2) — canvas facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-RadioButtonV2-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places a 12-column, 43px Radio Button with the three default options and option2 checked', () => {
            verifyWidgetCount(PREFIX, 1);
            cy.get('#real-canvas').then(($c) => {
                const column = $c[0].getBoundingClientRect().width / T.gridColumns;
                radioBoxes(W, (b) => {
                    expect(b.wrapper.width, 'registered width').to.be.closeTo(column * T.defaultGridWidth, PX);
                    expect(b.wrapper.height, 'registered height').to.be.closeTo(T.defaultHeight, PX);
                    expect(b.options.map((o) => o.text), 'default options').to.have.length(T.defaultOptionCount);
                    expect(b.options.map((o) => o.checked), 'option2 is the default').to.deep.eq([false, true, false]);
                    expect(b.overflowX, 'row layout scrolls sideways').to.eq(T.rowOverflowX);
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

        it('resize changes the widget dimensions and the options scroller follows', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.resizeWidget(W, before.x + before.w + 160, before.y + before.h + 60);
                verifyWidgetResized(W, before);
                radioBoxes(W, (b) => {
                    expect(b.box.width, 'wider').to.be.gt(before.w + 100);
                    expect(b.scroller.height, 'scroller fills the taller box').to.be.closeTo(b.box.height - 2 * T.boxPadding, PX);
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
            radioBoxes(`${PREFIX}2`, (b) => expect(b.options, 'duplicate keeps the options').to.have.length(T.defaultOptionCount));
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
            radioBoxes(W, (b) => expect(b.options, 'pasted options').to.have.length(T.defaultOptionCount));
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
            cy.apiCreateApp(`${fake.companyName}-RadioButtonV2-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── RadioButtonV2-BRW-001: row overflow scrolls ──────────────────────
        // `rbrow` holds eight single-word options in a 10-column widget (far wider than the box); `rbwide` (same
        // options, 40 columns) is the control that fits; `below` sits GAP px under `rbrow` and must not move.
        it('[RadioButtonV2-BRW-001] Row layout: options past the widget width scroll sideways inside the widget at its authored size, every option reachable and uncut', () => {
            const options = { value: singleWordOptions(8) }; // dynamic: eight options overflow 10 columns
            addRadioButtonsViaApi([
                { name: 'rbrow', layout: { top: 40, left: 2, width: 10, height: T.defaultHeight }, properties: { options } },
                {
                    type: 'Text',
                    name: 'below',
                    layout: { top: 40 + T.defaultHeight + GAP, left: 2, width: 10, height: 40 },
                    properties: { text: { value: word(0) } },
                },
                { name: 'rbwide', layout: { top: 200, left: 2, width: 40, height: T.defaultHeight }, properties: { options } },
            ]);
            openRadioAppInViewer(radioButtonV2Selector.options('rbrow'));

            radioBoxes('rbrow', (b) => {
                expect(b.options, 'all options rendered').to.have.length(8);
                expect(b.overflowX, 'scrolls sideways').to.eq(T.rowOverflowX);
                expect(b.overflowY, 'never scrolls down').to.eq(T.rowOverflowY);
                expect(b.scrollWidth, 'content wider than the row').to.be.gt(b.clientWidth + 100);
                expect(b.scrollLeft, 'starts at the first option').to.eq(0);
                expect(b.wrapper.height, 'widget keeps its authored height').to.be.closeTo(T.defaultHeight, PX);
                expect(b.options[7].rect.left, 'last option starts past the visible row').to.be.gt(b.scroller.right);
                expectRectWithin(b.options[0].rect, b.scroller, 'first option');
                expectOptionsUncut(b, 'overflowing row');
            });
            // control: the same options in a wide widget fit without scrolling
            radioBoxes('rbwide', (b) => {
                expect(b.scrollWidth, 'control: fits').to.be.lte(b.clientWidth + 1);
                expectOptionsUncut(b, 'control');
            });

            // a real horizontal wheel scrolls the row to its end: the last option comes fully into view
            cy.get(radioButtonV2Selector.options('rbrow')).realMouseWheel({ deltaX: 3000, scrollBehavior: false });
            radioBoxes('rbrow', (b) => {
                expect(b.scrollLeft, 'scrolled to the end').to.be.closeTo(b.scrollWidth - b.clientWidth, PX);
                expectRectWithin(b.options[7].rect, b.scroller, 'last option after scrolling');
                expect(b.options[0].rect.right, 'first option scrolled out').to.be.lt(b.scroller.left);
                expect(b.wrapper.height, 'still the authored height').to.be.closeTo(T.defaultHeight, PX);
                expectOptionsUncut(b, 'scrolled row');
            });
            // the scrolled-in option is really usable: a click on it selects it
            cy.get(radioButtonV2Selector.optionLabel('rbrow', 7)).realClick({ scrollBehavior: false });
            radioBoxes('rbrow', (b) =>
                expect(b.options.map((o) => o.checked), 'last option selected').to.deep.eq([false, false, false, false, false, false, false, true])
            );
            cy.get(commonWidgetSelector.draggableWidget('below')).then(($below) => {
                readRadioBoxes('rbrow').then((b) =>
                    expect($below[0].getBoundingClientRect().top - b.box.bottom, 'sibling keeps its gap').to.be.closeTo(GAP, 2)
                );
            });
        });

        // ── RadioButtonV2-BRW-001: realistic multi-word captions (KNOWN PRODUCT BUG — red) ──
        it('[RadioButtonV2-BRW-001] Row layout: multi-word captions stay whole on one line and the row scrolls sideways instead of wrapping and cutting them off', () => {
            addRadioButtonsViaApi([
                {
                    name: 'rbmulti',
                    layout: { top: 40, left: 2, width: 10, height: T.defaultHeight },
                    properties: { options: { value: multiWordOptions(8) } }, // dynamic: eight three-word captions
                },
            ]);
            openRadioAppInViewer(radioButtonV2Selector.options('rbmulti'));
            radioBoxes('rbmulti', (b) => {
                expect(b.options, 'all options rendered').to.have.length(8);
                expect(b.overflowX, 'scrolls sideways').to.eq(T.rowOverflowX);
                expect(b.scrollWidth, 'content wider than the row').to.be.gt(b.clientWidth);
                expect(b.wrapper.height, 'widget keeps its authored height').to.be.closeTo(T.defaultHeight, PX);
                expectOptionsUncut(b, 'multi-word row');
            });
        });

        // ── RadioButtonV2-BRW-001: collapse when hidden ───────────────────────
        // RenderWidget schedules a reflow when visibility flips in view mode and properties.collapseWhenHidden
        // (radioButtonV2.js:91-96) is on. Lane A collapses, lane B (collapse off — the radioButtonV2.js:349 default) is
        // the control; both radio buttons hide on the same TextInput value.
        it('[RadioButtonV2-BRW-001] Collapse when hidden reclaims the widget space in the running app; showing restores it; without it the space stays reserved', () => {
            const hideWord = fake.firstName.toLowerCase().replace(/\W/g, '') || 'hide'; // dynamic: typed to hide both
            const visibility = { value: `{{components.toggler.value !== "${hideWord}"}}` };
            const height = 80; // dynamic: authored radio height
            addRadioButtonsViaApi([
                { type: 'TextInput', name: 'toggler', layout: { top: 10, left: 30, width: 10, height: 40 } },
                {
                    name: 'rbcollapse',
                    layout: { top: 100, left: 2, width: 12, height },
                    properties: { visibility, collapseWhenHidden: ON },
                },
                { type: 'Text', name: 'texta', layout: { top: 100 + height + GAP, left: 2, width: 12, height: 40 }, properties: { text: { value: 'A' } } },
                { name: 'rbkeep', layout: { top: 100, left: 15, width: 12, height }, properties: { visibility } },
                { type: 'Text', name: 'textb', layout: { top: 100 + height + GAP, left: 15, width: 12, height: 40 }, properties: { text: { value: 'B' } } },
            ]);
            openRadioAppInViewer(radioButtonV2Selector.options('rbcollapse'));

            const top = (name) => Cypress.$(commonWidgetSelector.draggableWidget(name))[0].getBoundingClientRect().top;
            const bottom = (name) => Cypress.$(commonWidgetSelector.draggableWidget(name))[0].getBoundingClientRect().bottom;
            let before;
            cy.document().should(() => {
                before = { texta: top('texta'), textb: top('textb'), rbTop: top('rbcollapse') };
                expect(before.texta - bottom('rbcollapse'), 'texta gap').to.be.closeTo(GAP, 2);
                expect(before.textb - bottom('rbkeep'), 'textb gap').to.be.closeTo(GAP, 2);
            });

            cy.get(input('toggler')).type(hideWord);
            radioBoxes('rbcollapse', (b) => expect(b.rootVisibility, 'lane A hidden').to.eq('hidden'));
            radioBoxes('rbkeep', (b) => expect(b.rootVisibility, 'lane B hidden').to.eq('hidden'));
            cy.document().should(() => {
                // lane A: texta moved up into the reclaimed space (by the widget's height)…
                expect(before.texta - top('texta'), 'texta moved up').to.be.gte(height - 2);
                // …without climbing above the hidden widget's old top
                expect(top('texta'), 'texta not above the old top').to.be.gte(before.rbTop - 2);
                // lane B: no collapse → textb keeps its place
                expect(top('textb'), 'textb unchanged').to.be.closeTo(before.textb, 2);
            });

            cy.get(input('toggler')).clear();
            radioBoxes('rbcollapse', (b) => {
                expect(b.rootVisibility, 'lane A shown').to.eq('visible');
                expect(b.wrapper.height, 'authored height back').to.be.closeTo(height, PX);
                expectOptionsUncut(b, 'shown again');
            });
            cy.document().should(() => {
                expect(top('texta'), 'texta restored').to.be.closeTo(before.texta, 2);
                expect(top('textb'), 'textb unchanged').to.be.closeTo(before.textb, 2);
                expect(top('rbcollapse'), 'radio back at its top').to.be.closeTo(before.rbTop, 2);
            });
        });
    });
});
