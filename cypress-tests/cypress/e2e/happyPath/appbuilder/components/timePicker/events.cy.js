/**
 * SPEC — Time Picker — events facet.
 * FOR AI: TESTING.md browser scenario TimePicker-BRW-003 (event half): real focus / blur, and opening / closing the
 * selector, fire On focus / On blur (timepicker.js:125-126). The widget's focus is `isCalendarOpen || textInputFocus`
 * (useDatetimeInput.js:20) and an effect fires onFocus / onBlur when that flips (useDatetimeInput.js:62-69) — so
 * clicking a time item inside the open popup (DOM focus leaves the input) is not a blur, and closing the popup +
 * leaving the input is exactly one blur. The setFocus / setBlur CSA half is in csa.cy.js.
 * Observed through: exact counters (set-variable) — a doubled or missing dispatch fails.
 * Helpers: addTimePickersViaApi, openDateAppInViewer, openDatePopup, pickTimeItem, expectActiveElement,
 * counterEvent, counterText, expectCounter, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { timePickerSelector as S } from "Selectors/appBuilder/components/timePicker";
import { timePickerText as T } from "Texts/appBuilder/components/timePicker";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { addTimePickersViaApi } from "Support/utils/appBuilder/components/timePicker";
import {
    pinBrowserTimezone,
    openDateAppInViewer,
    openDatePopup,
    pickTimeItem,
    expectActiveElement,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'tp';
const BEFORE = 'before';
const AFTER = 'after';
const beforeInput = `${commonWidgetSelector.draggableWidget(BEFORE)} input`;
const afterInput = `${commonWidgetSelector.draggableWidget(AFTER)} input`;
const expectFocusBlur = (focuses, blurs) => {
    expectCounter('focuses', 'focuses', focuses);
    expectCounter('blurs', 'blurs', blurs);
};

describe('Time Picker — events facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TimePicker-events-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
        addTimePickersViaApi([
            { type: 'TextInput', name: BEFORE, layout: { top: 30, left: 2, width: 10, height: 40 } },
            {
                name: W,
                layout: { top: 100, left: 2, width: 10, height: 40 },
                properties: { defaultValue: { value: '10:30' } }, // dynamic: fixed explicit time
                events: [counterEvent('onFocus', 'focuses'), counterEvent('onBlur', 'blurs')], // timepicker.js:125-126
            },
            { type: 'TextInput', name: AFTER, layout: { top: 170, left: 2, width: 10, height: 40 } },
            counterText('focuses', 'focuses', { top: 420 }),
            counterText('blurs', 'blurs', { top: 480 }),
        ]);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── TimePicker-BRW-003 ───────────────────────────────────────────────────
    it('[TimePicker-BRW-003] Clicking into the field fires On focus once; picking inside the selector does not blur; leaving fires On blur once', () => {
        openDateAppInViewer(S.input(W));
        expectFocusBlur(0, 0); // nothing fires on mount

        openDatePopup(S.input(W));
        expectActiveElement(S.input(W), true);
        expectFocusBlur(1, 0);

        // working inside the open popup keeps the widget focused — no blur, no second focus
        pickTimeItem(0, '14'); // dynamic: hour
        cy.get(S.input(W)).should('have.value', '14:30');
        cy.get(P.calendar).should('be.visible');
        expectFocusBlur(1, 0);

        // clicking another widget closes the popup and leaves the field → one blur
        cy.get(beforeInput).click();
        cy.get(P.popup).should('not.exist');
        expectActiveElement(S.input(W), false);
        expectFocusBlur(1, 1);
    });

    it('[TimePicker-BRW-003] Keyboard: tabbing into the field fires On focus, tabbing out fires On blur (both directions)', () => {
        openDateAppInViewer(S.input(W));
        cy.get(beforeInput).click();
        expectFocusBlur(0, 0);

        cy.realPress('Tab');
        expectActiveElement(S.input(W), true); // Tab reaches the field
        expectFocusBlur(1, 0);

        cy.realPress('Tab');
        expectActiveElement(afterInput, true);
        cy.get(P.popup).should('not.exist');
        expectFocusBlur(1, 1);

        cy.realPress(['Shift', 'Tab']);
        expectActiveElement(S.input(W), true);
        expectFocusBlur(2, 1);

        cy.realPress(['Shift', 'Tab']);
        expectActiveElement(beforeInput, true);
        expectFocusBlur(2, 2);
    });
});
