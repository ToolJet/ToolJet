/**
 * SPEC — Number Input — canvas facet.
 * FOR AI: 11 cases — drag-and-drop places the widget; move repositions the widget; resize changes the widget dimensions (+8 more).
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard, duplicateWidgetFromMenu, copyPasteWidget.
 * + [NumberInput-BRW-001] a real mouse wheel over the focused field in the running app (API-seeded, viewer):
 *   disableStepControls on → value unchanged and the page scrolls; step controls on (control) → the
 *   browser's native wheel-to-step changes the value.
 */
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
import { numberInputSelector } from "Selectors/appBuilder/components/numberInput";
import { addIconsViaApi, openIconAppInViewer } from "Support/utils/appBuilder/components/icon";
import { expectScrollOffsets, resetScroll } from "Support/utils/appBuilder/components/numberInput";

// Canvas facet — component lifecycle on the canvas: drag/drop, move, resize,
// duplicate (keyboard + menu), copy-paste, cut, nudge, multi-select, rename,
// delete, undo/redo. testIsolation:false for cypress-real-dnd (its CDP client
// is cached per spec run); each test re-creates its own app in beforeEach.
describe('Number Input — canvas facet', { testIsolation: false }, () => {
    const W = 'numberinput1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-NumberInput-Canvas`);
        cy.openApp();
        cy.dragAndDropWidget('Number Input', 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it('drag-and-drop places the widget', () => {
        cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        verifyWidgetCount('numberinput', 1);
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
        verifyWidgetCount('numberinput', 2);
    });

    it('duplicate via ⋮ menu', () => {
        duplicateWidgetFromMenu(W);
        verifyWidgetCount('numberinput', 2);
    });

    it('copy-paste (Cmd/Ctrl+C then +V)', () => {
        copyPasteWidget(W);
        verifyWidgetCount('numberinput', 2);
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
        cy.dragAndDropWidget('Number Input', 650, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();

        multiSelectWidgets(['numberinput1', 'numberinput2']);
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

// ── NumberInput-BRW-001: real wheel over the focused field in the running app ──
// The redirect (NumberInput.jsx handleWheel) is attached only while disableStepControls is on and only
// matters in a real browser: jsdom has no native wheel-to-step and no real scroll geometry.
// Chrome-only: Chrome steps a focused, hovered <input type="number"> on wheel (the behaviour the guarantee
// overrides — the control below proves it fires); Cypress's bundled Electron does not, so there the wheel
// would scroll the page with or without the redirect and the test could not fail. CI runs Chrome.
describe('Number Input — wheel over the field (viewer)', { browser: 'chrome' }, () => {
    const LOCKED = 'nilocked';
    const STEP = 'nistep';
    const START = '5';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-NumberInput-canvas`);
        addIconsViaApi([
            {
                type: 'NumberInput',
                name: LOCKED,
                layout: { top: 40, left: 2, width: 12, height: 40 },
                // source: numberinput.js:104 disableStepControls (toggle, default false — numberinput.js:366)
                properties: { value: { value: START }, disableStepControls: { value: '{{true}}' } },
            },
            {
                type: 'NumberInput',
                name: STEP,
                layout: { top: 120, left: 2, width: 12, height: 40 },
                properties: { value: { value: START }, disableStepControls: { value: '{{false}}' } },
            },
            {
                type: 'Text',
                name: 'probe',
                layout: { top: 200, left: 2, width: 12, height: 40 },
                properties: { text: { value: `{{"locked:" + components.${LOCKED}.value + "|step:" + components.${STEP}.value}}` } },
            },
            // far-below filler so the running app's page is taller than the viewport and can scroll
            {
                type: 'Text',
                name: 'filler',
                layout: { top: 2400, left: 2, width: 12, height: 40 },
                properties: { text: { value: fake.firstName } },
            },
        ]);
        openIconAppInViewer(numberInputSelector.input(LOCKED));
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('[NumberInput-BRW-001] wheel over the focused field with disableStepControls on scrolls the page instead of changing the value', () => {
        const probe = commonWidgetSelector.draggableWidget('probe');
        cy.get(probe).should('have.text', `locked:${START}|step:${START}`);
        // the locked field has no step arrows, the control field has both
        cy.get(numberInputSelector.stepArrows(LOCKED)).should('not.exist');
        cy.get(numberInputSelector.stepArrows(STEP)).should('have.length', 2);
        // the running app is really scrollable and starts at the top
        expectScrollOffsets(numberInputSelector.input(LOCKED), (s) => {
            expect(s.scrollable, 'page can scroll').to.be.true;
            expect(s.total, 'starts at the top').to.eq(0);
        });

        // locked: focus, then a real wheel over the field
        cy.get(numberInputSelector.input(LOCKED)).realClick({ scrollBehavior: false });
        cy.focused().should('have.attr', 'data-cy', `${LOCKED}-input`);
        cy.get(numberInputSelector.input(LOCKED)).realMouseWheel({ deltaY: 240, scrollBehavior: false });
        expectScrollOffsets(numberInputSelector.input(LOCKED), (s) =>
            expect(s.total, 'the wheel scrolled the page').to.be.gt(0)
        );
        cy.get(numberInputSelector.input(LOCKED)).should('have.value', START);
        cy.get(probe).should('have.text', `locked:${START}|step:${START}`);

        // control: step controls on → the same wheel over the focused field steps the value natively
        resetScroll(numberInputSelector.input(STEP));
        cy.get(numberInputSelector.input(STEP)).realClick({ scrollBehavior: false });
        cy.focused().should('have.attr', 'data-cy', `${STEP}-input`);
        cy.get(numberInputSelector.input(STEP)).realMouseWheel({ deltaY: 240, scrollBehavior: false });
        cy.get(numberInputSelector.input(STEP)).should('not.have.value', START);
        cy.get(probe).should('not.have.text', `locked:${START}|step:${START}`);
    });
});
