/**
 * SPEC — Email Input — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only geometry scenarios from TESTING.md:
 *   EmailInput-BRW-001 — label width slider → real label/field split (Of the Component / Of the Field), editor + preview
 *   EmailInput-BRW-002 — clear button stays inside the field, clear of label + left icon, for side/top × left/right
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, openEditorSidebar, openAccordion, verifyAndModifyToggleFx,
 * expectLabelFieldSplit, getLabelShare, setLabelWidth, selectStyleSwitch, expectRectInside, expectRectsDisjoint.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { emailInputSelector, baseInputStyleSelector } from "Selectors/appBuilder/components/emailInput";
import { emailInputText } from "Texts/appBuilder/components/emailInput";
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
    openEditorSidebar,
    openAccordion,
    verifyAndModifyToggleFx,
} from "Support/utils/commonWidget";
import {
    expectLabelFieldSplit,
    getLabelShare,
    setLabelWidth,
    selectStyleSwitch,
    expectRectInside,
    expectRectsDisjoint,
} from "Support/utils/appBuilder/components/baseInput";

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Email Input — canvas facet', { testIsolation: false }, () => {
    const W = emailInputText.defaultWidgetName;
    const PREFIX = emailInputText.widgetPrefix;

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-EICanvas-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(emailInputText.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    const openStyles = () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    };

    it('drag-and-drop places the widget', () => {
        cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
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
        cy.dragAndDropWidget(emailInputText.displayName, 650, 300);
        cy.get('[data-cy="query-manager-toggle-button"]').click();

        multiSelectWidgets([W, `${PREFIX}2`]);
        verifySelectedWidgetCount(2);

        selectAllWidgets();
        verifySelectedWidgetCount(2);
        cy.get('.moveable-area').should('exist');
    });

    it('rename via ⋮ menu', () => {
        renameWidgetFromMenu(W, 'workemail'); // asserts new name internally
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

    // ── EmailInput-BRW-001 ───────────────────────────────────────────────────
    // labelWidth is measured with getBoundingClientRect (useInput.js label-measurement effect) and the
    // split comes from getLabelWidthOfInput/getWidthTypeOfComponentStyles (useInput.js:13-23):
    //   Of the Component → label = W% of the widget, field = (100 − W)%  (exact, asserted by formula)
    //   Of the Field (legacy) → label asks for W × 0.7 % but the field keeps width:100%, so both flex-shrink;
    //   that legacy split is asserted as: narrower label than Of the Component, field fills the rest,
    //   and the previewed (viewer) render reproduces the editor's split.
    it('[EmailInput-BRW-001] Label width slider splits the real width between label and field, as previewed', () => {
        const width = 50; // dynamic: test label width (default {{33}} — emailinput.js:358)
        openStyles();
        setLabelWidth(width);
        // widthType default ofComponent. source: emailinput.js:366
        expectLabelFieldSplit(W, width / 100, (100 - width) / 100);

        // previewed render keeps the same Of the Component split
        cy.waitForAutoSave();
        cy.openPreview(emailInputSelector.input(W));
        expectLabelFieldSplit(W, width / 100, (100 - width) / 100);

        // back to the editor → widthType Of the Field. source: emailinput.js:184
        cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), emailInputSelector.input(W));
        openStyles();
        cy.get(baseInputStyleSelector.widthTypeDropdown).click();
        cy.contains('[role="option"]', emailInputText.widthTypeOfField).click({ force: true });
        cy.get(baseInputStyleSelector.widthTypeDropdown).should('contain.text', emailInputText.widthTypeOfField);
        cy.get(emailInputSelector.label(W)).should('have.attr', 'style').and('include', `width: ${width * 0.7}%`);
        getLabelShare(W).then((editorShare) => {
            expect(editorShare, 'Of the Field label is narrower than Of the Component').to.be.lt(width / 100);
            expectLabelFieldSplit(W, editorShare, null);

            cy.waitForAutoSave();
            cy.openPreview(emailInputSelector.input(W));
            expectLabelFieldSplit(W, editorShare, null, 3);
        });
    });

    // ── EmailInput-BRW-002 ───────────────────────────────────────────────────
    // BaseInput.jsx:127-141 positions the clear button against the whole row: right = 11px, or
    // labelWidth + 11px when the label sits on the right; top shifts by half the top label's height.
    const enableClearButton = () => {
        openEditorSidebar(W);
        openAccordion(emailInputText.accordionAdditionalActions);
        verifyAndModifyToggleFx(emailInputText.enableClearButton, '{{false}}'); // flips ON. source: emailinput.js:45
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    };

    const typeValueAndExpectClearButtonInsideField = () => {
        cy.forceClickOnCanvas();
        cy.get(emailInputSelector.input(W)).clear().type(fake.email); // dynamic: fake
        cy.get(emailInputSelector.clearButton(W)).should('be.visible');
        expectRectInside(emailInputSelector.clearButton(W), emailInputSelector.field(W));
        expectRectsDisjoint(emailInputSelector.clearButton(W), emailInputSelector.label(W));
        // left icon is on by default for EmailInput (iconVisibility true). source: emailinput.js:365
        expectRectsDisjoint(emailInputSelector.clearButton(W), emailInputSelector.icon(W));
    };

    it('[EmailInput-BRW-002] Clear button sits inside the field — side alignment, left direction', () => {
        enableClearButton();
        // defaults side + left. source: emailinput.js:359 / emailinput.js:357
        typeValueAndExpectClearButtonInsideField();
    });

    it('[EmailInput-BRW-002] Clear button sits inside the field — side alignment, right direction', () => {
        enableClearButton();
        selectStyleSwitch('right'); // direction. source: emailinput.js:139
        typeValueAndExpectClearButtonInsideField();
    });

    it('[EmailInput-BRW-002] Clear button sits inside the field — side alignment, right direction, fixed label width', () => {
        enableClearButton();
        selectStyleSwitch('right'); // source: emailinput.js:139
        setLabelWidth(40); // dynamic: test label width — offset derives from the measured label width
        typeValueAndExpectClearButtonInsideField();
    });

    it('[EmailInput-BRW-002] Clear button sits inside the field — top alignment, left direction', () => {
        enableClearButton();
        selectStyleSwitch('top'); // alignment. source: emailinput.js:129
        typeValueAndExpectClearButtonInsideField();
    });

    it('[EmailInput-BRW-002] Clear button sits inside the field — top alignment, right direction', () => {
        enableClearButton();
        selectStyleSwitch('top'); // source: emailinput.js:129
        selectStyleSwitch('right'); // source: emailinput.js:139
        typeValueAndExpectClearButtonInsideField();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
