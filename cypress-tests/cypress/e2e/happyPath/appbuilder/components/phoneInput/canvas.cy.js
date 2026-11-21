/**
 * SPEC — Phone Input — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only canvas/geometry scenarios from TESTING.md:
 *   PhoneInput-BRW-002 — on the editor canvas the country dropdown selects the component, does not start a widget
 *                        drag or fire builder shortcuts, and still opens, closes and selects
 *   PhoneInput-BRW-003 — the portalled menu is 208×236 right under the control and dismisses on an outside click
 *                        (editor + preview); the loader and clear button sit inside the number field, clear of the
 *                        label and the country select, for side/top × left/right
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets, multiSelectWidgets,
 * verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo, openEditorSidebar, openAccordion,
 * verifyAndModifyToggleFx, setLabelWidth, selectStyleSwitch, expectRectInside, expectRectsDisjoint, getComponentId,
 * openCountryMenu, selectCountryOption, expectDialCode, expectVerticallyCentred, expectCountryMenuGeometry,
 * getWidgetCanvasOffset.
 */
import { fake } from "Fixtures/fake";
import { commonSelectors, commonWidgetSelector } from "Selectors/common";
import { phoneInputSelector } from "Selectors/appBuilder/components/phoneInput";
import { phoneInputText } from "Texts/appBuilder/components/phoneInput";
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
    setLabelWidth,
    selectStyleSwitch,
    expectRectInside,
    expectRectsDisjoint,
} from "Support/utils/appBuilder/components/baseInput";
import {
    getComponentId,
    getWidgetCanvasOffset,
    openCountryMenu,
    selectCountryOption,
    expectDialCode,
    expectVerticallyCentred,
    expectCountryMenuGeometry,
} from "Support/utils/appBuilder/components/phoneInput";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = phoneInputText.defaultWidgetName;
const PREFIX = phoneInputText.widgetPrefix;
const T = phoneInputText;
const SEL = phoneInputSelector;

// dynamic: a US national number (NANP 201-555-xxxx), digits only
const nationalNumber = () => `201555${Cypress._.random(1000, 9999)}`;

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Phone Input — canvas facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PhoneInput-canvas-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

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
        cy.dragAndDropWidget(T.displayName, 650, 300);
        closeQueryPanel();

        multiSelectWidgets([W, `${PREFIX}2`]);
        verifySelectedWidgetCount(2);

        selectAllWidgets();
        verifySelectedWidgetCount(2);
        cy.get('.moveable-area').should('exist');
    });

    it('rename via ⋮ menu', () => {
        renameWidgetFromMenu(W, 'workphone'); // asserts new name internally
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

    // ── PhoneInput-BRW-002 ───────────────────────────────────────────────────
    // CountrySelect.jsx:112-123 (fc2e91bd1d, 9dc5f9b1ff): in edit mode the wrapper's onMouseDownCapture stops the
    // event (so the builder's drag/selection never sees it), selects the component if it is not selected, and toggles
    // the menu; a mousedown inside the portalled menu returns early so search and option clicks reach react-select.
    const wrapperOf = (name) => cy.get(SEL.draggableWidget(name)).closest(SEL.wrapper);

    it('[PhoneInput-BRW-002] Clicking the country dropdown on the canvas selects the component and toggles the list', () => {
        cy.forceClickOnCanvas();
        wrapperOf(W).should('not.have.class', 'active-target');

        openCountryMenu(W).then((id) => {
            // the click selected the Phone Input
            wrapperOf(W).should('have.class', 'active-target');
            verifySelectedWidgetCount(1);
            // a second click on the control closes the list
            cy.get(SEL.countrySelect(W)).realClick();
            cy.get(SEL.menu(id)).should('not.exist');
            // and a third opens it again
            cy.get(SEL.countrySelect(W)).realClick();
            cy.get(SEL.menu(id)).should('be.visible');
        });
    });

    it('[PhoneInput-BRW-002] Dragging from the country dropdown does not move the widget; dragging from the label does', () => {
        cy.forceClickOnCanvas();
        // positions are measured against the canvas: real events may scroll the page, which moves every rect
        getWidgetCanvasOffset(W).then((before) => {
            // press on the country control, move far away, release — without letting real-events scroll
            const noScroll = { scrollBehavior: false };
            cy.get(SEL.countrySelect(W)).realMouseDown(noScroll);
            cy.get(SEL.countrySelect(W)).realMouseMove(220, 160, noScroll);
            cy.get(SEL.countrySelect(W)).realMouseMove(260, 200, noScroll);
            // release where the pointer ended (releasing back on the origin would cancel a drag anyway)
            cy.get(SEL.countrySelect(W)).realMouseUp({ ...noScroll, x: 260, y: 200 });
            cy.wait(500); // let a drag, if one had started, commit its drop
            getWidgetCanvasOffset(W).then((after) => {
                expect(Math.abs(after.x - before.x), 'widget x on canvas unchanged').to.be.lte(2);
                expect(Math.abs(after.y - before.y), 'widget y on canvas unchanged').to.be.lte(2);
            });
            // the press itself opened the list (the dropdown reacted, the builder did not)
            getComponentId(W).then((id) => cy.get(SEL.menu(id)).should('be.visible'));
        });

        // control: the very same real gesture started on the label (not the dropdown) does move the widget,
        // so the check above is not vacuous
        cy.forceClickOnCanvas();
        getWidgetCanvasOffset(W).then((before) => {
            const noScroll = { scrollBehavior: false };
            cy.get(SEL.label(W)).realMouseDown(noScroll);
            cy.get(SEL.label(W)).realMouseMove(220, 160, noScroll);
            cy.get(SEL.label(W)).realMouseMove(260, 200, noScroll);
            cy.get(SEL.label(W)).realMouseUp({ ...noScroll, x: 260, y: 200 });
            cy.wait(500);
            getWidgetCanvasOffset(W).then((after) => {
                expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y), 'widget moved on the canvas').to.be.gt(20);
            });
        });
    });

    it('[PhoneInput-BRW-002] Searching and picking a country in the canvas menu works and does not delete the widget', () => {
        const query = T.searchCountry.query;
        openCountryMenu(W).then((id) => {
            cy.get(SEL.menuSearch(id)).realClick();
            cy.get(SEL.menuSearch(id)).type(`${query}x`);
            cy.get(SEL.menuSearch(id)).should('have.value', `${query}x`);
            // Backspace inside the search box edits the query — it must not reach the builder's delete-widget shortcut
            cy.get(SEL.menuSearch(id)).type('{backspace}');
            cy.get(SEL.menuSearch(id)).should('have.value', query);
            cy.get(SEL.draggableWidget(W)).should('exist');
            cy.get(SEL.option(id)).should('have.length', 1).and('contain.text', T.searchCountry.optionLabel);
            selectCountryOption(id, T.searchCountry.optionLabel);
        });
        expectDialCode(W, T.searchCountry.dialCode);
        verifyWidgetCount(PREFIX, 1);
    });

    // ── PhoneInput-BRW-003 (menu) ────────────────────────────────────────────
    // CountrySelect.jsx:71-78 menu box 208×236, marginTop 2, portalled to <body>; CountrySelect.jsx:31-45 closes it
    // on a document mousedown outside the dropdown.
    it('[PhoneInput-BRW-003] The country menu is 208×236 right under the control and closes on an outside click — editor and preview', () => {
        const box = { width: T.menuWidth, height: T.menuHeight, gap: T.menuMarginTop };

        openCountryMenu(W).then((id) => {
            expectCountryMenuGeometry(W, id, box);
            cy.get(commonSelectors.canvas).first().realClick({ x: 30, y: 30 }); // empty canvas corner
            cy.get(SEL.menu(id)).should('not.exist');
        });

        cy.waitForAutoSave();
        cy.openPreview(SEL.input(W));
        openCountryMenu(W).then((id) => {
            expectCountryMenuGeometry(W, id, box);
            cy.get(commonSelectors.canvas).first().realClick({ x: 30, y: 30 }); // empty canvas corner
            cy.get(SEL.menu(id)).should('not.exist');
        });
    });

    // ── PhoneInput-BRW-003 (loader + clear button) ───────────────────────────
    // PhoneInput.jsx:181-202: loader and clear button are absolutely positioned against the whole row — right 11px,
    // or labelWidth + 11px when the label is on the right; top shifted by half a top label's height.
    const enableClearButton = () => {
        openEditorSidebar(W);
        openAccordion(T.accordionAdditionalActions);
        verifyAndModifyToggleFx(T.enableClearButton, '{{false}}'); // flips ON. source: phoneinput.js:52
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
    };

    const expectPlacedInsideNumberField = (selector) => {
        expectRectInside(selector, SEL.input(W));
        expectVerticallyCentred(selector, SEL.input(W));
        expectRectsDisjoint(selector, SEL.label(W));
        expectRectsDisjoint(selector, SEL.countrySelect(W));
    };

    const expectClearButtonThenLoaderPlacement = () => {
        cy.forceClickOnCanvas();
        cy.get(SEL.input(W)).clear().type(nationalNumber()); // dynamic
        cy.get(SEL.clearButton(W)).should('be.visible');
        expectPlacedInsideNumberField(SEL.clearButton(W));

        // loading state ON → clear button hides, loader takes the same slot
        openEditorSidebar(W);
        cy.get(SEL.propertiesTab).click();
        openAccordion(T.accordionAdditionalActions);
        verifyAndModifyToggleFx(T.loadingState, '{{false}}'); // flips ON. source: phoneinput.js:58
        cy.forceClickOnCanvas();
        cy.get(SEL.loader(W)).should('be.visible');
        cy.get(SEL.clearButton(W)).should('not.exist');
        expectPlacedInsideNumberField(SEL.loader(W));
    };

    it('[PhoneInput-BRW-003] Clear button and loader sit inside the number field — side alignment, left direction', () => {
        enableClearButton();
        // defaults side + left. source: phoneinput.js:361 / phoneinput.js:359
        expectClearButtonThenLoaderPlacement();
    });

    it('[PhoneInput-BRW-003] Clear button and loader sit inside the number field — side alignment, right direction', () => {
        enableClearButton();
        selectStyleSwitch('right'); // direction. source: phoneinput.js:155
        expectClearButtonThenLoaderPlacement();
    });

    it('[PhoneInput-BRW-003] Clear button and loader sit inside the number field — side alignment, right direction, fixed label width', () => {
        enableClearButton();
        selectStyleSwitch('right'); // source: phoneinput.js:155
        setLabelWidth(40); // dynamic: test label width — the offset derives from the measured label width
        expectClearButtonThenLoaderPlacement();
    });

    it('[PhoneInput-BRW-003] Clear button and loader sit inside the number field — top alignment, left direction', () => {
        enableClearButton();
        selectStyleSwitch('top'); // alignment. source: phoneinput.js:143
        expectClearButtonThenLoaderPlacement();
    });

    it('[PhoneInput-BRW-003] Clear button and loader sit inside the number field — top alignment, right direction', () => {
        enableClearButton();
        selectStyleSwitch('top'); // source: phoneinput.js:143
        selectStyleSwitch('right'); // source: phoneinput.js:155
        expectClearButtonThenLoaderPlacement();
    });
});
