/**
 * SPEC — Date Picker — userflow facet.
 * FOR AI: real-pointer / keyboard interaction from the TESTING.md browser scenarios:
 *   DatePickerV2-BRW-001 — opening the react-datepicker calendar and clicking a day selects that date: the value
 *                          updates and onSelect fires (BaseDateComponent.jsx:190-206 react-datepicker,
 *                          DatePickerV2.jsx:86-94 onDateSelect, :197-211 onSelect).
 *   DatePickerV2-BRW-002 — (typing/parsing half) typed text is parsed with the date format and committed while it
 *                          is parseable (DatepickerInput.jsx:79-95 → utils.js parseDateInputText); unparseable text
 *                          stays on screen and marks the field invalid with "Invalid date" (DatePickerV2.jsx:178-186).
 *                          Timezone display → contexts.cy.js; dynamic height → canvas.cy.js.
 *   DatePickerV2-BRW-004 — submitting a Form with an invalid (mandatory, empty) picker reveals the validation
 *                          error text under the field (DatePickerV2.jsx:60 useShowValidationOnFormSubmit →
 *                          DatepickerInput.jsx:107-122).
 * Observed through: a probe Text with the exposed values as JSON + an onSelect counter (set-variable).
 * Time zone: the browser is pinned to Asia/Kolkata (CDP) and every date is an explicit fixed date — no cy.clock.
 * Helpers: addDatePickersViaApi, pinBrowserTimezone, expectBrowserTimezone, dateProbe, expectDateProbe,
 * openDateAppInViewer, openDatePopup, pickCalendarDay, datePopupBoxes, counterEvent, counterText, expectCounter,
 * resolveCssVarColor, expectComputedColor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { datePickerV2Selector as S } from "Selectors/appBuilder/components/datePickerV2";
import { datePickerV2Text as T } from "Texts/appBuilder/components/datePickerV2";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { resolveCssVarColor, expectComputedColor } from "Support/utils/appBuilder/components/baseInput";
import { addDatePickersViaApi } from "Support/utils/appBuilder/components/datePickerV2";
import {
    pinBrowserTimezone,
    expectBrowserTimezone,
    dateProbe,
    expectDateProbe,
    openDateAppInViewer,
    openDatePopup,
    pickCalendarDay,
    datePopupBoxes,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'dp';
const KEYS = ['displayValue', 'selectedDate', 'value', 'isValid'];
// tz pinned to Asia/Kolkata → a date is local midnight at +05:30
const exposed = (date, iso, isValid = true) => ({
    displayValue: date,
    selectedDate: date,
    value: `${iso}T00:00:00.000${T.browserOffset}`,
    isValid,
});

describe('Date Picker — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DatePickerV2-userflow-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    const seedPickerWithProbe = () =>
        addDatePickersViaApi([
            {
                name: W,
                // dynamic: fixed explicit date in the default format DD/MM/YYYY (datepickerV2.js:404)
                properties: { defaultValue: { value: '15/06/2026' } },
                events: [counterEvent('onSelect', 'selects')], // datepickerV2.js:136
            },
            dateProbe('probe', W, KEYS, { top: 300 }),
            counterText('selects', 'selects', { top: 400 }),
        ]);

    // ── DatePickerV2-BRW-001 ─────────────────────────────────────────────────
    it('[DatePickerV2-BRW-001] The calendar opens under the field; clicking a day selects it and fires On select', () => {
        seedPickerWithProbe();
        openDateAppInViewer(S.input(W));
        expectBrowserTimezone(T.browserTimezone);
        expectDateProbe('probe', exposed('15/06/2026', '2026-06-15'));
        expectCounter('selects', 'selects', 0); // mount publishes without firing (D-05)
        cy.get(P.popup).should('not.exist'); // the calendar mounts only on open

        openDatePopup(S.input(W));
        // anchored bottom-start under the field (BaseDateComponent.jsx:202-206), no time panel for a date-only picker
        datePopupBoxes(S.input(W), (b) => {
            expect(b.popup, 'popup rendered').to.not.eq(null);
            expect(b.popup.left, 'popup left = field left').to.be.closeTo(b.input.left, 2);
            expect(b.popup.top - b.input.bottom, 'popup hugs the field bottom').to.be.within(-8, 8);
            expect(b.time, 'no time panel').to.eq(null);
        });
        cy.get(P.monthSelector).should('have.text', T.monthNames[5]);
        cy.get(P.yearSelector).should('have.text', '2026');
        cy.get(P.selectedDay).should('have.text', '15');

        pickCalendarDay(20); // dynamic: another day of the shown month
        cy.get(S.input(W)).should('have.value', '20/06/2026');
        expectDateProbe('probe', exposed('20/06/2026', '2026-06-20'));
        expectCounter('selects', 'selects', 1);
        cy.get(P.selectedDay).should('have.text', '20');

        // paging to the next month and clicking a day there commits that month
        cy.get(P.nextArrow).click();
        cy.get(P.monthSelector).should('have.text', T.monthNames[6]);
        expectCounter('selects', 'selects', 1); // paging alone selects nothing
        pickCalendarDay(3); // dynamic: a day in July
        cy.get(S.input(W)).should('have.value', '03/07/2026');
        expectDateProbe('probe', exposed('03/07/2026', '2026-07-03'));
        expectCounter('selects', 'selects', 2);

        // an outside click closes the calendar and keeps the picked date
        cy.get(commonWidgetSelector.draggableWidget('probe')).click();
        cy.get(P.popup).should('not.exist');
        cy.get(S.input(W)).should('have.value', '03/07/2026');
        // reopening shows the picked date selected
        openDatePopup(S.input(W));
        cy.get(P.monthSelector).should('have.text', T.monthNames[6]);
        cy.get(P.selectedDay).should('have.text', '3');
    });

    // ── DatePickerV2-BRW-002 (typing / parsing) ──────────────────────────────
    it('[DatePickerV2-BRW-002] Typing a date parses it into the value; unparseable text stays on screen as "Invalid date"', () => {
        seedPickerWithProbe();
        openDateAppInViewer(S.input(W));
        expectDateProbe('probe', exposed('15/06/2026', '2026-06-15'));

        cy.get(S.input(W)).click().clear().type('25/12/2026'); // dynamic: typed in DD/MM/YYYY
        expectDateProbe('probe', exposed('25/12/2026', '2026-12-25'));
        // typing is a user selection → On select fired (once per parseable keystroke, so at least once)
        cy.get(commonWidgetSelector.draggableWidget('selects')).should(($el) => {
            const n = Number($el.text().trim().split(':')[1]);
            expect(n, 'onSelect fired while typing').to.be.gte(1);
        });
        // blur: the field re-renders from the parsed value in the display format, no error
        cy.get(commonWidgetSelector.draggableWidget('probe')).click();
        cy.get(P.popup).should('not.exist');
        cy.get(S.input(W)).should('have.value', '25/12/2026').and('have.attr', 'aria-invalid', 'false');
        cy.get(S.errorText(W)).should('not.exist');

        // unparseable text: kept on screen, the field turns invalid and the error shows after blur
        const garbage = fake.firstName.replace(/[^A-Za-z]/g, '').slice(0, 8) || 'abcd'; // dynamic: letters only
        cy.get(S.input(W)).click().clear().type(garbage);
        cy.get(commonWidgetSelector.draggableWidget('probe')).click();
        cy.get(P.popup).should('not.exist');
        cy.get(S.input(W)).should('have.value', garbage).and('have.attr', 'aria-invalid', 'true');
        cy.get(S.errorText(W)).should('have.text', T.errorInvalidDate);
        // the last committed date is kept; only isValid flips
        expectDateProbe('probe', exposed('25/12/2026', '2026-12-25', false));

        // a calendar pick supersedes the bad text and clears the error
        openDatePopup(S.input(W));
        pickCalendarDay(5); // dynamic: a day of the shown month (December 2026)
        cy.get(S.input(W)).should('have.value', '05/12/2026');
        expectDateProbe('probe', exposed('05/12/2026', '2026-12-05'));
        cy.get(S.errorText(W)).should('not.exist');
    });

    // ── DatePickerV2-BRW-004 ─────────────────────────────────────────────────
    it('[DatePickerV2-BRW-004] Submitting a Form with an empty mandatory picker reveals the error text under the field', () => {
        const FORM = crypto.randomUUID();
        const BUTTON = crypto.randomUUID();
        addDatePickersViaApi([
            {
                id: FORM,
                type: 'Form',
                name: 'form1',
                layout: { top: 40, left: 2, width: 16, height: 330 },
                properties: { buttonToSubmit: { value: BUTTON } }, // Form submits on its buttonToSubmit's click
            },
            {
                parent: FORM,
                name: W,
                layout: { top: 20, left: 2, width: 30, height: 40 },
                properties: { defaultValue: { value: '' } }, // empty field
                validation: { mandatory: { value: '{{true}}' } }, // datepickerV2.js:36-39
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
        // coloured with errTextColor (default var(--cc-error-systemStatus) — datepickerV2.js:426)
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
