/**
 * SPEC — Date Range Picker — properties facet.
 * FOR AI: property behaviour that only a real browser shows, from the TESTING.md browser scenario:
 *   DaterangePicker-BRW-005 — with no range the input shows the configured `placeholder` (daterangepicker.js:55-61,
 *                             default 'Select Date Range' :428 / DaterangePicker.jsx:28) and the empty-value styling:
 *                             DatepickerInput.jsx:42-47 paints the text with var(--cc-placeholder-text) while the value
 *                             is empty, the field text colour otherwise.
 * Time zone: the browser is pinned to Asia/Kolkata through CDP; all dates are explicit.
 * Helpers: addDaterangePickersViaApi, pickRangeDay, expectRangeDisplay, pinBrowserTimezone, openDateAppInViewer,
 * openDatePopup, openEditorSidebar, verifyAndModifyParameter, resolveCssVarColor, expectComputedColor.
 */
import { fake } from "Fixtures/fake";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { daterangePickerSelector as S } from "Selectors/appBuilder/components/daterangePicker";
import { daterangePickerText as T } from "Texts/appBuilder/components/daterangePicker";
import { openEditorSidebar, verifyAndModifyParameter } from "Support/utils/commonWidget";
import { resolveCssVarColor, expectComputedColor } from "Support/utils/appBuilder/components/baseInput";
import { addDaterangePickersViaApi, pickRangeDay } from "Support/utils/appBuilder/components/daterangePicker";
import {
    pinBrowserTimezone,
    openDateAppInViewer,
    openDatePopup,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'drp';
const ON = { value: '{{true}}' };

describe('Date Range Picker — properties facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DaterangePicker-properties-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── DaterangePicker-BRW-005 ──────────────────────────────────────────────
    it('[DaterangePicker-BRW-005] An empty range shows the configured placeholder in the placeholder colour; a range replaces it', () => {
        const placeholder = fake.fullName.slice(0, 24); // dynamic: fake
        addDaterangePickersViaApi([
            {
                name: W,
                layout: { top: 40, left: 2, width: 14, height: 40 },
                properties: {
                    defaultStartDate: { value: '' }, // empty range
                    defaultEndDate: { value: '' },
                    showClearBtn: ON, // daterangepicker.js:93-98 — to empty it again from the UI
                },
            },
        ]);
        cy.openApp('', undefined, undefined, S.input(W));

        const expectPlaceholderState = (text, context) => {
            cy.log(`placeholder — ${context}`);
            cy.get(S.input(W)).should('have.value', '').and('have.attr', 'placeholder', text);
            resolveCssVarColor('--cc-placeholder-text', S.root(W)).then((rgb) => {
                expectComputedColor(S.input(W), 'color', rgb);
                cy.get(S.input(W)).should(($i) =>
                    expect(getComputedStyle($i[0], '::placeholder').color, '::placeholder colour').to.eq(rgb));
            });
        };
        const expectValueState = (context) => {
            cy.log(`value — ${context}`);
            cy.get(S.input(W)).invoke('val').should('match', /^\d{2}\/\d{2}\/\d{4} → \d{2}\/\d{2}\/\d{4}$/);
            // the field text colour (selectedTextColor default var(--cc-primary-text) — daterangepicker.js:456)
            resolveCssVarColor('--cc-primary-text', S.root(W)).then((rgb) => expectComputedColor(S.input(W), 'color', rgb));
            resolveCssVarColor('--cc-placeholder-text', S.root(W)).then((rgb) =>
                cy.get(S.input(W)).should(($i) => expect(getComputedStyle($i[0]).color, 'not the placeholder colour').not.to.eq(rgb)));
        };

        // definition default placeholder (daterangepicker.js:428)
        expectPlaceholderState(T.placeholder, 'editor, default placeholder');

        // configured placeholder — array form types it verbatim
        openEditorSidebar(W);
        verifyAndModifyParameter(T.labelPlaceholder, [placeholder]);
        cy.forceClickOnCanvas();
        expectPlaceholderState(placeholder, 'editor, configured placeholder');
        cy.waitForAutoSave();

        // running app: same placeholder; a start alone already replaces it; a full range keeps the value styling;
        // clearing restores the placeholder
        openDateAppInViewer(S.input(W));
        expectPlaceholderState(placeholder, 'viewer');
        openDatePopup(S.input(W));
        pickRangeDay(0, 10); // dynamic: any days of the (current) shown month
        cy.get(S.input(W)).invoke('val').should('match', /^\d{2}\/\d{2}\/\d{4} → $/);
        pickRangeDay(0, 12);
        cy.get(P.popup).should('not.exist');
        expectValueState('viewer, after a range pick');
        cy.get(S.clearButton(W)).click();
        expectPlaceholderState(placeholder, 'viewer, after clearing');
    });
});
