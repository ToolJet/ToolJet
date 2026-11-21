/**
 * SPEC — Date Time Picker — events facet.
 * FOR AI: TESTING.md browser scenario DatetimePickerV2-BRW-004 (event half): real focus / blur fire On focus /
 * On blur (datetimepickerV2.js:153-154). The widget's focus is `isCalendarOpen || textInputFocus`
 * (useDatetimeInput.js:20) and an effect fires onFocus / onBlur when that flips (useDatetimeInput.js:62-69) — so
 * moving focus INTO the open popup is not a blur, and closing the popup + leaving the input is exactly one blur.
 * The setFocus / setBlur CSA half is in csa.cy.js.
 * Observed through: exact counters (set-variable) — a doubled or missing dispatch fails.
 * Helpers: addDatetimePickersViaApi, openDateAppInViewer, openDatePopup, pickCalendarDay, expectActiveElement,
 * counterEvent, counterText, expectCounter, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { datetimePickerV2Selector as S } from "Selectors/appBuilder/components/datetimePickerV2";
import { datetimePickerV2Text as T } from "Texts/appBuilder/components/datetimePickerV2";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { addDatetimePickersViaApi } from "Support/utils/appBuilder/components/datetimePickerV2";
import {
    pinBrowserTimezone,
    openDateAppInViewer,
    openDatePopup,
    pickCalendarDay,
    expectActiveElement,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'dtp';
const BEFORE = 'before';
const beforeInput = `${commonWidgetSelector.draggableWidget(BEFORE)} input`;
const expectFocusBlur = (focuses, blurs) => {
    expectCounter('focuses', 'focuses', focuses);
    expectCounter('blurs', 'blurs', blurs);
};

describe('Date Time Picker — events facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DatetimePickerV2-events-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
        addDatetimePickersViaApi([
            { type: 'TextInput', name: BEFORE, layout: { top: 30, left: 2, width: 10, height: 40 } },
            {
                name: W,
                layout: { top: 100, left: 2, width: 10, height: 40 },
                properties: { defaultValue: { value: '15/06/2026 10:30' } }, // dynamic: fixed explicit date
                events: [counterEvent('onFocus', 'focuses'), counterEvent('onBlur', 'blurs')], // datetimepickerV2.js:153-154
            },
            counterText('focuses', 'focuses', { top: 420 }),
            counterText('blurs', 'blurs', { top: 480 }),
        ]);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── DatetimePickerV2-BRW-004 ─────────────────────────────────────────────
    it('[DatetimePickerV2-BRW-004] Clicking into the field fires On focus once; leaving the picker fires On blur once', () => {
        openDateAppInViewer(S.input(W));
        expectFocusBlur(0, 0); // nothing fires on mount

        openDatePopup(S.input(W));
        expectActiveElement(S.input(W), true);
        expectFocusBlur(1, 0);

        // working inside the open popup keeps the widget focused — no blur, no second focus
        pickCalendarDay(20); // dynamic: another day
        cy.get(P.calendar).should('be.visible');
        expectFocusBlur(1, 0);

        // clicking another widget closes the popup and leaves the field → one blur
        cy.get(beforeInput).click();
        cy.get(P.popup).should('not.exist');
        expectActiveElement(S.input(W), false);
        expectFocusBlur(1, 1);
    });

    it('[DatetimePickerV2-BRW-004] Keyboard: tabbing into the field fires On focus, tabbing out fires On blur', () => {
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
