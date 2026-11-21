/**
 * SPEC — Date Range Picker — userflow facet.
 * FOR AI: real-pointer / keyboard interaction from the TESTING.md browser scenarios:
 *   DaterangePicker-BRW-001 — the react-datepicker dual calendar (monthsShown 2, selectsRange — DaterangePicker.jsx:329-334)
 *                             opens; clicking a start then an end day selects the range, fires On select once per pick
 *                             (DaterangePicker.jsx:105-121 onChange), and the FIELD shows the range with ` → ` (partial
 *                             `start → ` while picking — :69-80) while the exposed selectedDateRange uses ` - ` (D-03).
 *   DaterangePicker-BRW-002 — keyboard navigation inside the open calendar: Tab moves focus into the popup (the
 *                             preselected day), arrows move the keyboard highlight, Enter commits the start / end.
 *   DaterangePicker-BRW-004 — blurring the input (DatepickerInput.jsx:66-69) or submitting a Form
 *                             (useShowValidationOnFormSubmit, DaterangePicker.jsx:83-84) reveals the validation error
 *                             TEXT under the field with aria-invalid (DatepickerInput.jsx:74,107-121).
 *   DaterangePicker-BRW-006 — (close half) the calendar closes once the end date is picked (shouldCloseOnSelect,
 *                             DaterangePicker.jsx:349; e570ef16b8). Geometry / dynamic height → canvas.cy.js.
 * Observed through: a probe Text with the exposed range values as JSON + an On select counter (set-variable).
 * Time zone: the browser is pinned to Asia/Kolkata (CDP) and every date is an explicit fixed date — no cy.clock.
 * Helpers: addDaterangePickersViaApi, pickRangeDay, expectShownMonths, expectDayCells, expectRangeDisplay,
 * rangeExposed, moveMouseAway, pinBrowserTimezone, expectBrowserTimezone, dateProbe, expectDateProbe, openDateAppInViewer,
 * openDatePopup, expectActiveElement, counterEvent, counterText, expectCounter, resolveCssVarColor, expectComputedColor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { daterangePickerSelector as S } from "Selectors/appBuilder/components/daterangePicker";
import { daterangePickerText as T } from "Texts/appBuilder/components/daterangePicker";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { resolveCssVarColor, expectComputedColor } from "Support/utils/appBuilder/components/baseInput";
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";
import {
    addDaterangePickersViaApi,
    pickRangeDay,
    expectShownMonths,
    expectDayCells,
    expectRangeDisplay,
    rangeExposed,
    RANGE_KEYS,
} from "Support/utils/appBuilder/components/daterangePicker";
import {
    pinBrowserTimezone,
    expectBrowserTimezone,
    dateProbe,
    expectDateProbe,
    openDateAppInViewer,
    openDatePopup,
    expectActiveElement,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'drp';
// dynamic: a fixed explicit range in the default format DD/MM/YYYY (daterangepicker.js:427)
const START = '10/06/2026';
const END = '14/06/2026';
const seededPicker = (extra = {}) => ({
    name: W,
    layout: { top: 40, left: 2, width: 12, height: 40 },
    properties: { defaultStartDate: { value: START }, defaultEndDate: { value: END } },
    events: [counterEvent('onSelect', 'selects')], // daterangepicker.js:154
    ...extra,
});

describe('Date Range Picker — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        moveMouseAway(); // the real pointer persists across tests — keep it off the popup (stray hover previews)
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DaterangePicker-userflow-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── DaterangePicker-BRW-001 ──────────────────────────────────────────────
    it('[DaterangePicker-BRW-001] The dual calendar opens; clicking a start then an end day selects the range with an arrow display', () => {
        addDaterangePickersViaApi([
            seededPicker(),
            dateProbe('probe', W, RANGE_KEYS, { top: 300, width: 40 }),
            counterText('selects', 'selects', { top: 400 }),
        ]);
        openDateAppInViewer(S.input(W));
        expectBrowserTimezone(T.browserTimezone);
        expectRangeDisplay(W, START, END);
        expectDateProbe('probe', rangeExposed(START, END));
        expectCounter('selects', 'selects', 0); // mount publishes without firing

        // two months side by side, starting at the selected start's month, the seeded range highlighted
        openDatePopup(S.input(W));
        cy.get(S.rangePopup).should('be.visible');
        cy.get(P.monthContainer).should('have.length', 2);
        expectShownMonths([`${T.monthNames[5]} 2026`, `${T.monthNames[6]} 2026`]);
        expectDayCells(S.rangeStart, ['10'], 'range start');
        expectDayCells(S.rangeEnd, ['14'], 'range end');
        expectDayCells(S.inRange, ['10', '11', '12', '13', '14'], 'seeded range');

        // first click starts a NEW range: start set, end cleared, partial display, one On select, popup stays open
        pickRangeDay(0, 20); // dynamic: 20 June
        expectRangeDisplay(W, '20/06/2026', null);
        expectDateProbe('probe', rangeExposed('20/06/2026', null));
        expectCounter('selects', 'selects', 1);
        cy.get(S.rangePopup).should('be.visible');
        expectDayCells(S.inRange, [], 'the seeded range is gone');
        expectDayCells(S.inSelectingRange, ['20'], 'only the new start is being selected');

        // second click (in the right-hand month) ends it: full arrow display, ` - ` in the exposed value
        pickRangeDay(1, 3); // dynamic: 3 July
        expectRangeDisplay(W, '20/06/2026', '03/07/2026');
        cy.get(S.input(W)).invoke('val').should('not.contain', T.exposedSeparator);
        expectDateProbe('probe', rangeExposed('20/06/2026', '03/07/2026'));
        expectCounter('selects', 'selects', 2);

        cy.get(P.popup).should('not.exist');
        // the picked range is what the field keeps after the popup closes
        cy.get(commonWidgetSelector.draggableWidget('selects')).click();
        expectRangeDisplay(W, '20/06/2026', '03/07/2026');
        expectCounter('selects', 'selects', 2);
    });

    // ── DaterangePicker-BRW-001 (reopening after a cross-month pick) ─────────
    // PRODUCT BUG (kept red): the first open shows the start's month on the LEFT (June | July), but after an end
    // date is clicked in the RIGHT-hand month, every later open shows the start's month on the RIGHT (May | June):
    // react-datepicker keeps `monthSelectedIn` = 1 from that click and DaterangePicker.jsx never resets it, so the
    // picked end (3 July) is off-screen and the range looks cut off.
    it('[DaterangePicker-BRW-001] Reopening after a cross-month pick shows the picked range from its start month', () => {
        addDaterangePickersViaApi([seededPicker(), counterText('selects', 'selects', { top: 400 })]);
        openDateAppInViewer(S.input(W));
        openDatePopup(S.input(W));
        expectShownMonths([`${T.monthNames[5]} 2026`, `${T.monthNames[6]} 2026`]); // first open: start month left
        pickRangeDay(0, 20); // dynamic: 20 June
        pickRangeDay(1, 3); // dynamic: 3 July (right-hand month)
        cy.get(P.popup).should('not.exist');
        expectRangeDisplay(W, '20/06/2026', '03/07/2026');

        openDatePopup(S.input(W));
        expectCounter('selects', 'selects', 2); // opening does not select
        cy.document().should((doc) => {
            const values = [...doc.querySelectorAll(S.monthHeaderValues)].map((e) => e.textContent.trim());
            const inMonth = (sel) => [...doc.querySelectorAll(sel)].map((e) => e.textContent.trim());
            expect({
                months: [`${values[0]} ${values[1]}`, `${values[2]} ${values[3]}`],
                rangeStart: inMonth(S.rangeStart),
                rangeEnd: inMonth(S.rangeEnd),
            }, 'reopened calendar').to.deep.eq({
                months: [`${T.monthNames[5]} 2026`, `${T.monthNames[6]} 2026`],
                rangeStart: ['20'],
                rangeEnd: ['3'],
            });
        });
    });

    // ── DaterangePicker-BRW-006 (calendar closes after the end date) ─────────
    it('[DaterangePicker-BRW-006] The calendar stays open after the start date and closes after the end date', () => {
        addDaterangePickersViaApi([seededPicker(), counterText('selects', 'selects', { top: 400 })]);
        openDateAppInViewer(S.input(W));

        openDatePopup(S.input(W));
        pickRangeDay(0, 16); // dynamic: start
        cy.get(S.rangePopup).should('be.visible');
        // hovering a later day previews the range being selected
        cy.get(P.monthContainer).eq(0).find(S.dayCell(18)).realHover();
        expectDayCells(S.inSelectingRange, ['16', '17', '18'], 'preview while selecting');
        pickRangeDay(0, 18); // dynamic: end
        cy.get(P.popup).should('not.exist');
        expectRangeDisplay(W, '16/06/2026', '18/06/2026');
        expectCounter('selects', 'selects', 2);
    });

    // ── DaterangePicker-BRW-002 ──────────────────────────────────────────────
    it('[DaterangePicker-BRW-002] Keyboard: arrows move the highlighted day and Enter picks the start and the end', () => {
        addDaterangePickersViaApi([
            seededPicker(),
            dateProbe('probe', W, RANGE_KEYS, { top: 300, width: 40 }),
            counterText('selects', 'selects', { top: 400 }),
        ]);
        openDateAppInViewer(S.input(W));
        openDatePopup(S.input(W));
        expectActiveElement(S.input(W), true);

        // Tab moves focus from the input into the calendar, onto the selected start day
        cy.realPress('Tab');
        cy.focused().should('have.class', 'react-datepicker__day--range-start').and('have.text', '10');
        cy.get(S.rangePopup).should('be.visible');

        cy.realPress('ArrowRight');
        expectDayCells(S.keyboardSelected, ['11'], 'ArrowRight → next day');
        cy.realPress('ArrowRight');
        cy.realPress('ArrowDown');
        expectDayCells(S.keyboardSelected, ['19'], 'ArrowDown → one week later');
        cy.realPress('ArrowUp');
        expectDayCells(S.keyboardSelected, ['12'], 'ArrowUp → one week earlier');
        expectCounter('selects', 'selects', 0); // moving the highlight selects nothing

        cy.realPress('Enter'); // start = 12 June
        expectRangeDisplay(W, '12/06/2026', null);
        expectDateProbe('probe', rangeExposed('12/06/2026', null));
        expectCounter('selects', 'selects', 1);
        cy.get(S.rangePopup).should('be.visible');

        cy.realPress('ArrowDown');
        cy.realPress('ArrowLeft');
        expectDayCells(S.keyboardSelected, ['18'], 'week down, day left');
        expectDayCells(S.inSelectingRange, ['12', '13', '14', '15', '16', '17', '18'], 'keyboard preview of the range');

        cy.realPress('Enter'); // end = 18 June → calendar closes
        expectRangeDisplay(W, '12/06/2026', '18/06/2026');
        expectDateProbe('probe', rangeExposed('12/06/2026', '18/06/2026'));
        expectCounter('selects', 'selects', 2);
        cy.get(P.popup).should('not.exist');
    });

    // ── DaterangePicker-BRW-004 (blur) ───────────────────────────────────────
    it('[DaterangePicker-BRW-004] Blurring the field reveals the validation error text under it with aria-invalid', () => {
        addDaterangePickersViaApi([
            {
                name: 'mandatory',
                layout: { top: 40, left: 2, width: 14, height: 40 },
                properties: { defaultStartDate: { value: '' }, defaultEndDate: { value: '' } }, // empty range
                validation: { mandatory: { value: '{{true}}' } }, // daterangepicker.js:36-39
            },
            {
                name: 'inverted',
                layout: { top: 140, left: 2, width: 14, height: 40 },
                // dynamic: start after end (D-02 — both kept, isValid false)
                properties: { defaultStartDate: { value: '20/06/2026' }, defaultEndDate: { value: '10/06/2026' } },
            },
            dateProbe('probe', 'mandatory', ['isValid'], { top: 300 }),
            dateProbe('probe2', 'inverted', ['isValid'], { top: 380 }),
        ]);
        openDateAppInViewer(S.input('mandatory'));
        // invalid from the start, but nothing is revealed before the field is left
        expectDateProbe('probe', { isValid: false });
        expectDateProbe('probe2', { isValid: false });
        ['mandatory', 'inverted'].forEach((name) => {
            cy.get(S.errorText(name)).should('not.exist');
            cy.get(S.input(name)).should('have.attr', 'aria-invalid', 'false').and('not.have.class', 'is-invalid');
        });

        [['mandatory', T.errorMandatory], ['inverted', T.errorOrder]].forEach(([name, message]) => {
            cy.get(S.input(name)).focus();
            cy.get(S.errorText(name)).should('not.exist'); // focusing alone reveals nothing
            cy.get(S.input(name)).blur();
            cy.get(S.errorText(name)).should('have.text', message);
            cy.get(S.input(name)).should('have.attr', 'aria-invalid', 'true').and('have.class', 'is-invalid');
        });
        // coloured with errTextColor (default var(--cc-error-systemStatus) — daterangepicker.js:457), under the field
        resolveCssVarColor('--cc-error-systemStatus', S.root('mandatory')).then((rgb) =>
            expectComputedColor(S.errorText('mandatory'), 'color', rgb));
        cy.document().should((doc) => {
            const input = doc.querySelector(S.input('mandatory')).getBoundingClientRect();
            const err = doc.querySelector(S.errorText('mandatory')).getBoundingClientRect();
            expect(err.height, 'error text painted').to.be.gt(0);
            expect(err.top, 'error text starts below the field').to.be.gte(input.bottom - 1);
        });
    });

    // ── DaterangePicker-BRW-004 (Form submit) ────────────────────────────────
    it('[DaterangePicker-BRW-004] Submitting a Form with an empty mandatory range reveals the error text; picking a range clears it', () => {
        const FORM = crypto.randomUUID();
        const BUTTON = crypto.randomUUID();
        addDaterangePickersViaApi([
            {
                id: FORM,
                type: 'Form',
                name: 'form1',
                layout: { top: 40, left: 2, width: 18, height: 330 },
                properties: { buttonToSubmit: { value: BUTTON } }, // Form.jsx matches the dispatching button id
            },
            {
                parent: FORM,
                name: W,
                layout: { top: 20, left: 2, width: 36, height: 40 },
                properties: { defaultStartDate: { value: '' }, defaultEndDate: { value: '' } }, // empty range
                validation: { mandatory: { value: '{{true}}' } }, // daterangepicker.js:36-39
            },
            {
                id: BUTTON,
                parent: `${FORM}-footer`,
                type: 'Button',
                name: 'submitbtn',
                layout: { top: 10, left: 25, width: 14, height: 40 },
                properties: { text: { value: 'Submit' } },
            },
            dateProbe('probe', W, ['isValid', 'startDate', 'endDate'], { top: 420, width: 30 }),
        ]);
        openDateAppInViewer(S.input(W));
        cy.get(S.input(W)).should('have.value', '').and('have.attr', 'aria-required', 'true');
        expectDateProbe('probe', { isValid: false, startDate: null, endDate: null });
        cy.get(S.errorText(W)).should('not.exist');

        cy.get(`${commonWidgetSelector.draggableWidget('submitbtn')} button`).click();
        cy.get(S.errorText(W)).should('have.text', T.errorMandatory);
        cy.get(S.input(W)).should('have.attr', 'aria-invalid', 'true').and('have.class', 'is-invalid');

        // a full range makes the field valid and removes the message
        openDatePopup(S.input(W));
        pickRangeDay(0, 10); // dynamic: any days of the (current) shown month
        pickRangeDay(0, 12);
        cy.get(P.popup).should('not.exist');
        cy.get(commonWidgetSelector.draggableWidget('probe')).should(($el) => {
            const probe = JSON.parse($el.text().trim());
            expect(probe.isValid, 'valid after a pick').to.eq(true);
            expect(probe.startDate, 'start stored').to.match(/^10\/\d{2}\/\d{4}$/);
            expect(probe.endDate, 'end stored').to.match(/^12\/\d{2}\/\d{4}$/);
        });
        cy.get(S.errorText(W)).should('not.exist');
        cy.get(S.input(W)).should('have.attr', 'aria-invalid', 'false');
    });
});
