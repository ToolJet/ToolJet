/**
 * SPEC — Time Picker — contexts facet.
 * FOR AI: always-on device + exposed-value contexts (no TESTING.md browser scenario maps here):
 *   device context — saved Show on desktop / Show on mobile flags (timepicker.js:33-34, defaults :364-365)
 *   select the editor layout and the running app the picker renders on (WidgetWrapper: off = not rendered);
 *   exposed-value context — the dropped widget's deterministic exposed values in the inspector tree
 *   (TimePicker.jsx:123-131 mount publish: value = defaultValue in timeFormat, timeFormat, isValid), and the
 *   editor canvas vs the running app agreeing on them.
 * Time zone: the browser is pinned to Asia/Kolkata (CDP); the time value has no offset, the pin only removes DST.
 * Helpers: switchLayout, openNode, openAndVerifyNode, verifyNodeData, addTimePickersViaApi, dateProbe,
 * expectDateProbe, openDateAppInViewer, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { timePickerSelector as S } from "Selectors/appBuilder/components/timePicker";
import { timePickerText as T } from "Texts/appBuilder/components/timePicker";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { addTimePickersViaApi } from "Support/utils/appBuilder/components/timePicker";
import {
    pinBrowserTimezone,
    dateProbe,
    expectDateProbe,
    openDateAppInViewer,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = T.defaultWidgetName;

describe('Time Picker — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-TimePicker-contexts-${Cypress._.uniqueId()}`);
            pinBrowserTimezone(T.browserTimezone);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('exposed-value context — default values observable in the inspector tree', () => {
            cy.get(S.input(W)).should('have.value', T.defaultValue); // timepicker.js:375
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'value', type: 'String', value: `"${T.defaultValue}"` }, // timepicker.js:375
                { key: 'timeFormat', type: 'String', value: `"${T.timeFormat}"` }, // timepicker.js:377
                { key: 'label', type: 'String', value: `"${T.label}"` }, // timepicker.js:374
                { key: 'isValid', type: 'Boolean', value: 'true' },
                { key: 'isVisible', type: 'Boolean', value: 'true' },
                { key: 'isDisabled', type: 'Boolean', value: 'false' },
            ], verifyNodeData);
        });
    });

    describe('editor vs running app', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-TimePicker-contexts-${Cypress._.uniqueId()}`);
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
            addTimePickersViaApi([
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
            const expected = { value: '09:05 PM', timeFormat: 'hh:mm A', isValid: true };
            addTimePickersViaApi([
                {
                    name: 'tp',
                    // dynamic: fixed explicit time in a 12-hour format
                    properties: { timeFormat: { value: expected.timeFormat }, defaultValue: { value: expected.value } },
                },
                dateProbe('probe', 'tp', Object.keys(expected), { top: 300 }),
            ]);
            cy.openApp('', undefined, undefined, S.input('tp'));
            cy.get(S.input('tp')).should('have.value', expected.value);
            expectDateProbe('probe', expected, 'editor');

            openDateAppInViewer(S.input('tp'));
            cy.get(S.input('tp')).should('have.value', expected.value);
            expectDateProbe('probe', expected, 'viewer');
        });
    });
});
