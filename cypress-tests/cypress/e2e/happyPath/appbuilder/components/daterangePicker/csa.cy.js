/**
 * SPEC — Date Range Picker — csa facet.
 * FOR AI: TESTING.md browser scenario DaterangePicker-BRW-003 (CSA half): setFocus / setBlur
 * (daterangepicker.js:230-237) drive REAL focus. useDatetimeInput.js:90-97 sets isCalendarOpen + textInputFocus;
 * the effects at :50-60 call input.focus()/blur() and datePicker.setOpen(); :62-69 fire onFocus / onBlur.
 * setFocus is wired to a Button (a click never focuses the picker by itself). setBlur is wired to the picker's
 * own On select, so it runs after the START pick — when a range picker otherwise keeps its calendar open — without
 * any outside click. Control: a second picker without the handler stays open after a start pick.
 * Helpers: addDaterangePickersViaApi, pickRangeDay, expectDayCells, expectRangeDisplay, csaEvent, openDateAppInViewer,
 * openDatePopup, expectActiveElement, counterEvent, counterText, expectCounter, pinBrowserTimezone, moveMouseAway.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { daterangePickerSelector as S } from "Selectors/appBuilder/components/daterangePicker";
import { daterangePickerText as T } from "Texts/appBuilder/components/daterangePicker";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";
import {
    addDaterangePickersViaApi,
    pickRangeDay,
    expectDayCells,
    expectRangeDisplay,
} from "Support/utils/appBuilder/components/daterangePicker";
import {
    pinBrowserTimezone,
    csaEvent,
    openDateAppInViewer,
    openDatePopup,
    expectActiveElement,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'drp';
const CTL = 'ctl';
// dynamic: fixed explicit ranges
const range = (start, end) => ({ defaultStartDate: { value: start }, defaultEndDate: { value: end } });
const expectFocusBlur = (focuses, blurs) => {
    expectCounter('focuses', 'focuses', focuses);
    expectCounter('blurs', 'blurs', blurs);
};

describe('Date Range Picker — csa facet', { testIsolation: false }, () => {
    beforeEach(() => {
        moveMouseAway();
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DaterangePicker-csa-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── DaterangePicker-BRW-003 ──────────────────────────────────────────────
    it('[DaterangePicker-BRW-003] setFocus focuses the input and opens the calendar; setBlur blurs it and closes the calendar', () => {
        addDaterangePickersViaApi([
            {
                name: W,
                layout: { top: 40, left: 2, width: 12, height: 40 },
                properties: range('10/06/2026', '14/06/2026'),
                events: [
                    counterEvent('onFocus', 'focuses'),
                    counterEvent('onBlur', 'blurs'),
                    csaEvent('onSelect', W, 'setBlur'), // daterangepicker.js:235
                ],
            },
            {
                name: CTL, // control: same picker, no setBlur handler
                layout: { top: 40, left: 24, width: 12, height: 40 },
                properties: range('10/06/2026', '14/06/2026'),
            },
            {
                type: 'Button',
                name: 'focusbtn',
                layout: { top: 120, left: 2, width: 6, height: 40 },
                properties: { text: { value: 'Focus' } },
                events: [csaEvent('onClick', W, 'setFocus')], // daterangepicker.js:231
            },
            counterText('focuses', 'focuses', { top: 420 }),
            counterText('blurs', 'blurs', { top: 480 }),
        ]);
        openDateAppInViewer(S.input(W));
        expectFocusBlur(0, 0);

        // control: without setBlur, a start pick leaves the calendar open
        openDatePopup(S.input(CTL));
        pickRangeDay(0, 20);
        expectRangeDisplay(CTL, '20/06/2026', null);
        cy.get(S.rangePopup).should('be.visible');
        cy.get(commonWidgetSelector.draggableWidget('blurs')).click(); // outside click closes it
        cy.get(P.popup).should('not.exist');
        expectFocusBlur(0, 0); // the other picker's focus is not ours

        // setFocus from a Button: the picker input takes real focus and its calendar opens
        cy.get(`${commonWidgetSelector.draggableWidget('focusbtn')} button`).click();
        expectActiveElement(S.input(W), true);
        cy.get(S.rangePopup).should('be.visible');
        expectDayCells(S.inRange, ['10', '11', '12', '13', '14'], 'it is THIS picker\'s calendar');
        expectFocusBlur(1, 0);

        // setBlur from On select: the calendar closes after the start pick and the input loses focus
        pickRangeDay(0, 22); // dynamic: another start
        expectRangeDisplay(W, '22/06/2026', null);
        cy.get(P.popup).should('not.exist');
        expectActiveElement(S.input(W), false);
        expectFocusBlur(1, 1);
    });
});
