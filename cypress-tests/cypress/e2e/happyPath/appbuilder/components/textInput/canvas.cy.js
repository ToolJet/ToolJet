/**
 * SPEC — Text Input — canvas facet.
 * FOR AI: 11 cases — drag-and-drop places the widget; move repositions the widget; resize changes the widget dimensions (+8 more).
 * Browser-only geometry scenarios from TESTING.md:
 *   TextInput-BRW-001 — label width slider → real label/field split (Of the Component / Of the Field), editor + preview
 *   TextInput-BRW-002 — clear button stays inside the field, clear of label + typed text, for side/top × left/right
 *   TextInput-BRW-007 — configured height honoured: top label (+20px), legacy input size, fx alignment, and a
 *                       dynamic-height container (viewer only) that must enclose a top-aligned Text Input
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard, duplicateWidgetFromMenu, copyPasteWidget,
 * expectLabelFieldSplit, getLabelShare, setLabelWidth, selectStyleSwitch, expectRectInside, expectRectsDisjoint,
 * addTextInputsViaApi, expectClearButtonClearOfText, openAppInViewer, expectLayout.
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
    openEditorSidebar,
    openAccordion,
    verifyAndModifyToggleFx,
} from "Support/utils/commonWidget";
import { textInputSelector } from "Selectors/appBuilder/components/textInput";
import { baseInputStyleSelector } from "Selectors/appBuilder/components/emailInput";
import { textInputText } from "Texts/appBuilder/components/textInput";
import {
    expectLabelFieldSplit,
    getLabelShare,
    setLabelWidth,
    selectStyleSwitch,
    expectRectInside,
    expectRectsDisjoint,
} from "Support/utils/appBuilder/components/baseInput";
import { addTextInputsViaApi, expectClearButtonClearOfText } from "Support/utils/appBuilder/components/textInput";
import { openAppInViewer, expectLayout } from "Support/utils/appBuilder/components/textArea";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = textInputText;
const SEL = textInputSelector;

// Canvas facet — component lifecycle on the canvas: drag/drop, move, resize,
// duplicate (keyboard + menu), copy-paste, cut, nudge, multi-select, rename,
// delete, undo/redo. testIsolation:false for cypress-real-dnd (its CDP client
// is cached per spec run); each test re-creates its own app in beforeEach.
describe('Text Input — canvas facet', { testIsolation: false }, () => {
    const W = 'textinput1';

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TextInput-Canvas`);
        cy.openApp();
        cy.dragAndDropWidget('Text Input', 400, 200);
        closeQueryPanel();
    });

    it('drag-and-drop places the widget', () => {
        cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        verifyWidgetCount('textinput', 1);
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
        verifyWidgetCount('textinput', 2);
    });

    it('duplicate via ⋮ menu', () => {
        duplicateWidgetFromMenu(W);
        verifyWidgetCount('textinput', 2);
    });

    it('copy-paste (Cmd/Ctrl+C then +V)', () => {
        copyPasteWidget(W);
        verifyWidgetCount('textinput', 2);
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
        cy.dragAndDropWidget('Text Input', 650, 200);
        closeQueryPanel();

        multiSelectWidgets(['textinput1', 'textinput2']);
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

    const openStyles = () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    };

    // ── TextInput-BRW-001 ────────────────────────────────────────────────────
    // labelWidth is measured with getBoundingClientRect (useInput.js:116-134) and the split comes from
    // getLabelWidthOfInput/getWidthTypeOfComponentStyles (useInput.js:13-23):
    //   Of the Component → label = W% of the widget, field = (100 − W)%  (exact, asserted by formula)
    //   Of the Field (legacy) → label asks for W × 0.7 % while the field keeps width:100%, so both flex-shrink;
    //   asserted as: narrower label than Of the Component, field fills the rest, preview reproduces the editor.
    it('[TextInput-BRW-001] Label width slider splits the real width between label and field, as previewed', () => {
        const width = 50; // dynamic: test label width (default {{33}} — textinput.js:376)
        openStyles();
        setLabelWidth(width);
        // widthType default ofComponent. source: textinput.js:384
        cy.get(SEL.label(W)).should('have.attr', 'style').and('include', `width: ${width}%`);
        expectLabelFieldSplit(W, width / 100, (100 - width) / 100);

        // previewed render keeps the same Of the Component split
        cy.waitForAutoSave();
        cy.openPreview(SEL.input(W));
        expectLabelFieldSplit(W, width / 100, (100 - width) / 100);

        // back to the editor → widthType Of the Field. source: textinput.js:185
        cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), SEL.input(W));
        openStyles();
        cy.get(baseInputStyleSelector.widthTypeDropdown).click();
        cy.contains('[role="option"]', T.widthTypeOfField).click({ force: true });
        cy.get(baseInputStyleSelector.widthTypeDropdown).should('contain.text', T.widthTypeOfField);
        cy.get(SEL.label(W)).should('have.attr', 'style').and('include', `width: ${width * 0.7}%`);
        getLabelShare(W).then((editorShare) => {
            expect(editorShare, 'Of the Field label is narrower than Of the Component').to.be.lt(width / 100);
            expectLabelFieldSplit(W, editorShare, null);

            cy.waitForAutoSave();
            cy.openPreview(SEL.input(W));
            expectLabelFieldSplit(W, editorShare, null, 3);
        });
    });

    // ── TextInput-BRW-002 ────────────────────────────────────────────────────
    // BaseInput.jsx:127-142 positions the clear button against the whole row: right = 11px, or
    // labelWidth + 11px when the label sits on the right; top shifts by half the top label's height.
    // TextInput renders no right icon (TextInput.jsx passes none; the Loader replaces it only while loading,
    // when the button is suppressed), so "clear of any right icon" = clear of the typed text: TextInput.jsx
    // reserves 25px of input padding-right for the button.
    const enableClearButton = () => {
        openEditorSidebar(W);
        openAccordion(T.accordionAdditionalActions);
        verifyAndModifyToggleFx(T.enableClearButton, '{{false}}'); // flips ON. source: textinput.js:45
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    };

    const typeValueAndExpectClearButtonInsideField = () => {
        cy.forceClickOnCanvas();
        cy.get(SEL.input(W)).clear().type(fake.firstName); // dynamic: fake
        cy.get(SEL.clearButton(W)).should('be.visible');
        expectRectInside(SEL.clearButton(W), SEL.field(W));
        expectRectsDisjoint(SEL.clearButton(W), SEL.label(W));
        expectClearButtonClearOfText(W);
    };

    it('[TextInput-BRW-002] Clear button sits inside the field — side alignment, left direction', () => {
        enableClearButton();
        // defaults side + left. source: textinput.js:377 / textinput.js:375
        typeValueAndExpectClearButtonInsideField();
    });

    it('[TextInput-BRW-002] Clear button sits inside the field — side alignment, right direction', () => {
        enableClearButton();
        selectStyleSwitch('right'); // direction. source: textinput.js:139
        typeValueAndExpectClearButtonInsideField();
    });

    it('[TextInput-BRW-002] Clear button sits inside the field — side alignment, right direction, fixed label width', () => {
        enableClearButton();
        selectStyleSwitch('right'); // source: textinput.js:139
        setLabelWidth(40); // dynamic: test label width — offset derives from the measured label width
        typeValueAndExpectClearButtonInsideField();
    });

    it('[TextInput-BRW-002] Clear button sits inside the field — top alignment, left direction', () => {
        enableClearButton();
        selectStyleSwitch('top'); // alignment. source: textinput.js:129
        typeValueAndExpectClearButtonInsideField();
    });

    it('[TextInput-BRW-002] Clear button sits inside the field — top alignment, right direction', () => {
        enableClearButton();
        selectStyleSwitch('top'); // source: textinput.js:129
        selectStyleSwitch('right'); // source: textinput.js:139
        typeValueAndExpectClearButtonInsideField();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});

// ── TextInput-BRW-007 ────────────────────────────────────────────────────────
// The grid box height comes from calculateMoveableBoxHeightWithId → calculateInputCanvasHeight
// (componentsSliceUtils.js:27-56, WidgetWrapper.jsx:174): a top-aligned label adds
// TOP_ALIGNMENT_HEIGHT_INCREMENT (20px) to the authored height; legacyInputSize reserves that label slot even
// for an empty label and freezes the height when alignment comes from an fx expression. Dynamic height
// (a Container's) runs only in a running app (WidgetWrapper.jsx:117 `mode === 'view'`).
describe('Text Input — canvas facet (heights)', { testIsolation: false }, () => {
    const H = 40; // authored height. source: textinput.js:8 defaultSize.height
    const INC = T.topAlignmentHeightIncrement; // 20 — appCanvasConstants.js:83
    const PX = 1.5;
    const containerId = crypto.randomUUID();
    const CONTAINER_H = 140; // dynamic: authored container height
    const CHILD_TOP = 90; // dynamic: child top inside the container → 90 + 60 > 140

    const legacy = (on) => ({ legacyInputSize: { value: on ? '{{true}}' : '{{false}}' } }); // source: textinput.js:15
    const top = { alignment: { value: 'top' } }; // source: textinput.js:129
    const fxTop = { alignment: { value: "{{'top'}}" } }; // dynamic: fx-resolved alignment
    const noLabel = { label: { value: '' } }; // source: textinput.js:22

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TextInput-canvas-${Cypress._.uniqueId()}`);
        addTextInputsViaApi([
            { name: 'tiside', layout: { top: 40, left: 1, width: 12, height: H }, properties: legacy(false) },
            { name: 'titop', layout: { top: 120, left: 1, width: 12, height: H }, properties: legacy(false), styles: top },
            { name: 'titopempty', layout: { top: 220, left: 1, width: 12, height: H }, properties: { ...legacy(false), ...noLabel }, styles: top },
            { name: 'titoplegacy', layout: { top: 300, left: 1, width: 12, height: H }, properties: { ...legacy(true), ...noLabel }, styles: top },
            { name: 'tifxtop', layout: { top: 40, left: 15, width: 12, height: H }, properties: legacy(false), styles: fxTop },
            { name: 'tifxlegacy', layout: { top: 120, left: 15, width: 12, height: H }, properties: legacy(true), styles: fxTop },
            {
                type: 'Container',
                name: 'heightcontainer',
                id: containerId,
                layout: { top: 220, left: 15, width: 14, height: CONTAINER_H },
                properties: { dynamicHeight: { value: '{{true}}' }, showHeader: { value: '{{false}}' } },
            },
            { name: 'ticontainer', parent: containerId, layout: { top: CHILD_TOP, left: 1, width: 40, height: H }, properties: legacy(false), styles: top },
            { type: 'Text', name: 'belowcontainer', layout: { top: 420, left: 15, width: 14, height: 40 }, properties: { text: { value: 'below' } } },
        ]);
        cy.then(() => cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), SEL.input('tiside')));
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // label + field of a top-aligned input both sit inside the grown box, label above the field
    const fieldRect = (doc, name) => doc.querySelector(SEL.field(name)).getBoundingClientRect();
    const labelRect = (doc, name) => doc.querySelector(SEL.label(name)).getBoundingClientRect();
    const expectRootHeights = (context) => {
        cy.log(`heights — ${context}`);
        cy.document().should((doc) => {
            const box = (name) => doc.querySelector(SEL.draggableWidget(name)).getBoundingClientRect();
            expect(box('tiside').height, 'side label: authored height').to.be.closeTo(H, PX);
            expect(box('titop').height, 'top label: authored + 20').to.be.closeTo(H + INC, PX);
            expect(box('titopempty').height, 'top, empty label, not legacy: authored').to.be.closeTo(H, PX);
            expect(box('titoplegacy').height, 'top, empty label, legacy size: label slot kept').to.be.closeTo(H + INC, PX);
            expect(box('tifxtop').height, 'fx top, not legacy: resolved alignment grows the box').to.be.closeTo(H + INC, PX);
            expect(box('tifxlegacy').height, 'fx top, legacy size: height frozen').to.be.closeTo(H, PX);
            ['titop', 'tifxtop'].forEach((name) => {
                const b = box(name);
                const f = fieldRect(doc, name);
                const l = labelRect(doc, name);
                expect(l.bottom, `${name} label above field`).to.be.lte(f.top + PX);
                expect(f.bottom, `${name} field inside its box`).to.be.lte(b.bottom + PX);
                expect(l.top, `${name} label inside its box`).to.be.gte(b.top - PX);
            });
            // the 20px increment is exactly the label row: a top-aligned field keeps the side-labelled field's height
            expect(fieldRect(doc, 'titop').height, 'top-aligned field height = side field height').to.be.closeTo(fieldRect(doc, 'tiside').height, 1);
        });
    };

    it('[TextInput-BRW-007] Top label, legacy input size and fx alignment size the widget box — editor and viewer', () => {
        expectRootHeights('editor');
        openAppInViewer(SEL.input('tiside'));
        expectRootHeights('viewer');
    });

    it('[TextInput-BRW-007] A dynamic-height container grows to enclose a top-aligned Text Input — viewer only', () => {
        // editor: dynamic height is gated to the running app, the container keeps its authored height
        cy.get(SEL.input('ticontainer')).should('exist');
        cy.document().should((doc) => {
            const box = (name) => doc.querySelector(SEL.draggableWidget(name)).getBoundingClientRect();
            expect(box('ticontainer').height, 'child keeps authored + 20 in the editor').to.be.closeTo(H + INC, PX);
            expect(box('heightcontainer').height, 'editor container keeps its authored height').to.be.closeTo(CONTAINER_H, 4);
        });

        openAppInViewer(SEL.input('ticontainer'));
        expectLayout((box) => {
            expect(box('ticontainer').height, 'child keeps authored + 20 in the viewer').to.be.closeTo(H + INC, PX);
            // control: the child really overflows the authored container height
            expect(box('ticontainer').bottom - box('heightcontainer').top, 'child reaches past the authored height').to.be.gt(CONTAINER_H);
            expect(box('heightcontainer').bottom, 'container encloses the whole top-aligned child').to.be.gte(box('ticontainer').bottom - PX);
            expect(box('belowcontainer').top, 'widget below is not overlapped').to.be.gte(box('heightcontainer').bottom - PX);
        });
    });
});
