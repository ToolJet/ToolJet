/**
 * SPEC — Date Picker — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus the timezone half of a TESTING.md browser scenario:
 *   device context — saved Show on desktop / Show on mobile flags (datepickerV2.js:41-44, defaults :390-391)
 *   select the editor layout and the running app the picker renders on (WidgetWrapper: off = not rendered);
 *   exposed-value context — the dropped widget's deterministic exposed values in the inspector tree
 *   (DatePickerV2.jsx:128-142 mount publish), and the editor canvas vs the running app agreeing on them.
 *   DatePickerV2-BRW-002 — (timezone half) the picker has no timezone settings: the field shows the date as
 *   entered, while `value` / `unixTimestamp` are that date's local midnight in the BROWSER's zone
 *   (DatePickerV2.jsx:96-106 — utils.js getUnixTime parses in local time, convertToIsoWithTimezoneOffset formats
 *   with moment.tz.guess()). The offset must be the one in force on that date (DST), unlike a fixed zone offset.
 * Time zone: pinned through CDP per test (Asia/Kolkata, or America/New_York for DST); restored after the spec.
 * Helpers: switchLayout, openNode, openAndVerifyNode, verifyNodeData, addDatePickersViaApi, dateProbe,
 * expectDateProbe, openDateAppInViewer, openDatePopup, pickCalendarDay, pinBrowserTimezone,
 * expectBrowserTimezone, unpinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { datePickerV2Selector as S } from "Selectors/appBuilder/components/datePickerV2";
import { datePickerV2Text as T } from "Texts/appBuilder/components/datePickerV2";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { addDatePickersViaApi, unpinBrowserTimezone } from "Support/utils/appBuilder/components/datePickerV2";
import {
    pinBrowserTimezone,
    expectBrowserTimezone,
    dateProbe,
    expectDateProbe,
    openDateAppInViewer,
    openDatePopup,
    pickCalendarDay,
} from "Support/utils/appBuilder/components/dateTimeCommon";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = T.defaultWidgetName;

describe('Date Picker — contexts facet', { testIsolation: false }, () => {
    after(() => unpinBrowserTimezone());

    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DatePickerV2-contexts-${Cypress._.uniqueId()}`);
            pinBrowserTimezone(T.browserTimezone);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('exposed-value context — default values observable in the inspector tree', () => {
            cy.get(S.input(W)).should('have.value', T.defaultValue);
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'selectedDate', type: 'String', value: `"${T.defaultValue}"` }, // datepickerV2.js:402
                { key: 'displayValue', type: 'String', value: `"${T.defaultValue}"` },
                { key: 'dateFormat', type: 'String', value: `"${T.dateFormat}"` }, // datepickerV2.js:404
                { key: 'value', type: 'String', value: `"2022-01-01T00:00:00.000${T.browserOffset}"` },
            ], verifyNodeData);
        });
    });

    describe('editor vs running app', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DatePickerV2-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('device context — saved Show on desktop / Show on mobile flags pick the layouts the picker renders on', () => {
            pinBrowserTimezone(T.browserTimezone);
            const OFF = { value: '{{false}}' };
            const ON = { value: '{{true}}' };
            // one vertical lane (the mobile canvas stacks widgets)
            addDatePickersViaApi([
                { name: 'desktoponly', layout: { top: 40, left: 2, width: 10, height: 40 } }, // defaults desktop on, mobile off
                { name: 'mobileonly', layout: { top: 100, left: 2, width: 10, height: 40 }, others: { showOnDesktop: OFF, showOnMobile: ON } },
                { name: 'both', layout: { top: 160, left: 2, width: 10, height: 40 }, others: { showOnMobile: ON } },
            ]);
            const expectRendered = (expected, context) =>
                Object.entries(expected).forEach(([name, shown]) => {
                    cy.log(`${context}: ${name} ${shown ? 'rendered' : 'absent'}`);
                    cy.get(S.input(name)).should(shown ? 'be.visible' : 'not.exist');
                });
            cy.openApp('', undefined, undefined, S.input('both'));
            expectRendered({ desktoponly: true, mobileonly: false, both: true }, 'editor desktop');
            switchLayout('mobile');
            expectRendered({ desktoponly: false, mobileonly: true, both: true }, 'editor mobile');
            switchLayout('desktop');
            expectRendered({ desktoponly: true, mobileonly: false, both: true }, 'editor desktop again');

            openDateAppInViewer(S.input('both'));
            expectRendered({ desktoponly: true, mobileonly: false, both: true }, 'running app desktop');
        });

        it('exposed-value context — the editor canvas and the running app publish the same values', () => {
            pinBrowserTimezone(T.browserTimezone);
            const expected = {
                displayValue: '15/06/2026',
                selectedDate: '15/06/2026',
                value: `2026-06-15T00:00:00.000${T.browserOffset}`,
                unixTimestamp: Date.UTC(2026, 5, 14, 18, 30), // local midnight at +05:30
                isValid: true,
            };
            addDatePickersViaApi([
                { name: 'dp', properties: { defaultValue: { value: expected.displayValue } } }, // dynamic: fixed date
                dateProbe('probe', 'dp', Object.keys(expected), { top: 300 }),
            ]);
            cy.openApp('', undefined, undefined, S.input('dp'));
            cy.get(S.input('dp')).should('have.value', expected.displayValue);
            expectDateProbe('probe', expected, 'editor');

            openDateAppInViewer(S.input('dp'));
            cy.get(S.input('dp')).should('have.value', expected.displayValue);
            expectDateProbe('probe', expected, 'viewer');
        });

        // ── DatePickerV2-BRW-002 (timezone display) ──────────────────────────
        it('[DatePickerV2-BRW-002] The field shows the date as entered; value is local midnight with the browser-zone offset in force on that date', () => {
            pinBrowserTimezone(T.dstTimezone);
            const keys = ['displayValue', 'value', 'unixTimestamp'];
            addDatePickersViaApi([
                // control: January, New York on EST (-05:00)
                { name: 'winter', layout: { top: 40, left: 2, width: 10, height: 40 }, properties: { defaultValue: { value: '15/01/2026' } } },
                // July, New York on EDT (-04:00)
                { name: 'summer', layout: { top: 100, left: 2, width: 10, height: 40 }, properties: { defaultValue: { value: '15/07/2026' } } },
                dateProbe('wprobe', 'winter', keys, { top: 300 }),
                dateProbe('sprobe', 'summer', keys, { top: 380 }),
            ]);
            openDateAppInViewer(S.input('summer'));
            expectBrowserTimezone(T.dstTimezone);

            // the field never shifts the date: what was entered is what is shown, in either season
            cy.get(S.input('winter')).should('have.value', '15/01/2026');
            cy.get(S.input('summer')).should('have.value', '15/07/2026');
            expectDateProbe('wprobe', {
                displayValue: '15/01/2026',
                value: '2026-01-15T00:00:00.000-05:00',
                unixTimestamp: Date.UTC(2026, 0, 15, 5), // 00:00 EST
            }, 'winter (EST)');
            expectDateProbe('sprobe', {
                displayValue: '15/07/2026',
                value: '2026-07-15T00:00:00.000-04:00',
                unixTimestamp: Date.UTC(2026, 6, 15, 4), // 00:00 EDT
            }, 'summer (EDT)');

            // a calendar pick is also the local midnight of the clicked day, with that day's offset
            openDatePopup(S.input('summer'));
            pickCalendarDay(20); // dynamic: another July day
            cy.get(S.input('summer')).should('have.value', '20/07/2026');
            expectDateProbe('sprobe', {
                displayValue: '20/07/2026',
                value: '2026-07-20T00:00:00.000-04:00',
                unixTimestamp: Date.UTC(2026, 6, 20, 4),
            }, 'summer pick (EDT)');
        });
    });
});
