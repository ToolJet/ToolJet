/**
 * SPEC — Date Range Picker — events facet.
 * FOR AI: TESTING.md browser scenario DaterangePicker-BRW-003 (event half): real focus / blur and the calendar
 * opening / closing fire On focus / On blur (daterangepicker.js:155-156). The widget's focus is
 * `isCalendarOpen || textInputFocus` (useDatetimeInput.js:20) and an effect fires onFocus / onBlur when that flips
 * (useDatetimeInput.js:62-69) — so moving focus from the input INTO the open calendar is not a blur, and the calendar
 * closing after the end date (DaterangePicker.jsx:349) is exactly one blur.
 * The setFocus / setBlur CSA half is in csa.cy.js.
 * Observed through: exact counters (set-variable) — a doubled or missing dispatch fails.
 * Helpers: addDaterangePickersViaApi, pickRangeDay, expectRangeDisplay, openDateAppInViewer, openDatePopup,
 * expectActiveElement, counterEvent, counterText, expectCounter, pinBrowserTimezone, moveMouseAway.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { daterangePickerSelector as S } from "Selectors/appBuilder/components/daterangePicker";
import { daterangePickerText as T } from "Texts/appBuilder/components/daterangePicker";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";
import { addDaterangePickersViaApi, pickRangeDay, expectRangeDisplay } from "Support/utils/appBuilder/components/daterangePicker";
import {
    pinBrowserTimezone,
    openDateAppInViewer,
    openDatePopup,
    expectActiveElement,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'drp';
const BEFORE = 'before';
const beforeInput = `${commonWidgetSelector.draggableWidget(BEFORE)} input`;
const expectFocusBlur = (focuses, blurs) => {
    expectCounter('focuses', 'focuses', focuses);
    expectCounter('blurs', 'blurs', blurs);
};

describe('Date Range Picker — events facet', { testIsolation: false }, () => {
    beforeEach(() => {
        moveMouseAway();
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DaterangePicker-events-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
        addDaterangePickersViaApi([
            { type: 'TextInput', name: BEFORE, layout: { top: 30, left: 2, width: 10, height: 40 } },
            {
                name: W,
                layout: { top: 100, left: 2, width: 12, height: 40 },
                // dynamic: fixed explicit range
                properties: { defaultStartDate: { value: '10/06/2026' }, defaultEndDate: { value: '14/06/2026' } },
                events: [counterEvent('onFocus', 'focuses'), counterEvent('onBlur', 'blurs')], // daterangepicker.js:155-156
            },
            counterText('focuses', 'focuses', { top: 420 }),
            counterText('blurs', 'blurs', { top: 480 }),
        ]);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── DaterangePicker-BRW-003 ──────────────────────────────────────────────
    it('[DaterangePicker-BRW-003] Opening the calendar fires On focus once; it closing after the end date fires On blur once', () => {
        openDateAppInViewer(S.input(W));
        expectFocusBlur(0, 0); // nothing fires on mount

        openDatePopup(S.input(W));
        expectActiveElement(S.input(W), true);
        expectFocusBlur(1, 0);

        // Tab moves real focus from the input into the calendar — still the widget's focus: no blur, no 2nd focus
        cy.realPress('Tab');
        cy.focused().should('have.class', 'react-datepicker__day');
        expectActiveElement(S.input(W), false);
        expectFocusBlur(1, 0);

        // picking the start keeps the calendar open → still focused
        pickRangeDay(0, 16); // dynamic: start
        cy.get(S.rangePopup).should('be.visible');
        expectFocusBlur(1, 0);

        // picking the end closes the calendar → one blur
        pickRangeDay(0, 19); // dynamic: end
        cy.get(P.popup).should('not.exist');
        expectRangeDisplay(W, '16/06/2026', '19/06/2026');
        expectFocusBlur(1, 1);

        // clicking elsewhere afterwards is not a second blur
        cy.get(beforeInput).click();
        expectFocusBlur(1, 1);
    });

    it('[DaterangePicker-BRW-003] Clicking another widget while the calendar is open closes it and fires On blur once', () => {
        openDateAppInViewer(S.input(W));
        openDatePopup(S.input(W));
        expectFocusBlur(1, 0);

        cy.get(beforeInput).click();
        cy.get(P.popup).should('not.exist');
        expectActiveElement(S.input(W), false);
        expectFocusBlur(1, 1);
        expectRangeDisplay(W, '10/06/2026', '14/06/2026'); // nothing picked → range unchanged
    });

    it('[DaterangePicker-BRW-003] Keyboard: tabbing into the field fires On focus, tabbing out fires On blur', () => {
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
