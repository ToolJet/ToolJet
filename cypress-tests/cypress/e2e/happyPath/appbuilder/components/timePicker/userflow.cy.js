/**
 * SPEC — Time Picker — userflow facet.
 * FOR AI: real-pointer / keyboard interaction from the TESTING.md browser scenarios:
 *   TimePicker-BRW-001 — opening the react-datepicker time selector and picking hours / minutes / AM-PM updates the
 *                        value and fires onSelect (TimePicker.jsx:88-101 onTimeChange; TimepickerInput.jsx:158-253);
 *                        an empty picker bases the pick on midnight (utils.js getTimeSelectionBase); items outside
 *                        minTime / maxTime are greyed and not clickable (TimepickerInput.jsx:128-148, theme.scss
 *                        `.disabled-time { pointer-events: none }`).
 *   TimePicker-BRW-002 — (typing / parsing half) typed text is parsed in the time format into the value
 *                        (DatepickerInput.jsx:79-95 → parseDateInputText → TimePicker.jsx:78-86); unparseable text stays
 *                        on screen and reveals "Invalid time" on blur (TimePicker.jsx:152-157).
 *                        Geometry + dynamic height → canvas.cy.js.
 *   TimePicker-BRW-004 — submitting a Form with an invalid picker (mandatory + empty, or below Min time) reveals the
 *                        validation error text under the field (FormSignalContext useShowValidationOnFormSubmit →
 *                        DatepickerInput.jsx:107-121).
 * Observed through: a probe Text with the exposed values as JSON + an onSelect counter (set-variable).
 * Time zone: the browser is pinned to Asia/Kolkata (CDP) and every time is an explicit fixed time — no cy.clock.
 * Helpers: addTimePickersViaApi, expectTimeItems, pinBrowserTimezone, dateProbe, expectDateProbe,
 * openDateAppInViewer, openDatePopup, pickTimeItem, expectSelectedTime, counterEvent, counterText, expectCounter,
 * resolveCssVarColor, expectComputedColor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { timePickerSelector as S } from "Selectors/appBuilder/components/timePicker";
import { timePickerText as T } from "Texts/appBuilder/components/timePicker";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { resolveCssVarColor, expectComputedColor } from "Support/utils/appBuilder/components/baseInput";
import { addTimePickersViaApi, expectTimeItems } from "Support/utils/appBuilder/components/timePicker";
import {
    pinBrowserTimezone,
    dateProbe,
    expectDateProbe,
    openDateAppInViewer,
    openDatePopup,
    pickTimeItem,
    expectSelectedTime,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'tp';
const pad = (n) => String(n).padStart(2, '0');
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => pad(from + i));
const closePopup = () => {
    cy.get(commonWidgetSelector.draggableWidget('probe')).click();
    cy.get(P.popup).should('not.exist');
};

describe('Time Picker — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TimePicker-userflow-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── TimePicker-BRW-001 ───────────────────────────────────────────────────
    it('[TimePicker-BRW-001] Picking an hour and a minute in the time selector updates the value and fires On select each time', () => {
        addTimePickersViaApi([
            {
                name: W,
                properties: { defaultValue: { value: '10:30' } }, // dynamic: fixed explicit time in HH:mm (timepicker.js:377)
                events: [counterEvent('onSelect', 'selects')], // timepicker.js:124
            },
            dateProbe('probe', W, ['value', 'isValid'], { top: 300 }),
            counterText('selects', 'selects', { top: 400 }),
        ]);
        openDateAppInViewer(S.input(W));
        expectDateProbe('probe', { value: '10:30', isValid: true });
        expectCounter('selects', 'selects', 0); // mount publishes without firing

        openDatePopup(S.input(W));
        cy.get(S.timeOnlyDialog).should('be.visible'); // time-only: no calendar grid
        cy.get(P.timeHeader).should(($h) => expect([...$h].map((e) => e.textContent)).to.deep.eq(T.timeHeaders24h));
        expectTimeItems(0, (labels) => expect(labels, '24 hours').to.deep.eq(range(0, 23)));
        expectTimeItems(1, (labels) => expect(labels, '60 minutes').to.deep.eq(range(0, 59)));
        expectSelectedTime(['10', '30']);

        pickTimeItem(0, '14'); // dynamic: hour
        cy.get(S.input(W)).should('have.value', '14:30');
        expectDateProbe('probe', { value: '14:30', isValid: true });
        expectCounter('selects', 'selects', 1);
        // the popup stays open for the minute pick (shouldCloseOnSelect false — BaseDateComponent.jsx:201)
        cy.get(P.calendar).should('be.visible');

        pickTimeItem(1, '45'); // dynamic: minute
        expectSelectedTime(['14', '45']);
        cy.get(S.input(W)).should('have.value', '14:45');
        expectDateProbe('probe', { value: '14:45', isValid: true });
        expectCounter('selects', 'selects', 2);

        // closing the popup keeps the picked value; reopening highlights it
        closePopup();
        cy.get(S.input(W)).should('have.value', '14:45');
        openDatePopup(S.input(W));
        expectSelectedTime(['14', '45']);
        expectCounter('selects', 'selects', 2);
    });

    it('[TimePicker-BRW-001] 12-hour time format: the am/pm column switches the half of the day; 12 PM is noon', () => {
        addTimePickersViaApi([
            {
                name: W,
                properties: {
                    timeFormat: { value: 'hh:mm A' }, // dynamic: 12-hour format (runtime-read, TimePicker.jsx:26)
                    defaultValue: { value: '09:05 AM' }, // dynamic: fixed explicit time
                },
                events: [counterEvent('onSelect', 'selects')],
            },
            dateProbe('probe', W, ['value', 'timeFormat'], { top: 300 }),
            counterText('selects', 'selects', { top: 400 }),
        ]);
        openDateAppInViewer(S.input(W));
        expectDateProbe('probe', { value: '09:05 AM', timeFormat: 'hh:mm A' });

        openDatePopup(S.input(W));
        cy.get(P.timeHeader).should(($h) => expect([...$h].map((e) => e.textContent)).to.deep.eq(T.timeHeaders12h));
        expectTimeItems(0, (labels) => expect(labels, '12-hour column').to.deep.eq(T.hours12));
        expectTimeItems(2, (labels) => expect(labels, 'am/pm column').to.deep.eq(['AM', 'PM']));
        expectSelectedTime(['09', '05', 'AM']);

        pickTimeItem(2, 'PM');
        expectSelectedTime(['09', '05', 'PM']);
        expectDateProbe('probe', { value: '09:05 PM', timeFormat: 'hh:mm A' });
        pickTimeItem(0, '12'); // 12 in the PM half = noon (TimepickerInput.jsx:151-156)
        expectSelectedTime(['12', '05', 'PM']);
        expectDateProbe('probe', { value: '12:05 PM', timeFormat: 'hh:mm A' });
        pickTimeItem(2, 'AM'); // 12 in the AM half = midnight
        expectSelectedTime(['12', '05', 'AM']);
        expectDateProbe('probe', { value: '12:05 AM', timeFormat: 'hh:mm A' });
        cy.get(S.input(W)).should('have.value', '12:05 AM');
        expectCounter('selects', 'selects', 3);
    });

    it('[TimePicker-BRW-001] An empty picker: picking only an hour gives that hour at :00 (no wall-clock minutes leak in)', () => {
        addTimePickersViaApi([
            {
                name: W,
                properties: { defaultValue: { value: '' } }, // empty field
                events: [counterEvent('onSelect', 'selects')],
            },
            dateProbe('probe', W, ['value'], { top: 300 }),
            counterText('selects', 'selects', { top: 400 }),
        ]);
        openDateAppInViewer(S.input(W));
        cy.get(S.input(W)).should('have.value', '');
        expectDateProbe('probe', { value: null });

        openDatePopup(S.input(W));
        expectSelectedTime(['00', '00']); // nothing chosen yet → the columns sit on midnight
        pickTimeItem(0, '02'); // dynamic: hour
        cy.get(S.input(W)).should('have.value', '02:00');
        expectDateProbe('probe', { value: '02:00' });
        expectSelectedTime(['02', '00']);
        expectCounter('selects', 'selects', 1);
    });

    it('[TimePicker-BRW-001] Min / Max time grey out the hours and minutes outside the range and they cannot be picked', () => {
        addTimePickersViaApi([
            {
                name: W,
                properties: { defaultValue: { value: '10:30' } }, // dynamic: fixed explicit time
                // dynamic: a working-hours window (timepicker.js:11-22)
                validation: { minTime: { value: '09:00' }, maxTime: { value: '17:30' } },
                events: [counterEvent('onSelect', 'selects')],
            },
            dateProbe('probe', W, ['value', 'isValid'], { top: 300 }),
            counterText('selects', 'selects', { top: 400 }),
        ]);
        openDateAppInViewer(S.input(W));
        openDatePopup(S.input(W));
        expectTimeItems(0, (labels, disabled) =>
            expect(disabled, 'hours outside 09–17').to.deep.eq([...range(0, 8), ...range(18, 23)]));
        expectTimeItems(1, (labels, disabled) => expect(disabled, 'minutes of an in-range hour').to.deep.eq([]));
        cy.get(P.timeColumn).eq(0).contains(P.timeItem, /^20$/)
            .should('have.class', 'disabled-time')
            .and('have.css', 'pointer-events', 'none');

        // a real click on a greyed hour does nothing
        cy.get(P.timeColumn).eq(0).contains(P.timeItem, /^20$/).realClick({ scrollBehavior: 'center' });
        expectDateProbe('probe', { value: '10:30', isValid: true });
        expectCounter('selects', 'selects', 0);

        // at the max hour, the minutes past :30 grey out
        pickTimeItem(0, '17');
        expectDateProbe('probe', { value: '17:30', isValid: true });
        expectTimeItems(1, (labels, disabled) => expect(disabled, 'minutes past 17:30').to.deep.eq(range(31, 59)));
        cy.get(P.timeColumn).eq(1).contains(P.timeItem, /^45$/).realClick({ scrollBehavior: 'center' });
        expectDateProbe('probe', { value: '17:30', isValid: true });
        pickTimeItem(1, '15');
        expectDateProbe('probe', { value: '17:15', isValid: true });
        expectCounter('selects', 'selects', 2);
    });

    // ── TimePicker-BRW-002 (typing / parsing) ────────────────────────────────
    it('[TimePicker-BRW-002] Typing a time parses it into the value; the open selector follows the typed time', () => {
        addTimePickersViaApi([
            {
                name: W,
                properties: { defaultValue: { value: '10:30' } }, // dynamic: fixed explicit time
                events: [counterEvent('onSelect', 'selects')],
            },
            dateProbe('probe', W, ['value', 'isValid'], { top: 300 }),
            counterText('selects', 'selects', { top: 400 }),
        ]);
        openDateAppInViewer(S.input(W));
        expectDateProbe('probe', { value: '10:30', isValid: true });

        cy.get(S.input(W)).click().clear().type('08:15'); // dynamic: typed in HH:mm
        expectDateProbe('probe', { value: '08:15', isValid: true });
        expectSelectedTime(['08', '15']); // the open popup's columns follow the typed value
        // typing is a user selection → On select fired (once per parseable keystroke, so at least once)
        cy.get(commonWidgetSelector.draggableWidget('selects')).should(($el) => {
            const n = Number($el.text().trim().split(':')[1]);
            expect(n, 'onSelect fired while typing').to.be.gte(1);
        });

        // blur: the field re-renders from the parsed value in the display format
        closePopup();
        cy.get(S.input(W)).should('have.value', '08:15');
        cy.get(S.errorText(W)).should('not.exist');
    });

    it('[TimePicker-BRW-002] Unparseable typed text stays on screen and reveals "Invalid time" on blur; a pick recovers', () => {
        const junk = fake.firstName.replace(/[^a-z]/gi, '').slice(0, 8).toLowerCase() || 'abc'; // dynamic: letters only
        addTimePickersViaApi([
            { name: W, properties: { defaultValue: { value: '10:30' } } }, // dynamic: fixed explicit time
            dateProbe('probe', W, ['value', 'isValid'], { top: 300 }),
        ]);
        openDateAppInViewer(S.input(W));
        cy.get(S.input(W)).click().clear().type(junk);
        // the last parsed value is kept; the widget turns invalid at once, the message waits for blur
        expectDateProbe('probe', { value: '10:30', isValid: false });
        cy.get(S.errorText(W)).should('not.exist');

        closePopup();
        cy.get(S.input(W)).should('have.value', junk); // not reverted
        cy.get(S.errorText(W)).should('have.text', T.errorInvalid);
        cy.get(S.input(W)).should('have.attr', 'aria-invalid', 'true').and('have.class', 'is-invalid');

        // a pick from the selector replaces the text and clears the error.
        // PRODUCT BUG (kept red): the pick shows 11:30 and publishes value 11:30, but the widget stays invalid with
        // "Invalid time" — onTimeChange (TimePicker.jsx:88-101) never resets the typed-text parse error, unlike
        // setInputValue / onDateSelect (TimePicker.jsx:63,79). Typing a valid time does recover.
        openDatePopup(S.input(W));
        pickTimeItem(0, '11'); // dynamic: hour
        cy.get(S.input(W)).should('have.value', '11:30');
        closePopup();
        cy.get(commonWidgetSelector.draggableWidget('probe')).should(($probe) => {
            const input = $probe[0].ownerDocument.querySelector(S.input(W));
            const err = $probe[0].ownerDocument.querySelector(S.errorText(W));
            expect({
                exposed: JSON.parse($probe.text().trim()),
                errorText: err ? err.textContent : null,
                ariaInvalid: input.getAttribute('aria-invalid'),
            }, 'state after picking a valid time over unparseable text').to.deep.eq({
                exposed: { value: '11:30', isValid: true },
                errorText: null,
                ariaInvalid: 'false',
            });
        });
    });

    // ── TimePicker-BRW-004 ───────────────────────────────────────────────────
    it('[TimePicker-BRW-004] Submitting a Form with invalid pickers reveals each error text under its field', () => {
        const FORM = crypto.randomUUID();
        const BUTTON = crypto.randomUUID();
        const MIN = '09:00'; // dynamic: min time
        addTimePickersViaApi([
            {
                id: FORM,
                type: 'Form',
                name: 'form1',
                layout: { top: 40, left: 2, width: 20, height: 400 },
                properties: { buttonToSubmit: { value: BUTTON } }, // Form.jsx matches the dispatching button id
            },
            {
                parent: FORM,
                name: W,
                layout: { top: 20, left: 2, width: 30, height: 40 },
                properties: { defaultValue: { value: '' } }, // empty field
                validation: { mandatory: { value: '{{true}}' } }, // timepicker.js:27-30
            },
            {
                parent: FORM,
                name: 'early',
                layout: { top: 100, left: 2, width: 30, height: 40 },
                properties: { defaultValue: { value: '08:15' } }, // dynamic: before the min time
                validation: { minTime: { value: MIN } }, // timepicker.js:11-16
            },
            {
                id: BUTTON,
                parent: `${FORM}-footer`,
                type: 'Button',
                name: 'submitbtn',
                layout: { top: 10, left: 25, width: 14, height: 40 },
                properties: { text: { value: 'Submit' } },
            },
        ]);
        openDateAppInViewer(S.input(W));
        cy.get(S.input(W)).should('have.value', '').and('have.attr', 'aria-required', 'true');
        cy.get(S.input('early')).should('have.value', '08:15');
        // nothing is revealed before a submit attempt
        ['tp', 'early'].forEach((name) => {
            cy.get(S.errorText(name)).should('not.exist');
            cy.get(S.input(name)).should('have.attr', 'aria-invalid', 'false').and('not.have.class', 'is-invalid');
        });

        cy.get(`${commonWidgetSelector.draggableWidget('submitbtn')} button`).click();
        cy.get(S.errorText(W)).should('have.text', T.errorMandatory);
        cy.get(S.errorText('early')).should('have.text', T.errorMinTime(MIN));
        ['tp', 'early'].forEach((name) => {
            cy.get(S.input(name)).should('have.attr', 'aria-invalid', 'true').and('have.class', 'is-invalid');
            // coloured with errTextColor (default var(--cc-error-systemStatus) — timepicker.js:399)
            resolveCssVarColor('--cc-error-systemStatus', S.root(name)).then((rgb) =>
                expectComputedColor(S.errorText(name), 'color', rgb));
            // under the field, inside the widget's width, painted
            cy.document().should((doc) => {
                const input = doc.querySelector(S.input(name)).getBoundingClientRect();
                const err = doc.querySelector(S.errorText(name)).getBoundingClientRect();
                expect(err.height, `${name}: error text painted`).to.be.gt(0);
                expect(err.top, `${name}: error text starts below the field`).to.be.gte(input.bottom - 1);
                expect(err.left, `${name}: error text within the field (left)`).to.be.gte(input.left - 1);
                expect(err.right, `${name}: error text within the field (right)`).to.be.lte(input.right + 1);
            });
        });

        // picking a valid time removes that field's message only
        openDatePopup(S.input(W));
        pickTimeItem(0, '10'); // dynamic: any hour
        cy.get(S.input(W)).should('have.value', '10:00');
        cy.get(S.errorText(W)).should('not.exist');
        cy.get(S.input(W)).should('have.attr', 'aria-invalid', 'false');
        cy.get(S.errorText('early')).should('have.text', T.errorMinTime(MIN));
    });
});
