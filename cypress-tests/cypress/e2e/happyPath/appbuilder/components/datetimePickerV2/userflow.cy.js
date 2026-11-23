/**
 * SPEC — Date Time Picker — userflow facet.
 * FOR AI: real-pointer / keyboard interaction from the TESTING.md browser scenarios:
 *   DatetimePickerV2-BRW-001 — opening the react-datepicker date grid + time selector and picking a date / time
 *                              updates the value and fires onSelect; typing a datetime in the input parses it
 *                              (DatetimePickerV2.jsx:145-170 onDateSelect / onTimeChange, :408-422 onSelect;
 *                              DatepickerInput.jsx:79-95 typed text → parseDateInputText).
 *   DatetimePickerV2-BRW-002 — (month/year navigation half) the header's month / year selectors switch the popup
 *                              into month and year picker modes (datepickerMode, DatetimePickerV2.jsx:404-406,
 *                              :431-433); picking a cell commits that month / year and returns to the date grid.
 *                              Geometry + dynamic height → canvas.cy.js; timezone offsets → properties.cy.js.
 *   DatetimePickerV2-BRW-005 — submitting a Form with an invalid (mandatory, empty) picker reveals the validation
 *                              error text under the field (FormSignalContext useShowValidationOnFormSubmit →
 *                              DatepickerInput.jsx:107-121).
 * Observed through: a probe Text with the exposed values as JSON + an onSelect counter (set-variable).
 * Time zone: the browser is pinned to Asia/Kolkata (CDP) and every date is an explicit fixed date — no cy.clock.
 * Helpers: addDatetimePickersViaApi, pinBrowserTimezone, expectBrowserTimezone, dateProbe, expectDateProbe,
 * openDateAppInViewer, openDatePopup, pickCalendarDay, pickTimeItem, expectSelectedTime, csaEvent, counterEvent,
 * counterText, expectCounter, resolveCssVarColor, expectComputedColor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { datetimePickerV2Selector as S } from "Selectors/appBuilder/components/datetimePickerV2";
import { datetimePickerV2Text as T } from "Texts/appBuilder/components/datetimePickerV2";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { resolveCssVarColor, expectComputedColor } from "Support/utils/appBuilder/components/baseInput";
import { addDatetimePickersViaApi } from "Support/utils/appBuilder/components/datetimePickerV2";
import {
    pinBrowserTimezone,
    expectBrowserTimezone,
    dateProbe,
    expectDateProbe,
    openDateAppInViewer,
    openDatePopup,
    pickCalendarDay,
    pickTimeItem,
    expectSelectedTime,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'dtp';
const OFFSET = T.browserOffset; // tz disabled → value is ISO in the (pinned) browser zone
const KEYS = ['displayValue', 'selectedDate', 'selectedTime', 'value'];
const exposed = (date, time, iso) => ({
    displayValue: `${date} ${time}`,
    selectedDate: date,
    selectedTime: time,
    value: `${iso}${OFFSET}`,
});

describe('Date Time Picker — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DatetimePickerV2-userflow-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── DatetimePickerV2-BRW-001 ─────────────────────────────────────────────
    it('[DatetimePickerV2-BRW-001] Picking a day, an hour and a minute in the popup updates the value and fires On select each time', () => {
        addDatetimePickersViaApi([
            {
                name: W,
                // dynamic: fixed explicit date in the default format DD/MM/YYYY HH:mm (datetimepickerV2.js:450-451)
                properties: { defaultValue: { value: '15/06/2026 10:30' } },
                events: [counterEvent('onSelect', 'selects')], // datetimepickerV2.js:152
            },
            dateProbe('probe', W, KEYS, { top: 300 }),
            counterText('selects', 'selects', { top: 400 }),
        ]);
        openDateAppInViewer(S.input(W));
        expectBrowserTimezone(T.browserTimezone);
        expectDateProbe('probe', exposed('15/06/2026', '10:30', '2026-06-15T10:30:00.000'));
        expectCounter('selects', 'selects', 0); // mount publishes without firing (D-05)

        openDatePopup(S.input(W));
        cy.get(P.selectedDay).should('have.text', '15');
        cy.get(P.timeHeader).should(($h) => expect([...$h].map((e) => e.textContent)).to.deep.eq(T.timeHeaders24h));
        expectSelectedTime(['10', '30']);

        pickCalendarDay(20); // dynamic: another day of the shown month
        cy.get(S.input(W)).should('have.value', '20/06/2026 10:30');
        expectDateProbe('probe', exposed('20/06/2026', '10:30', '2026-06-20T10:30:00.000'));
        expectCounter('selects', 'selects', 1);
        // shouldCloseOnSelect is false (BaseDateComponent.jsx:201): the popup stays open for the time pick
        cy.get(P.calendar).should('be.visible');
        cy.get(P.selectedDay).should('have.text', '20');

        pickTimeItem(0, '14'); // dynamic: hour
        cy.get(S.input(W)).should('have.value', '20/06/2026 14:30');
        expectCounter('selects', 'selects', 2);
        pickTimeItem(1, '45'); // dynamic: minute
        expectSelectedTime(['14', '45']);
        cy.get(S.input(W)).should('have.value', '20/06/2026 14:45');
        expectDateProbe('probe', exposed('20/06/2026', '14:45', '2026-06-20T14:45:00.000'));
        expectCounter('selects', 'selects', 3);

        // closing the popup keeps the picked value
        cy.get(commonWidgetSelector.draggableWidget('probe')).click();
        cy.get(P.popup).should('not.exist');
        cy.get(S.input(W)).should('have.value', '20/06/2026 14:45');
    });

    it('[DatetimePickerV2-BRW-001] Typing a datetime in the input parses it into the value; the time panel follows', () => {
        addDatetimePickersViaApi([
            {
                name: W,
                properties: { defaultValue: { value: '15/06/2026 10:30' } }, // dynamic: fixed explicit date
                events: [counterEvent('onSelect', 'selects')],
            },
            dateProbe('probe', W, KEYS, { top: 300 }),
            counterText('selects', 'selects', { top: 400 }),
        ]);
        openDateAppInViewer(S.input(W));
        expectDateProbe('probe', exposed('15/06/2026', '10:30', '2026-06-15T10:30:00.000'));

        cy.get(S.input(W)).click().clear().type('25/12/2026 08:15'); // dynamic: typed in DD/MM/YYYY HH:mm
        expectDateProbe('probe', exposed('25/12/2026', '08:15', '2026-12-25T08:15:00.000'));
        // the open popup's time panel follows the typed value (the date grid keeps its month — see report)
        expectSelectedTime(['08', '15']);
        // typing is a user selection → On select fired (once per parseable keystroke, so at least once)
        cy.get(commonWidgetSelector.draggableWidget('selects')).should(($el) => {
            const n = Number($el.text().trim().split(':')[1]);
            expect(n, 'onSelect fired while typing').to.be.gte(1);
        });

        // blur: the field re-renders from the parsed value in the display format
        cy.get(commonWidgetSelector.draggableWidget('probe')).click();
        cy.get(P.popup).should('not.exist');
        cy.get(S.input(W)).should('have.value', '25/12/2026 08:15');
    });

    it('[DatetimePickerV2-BRW-001] 12-hour time format: the am/pm column switches the half of the day', () => {
        addDatetimePickersViaApi([
            {
                name: W,
                properties: {
                    timeFormat: { value: 'hh:mm A' }, // dynamic: 12-hour format (Inspector TIME_FORMAT_OPTIONS)
                    defaultValue: { value: '15/06/2026 09:05 AM' }, // dynamic: fixed explicit date
                },
                events: [counterEvent('onSelect', 'selects')],
            },
            dateProbe('probe', W, KEYS, { top: 300 }),
            counterText('selects', 'selects', { top: 400 }),
        ]);
        openDateAppInViewer(S.input(W));
        expectDateProbe('probe', exposed('15/06/2026', '09:05 AM', '2026-06-15T09:05:00.000'));

        openDatePopup(S.input(W));
        cy.get(P.timeHeader).should(($h) => expect([...$h].map((e) => e.textContent)).to.deep.eq(T.timeHeaders12h));
        expectSelectedTime(['09', '05', 'AM']);

        pickTimeItem(2, 'PM');
        expectSelectedTime(['09', '05', 'PM']);
        expectDateProbe('probe', exposed('15/06/2026', '09:05 PM', '2026-06-15T21:05:00.000'));
        pickTimeItem(0, '12'); // 12 in the PM half = noon (TimepickerInput.jsx:151-156)
        expectSelectedTime(['12', '05', 'PM']);
        expectDateProbe('probe', exposed('15/06/2026', '12:05 PM', '2026-06-15T12:05:00.000'));
        expectCounter('selects', 'selects', 2);
    });

    // ── DatetimePickerV2-BRW-002 (month / year navigation) ──────────────────
    it('[DatetimePickerV2-BRW-002] Month and year selectors switch the popup mode; picking a cell commits it and returns to the date grid', () => {
        addDatetimePickersViaApi([
            {
                name: W,
                properties: { defaultValue: { value: '15/06/2026 10:30' } }, // dynamic: fixed explicit date
                events: [counterEvent('onSelect', 'selects')],
            },
            dateProbe('probe', W, KEYS, { top: 300 }),
            counterText('selects', 'selects', { top: 400 }),
        ]);
        openDateAppInViewer(S.input(W));
        openDatePopup(S.input(W));
        cy.get(P.monthSelector).should('have.text', T.monthNames[5]);
        cy.get(P.yearSelector).should('have.text', '2026');

        // arrows in date mode page the month without committing a value
        cy.get(P.nextArrow).click();
        cy.get(P.monthSelector).should('have.text', T.monthNames[6]);
        cy.get(P.prevArrow).click();
        cy.get(P.monthSelector).should('have.text', T.monthNames[5]);
        expectCounter('selects', 'selects', 0);

        // month mode: 12 month cells, current month highlighted, no time panel
        cy.get(P.monthSelector).click();
        cy.get(P.popup).should('have.class', 'react-datepicker-month-component');
        cy.get(P.monthText).should(($m) => expect([...$m].map((e) => e.textContent)).to.deep.eq(T.months));
        cy.get(P.monthText).contains(T.months[5]).should('have.class', 'react-datepicker__month-text--selected');
        cy.get(P.timePanel).should('not.exist');
        cy.get(P.monthSelector).should('not.exist');
        cy.get(P.yearSelector).should('have.text', '2026');

        cy.get(P.monthText).contains(T.months[8]).click(); // dynamic: September
        cy.get(P.popup).should('not.have.class', 'react-datepicker-month-component');
        cy.get(P.timePanel).should('be.visible');
        cy.get(P.monthSelector).should('have.text', T.monthNames[8]);
        expectDateProbe('probe', exposed('15/09/2026', '10:30', '2026-09-15T10:30:00.000'));
        expectCounter('selects', 'selects', 1);

        // year mode: a 12-year page around the year; arrows page by 12 years
        cy.get(P.yearSelector).click();
        cy.get(P.popup).should('have.class', 'react-datepicker-year-component');
        cy.get(P.yearText).should('have.length', 12).and('contain', '2026');
        cy.get(P.yearText).contains('2026').should('have.class', 'react-datepicker__year-text--selected');
        cy.get(P.timePanel).should('not.exist');
        cy.get(P.yearText).first().invoke('text').then((first) => {
            cy.get(P.prevArrow).click();
            cy.get(P.yearText).first().should('have.text', String(Number(first) - 12));
            cy.get(P.nextArrow).click();
            cy.get(P.yearText).first().should('have.text', first);
        });
        cy.get(P.yearText).contains('2028').click(); // dynamic: a later year on the same page
        cy.get(P.popup).should('not.have.class', 'react-datepicker-year-component');
        cy.get(P.yearSelector).should('have.text', '2028');
        expectDateProbe('probe', exposed('15/09/2028', '10:30', '2028-09-15T10:30:00.000'));
        expectCounter('selects', 'selects', 2);
        cy.get(S.input(W)).should('have.value', '15/09/2028 10:30');
        // back in the date grid the calendar shows the committed month with its day selected, as after a
        // month pick. PRODUCT BUG (kept red): after a year pick the grid opens on January of that year — the
        // committed 15 September is off-screen (DatetimePickerV2.jsx:410-412 changes the value's year but the
        // react-datepicker view moves to the start of the picked year).
        cy.get(P.monthSelector).should('have.text', T.monthNames[8]);
        cy.get(P.selectedDay).should('have.text', '15');
    });

    // ── DatetimePickerV2-BRW-005 ─────────────────────────────────────────────
    it('[DatetimePickerV2-BRW-005] Submitting a Form with an empty mandatory picker reveals the error text under the field', () => {
        const FORM = crypto.randomUUID();
        const BUTTON = crypto.randomUUID();
        addDatetimePickersViaApi([
            {
                id: FORM,
                type: 'Form',
                name: 'form1',
                layout: { top: 40, left: 2, width: 16, height: 330 },
                properties: { buttonToSubmit: { value: BUTTON } }, // Form.jsx:417 matches the dispatching button id
            },
            {
                parent: FORM,
                name: W,
                layout: { top: 20, left: 2, width: 30, height: 40 },
                properties: { defaultValue: { value: '' } }, // empty field
                validation: { mandatory: { value: '{{true}}' } }, // datetimepickerV2.js:49-52
            },
            {
                id: BUTTON,
                parent: `${FORM}-footer`,
                type: 'Button',
                name: 'submitbtn',
                layout: { top: 10, left: 25, width: 14, height: 40 },
                properties: { text: { value: 'Submit' } },
            },
            dateProbe('probe', W, ['isValid', 'value'], { top: 420 }),
        ]);
        openDateAppInViewer(S.input(W));
        cy.get(S.input(W)).should('have.value', '').and('have.attr', 'aria-required', 'true');
        // invalid from the start, but nothing is revealed before a submit attempt
        expectDateProbe('probe', { isValid: false, value: null });
        cy.get(S.errorText(W)).should('not.exist');
        cy.get(S.input(W)).should('have.attr', 'aria-invalid', 'false').and('not.have.class', 'is-invalid');

        cy.get(`${commonWidgetSelector.draggableWidget('submitbtn')} button`).click();
        cy.get(S.errorText(W)).should('have.text', T.errorMandatory);
        cy.get(S.input(W)).should('have.attr', 'aria-invalid', 'true').and('have.class', 'is-invalid');
        // coloured with errTextColor (default var(--cc-error-systemStatus) — datetimepickerV2.js:476)
        resolveCssVarColor('--cc-error-systemStatus', S.root(W)).then((rgb) =>
            expectComputedColor(S.errorText(W), 'color', rgb));
        // under the field, inside the widget's width, painted
        cy.document().should((doc) => {
            const input = doc.querySelector(S.input(W)).getBoundingClientRect();
            const err = doc.querySelector(S.errorText(W)).getBoundingClientRect();
            expect(err.height, 'error text painted').to.be.gt(0);
            expect(err.top, 'error text starts below the field').to.be.gte(input.bottom - 1);
            expect(err.left, 'error text within the field (left)').to.be.gte(input.left - 1);
            expect(err.right, 'error text within the field (right)').to.be.lte(input.right + 1);
        });

        // picking a value makes the field valid and removes the message
        openDatePopup(S.input(W));
        cy.get(P.day(10)).first().click(); // dynamic: any day of the (current) shown month
        cy.get(commonWidgetSelector.draggableWidget('probe')).should(($el) => {
            const probe = JSON.parse($el.text().trim());
            expect(probe.isValid, 'valid after a pick').to.eq(true);
            expect(probe.value, 'a value is stored').to.be.a('string');
        });
        cy.get(S.errorText(W)).should('not.exist');
        cy.get(S.input(W)).should('have.attr', 'aria-invalid', 'false');
    });
});
