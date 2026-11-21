/**
 * SPEC — Date Time Picker — contexts facet.
 * FOR AI: always-on device + exposed-value contexts (no TESTING.md browser scenario maps here):
 *   device context — saved Show on desktop / Show on mobile flags (datetimepickerV2.js:54-57, defaults :434-435)
 *   select the editor layout and the running app the picker renders on (WidgetWrapper: off = not rendered);
 *   exposed-value context — the dropped widget's deterministic exposed values in the inspector tree
 *   (DatetimePickerV2.jsx:255-274 mount publish), and the editor canvas vs the running app agreeing on them.
 * Time zone: the browser is pinned to Asia/Kolkata (CDP) so `value` is deterministic.
 * Helpers: switchLayout, openNode, openAndVerifyNode, verifyNodeData, addDatetimePickersViaApi, dateProbe,
 * expectDateProbe, openDateAppInViewer, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { datetimePickerV2Selector as S } from "Selectors/appBuilder/components/datetimePickerV2";
import { datetimePickerV2Text as T } from "Texts/appBuilder/components/datetimePickerV2";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { addDatetimePickersViaApi } from "Support/utils/appBuilder/components/datetimePickerV2";
import {
    pinBrowserTimezone,
    dateProbe,
    expectDateProbe,
    openDateAppInViewer,
} from "Support/utils/appBuilder/components/dateTimeCommon";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = T.defaultWidgetName;
const DEFAULT_DISPLAY = `${T.defaultValue} 00:00`; // defaultValue has no time → midnight in timeFormat HH:mm

describe('Date Time Picker — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DatetimePickerV2-contexts-${Cypress._.uniqueId()}`);
            pinBrowserTimezone(T.browserTimezone);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('exposed-value context — default values observable in the inspector tree', () => {
            cy.get(S.input(W)).should('have.value', DEFAULT_DISPLAY);
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'selectedDate', type: 'String', value: `"${T.defaultValue}"` }, // datetimepickerV2.js:448
                { key: 'selectedTime', type: 'String', value: '"00:00"' },
                { key: 'displayValue', type: 'String', value: `"${DEFAULT_DISPLAY}"` },
                { key: 'dateFormat', type: 'String', value: `"${T.dateFormat}"` }, // datetimepickerV2.js:450
                { key: 'timeFormat', type: 'String', value: `"${T.timeFormat}"` }, // datetimepickerV2.js:451
                { key: 'value', type: 'String', value: `"2022-01-01T00:00:00.000${T.browserOffset}"` },
            ], verifyNodeData);
        });
    });

    describe('editor vs running app', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DatetimePickerV2-contexts-${Cypress._.uniqueId()}`);
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
            addDatetimePickersViaApi([
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
            const expected = {
                displayValue: '15/06/2026 10:30',
                selectedDate: '15/06/2026',
                selectedTime: '10:30',
                value: `2026-06-15T10:30:00.000${T.browserOffset}`,
                isValid: true,
            };
            addDatetimePickersViaApi([
                { name: 'dtp', properties: { defaultValue: { value: expected.displayValue } } }, // dynamic: fixed date
                dateProbe('probe', 'dtp', Object.keys(expected), { top: 300 }),
            ]);
            cy.openApp('', undefined, undefined, S.input('dtp'));
            cy.get(S.input('dtp')).should('have.value', expected.displayValue);
            expectDateProbe('probe', expected, 'editor');

            openDateAppInViewer(S.input('dtp'));
            cy.get(S.input('dtp')).should('have.value', expected.displayValue);
            expectDateProbe('probe', expected, 'viewer');
        });
    });
});
