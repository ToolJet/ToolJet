/**
 * SPEC — Date Time Picker — properties facet.
 * FOR AI: property behaviour that only a real browser shows, from the TESTING.md browser scenarios:
 *   DatetimePickerV2-BRW-006 — with no value the input shows the configured `placeholder` (datetimepickerV2.js:74-81)
 *                              and the empty-value styling: DatepickerInput.jsx:42-47 paints the text with
 *                              var(--cc-placeholder-text) while the value is empty, the field text colour otherwise.
 *   DatetimePickerV2-BRW-002 — (timezone half) the real wall-clock offset rendering, incl. DST: with "Manage time
 *                              zones" on, the field shows the instant in `displayTimezone` and `value` is the ISO
 *                              string of the instant in `storeTimezone` (DatetimePickerV2.jsx:84-100, :172-184;
 *                              utils.js getOffset / getUnixTimeFromParsedDate / convertToIsoWithTimezoneOffset).
 *                              D-13 leaves the offset math, DST and the inspector timezone dropdowns to QA.
 * Time zone: the browser is pinned to Asia/Kolkata (+05:30, no DST) through CDP; all dates are explicit.
 * Helpers: addDatetimePickersViaApi, pinBrowserTimezone, expectBrowserTimezone, dateProbe, expectDateProbe,
 * openDateAppInViewer, openDatePopup, pickCalendarDay, pickTimeItem, openEditorSidebar, verifyAndModifyParameter,
 * resolveCssVarColor, expectComputedColor.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { datetimePickerV2Selector as S } from "Selectors/appBuilder/components/datetimePickerV2";
import { datetimePickerV2Text as T } from "Texts/appBuilder/components/datetimePickerV2";
import { openEditorSidebar, verifyAndModifyParameter } from "Support/utils/commonWidget";
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
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = 'dtp';
const ON = { value: '{{true}}' };

// timezone-enabled picker; `display` / `store` are IANA ids as the inspector dropdowns store them
const tzPicker = (name, top, display, store, defaultValue) => ({
    name,
    layout: { top, left: 2, width: 12, height: 40 },
    properties: {
        isTimezoneEnabled: ON, // datetimepickerV2.js:68-73
        displayTimezone: { value: display },
        storeTimezone: { value: store },
        defaultValue: { value: defaultValue },
    },
});
// one Text exposing [displayValue, value] of several pickers as JSON
const multiProbe = (name, widgets, top) => ({
    type: 'Text',
    name,
    layout: { top, left: 2, width: 40, height: 80 },
    properties: {
        text: { value: `{{JSON.stringify({${widgets.map((w) => `${w}: [components.${w}.displayValue, components.${w}.value]`).join(', ')}})}}` },
    },
});

describe('Date Time Picker — properties facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-DatetimePickerV2-properties-${Cypress._.uniqueId()}`);
        pinBrowserTimezone(T.browserTimezone);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── DatetimePickerV2-BRW-006 ─────────────────────────────────────────────
    it('[DatetimePickerV2-BRW-006] An empty field shows the configured placeholder in the placeholder colour; a value replaces it', () => {
        const placeholder = fake.fullName.slice(0, 24); // dynamic: fake
        addDatetimePickersViaApi([
            {
                name: W,
                layout: { top: 40, left: 2, width: 14, height: 40 },
                properties: {
                    defaultValue: { value: '' }, // empty field
                    showClearBtn: ON, // datetimepickerV2.js:90-95 — to empty it again from the UI
                },
            },
        ]);
        cy.openApp('', undefined, undefined, S.input(W));

        const expectPlaceholderState = (text, context) => {
            cy.log(`placeholder — ${context}`);
            cy.get(S.input(W)).should('have.value', '').and('have.attr', 'placeholder', text);
            resolveCssVarColor('--cc-placeholder-text', S.root(W)).then((rgb) => {
                expectComputedColor(S.input(W), 'color', rgb);
                cy.get(S.input(W)).should(($i) =>
                    expect(getComputedStyle($i[0], '::placeholder').color, '::placeholder colour').to.eq(rgb));
            });
        };
        const expectValueState = (context) => {
            cy.log(`value — ${context}`);
            cy.get(S.input(W)).invoke('val').should('match', /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
            // the field text colour (selectedTextColor default var(--cc-primary-text) — datetimepickerV2.js:475)
            resolveCssVarColor('--cc-primary-text', S.root(W)).then((rgb) => expectComputedColor(S.input(W), 'color', rgb));
            resolveCssVarColor('--cc-placeholder-text', S.root(W)).then((rgb) =>
                cy.get(S.input(W)).should(($i) => expect(getComputedStyle($i[0]).color, 'not the placeholder colour').not.to.eq(rgb)));
        };

        // definition default placeholder (datetimepickerV2.js:449)
        expectPlaceholderState(T.placeholder, 'editor, default placeholder');

        // configured placeholder — array form types it verbatim
        openEditorSidebar(W);
        verifyAndModifyParameter(T.labelPlaceholder, [placeholder]);
        cy.forceClickOnCanvas();
        expectPlaceholderState(placeholder, 'editor, configured placeholder');
        cy.waitForAutoSave();

        // running app: same placeholder; picking a value replaces the empty styling; clearing restores it
        openDateAppInViewer(S.input(W));
        expectPlaceholderState(placeholder, 'viewer');
        openDatePopup(S.input(W));
        pickCalendarDay(12); // dynamic: any day of the (current) shown month
        expectValueState('viewer, after a pick');
        cy.get(S.clearButton(W)).click();
        expectPlaceholderState(placeholder, 'viewer, after clearing');
    });

    // ── DatetimePickerV2-BRW-002 (timezone offsets) ──────────────────────────
    // Fixed-offset zones: no DST anywhere, so the arithmetic is unambiguous.
    it('[DatetimePickerV2-BRW-002] Timezones without DST: the field shows the display-zone wall clock, value is the store-zone ISO, a pick converts back', () => {
        addDatetimePickersViaApi([
            // stored in UTC, shown in Bogota (UTC-05:00): 10:00Z → 05:00
            tzPicker('bogota', 40, 'America/Bogota', 'Etc/UTC', '15/06/2026 10:00'),
            // stored in Kathmandu (+05:45), shown in UTC: 10:00 +05:45 → 04:15Z
            tzPicker('kathmandu', 100, 'Etc/UTC', 'Asia/Kathmandu', '15/06/2026 10:00'),
            multiProbe('probe', ['bogota', 'kathmandu'], 300),
            dateProbe('tzprobe', 'bogota', ['displayTimezone', 'storeTimezone'], { top: 400 }),
        ]);
        openDateAppInViewer(S.input('bogota'));
        expectBrowserTimezone(T.browserTimezone);
        expectDateProbe('tzprobe', { displayTimezone: 'America/Bogota', storeTimezone: 'Etc/UTC' });
        expectDateProbe('probe', {
            bogota: ['15/06/2026 05:00', '2026-06-15T10:00:00.000+00:00'],
            kathmandu: ['15/06/2026 04:15', '2026-06-15T10:00:00.000+05:45'],
        });
        cy.get(S.input('bogota')).should('have.value', '15/06/2026 05:00');
        cy.get(S.input('kathmandu')).should('have.value', '15/06/2026 04:15');

        // a pick is a display-zone wall clock: 07:00 in Bogota is 12:00Z
        openDatePopup(S.input('bogota'));
        pickTimeItem(0, '07');
        cy.get(S.input('bogota')).should('have.value', '15/06/2026 07:00');
        expectDateProbe('probe', {
            bogota: ['15/06/2026 07:00', '2026-06-15T12:00:00.000+00:00'],
            kathmandu: ['15/06/2026 04:15', '2026-06-15T10:00:00.000+05:45'],
        });
    });

    // DST zones: the wall clock must use the offset in force ON THAT DATE (the inspector lists region names,
    // e.g. "America/New_York"). Winter dates are the control — they pass with a fixed standard offset too.
    it('[DatetimePickerV2-BRW-002] Timezones with DST: summer dates use the summer offset in the field and in value', () => {
        addDatetimePickersViaApi([
            // control: January, New York on EST (-05:00): 12:00Z → 07:00
            tzPicker('nywinter', 40, 'America/New_York', 'Etc/UTC', '15/01/2026 12:00'),
            // July, New York on EDT (-04:00): 12:00Z → 08:00
            tzPicker('nysummer', 100, 'America/New_York', 'Etc/UTC', '15/07/2026 12:00'),
            // July, Sydney on AEST (+10:00, its winter): 12:00Z → 22:00
            tzPicker('sydney', 160, 'Australia/Sydney', 'Etc/UTC', '15/07/2026 12:00'),
            // stored in New York: the entered 09:00 New York in July is 09:00-04:00 (13:00Z)
            tzPicker('nystore', 220, 'America/New_York', 'America/New_York', '15/07/2026 09:00'),
            multiProbe('probe', ['nywinter', 'nysummer', 'sydney', 'nystore'], 300),
        ]);
        openDateAppInViewer(S.input('nystore'));
        expectBrowserTimezone(T.browserTimezone);

        // control first: a winter date renders with the standard offset
        cy.get(S.input('nywinter')).should('have.value', '15/01/2026 07:00');

        // PRODUCT BUG (kept red): utils.js getOffset reads every zone's offset at a fixed instant
        // (2020-01-01), so DST is never applied — New York summer shows 07:00, Sydney winter 23:00, and a
        // value stored in New York comes back an hour later than entered (10:00-04:00), while
        // convertToIsoWithTimezoneOffset (moment.tz) does honour DST. All symptoms in one comparison:
        cy.get(commonWidgetSelector.draggableWidget('probe')).should(($el) => {
            const probe = JSON.parse($el.text().trim());
            const fields = Object.fromEntries(
                ['nywinter', 'nysummer', 'sydney', 'nystore'].map((n) => [n, Cypress.$(S.input(n)).val()]));
            expect({ fields, probe }, 'DST-correct wall clock and stored value').to.deep.eq({
                fields: {
                    nywinter: '15/01/2026 07:00',
                    nysummer: '15/07/2026 08:00',
                    sydney: '15/07/2026 22:00',
                    nystore: '15/07/2026 09:00',
                },
                probe: {
                    nywinter: ['15/01/2026 07:00', '2026-01-15T12:00:00.000+00:00'],
                    nysummer: ['15/07/2026 08:00', '2026-07-15T12:00:00.000+00:00'],
                    sydney: ['15/07/2026 22:00', '2026-07-15T12:00:00.000+00:00'],
                    nystore: ['15/07/2026 09:00', '2026-07-15T09:00:00.000-04:00'],
                },
            });
        });
    });

    // The inspector's "Display in" / "Store in" dropdowns (D-13: QA-owned) drive the same conversion live.
    it('[DatetimePickerV2-BRW-002] The Display in / Store in dropdowns re-render the field in the picked zones', () => {
        addDatetimePickersViaApi([
            {
                name: W,
                layout: { top: 40, left: 2, width: 14, height: 40 },
                properties: {
                    isTimezoneEnabled: ON,
                    defaultValue: { value: '15/06/2026 10:00' }, // dynamic: fixed explicit date
                    // display / store stay at the definition default 'UTC' (datetimepickerV2.js:453-454)
                },
            },
        ]);
        cy.openApp('', undefined, undefined, S.input(W));
        cy.get(S.input(W)).should('have.value', '15/06/2026 10:00');

        const pickZone = (index, zone) => {
            // both dropdowns render data-cy="input-display-time-zone" (Display in = 0, Store in = 1)
            cy.get('[data-cy="input-display-time-zone"]').eq(index).find('.react-select__control').click();
            cy.realType(zone);
            cy.contains('.react-select__option', `${zone} (UTC`).click();
            cy.get('[data-cy="input-display-time-zone"]').eq(index).should('contain.text', zone);
        };
        openEditorSidebar(W);
        pickZone(0, 'America/Bogota'); // 10:00 UTC → 05:00 in Bogota
        cy.get(S.input(W)).should('have.value', '15/06/2026 05:00');
        pickZone(1, 'Asia/Kathmandu'); // the default is now read as 10:00 Kathmandu = 04:15Z → 23:15 Bogota, day before
        cy.get(S.input(W)).should('have.value', '14/06/2026 23:15');
        cy.forceClickOnCanvas();
        cy.waitForAutoSave();

        openDateAppInViewer(S.input(W));
        cy.get(S.input(W)).should('have.value', '14/06/2026 23:15');
    });
});
