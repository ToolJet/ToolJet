/**
 * SPEC — Currency Input — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only canvas scenarios from TESTING.md:
 *   CurrencyInput-BRW-002 — opening the currency list on the editor canvas selects the component, does not
 *                           drag it, and search + pick still work
 *   CurrencyInput-BRW-003 — the portalled menu's size/position + outside-click dismissal, and the loader and
 *                           clear button land inside the field for side/top × left/right label placement
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * openEditorSidebar, openAccordion, verifyAndModifyToggleFx, selectStyleSwitch, getRect, expectRectInside,
 * expectRectsDisjoint, getCurrencyComponentId, openCurrencyMenu, searchCurrency, expectEveryCurrencyOption,
 * selectCurrencyOption, expectCurrencyPrefix.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { currencyInputSelector } from "Selectors/appBuilder/components/currencyInput";
import { currencyInputText } from "Texts/appBuilder/components/currencyInput";
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
    getRect,
    expectRectInside,
    expectRectsDisjoint,
    selectStyleSwitch,
} from "Support/utils/appBuilder/components/baseInput";
import {
    getCurrencyComponentId,
    openCurrencyMenu,
    searchCurrency,
    expectEveryCurrencyOption,
    selectCurrencyOption,
    expectCurrencyPrefix,
} from "Support/utils/appBuilder/components/currencyInput";

const W = currencyInputText.defaultWidgetName;
const T = currencyInputText;
const SEL = currencyInputSelector;

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Currency Input — canvas facet', { testIsolation: false }, () => {
    const PREFIX = T.widgetPrefix;

    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-CurrencyInput-canvas-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('drag-and-drop places the widget', () => {
        cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        cy.get(SEL.input(W)).should('have.value', T.defaultDisplay); // source: currencyinput.js:363
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
        cy.get('[data-cy="query-manager-toggle-button"]').click();

        multiSelectWidgets([W, `${PREFIX}2`]);
        verifySelectedWidgetCount(2);

        selectAllWidgets();
        verifySelectedWidgetCount(2);
        cy.get('.moveable-area').should('exist');
    });

    it('rename via ⋮ menu', () => {
        renameWidgetFromMenu(W, 'invoiceamount'); // asserts new name internally
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

    // ── CurrencyInput-BRW-002 ────────────────────────────────────────────────
    // CountrySelect.jsx:112-123: in edit mode a capture-phase mousedown stops propagation (so the builder's
    // drag/selection never sees it), selects the component if needed and toggles the menu; mousedowns inside
    // the portalled menu return early so search + pick work.
    it('[CurrencyInput-BRW-002] Opening the currency list on the canvas selects the widget, does not drag it, and search + pick work', () => {
        // position relative to the canvas, so a sidebar/scroll shift of the viewport is not read as a drag
        const offsetInCanvas = ($w) => {
            const r = $w[0].getBoundingClientRect();
            const c = Cypress.$('#real-canvas')[0].getBoundingClientRect();
            return { x: Math.round(r.left - c.left), y: Math.round(r.top - c.top) };
        };
        cy.forceClickOnCanvas();
        verifySelectedWidgetCount(0);
        cy.get(commonWidgetSelector.draggableWidget(W)).then(($w) => offsetInCanvas($w)).as('r0');

        openCurrencyMenu(W).then((id) => {
            // the widget is now the single selected component and its inspector is shown
            cy.get(`${SEL.wrapper}.active-target`).should('have.length', 1).and('have.attr', 'id', id);
            cy.contains('label.form-label', T.numberFormat).should('be.visible');

            // clicking into the search box keeps the menu open; the filter matches the country name
            searchCurrency(id, T.eur.country.split(' ')[0]); // "European"
            cy.get(SEL.menu(id)).should('be.visible');
            expectEveryCurrencyOption(id, (text) => text.includes(T.eur.option), `is ${T.eur.option}`);
            selectCurrencyOption(id, T.eur.option);
        });
        expectCurrencyPrefix(W, T.eur.prefix);

        // still exactly where it was dropped, still the only selection
        cy.get('@r0').then((before) => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) => {
                const now = offsetInCanvas($w);
                expect(Math.abs(now.x - before.x), 'x in canvas unchanged').to.be.lte(1);
                expect(Math.abs(now.y - before.y), 'y in canvas unchanged').to.be.lte(1);
            });
        });
        verifySelectedWidgetCount(1);
    });

    // ── CurrencyInput-BRW-003 (menu) ─────────────────────────────────────────
    // CountrySelect.jsx:71-78: menu 208 × 236, marginTop 2, portalled to document.body; CountrySelect.jsx:31-45
    // closes it on a mousedown outside the picker.
    const expectMenuGeometry = (id) => {
        cy.get(SEL.menu(id)).should(($menu) => {
            expect($menu.parent().closest(SEL.draggableWidget(W)).length, 'menu is portalled out of the widget').to.eq(0);
            const m = $menu[0].getBoundingClientRect();
            const c = Cypress.$(SEL.currencyControl(W))[0].getBoundingClientRect();
            expect(m.width, 'menu width').to.be.closeTo(T.menuWidth, 1);
            expect(m.height, 'menu height').to.be.closeTo(T.menuHeight, 1);
            expect(m.left, 'menu left aligns with the control').to.be.closeTo(c.left, 2);
            expect(m.top - c.bottom, 'menu opens just below the control').to.be.closeTo(T.menuMarginTop, 2);
        });
    };

    it('[CurrencyInput-BRW-003] The portalled menu opens at its size next to the control and closes on an outside click — editor and preview', () => {
        cy.forceClickOnCanvas();
        openCurrencyMenu(W).then((id) => {
            expectMenuGeometry(id);
            cy.get('[data-cy="real-canvas"]').realClick({ position: 'bottomRight' });
            cy.get(SEL.menu(id)).should('not.exist');
        });

        cy.openPreview(SEL.input(W));
        openCurrencyMenu(W).then((id) => {
            expectMenuGeometry(id);
            cy.get('body').realClick({ position: 'bottomRight' });
            cy.get(SEL.menu(id)).should('not.exist');
        });
    });

    // ── CurrencyInput-BRW-003 (loader + clear button) ────────────────────────
    // CurrencyInput.jsx:171-185: loader and clear button are positioned against the whole row — right 11px,
    // or labelWidth + 11px with a right-side label; top shifted by half a top label's height.
    const expectInsideAmountField = (selector) => {
        cy.get(selector).should('be.visible');
        expectRectInside(selector, SEL.field(W));
        expectRectsDisjoint(selector, SEL.label(W));
        expectRectsDisjoint(selector, SEL.currencySelect(W));
        // within the amount <input>'s own box, i.e. not over the currency picker
        getRect(SEL.input(W)).then((input) => {
            getRect(selector).then((r) => {
                expect(r.left, 'starts inside the amount field').to.be.gte(input.left - 0.5);
                expect(r.right, 'ends inside the amount field').to.be.lte(input.right + 0.5);
            });
        });
    };

    const placeLabelAndCheckClearThenLoader = (switches) => {
        openEditorSidebar(W);
        openAccordion(T.accordionAdditionalActions);
        verifyAndModifyToggleFx(T.enableClearButton, '{{false}}'); // flips ON. source: currencyinput.js:377
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        switches.forEach((value) => selectStyleSwitch(value)); // source: currencyinput.js:153-167
        cy.forceClickOnCanvas();

        cy.get(SEL.input(W)).clear().type('4250.75'); // dynamic: test amount
        cy.get(SEL.input(W)).should('have.value', '4,250.75');
        expectInsideAmountField(SEL.clearButton(W));

        openEditorSidebar(W);
        cy.get('#inspector .nav-link:eq(0)').click();
        openAccordion(T.accordionAdditionalActions);
        verifyAndModifyToggleFx(T.loadingState, '{{false}}'); // flips ON. source: currencyinput.js:370
        cy.forceClickOnCanvas();
        cy.get(SEL.clearButton(W)).should('not.exist'); // hidden while loading (CurrencyInput.jsx:137)
        expectInsideAmountField(SEL.loader(W));
    };

    it('[CurrencyInput-BRW-003] Clear button and loader sit inside the amount field — side alignment, left direction', () => {
        placeLabelAndCheckClearThenLoader([]); // defaults side + left. source: currencyinput.js:389-391
    });

    it('[CurrencyInput-BRW-003] Clear button and loader sit inside the amount field — side alignment, right direction', () => {
        placeLabelAndCheckClearThenLoader(['right']);
    });

    it('[CurrencyInput-BRW-003] Clear button and loader sit inside the amount field — top alignment, left direction', () => {
        placeLabelAndCheckClearThenLoader(['top']);
    });

    it('[CurrencyInput-BRW-003] Clear button and loader sit inside the amount field — top alignment, right direction', () => {
        placeLabelAndCheckClearThenLoader(['top', 'right']);
    });
});
