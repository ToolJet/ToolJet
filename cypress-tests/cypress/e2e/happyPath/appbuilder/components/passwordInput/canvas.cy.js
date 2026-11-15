/**
 * SPEC — Password Input — canvas facet.
 * FOR AI: 11 cases — drag-and-drop places the widget; move repositions the widget; resize changes the widget dimensions (+8 more).
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard, duplicateWidgetFromMenu, copyPasteWidget.
 * TESTING.md browser scenario:
 *   PasswordInput-BRW-001 — the reveal (eye) control stays inside the field, clear of label, left icon and text box,
 *   for side/top alignment × left/right direction (+ a fixed label width and the previewed app).
 *   Helpers: openEditorSidebar, setLabelWidth, selectStyleSwitch, expectRectInside, expectRectsDisjoint.
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
} from "Support/utils/commonWidget";
import {
    setLabelWidth,
    selectStyleSwitch,
    expectRectInside,
    expectRectsDisjoint,
} from "Support/utils/appBuilder/components/baseInput";
import { passwordInputSelector } from "Selectors/appBuilder/components/passwordInput";
import { passwordInputText } from "Texts/appBuilder/components/passwordInput";

// Canvas facet — component lifecycle on the canvas: drag/drop, move, resize,
// duplicate (keyboard + menu), copy-paste, cut, nudge, multi-select, rename,
// delete, undo/redo. testIsolation:false for cypress-real-dnd (its CDP client
// is cached per spec run); each test re-creates its own app in beforeEach.
describe('Password Input — canvas facet', { testIsolation: false }, () => {
    const W = 'passwordinput1';
    const SEL = passwordInputSelector;
    const T = passwordInputText;

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PasswordInput-Canvas`);
        cy.openApp();
        cy.dragAndDropWidget('Password Input', 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    it('drag-and-drop places the widget', () => {
        cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        verifyWidgetCount('passwordinput', 1);
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
        verifyWidgetCount('passwordinput', 2);
    });

    it('duplicate via ⋮ menu', () => {
        duplicateWidgetFromMenu(W);
        verifyWidgetCount('passwordinput', 2);
    });

    it('copy-paste (Cmd/Ctrl+C then +V)', () => {
        copyPasteWidget(W);
        verifyWidgetCount('passwordinput', 2);
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
        cy.dragAndDropWidget('Password Input', 650, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();

        multiSelectWidgets(['passwordinput1', 'passwordinput2']);
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


    // ── PasswordInput-BRW-001 ────────────────────────────────────────────────
    // The eye is PasswordInput's `rightIcon` (PasswordInput.jsx:19-23), rendered as the last flex child of the
    // field container (BaseInput.jsx:299), after the left IconLock (iconVisibility default true —
    // passwordinput.js:369) and the <input>. Three shipped fixes (1094695cfb, 92646571e2, b5d64d895a) chased
    // it rendering outside the field, so for every label placement it must: sit inside the field at its
    // trailing edge, overlap neither the label, the left icon nor the text box, be the element actually hit
    // at its centre, and stay put after a click reveals the value (IconEye → IconEyeClosed).
    const openStyles = () => {
        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    };

    const expectEyeInsideField = () => {
        cy.get(SEL.revealToggle(W)).should('be.visible');
        expectRectInside(SEL.revealToggle(W), SEL.field(W));
        expectRectsDisjoint(SEL.revealToggle(W), SEL.label(W));
        expectRectsDisjoint(SEL.revealToggle(W), SEL.icon(W));
        expectRectsDisjoint(SEL.revealToggle(W), SEL.input(W));
        cy.get(SEL.field(W)).should(($field) => {
            const field = $field[0].getBoundingClientRect();
            const eye = Cypress.$(SEL.revealToggle(W))[0].getBoundingClientRect();
            // trailing edge: only the field's right padding (tw-px-2.5 = 10px) + 1px border separate them
            expect(field.right - eye.right, 'eye sits at the field trailing edge').to.be.within(0, 14);
            // vertically centred in the field (tw-items-center, BaseInput.jsx:214)
            const eyeX = eye.left + eye.width / 2;
            const eyeY = eye.top + eye.height / 2;
            expect(Math.abs(field.top + field.height / 2 - eyeY), 'eye vertically centred in the field').to.be.lte(2);
            // nothing covers it: the topmost element at its centre belongs to the eye toggle
            const hit = $field[0].ownerDocument.elementFromPoint(eyeX, eyeY);
            expect(Cypress.$(hit).closest(SEL.revealToggle(W)).length, 'eye is the element hit at its centre').to.eq(1);
        });
    };

    const typeAndExpectEyeInsideField = ({ inEditor = true } = {}) => {
        if (inEditor) cy.forceClickOnCanvas();
        cy.get(SEL.input(W)).clear().type(fake.password); // dynamic: fake
        cy.get(SEL.input(W)).should('have.attr', 'type', 'password');
        cy.get(SEL.revealToggle(W)).find(T.iconEyePath).should('exist');
        expectEyeInsideField();
        // reveal → type=text + IconEyeClosed, and the eye has not moved out of the field
        cy.get(SEL.revealToggle(W)).click();
        cy.get(SEL.input(W)).should('have.attr', 'type', 'text');
        cy.get(SEL.revealToggle(W)).find(T.iconEyeClosedPath).should('exist');
        expectEyeInsideField();
        // hide again → password
        cy.get(SEL.revealToggle(W)).click();
        cy.get(SEL.input(W)).should('have.attr', 'type', 'password');
    };

    it('[PasswordInput-BRW-001] Reveal control sits inside the field — side alignment, left direction', () => {
        // defaults side + left. source: passwordinput.js:130 / passwordinput.js:140
        typeAndExpectEyeInsideField();
    });

    it('[PasswordInput-BRW-001] Reveal control sits inside the field — side alignment, right direction', () => {
        openStyles();
        selectStyleSwitch('right'); // direction. source: passwordinput.js:145
        typeAndExpectEyeInsideField();
    });

    it('[PasswordInput-BRW-001] Reveal control sits inside the field — side alignment, right direction, fixed label width', () => {
        openStyles();
        selectStyleSwitch('right'); // source: passwordinput.js:145
        setLabelWidth(40); // dynamic: test label width (default {{33}} — passwordinput.js:362)
        typeAndExpectEyeInsideField();
    });

    it('[PasswordInput-BRW-001] Reveal control sits inside the field — top alignment, left direction', () => {
        openStyles();
        selectStyleSwitch('top'); // alignment. source: passwordinput.js:133
        typeAndExpectEyeInsideField();
    });

    it('[PasswordInput-BRW-001] Reveal control sits inside the field — top alignment, right direction', () => {
        openStyles();
        selectStyleSwitch('top'); // source: passwordinput.js:133
        selectStyleSwitch('right'); // source: passwordinput.js:145
        typeAndExpectEyeInsideField();
    });

    it('[PasswordInput-BRW-001] Reveal control sits inside the field — previewed app, side alignment, right direction', () => {
        openStyles();
        selectStyleSwitch('right'); // source: passwordinput.js:145
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.openPreview(SEL.input(W));
        typeAndExpectEyeInsideField({ inEditor: false });
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });
});
