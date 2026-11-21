import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
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
import { checkboxSelector } from "Selectors/appBuilder/components/checkbox";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import { expectLayout } from "Support/utils/appBuilder/components/textArea";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const PX = 2; // layout tolerance (px)

// Canvas facet — component lifecycle on the canvas: drag/drop, move, resize,
// duplicate (keyboard + menu), copy-paste, cut, nudge, multi-select, rename,
// delete, undo/redo. testIsolation:false for cypress-real-dnd (its CDP client
// is cached per spec run); each test re-creates its own app in beforeEach.
describe('Checkbox — canvas facet', { testIsolation: false }, () => {
    const W = 'checkbox1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Checkbox-Canvas`);
        cy.openApp();
        cy.dragAndDropWidget('Checkbox', 400, 200);
        closeQueryPanel();
    });

    it('drag-and-drop places the widget', () => {
        cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        verifyWidgetCount('checkbox', 1);
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
        verifyWidgetCount('checkbox', 2);
    });

    it('duplicate via ⋮ menu', () => {
        duplicateWidgetFromMenu(W);
        verifyWidgetCount('checkbox', 2);
    });

    it('copy-paste (Cmd/Ctrl+C then +V)', () => {
        copyPasteWidget(W);
        verifyWidgetCount('checkbox', 2);
    });

    it('cut removes the widget, paste restores it', () => {
        cutWidget(W); // asserts removal internally
        cy.forceClickOnCanvas();
        pasteWidget();
        cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
    });

    it('multi-select then select-all', () => {
        // add a second widget (toggle panel closed so dragAndDrop re-opens it)
        cy.get('[data-cy="right-sidebar-components-button"]').click();
        cy.dragAndDropWidget('Checkbox', 650, 200);
        closeQueryPanel();

        multiSelectWidgets(['checkbox1', 'checkbox2']);
        verifySelectedWidgetCount(2);

        selectAllWidgets();
        verifySelectedWidgetCount(2);
        cy.get('.moveable-area').should('exist');
    });

    it('rename via ⋮ menu', () => {
        renameWidgetFromMenu(W, 'agreecheck'); // asserts new name internally
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

    afterEach(() => {
        cy.apiDeleteApp();
    });
});

// ── Checkbox-BRW-001: collapse when hidden in the running app ────────────────
// RenderWidget schedules a reflow when visibility flips in view mode and properties.collapseWhenHidden
// (checkbox.js:45, default {{false}} — checkbox.js:218) is on; the grid then drops the hidden widget's
// height. Lane A (collapse on) must reclaim the space; lane B (collapse off, the default) is the control.
// Collapse only runs in view mode, so the app is seeded through the components API and opened in the viewer.
describe('Checkbox — collapse when hidden (viewer)', () => {
    const CB_HEIGHT = 40; // dynamic: authored checkbox height (px)
    const GAP = 20; // dynamic: authored gap below each checkbox (px)

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Checkbox-canvas`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('[Checkbox-BRW-001] Collapse when hidden reclaims the space in the running app; collapse off keeps it; showing restores it', () => {
        const hideWord = fake.firstName.toLowerCase().replace(/[^a-z]/g, '') || 'hide'; // dynamic: typed to hide both
        const visibility = { value: `{{components.textinput1.value !== "${hideWord}"}}` }; // source: checkbox.js:38
        addIconsViaApi([
            { type: 'TextInput', name: 'textinput1', layout: { top: 10, left: 30, width: 10, height: 40 } },
            {
                type: 'Checkbox',
                name: 'checkbox1',
                layout: { top: 100, left: 2, width: 10, height: CB_HEIGHT },
                properties: { visibility, collapseWhenHidden: { value: '{{true}}' } }, // source: checkbox.js:45
            },
            { type: 'Text', name: 'text1', layout: { top: 100 + CB_HEIGHT + GAP, left: 2, width: 10, height: 40 }, properties: { text: { value: 'A' } } },
            {
                type: 'Checkbox',
                name: 'checkbox2',
                layout: { top: 100, left: 15, width: 10, height: CB_HEIGHT },
                properties: { visibility }, // collapseWhenHidden stays at its {{false}} default (checkbox.js:218)
            },
            { type: 'Text', name: 'text2', layout: { top: 100 + CB_HEIGHT + GAP, left: 15, width: 10, height: 40 }, properties: { text: { value: 'B' } } },
        ]);
        openIconAppInViewer(checkboxSelector.row('checkbox1'));
        cy.get(checkboxSelector.row('checkbox2')).should('be.visible');

        // measure relative to the TextInput, which never moves (typing in it may scroll the page)
        let before;
        expectLayout((box) => {
            const anchor = box('textinput1').top;
            before = { text1: box('text1').top - anchor, text2: box('text2').top - anchor, cb1: box('checkbox1').top - anchor };
            expect(box('text1').top - box('checkbox1').bottom, 'text1 authored gap').to.be.closeTo(GAP, PX);
            expect(box('text2').top - box('checkbox2').bottom, 'text2 authored gap').to.be.closeTo(GAP, PX);
        });

        cy.get('[data-cy="textinput1-input"]').type(hideWord);
        cy.get(checkboxSelector.row('checkbox1')).should('not.be.visible');
        cy.get(checkboxSelector.row('checkbox2')).should('not.be.visible');
        expectLayout((box) => {
            const anchor = box('textinput1').top;
            // lane A: text1 moved up into the reclaimed space (by at least the checkbox's height)
            expect(before.text1 - (box('text1').top - anchor), 'text1 moved up').to.be.gte(CB_HEIGHT - PX);
            expect(box('text1').top - anchor, "text1 not above the checkbox's old top").to.be.gte(before.cb1 - PX);
            // lane B: collapse off → text2 keeps its place
            expect(box('text2').top - anchor, 'text2 unchanged').to.be.closeTo(before.text2, PX);
        });

        cy.get('[data-cy="textinput1-input"]').clear();
        cy.get(checkboxSelector.row('checkbox1')).should('be.visible');
        expectLayout((box) => {
            const anchor = box('textinput1').top;
            expect(box('text1').top - anchor, 'text1 restored').to.be.closeTo(before.text1, PX);
            expect(box('text2').top - anchor, 'text2 unchanged').to.be.closeTo(before.text2, PX);
            expect(box('text1').top - box('checkbox1').bottom, 'gap restored').to.be.closeTo(GAP, PX);
        });
    });
});
