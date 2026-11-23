/**
 * SPEC — Time Picker — csa facet.
 * FOR AI: TESTING.md browser scenario TimePicker-BRW-003 (CSA half): setFocus / setBlur (timepicker.js:174-181)
 * drive REAL focus. useDatetimeInput.js:90-97 sets isCalendarOpen + textInputFocus; the effects at :50-60 call
 * input.focus()/blur() and datePicker.setOpen(); :62-69 fire onFocus / onBlur.
 * setFocus is wired to a Button (a click never focuses the picker by itself). setBlur is wired to the picker's own
 * On select, so it runs while the selector is open WITHOUT any outside click (an outside click would close the popup
 * on its own — no proof). Control: a second picker without the handler stays open after a pick.
 * Helpers: addTimePickersViaApi, csaEvent, openDateAppInViewer, openDatePopup, pickTimeItem, expectSelectedTime,
 * expectActiveElement, counterEvent, counterText, expectCounter, pinBrowserTimezone.
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
    csaEvent,
    openDateAppInViewer,
    openDatePopup,
    pickTimeItem,
    expectSelectedTime,
    expectActiveElement,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'tp';
const CTL = 'ctl';
const expectFocusBlur = (focuses, blurs) => {
    expectCounter('focuses', 'focuses', focuses);
    expectCounter('blurs', 'blurs', blurs);
};

describe('Time Picker — csa facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TimePicker-csa-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── TimePicker-BRW-003 ───────────────────────────────────────────────────
    it('[TimePicker-BRW-003] setFocus focuses the input and opens the selector; setBlur blurs it and closes the selector', () => {
        addTimePickersViaApi([
            {
                name: W,
                layout: { top: 40, left: 2, width: 10, height: 40 },
                properties: { defaultValue: { value: '10:30' } }, // dynamic: fixed explicit time
                events: [
                    counterEvent('onFocus', 'focuses'),
                    counterEvent('onBlur', 'blurs'),
                    csaEvent('onSelect', W, 'setBlur'), // timepicker.js:179
                ],
            },
            {
                name: CTL, // control: same picker, no setBlur handler
                layout: { top: 40, left: 22, width: 10, height: 40 },
                properties: { defaultValue: { value: '06:45' } }, // dynamic: a different time
            },
            {
                type: 'Button',
                name: 'focusbtn',
                layout: { top: 120, left: 2, width: 6, height: 40 },
                properties: { text: { value: 'Focus' } },
                events: [csaEvent('onClick', W, 'setFocus')], // timepicker.js:175
            },
            counterText('focuses', 'focuses', { top: 420 }),
            counterText('blurs', 'blurs', { top: 480 }),
        ]);
        openDateAppInViewer(S.input(W));
        expectFocusBlur(0, 0);

        // control: without setBlur, a pick leaves the selector open
        openDatePopup(S.input(CTL));
        pickTimeItem(0, '07');
        cy.get(S.input(CTL)).should('have.value', '07:45');
        cy.get(P.calendar).should('be.visible');
        cy.get(commonWidgetSelector.draggableWidget('blurs')).click(); // outside click closes it
        cy.get(P.popup).should('not.exist');
        expectFocusBlur(0, 0); // the other picker's focus is not ours

        // setFocus from a Button: the picker input takes real focus and its selector opens
        cy.get(`${commonWidgetSelector.draggableWidget('focusbtn')} button`).click();
        expectActiveElement(S.input(W), true);
        cy.get(P.calendar).should('be.visible');
        expectSelectedTime(['10', '30']); // it is THIS picker's selector
        expectFocusBlur(1, 0);

        // setBlur from On select: the selector closes and the input loses focus, with no outside click
        pickTimeItem(1, '15'); // dynamic: minute
        cy.get(S.input(W)).should('have.value', '10:15');
        cy.get(P.popup).should('not.exist');
        expectActiveElement(S.input(W), false);
        expectFocusBlur(1, 1);
    });
});
