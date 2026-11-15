/**
 * SPEC — Date Picker — events facet.
 * FOR AI: TESTING.md browser scenario DatePickerV2-BRW-003 (event half): real focus / blur fire On focus /
 * On blur (datepickerV2.js:137-138). The widget's focus is `isCalendarOpen || textInputFocus`
 * (useDatetimeInput.js:20) and an effect fires onFocus / onBlur when that flips (useDatetimeInput.js:62-69) — so
 * clicking a day in the open calendar is not a blur, and closing the calendar + leaving the input is exactly one blur.
 * The setFocus / setBlur CSA half is in csa.cy.js.
 * Observed through: exact counters (set-variable) — a doubled or missing dispatch fails.
 * Helpers: addDatePickersViaApi, openDateAppInViewer, openDatePopup, pickCalendarDay, expectActiveElement,
 * counterEvent, counterText, expectCounter, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { datePickerV2Selector as S } from "Selectors/appBuilder/components/datePickerV2";
import { datePickerV2Text as T } from "Texts/appBuilder/components/datePickerV2";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { addDatePickersViaApi } from "Support/utils/appBuilder/components/datePickerV2";
import {
    pinBrowserTimezone,
    openDateAppInViewer,
    openDatePopup,
    pickCalendarDay,
    expectActiveElement,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'dp';
const BEFORE = 'before';
const beforeInput = `${commonWidgetSelector.draggableWidget(BEFORE)} input`;
const expectFocusBlur = (focuses, blurs) => {
    expectCounter('focuses', 'focuses', focuses);
    expectCounter('blurs', 'blurs', blurs);
};

describe('Date Picker — events facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DatePickerV2-events-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
        addDatePickersViaApi([
            { type: 'TextInput', name: BEFORE, layout: { top: 30, left: 2, width: 10, height: 40 } },
            {
                name: W,
                layout: { top: 100, left: 2, width: 10, height: 40 },
                properties: { defaultValue: { value: '15/06/2026' } }, // dynamic: fixed explicit date
                events: [counterEvent('onFocus', 'focuses'), counterEvent('onBlur', 'blurs')], // datepickerV2.js:137-138
            },
            counterText('focuses', 'focuses', { top: 420 }),
            counterText('blurs', 'blurs', { top: 480 }),
        ]);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── DatePickerV2-BRW-003 ─────────────────────────────────────────────────
    it('[DatePickerV2-BRW-003] Clicking into the field fires On focus once; leaving the picker fires On blur once', () => {
        openDateAppInViewer(S.input(W));
        expectFocusBlur(0, 0); // nothing fires on mount

        openDatePopup(S.input(W));
        expectActiveElement(S.input(W), true);
        expectFocusBlur(1, 0);

        // working inside the open calendar keeps the widget focused — no blur, no second focus
        pickCalendarDay(20); // dynamic: another day
        cy.get(S.input(W)).should('have.value', '20/06/2026');
        cy.get(P.calendar).should('be.visible');
        expectFocusBlur(1, 0);

        // clicking another widget closes the calendar and leaves the field → one blur
        cy.get(beforeInput).click();
        cy.get(P.popup).should('not.exist');
        expectActiveElement(S.input(W), false);
        expectFocusBlur(1, 1);
    });

    it('[DatePickerV2-BRW-003] Keyboard: tabbing into the field fires On focus, tabbing out fires On blur', () => {
        openDateAppInViewer(S.input(W));
        cy.get(beforeInput).click();
        expectFocusBlur(0, 0);

        cy.realPress('Tab');
        expectActiveElement(S.input(W), true); // Tab reaches the field
        expectFocusBlur(1, 0);

        cy.realPress('Tab');
        expectActiveElement(S.input(W), false);
        cy.get(P.popup).should('not.exist');
        expectFocusBlur(1, 1);
    });
});
