/**
 * SPEC — Date Picker — properties facet.
 * FOR AI: property behaviour that only a real browser shows, from the TESTING.md browser scenarios:
 *   DatePickerV2-BRW-005 — with no value the input shows the configured `placeholder` (datepickerV2.js:58-65,
 *                          default :403) and the empty-value styling: DatepickerInput.jsx:42-47 paints the text with
 *                          var(--cc-placeholder-text) while the value is empty, the field text colour otherwise.
 * Time zone: the browser is pinned to Asia/Kolkata (CDP).
 * Helpers: addDatePickersViaApi, pinBrowserTimezone, openDateAppInViewer, openDatePopup, pickCalendarDay,
 * openEditorSidebar, verifyAndModifyParameter, resolveCssVarColor, expectComputedColor.
 */
import { fake } from "Fixtures/fake";
import { datePickerV2Selector as S } from "Selectors/appBuilder/components/datePickerV2";
import { datePickerV2Text as T } from "Texts/appBuilder/components/datePickerV2";
import { openEditorSidebar, verifyAndModifyParameter } from "Support/utils/commonWidget";
import { resolveCssVarColor, expectComputedColor } from "Support/utils/appBuilder/components/baseInput";
import { addDatePickersViaApi } from "Support/utils/appBuilder/components/datePickerV2";
import {
    pinBrowserTimezone,
    openDateAppInViewer,
    openDatePopup,
    pickCalendarDay,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'dp';
const ON = { value: '{{true}}' };

describe('Date Picker — properties facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DatePickerV2-properties-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── DatePickerV2-BRW-005 ─────────────────────────────────────────────────
    it('[DatePickerV2-BRW-005] An empty field shows the configured placeholder in the placeholder colour; a value replaces it', () => {
        const placeholder = fake.fullName.slice(0, 20); // dynamic: fake
        addDatePickersViaApi([
            {
                name: W,
                layout: { top: 40, left: 2, width: 14, height: 40 },
                properties: {
                    defaultValue: { value: '' }, // empty field
                    showClearBtn: ON, // datepickerV2.js:74-79 — to empty it again from the UI
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
            cy.get(S.input(W)).invoke('val').should('match', /^\d{2}\/\d{2}\/\d{4}$/);
            // the field text colour (selectedTextColor default var(--cc-primary-text) — datepickerV2.js:425)
            resolveCssVarColor('--cc-primary-text', S.root(W)).then((rgb) => expectComputedColor(S.input(W), 'color', rgb));
            resolveCssVarColor('--cc-placeholder-text', S.root(W)).then((rgb) =>
                cy.get(S.input(W)).should(($i) => expect(getComputedStyle($i[0]).color, 'not the placeholder colour').not.to.eq(rgb)));
        };

        // definition default placeholder (datepickerV2.js:403)
        expectPlaceholderState(T.placeholder, 'editor, default placeholder');

        // configured placeholder — array form types it verbatim
        openEditorSidebar(W);
        verifyAndModifyParameter(T.labelPlaceholder, [placeholder]);
        cy.forceClickOnCanvas();
        expectPlaceholderState(placeholder, 'editor, configured placeholder');
        cy.waitForAutoSave();

        // running app: same placeholder; picking a value replaces the empty styling; clearing restores it
        openDateAppInViewer(S.input(W));
        expectPlaceholderState(placeholder, 'viewer');
        openDatePopup(S.input(W));
        pickCalendarDay(12); // dynamic: any day of the (current) shown month
        expectValueState('viewer, after a pick');
        cy.get(S.clearButton(W)).click();
        expectPlaceholderState(placeholder, 'viewer, after clearing');
    });
});
