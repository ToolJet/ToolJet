/**
 * SPEC — Phone Input — userflow facet (scenario-scoped).
 * FOR AI: real pointer + keyboard interaction in a running (previewed) app, from TESTING.md:
 *   PhoneInput-BRW-001 — open the country list, search it / scroll it, pick a country → the dial code changes and
 *                        the number is re-based onto it (field keeps the national digits, `value` gets the new code)
 *   PhoneInput-BRW-004 — Tab reaches the country select and the number field; a disabled Phone Input takes
 *                        neither keyboard entry nor tab focus
 * The published `value` is observed through a Text Input whose Default value is bound to it ("mirror").
 * Helpers: openEditorSidebar, openAccordion, verifyAndModifyToggleFx, verifyAndModifyParameter, openCountryMenu,
 * selectCountryOption, expectDialCode, expectInputDigits, expectActiveElementWithin, expectActiveElementOutside.
 */
import { fake } from "Fixtures/fake";
import { phoneInputSelector } from "Selectors/appBuilder/components/phoneInput";
import { phoneInputText } from "Texts/appBuilder/components/phoneInput";
import {
    openEditorSidebar,
    openAccordion,
    verifyAndModifyToggleFx,
    verifyAndModifyParameter,
} from "Support/utils/commonWidget";
import {
    openCountryMenu,
    selectCountryOption,
    expectDialCode,
    expectInputDigits,
    expectActiveElementWithin,
    expectActiveElementOutside,
} from "Support/utils/appBuilder/components/phoneInput";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = phoneInputText.defaultWidgetName;
const T = phoneInputText;
const SEL = phoneInputSelector;
const TI = T.textInputWidgetName; // the Text Input placed above the Phone Input
const tiInput = SEL.input(TI); // same `<name>-input` data-cy scheme (BaseInput.jsx)

// dynamic: a US national number (NANP 201-555-xxxx), digits only
const nationalNumber = () => `201555${Cypress._.random(1000, 9999)}`;

// testIsolation:false — cypress-real-dnd caches its CDP client for the spec run.
describe('Phone Input — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PhoneInput-userflow-${Cypress._.uniqueId()}`);
        cy.openApp();
        // a Text Input ABOVE the Phone Input: the Tab starting point, and the `value` mirror for BRW-001
        cy.dragAndDropWidget(T.textInputDisplayName, 400, 100);
        cy.dragAndDropWidget(T.displayName, 400, 250);
        closeQueryPanel();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    const mirrorPhoneValueIntoTextInput = () => {
        openEditorSidebar(TI);
        verifyAndModifyParameter(T.defaultValue, `{{components.${W}.value}}`); // Text Input "Default value"
        cy.forceClickOnCanvas();
    };

    // ── PhoneInput-BRW-001 ───────────────────────────────────────────────────
    // CountrySelect.jsx:105-111: in view mode the wrapper's onClick toggles `menuIsOpen`; the menu is a
    // react-select portalled into <body> (CountrySelect.jsx:134) with a search box (CustomMenuList.jsx:23).
    // Picking a country re-bases the current number onto the new calling code (PhoneInput.jsx:120-134); the
    // field shows the national digits only (international, no withCountryCallingCode — PhoneInput.jsx:320-323).
    it('[PhoneInput-BRW-001] Search the country list, pick a country — dial code and number re-base', () => {
        const digits = nationalNumber();
        mirrorPhoneValueIntoTextInput();
        cy.waitForAutoSave();
        cy.openPreview(SEL.input(W));

        expectDialCode(W, T.defaultDialCode); // US by default (PhoneInput.jsx:66)
        cy.get(SEL.input(W)).realClick();
        cy.get(SEL.input(W)).type(digits);
        expectInputDigits(W, digits);
        cy.get(tiInput).should('have.value', `${T.defaultDialCode}${digits}`);

        openCountryMenu(W).then((id) => {
            cy.get(SEL.menuSearch(id)).realClick();
            cy.get(SEL.menuSearch(id)).type(T.searchCountry.query);
            // the search narrows the list to the matching country
            cy.get(SEL.option(id)).should('have.length', 1).and('contain.text', T.searchCountry.optionLabel);
            selectCountryOption(id, T.searchCountry.optionLabel);
        });

        expectDialCode(W, T.searchCountry.dialCode);
        // the same national number now sits on the new calling code
        expectInputDigits(W, digits);
        cy.get(tiInput).should('have.value', `${T.searchCountry.dialCode}${digits}`);
    });

    it('[PhoneInput-BRW-001] Scroll the country list, pick a country far down — dial code and number re-base', () => {
        const digits = nationalNumber();
        mirrorPhoneValueIntoTextInput();
        cy.waitForAutoSave();
        cy.openPreview(SEL.input(W));

        cy.get(SEL.input(W)).realClick();
        cy.get(SEL.input(W)).type(digits);
        cy.get(tiInput).should('have.value', `${T.defaultDialCode}${digits}`);

        openCountryMenu(W).then((id) => {
            // the target starts below the visible part of the list
            cy.contains(SEL.option(id), T.scrollCountry.optionLabel).then(($opt) => {
                cy.get(SEL.menuList(id)).should(($list) => {
                    const list = $list[0].getBoundingClientRect();
                    expect($opt[0].getBoundingClientRect().top, 'option starts below the visible list').to.be.gt(list.bottom);
                });
            });
            // scroll the list itself to the bottom
            cy.get(SEL.menuList(id)).scrollTo('bottom');
            cy.get(SEL.menuList(id)).should(($list) => expect($list[0].scrollTop, 'list scrolled').to.be.gt(0));
            cy.contains(SEL.option(id), T.scrollCountry.optionLabel).should('be.visible');
            selectCountryOption(id, T.scrollCountry.optionLabel);
        });

        expectDialCode(W, T.scrollCountry.dialCode);
        expectInputDigits(W, digits);
        cy.get(tiInput).should('have.value', `${T.scrollCountry.dialCode}${digits}`);
    });

    // ── PhoneInput-BRW-004 ───────────────────────────────────────────────────
    // KNOWN PRODUCT BUG (kept RED on purpose): the country select is not a Tab stop. CustomValueContainer.jsx:17-33
    // passes its own children to react-select's ValueContainer, which drops the `renderInput()` child react-select
    // puts there — the only focusable element of the select — so Tab goes straight from the previous widget to the
    // tel input.
    it('[PhoneInput-BRW-004] Tab from the previous widget stops on the country select, then on the number field', () => {
        cy.waitForAutoSave();
        cy.openPreview(SEL.input(W));

        cy.get(tiInput).realClick();
        cy.get(tiInput).should('be.focused');
        cy.realPress('Tab');
        expectActiveElementWithin(SEL.countrySelect(W));
        cy.realPress('Tab');
        cy.get(SEL.input(W)).should('be.focused');
    });

    it('[PhoneInput-BRW-004] Tab reaches the number field and the field takes keyboard entry', () => {
        const digits = nationalNumber();
        cy.waitForAutoSave();
        cy.openPreview(SEL.input(W));

        cy.get(tiInput).realClick();
        cy.get(tiInput).should('be.focused');
        cy.realPress('Tab');
        // the country select may take one Tab stop first (the BRW-004 test above owns that order)
        cy.document().then((doc) => {
            if (Cypress.$(SEL.countrySelect(W))[0].contains(doc.activeElement)) cy.realPress('Tab');
        });
        cy.get(SEL.input(W)).should('be.focused');
        cy.realType(digits);
        expectInputDigits(W, digits);
    });

    // 4f159069c7 / PhoneInput.jsx:329 put `disabled` on the tel input; CountrySelect.jsx:158 disables the picker.
    it('[PhoneInput-BRW-004] A disabled Phone Input takes neither keyboard entry nor tab focus', () => {
        // a Text Input BELOW the Phone Input: the next Tab stop after it. Without one, the Tab off the first input
        // leaves the app document, and where Shift+Tab lands from there differs between Chrome and Electron.
        const afterInput = SEL.input('textinput2'); // dynamic: the second dropped Text Input
        cy.dragAndDropWidget(T.textInputDisplayName, 400, 400);
        cy.get(afterInput).should('exist');
        openEditorSidebar(W);
        openAccordion(T.accordionAdditionalActions);
        verifyAndModifyToggleFx(T.disable, '{{false}}'); // flips ON. source: phoneinput.js:77
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();
        cy.openPreview(SEL.input(W));

        cy.get(SEL.input(W)).should('be.disabled').and('have.value', '');
        // Tab from the previous widget skips the whole Phone Input and lands on the next widget; Shift+Tab skips it back
        cy.get(tiInput).realClick();
        cy.get(tiInput).should('be.focused');
        cy.realPress('Tab');
        expectActiveElementOutside(SEL.field(W));
        cy.get(afterInput).should('be.focused');
        cy.realPress(['Shift', 'Tab']);
        expectActiveElementOutside(SEL.field(W));
        cy.get(tiInput).should('be.focused');

        // pointer + keyboard entry is ignored
        cy.get(SEL.input(W)).realClick();
        cy.get(SEL.input(W)).should('not.be.focused');
        cy.realType(nationalNumber());
        cy.get(SEL.input(W)).should('have.value', '');
        // the country picker does not open either
        cy.get(SEL.countrySelect(W)).realClick();
        cy.get(SEL.anyCountryMenu).should('not.exist');
        expectDialCode(W, T.defaultDialCode);
    });
});
