/**
 * SPEC — Date Picker — csa facet.
 * FOR AI: TESTING.md browser scenario DatePickerV2-BRW-003 (CSA half): setFocus / setBlur
 * (datepickerV2.js:200-207) drive REAL focus. useDatetimeInput.js:90-97 sets isCalendarOpen + textInputFocus;
 * the effects at :50-60 call input.focus()/blur() and datePicker.setOpen(); :62-69 fire onFocus / onBlur.
 * setFocus is wired to a Button (a click never focuses the picker by itself). setBlur is wired to the picker's
 * own On select, so it runs while the calendar is open WITHOUT any outside click (an outside click would close
 * the calendar on its own — no proof). Control: a second picker without the handler stays open after a pick.
 * Helpers: addDatePickersViaApi, csaEvent, openDateAppInViewer, openDatePopup, pickCalendarDay,
 * expectActiveElement, counterEvent, counterText, expectCounter, pinBrowserTimezone.
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
    csaEvent,
    openDateAppInViewer,
    openDatePopup,
    pickCalendarDay,
    expectActiveElement,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'dp';
const CTL = 'ctl';
const expectFocusBlur = (focuses, blurs) => {
    expectCounter('focuses', 'focuses', focuses);
    expectCounter('blurs', 'blurs', blurs);
};

describe('Date Picker — csa facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DatePickerV2-csa-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── DatePickerV2-BRW-003 ─────────────────────────────────────────────────
    it('[DatePickerV2-BRW-003] setFocus focuses the input and opens the calendar; setBlur blurs it and closes the calendar', () => {
        addDatePickersViaApi([
            {
                name: W,
                layout: { top: 40, left: 2, width: 10, height: 40 },
                properties: { defaultValue: { value: '15/06/2026' } }, // dynamic: fixed explicit date
                events: [
                    counterEvent('onFocus', 'focuses'),
                    counterEvent('onBlur', 'blurs'),
                    csaEvent('onSelect', W, 'setBlur'), // datepickerV2.js:205
                ],
            },
            {
                name: CTL, // control: same picker, no setBlur handler
                layout: { top: 40, left: 22, width: 10, height: 40 },
                properties: { defaultValue: { value: '15/06/2026' } },
            },
            {
                type: 'Button',
                name: 'focusbtn',
                layout: { top: 120, left: 2, width: 6, height: 40 },
                properties: { text: { value: 'Focus' } },
                events: [csaEvent('onClick', W, 'setFocus')], // datepickerV2.js:201
            },
            counterText('focuses', 'focuses', { top: 420 }),
            counterText('blurs', 'blurs', { top: 480 }),
        ]);
        openDateAppInViewer(S.input(W));
        expectFocusBlur(0, 0);

        // control: without setBlur, a pick leaves the calendar open
        openDatePopup(S.input(CTL));
        pickCalendarDay(20);
        cy.get(S.input(CTL)).should('have.value', '20/06/2026');
        cy.get(P.calendar).should('be.visible');
        cy.get(commonWidgetSelector.draggableWidget('blurs')).click(); // outside click closes it
        cy.get(P.popup).should('not.exist');
        expectFocusBlur(0, 0); // the other picker's focus is not ours

        // setFocus from a Button: the picker input takes real focus and its calendar opens
        cy.get(`${commonWidgetSelector.draggableWidget('focusbtn')} button`).click();
        expectActiveElement(S.input(W), true);
        cy.get(P.calendar).should('be.visible');
        cy.get(P.selectedDay).should('have.text', '15'); // it is THIS picker's calendar
        expectFocusBlur(1, 0);

        // setBlur from On select: the calendar closes and the input loses focus, with no outside click
        pickCalendarDay(22); // dynamic: another day
        cy.get(S.input(W)).should('have.value', '22/06/2026');
        cy.get(P.popup).should('not.exist');
        expectActiveElement(S.input(W), false);
        expectFocusBlur(1, 1);
    });
});
