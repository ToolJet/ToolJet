/**
 * SPEC — Date Range Picker — contexts facet.
 * FOR AI: always-on device + exposed-value contexts (no TESTING.md browser scenario maps here):
 *   device context — saved Show on desktop / Show on mobile flags (daterangepicker.js:42-43, defaults :420-421)
 *   select the editor layout and the running app the picker renders on (WidgetWrapper: off = not rendered);
 *   exposed-value context — the dropped widget's deterministic exposed range values in the inspector tree
 *   (DaterangePicker.jsx:161-190 mount publish), and the editor canvas vs the running app agreeing on them.
 * Time zone: the browser is pinned to Asia/Kolkata (CDP) so the *InUnix values are deterministic.
 * Helpers: switchLayout, openNode, openAndVerifyNode, verifyNodeData, addDaterangePickersViaApi, rangeExposed,
 * localMidnightUnix, expectRangeDisplay, dateProbe, expectDateProbe, openDateAppInViewer, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { daterangePickerSelector as S } from "Selectors/appBuilder/components/daterangePicker";
import { daterangePickerText as T } from "Texts/appBuilder/components/daterangePicker";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import {
    addDaterangePickersViaApi,
    rangeExposed,
    localMidnightUnix,
    expectRangeDisplay,
    RANGE_KEYS,
} from "Support/utils/appBuilder/components/daterangePicker";
import {
    pinBrowserTimezone,
    dateProbe,
    expectDateProbe,
    openDateAppInViewer,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = T.defaultWidgetName;

describe('Date Range Picker — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DaterangePicker-contexts-${Cypress._.uniqueId()}`);
            pinBrowserTimezone(T.browserTimezone);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('exposed-value context — default range values observable in the inspector tree', () => {
            expectRangeDisplay(W, T.defaultStartDate, T.defaultEndDate);
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'startDate', type: 'String', value: `"${T.defaultStartDate}"` }, // daterangepicker.js:425
                { key: 'endDate', type: 'String', value: `"${T.defaultEndDate}"` }, // daterangepicker.js:426
                {
                    key: 'selectedDateRange',
                    type: 'String',
                    value: `"${T.defaultStartDate}${T.exposedSeparator}${T.defaultEndDate}"`,
                },
                { key: 'startDateInUnix', type: 'Number', value: `${localMidnightUnix(T.defaultStartDate)}` },
                { key: 'endDateInUnix', type: 'Number', value: `${localMidnightUnix(T.defaultEndDate)}` },
                { key: 'dateFormat', type: 'String', value: `"${T.format}"` }, // daterangepicker.js:427
            ], verifyNodeData);
        });
    });

    describe('editor vs running app', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DaterangePicker-contexts-${Cypress._.uniqueId()}`);
            pinBrowserTimezone(T.browserTimezone);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('device context — saved Show on desktop / Show on mobile flags pick the layouts the picker renders on', () => {
            const OFF = { value: '{{false}}' };
            const ON = { value: '{{true}}' };
            // one vertical lane (the mobile canvas stacks widgets)
            addDaterangePickersViaApi([
                { name: 'desktoponly', layout: { top: 40, left: 2, width: 12, height: 40 } }, // defaults desktop on, mobile off
                { name: 'mobileonly', layout: { top: 100, left: 2, width: 12, height: 40 }, others: { showOnDesktop: OFF, showOnMobile: ON } },
                { name: 'both', layout: { top: 160, left: 2, width: 12, height: 40 }, others: { showOnMobile: ON } },
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

        it('exposed-value context — the editor canvas and the running app publish the same range values', () => {
            // dynamic: fixed explicit range
            const start = '05/03/2026';
            const end = '21/03/2026';
            const expected = { ...rangeExposed(start, end), isValid: true };
            addDaterangePickersViaApi([
                { name: 'drp', properties: { defaultStartDate: { value: start }, defaultEndDate: { value: end } } },
                dateProbe('probe', 'drp', [...RANGE_KEYS, 'isValid'], { top: 300, width: 40 }),
            ]);
            cy.openApp('', undefined, undefined, S.input('drp'));
            expectRangeDisplay('drp', start, end);
            expectDateProbe('probe', expected, 'editor');

            openDateAppInViewer(S.input('drp'));
            expectRangeDisplay('drp', start, end);
            expectDateProbe('probe', expected, 'viewer');
        });
    });
});
