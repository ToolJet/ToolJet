/**
 * SPEC — Currency Input — userflow facet (scenario-scoped).
 * FOR AI: real-browser interaction scenarios from TESTING.md, run in the previewed (running) app:
 *   CurrencyInput-BRW-001 — open the currency list, search by symbol and by country name, pick a currency,
 *                           and the prefix + formattedValue update
 *   CurrencyInput-BRW-004 — real keystrokes: group/decimal separators, the decimal-places limit, out-of-range
 *                           characters, and a disabled Currency Input refusing keyboard entry and Tab focus
 * react-currency-input-field (v3.10.0) reformats on every keystroke, so these are driven with realType.
 * Helpers: addProbeTextWidget, openEditorSidebar, openAccordion, verifyAndModifyParameter,
 * verifyAndModifyToggleFx, openCurrencyMenu, searchCurrency, expectEveryCurrencyOption, selectCurrencyOption,
 * expectCurrencyPrefix, selectInspectorSelectOption, typeAndExpectDisplay, collectTabStops.
 */
import { fake } from "Fixtures/fake";
import { currencyInputSelector } from "Selectors/appBuilder/components/currencyInput";
import { currencyInputText } from "Texts/appBuilder/components/currencyInput";
import {
    openEditorSidebar,
    openAccordion,
    verifyAndModifyParameter,
    verifyAndModifyToggleFx,
} from "Support/utils/commonWidget";
import {
    openCurrencyMenu,
    searchCurrency,
    expectEveryCurrencyOption,
    selectCurrencyOption,
    expectCurrencyPrefix,
    selectInspectorSelectOption,
    typeAndExpectDisplay,
    collectTabStops,
    addProbeTextWidget,
} from "Support/utils/appBuilder/components/currencyInput";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = currencyInputText.defaultWidgetName;
const T = currencyInputText;
const SEL = currencyInputSelector;
const textWidget = `[data-cy="draggable-widget-${T.textWidgetName}"]`;

const expectProbeText = (text) => {
    cy.get(textWidget).should(($t) => expect($t.text().trim(), "probe Text widget").to.eq(text));
};

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Currency Input — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-CurrencyInput-userflow-${Cypress._.uniqueId()}`);
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── CurrencyInput-BRW-001 ────────────────────────────────────────────────
    // CountrySelect.jsx:104-111 toggles the menu on click in the viewer; the filter (CurrencyInput.jsx:311-316)
    // matches the option label (`<prefix> (<code>)`) or the country name; onChange sets the country, which
    // re-publishes formattedValue = `${prefix} ${formatValue(value)}` (CurrencyInput.jsx:217-225).
    it('[CurrencyInput-BRW-001] Opens the currency list, searches by symbol and country, picks a currency; prefix and formatted value update', () => {
        addProbeTextWidget(`components.${W}.formattedValue`);
        cy.openPreview(SEL.input(W));

        typeAndExpectDisplay(W, '1234.5', '1,234.5'); // dynamic: test amount
        expectCurrencyPrefix(W, T.usd.prefix); // default US. source: CurrencyInput.jsx:69
        expectProbeText(`${T.usd.prefix} 1,234.5`);

        // search by symbol → only £-currencies, GBP among them; USD filtered out
        openCurrencyMenu(W).then((id) => {
            searchCurrency(id, T.gbp.prefix);
            expectEveryCurrencyOption(id, (text) => text.includes(T.gbp.prefix), `contains ${T.gbp.prefix}`);
            cy.contains(SEL.option(id), T.gbp.option).should('be.visible');
            cy.contains(SEL.option(id), T.usd.option).should('not.exist');
            selectCurrencyOption(id, T.gbp.option);
        });
        expectCurrencyPrefix(W, T.gbp.prefix);
        expectProbeText(`${T.gbp.prefix} 1,234.5`);
        cy.get(SEL.input(W)).should('have.value', '1,234.5');

        // search by country name (case-insensitive) → only Japan's yen
        cy.get('body').realClick({ position: 'bottomRight' }); // close the menu if it is still open
        openCurrencyMenu(W).then((id) => {
            searchCurrency(id, T.jpy.country.toLowerCase());
            cy.get(SEL.option(id)).should('have.length', 1).and('contain.text', T.jpy.option);
            selectCurrencyOption(id, T.jpy.option);
        });
        expectCurrencyPrefix(W, T.jpy.prefix);
        expectProbeText(`${T.jpy.prefix} 1,234.5`);
        cy.get(SEL.input(W)).should('have.value', '1,234.5');
    });

    // ── CurrencyInput-BRW-004 (default US format, 2 decimals) ────────────────
    // CurrencyInput.jsx:78-87 → allowDecimals/decimalsLimit + groupSeparator ',' / decimalSeparator '.' / en-US.
    it('[CurrencyInput-BRW-004] Typing groups digits, caps decimals, drops stray characters and separators (US format)', () => {
        addProbeTextWidget(`components.${W}.value`);
        cy.openPreview(SEL.input(W));

        cy.get(SEL.input(W)).should('have.value', T.defaultDisplay); // source: currencyinput.js:363
        // grouping is applied while typing
        typeAndExpectDisplay(W, '1234567', '1,234,567'); // dynamic: test amount
        expectProbeText('1234567');
        // a third decimal is refused (decimalPlaces '2'). source: currencyinput.js:375
        typeAndExpectDisplay(W, '1234567.891', '1,234,567.89');
        expectProbeText('1234567.89');
        // letters and symbols are dropped; a typed group separator is re-flowed, not kept
        typeAndExpectDisplay(W, '12x#3', '123');
        typeAndExpectDisplay(W, '1,,0,00', '1,000');
        expectProbeText('1000');
        // a second decimal separator is ignored
        typeAndExpectDisplay(W, '5.2.5', '5.25');
        // negative amounts are allowed
        typeAndExpectDisplay(W, '-42', '-42');
        expectProbeText('-42');
    });

    // ── CurrencyInput-BRW-004 (Decimal places 0) ─────────────────────────────
    // resolveDecimalPlaces('0') → allowDecimals false (CurrencyInput.jsx:78-81): the separator itself is refused.
    it('[CurrencyInput-BRW-004] With Decimal places 0 the decimal separator is refused', () => {
        openEditorSidebar(W);
        verifyAndModifyParameter(T.decimalPlaces, '0'); // dynamic: whole-number currency (default '2' — currencyinput.js:375)
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.openPreview(SEL.input(W));

        typeAndExpectDisplay(W, '12.5', '125');
        typeAndExpectDisplay(W, '9876.', '9,876');
    });

    // ── CurrencyInput-BRW-004 (European format) ──────────────────────────────
    // NUMBER_FORMATS.eu: groupSeparator '.', decimalSeparator ',' (PhoneCurrency/constants.js:7)
    it('[CurrencyInput-BRW-004] European number format swaps the separators while typing', () => {
        openEditorSidebar(W);
        selectInspectorSelectOption(T.numberFormat, T.numberFormatEuropean);
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.openPreview(SEL.input(W));

        typeAndExpectDisplay(W, '1234567,891', '1.234.567,89');
        // '.' is the group separator in this format: typing it does not start decimals
        typeAndExpectDisplay(W, '12.5', '125');
    });

    // ── CurrencyInput-BRW-004 (disabled) ─────────────────────────────────────
    // 4f159069c7: `disabled={disabledState}` on the amount field (CurrencyInput.jsx:355) and react-select
    // isDisabled on the picker (CountrySelect.jsx:158) → neither keyboard entry nor a Tab stop.
    it('[CurrencyInput-BRW-004] A disabled Currency Input accepts no keyboard entry and is skipped by Tab', () => {
        const tabPresses = 4; // dynamic: enough Tab presses to walk past the widget
        const widget = SEL.draggableWidget(W);
        const fromInput = `[data-cy="${T.textInputWidgetName}-input"]`;

        // a focusable widget above the Currency Input to tab from
        cy.forceClickOnCanvas();
        cy.dragAndDropWidget(T.textInputDisplayName, 400, 80);
        cy.forceClickOnCanvas();

        // control: enabled → Tab reaches the widget and typing lands
        cy.openPreview(SEL.input(W));
        collectTabStops(fromInput, widget, tabPresses).then((stops) => {
            expect(stops.some((s) => s.inside), `enabled: a Tab stop is inside the widget ${JSON.stringify(stops)}`).to.be.true;
        });

        // disable it (back in the editor)
        cy.openApp('', Cypress.env('workspaceId'), Cypress.env('appId'), SEL.input(W));
        openEditorSidebar(W);
        openAccordion(T.accordionAdditionalActions);
        verifyAndModifyToggleFx(T.disable, '{{false}}'); // flips ON. source: currencyinput.js:369
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        cy.openPreview(SEL.input(W));
        cy.get(SEL.input(W)).should('be.disabled').and('have.value', T.defaultDisplay);
        cy.get(SEL.input(W)).realClick().realType('987'); // dynamic: keystrokes that must not land
        cy.get(SEL.input(W)).should('have.value', T.defaultDisplay).and('not.be.focused');
        collectTabStops(fromInput, widget, tabPresses).then((stops) => {
            expect(stops.every((s) => !s.inside), `disabled: no Tab stop inside the widget ${JSON.stringify(stops)}`).to.be.true;
        });
    });
});
