/**
 * SPEC — Calendar — contexts facet.
 * FOR AI: always-on device + exposed-value contexts (no TESTING.md browser scenario maps here):
 *   device context — saved Show on desktop / Show on mobile flags (calendar.js:10-13, defaults :80-83) select the
 *   editor layout and the running app the calendar renders on (WidgetWrapper: off = not rendered);
 *   exposed-value context — a dropped Calendar publishes currentView (calendar.js:76, :99 → 'month') and
 *   currentDate (Calendar.jsx:96-98: defaultDate formatted with dateFormat — the config default is today, so only
 *   the date part is asserted) in the inspector tree; a seeded Calendar publishes the same currentView /
 *   currentDate on the editor canvas and in the running app.
 * Time zone: the browser is pinned to Asia/Kolkata (CDP) so "today" is machine-independent.
 * Helpers: switchLayout, openNode, openAndVerifyNode, verifyNodeData, addCalendarsViaApi, calendarProperties,
 * todayInBrowser, dateProbe, expectDateProbe, openDateAppInViewer, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { calendarSelector as S } from "Selectors/appBuilder/components/calendar";
import { calendarText as T } from "Texts/appBuilder/components/calendar";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { addCalendarsViaApi, calendarProperties, todayInBrowser } from "Support/utils/appBuilder/components/calendar";
import {
    pinBrowserTimezone,
    dateProbe,
    expectDateProbe,
    openDateAppInViewer,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const W = T.defaultWidgetName;

describe('Calendar — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Calendar-contexts-${Cypress._.uniqueId()}`);
            pinBrowserTimezone(T.browserTimezone);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 300, 100);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('exposed-value context — default values observable in the inspector tree', () => {
            cy.get(S.activeViewButton(W)).should('have.text', T.toolbar.month);
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'currentView', type: 'String', value: `"${T.defaultView}"` }, // calendar.js:76,99
            ], verifyNodeData);
            // currentDate = today in the default 'MM-DD-YYYY HH:mm:ss A Z' format (calendar.js:86-89)
            todayInBrowser().then(({ day }) => {
                cy.get('[data-cy="inspector-currentdate-value"]')
                    .invoke('text')
                    .should('match', new RegExp(`^"${day} \\d{2}:\\d{2}:\\d{2} [AP]M [+-]\\d{2}:\\d{2}"$`));
            });
        });
    });

    describe('editor vs running app', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Calendar-contexts-${Cypress._.uniqueId()}`);
            pinBrowserTimezone(T.browserTimezone);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        it('device context — saved Show on desktop / Show on mobile flags pick the layouts the calendar renders on', () => {
            const OFF = { value: '{{false}}' };
            const ON = { value: '{{true}}' };
            const props = calendarProperties();
            // one vertical lane (the mobile canvas stacks widgets)
            addCalendarsViaApi([
                { name: 'desktoponly', layout: { top: 40, left: 2, width: 30, height: 300 }, properties: props }, // defaults desktop on, mobile off
                { name: 'mobileonly', layout: { top: 360, left: 2, width: 30, height: 300 }, properties: props, others: { showOnDesktop: OFF, showOnMobile: ON } },
                { name: 'both', layout: { top: 680, left: 2, width: 30, height: 300 }, properties: props, others: { showOnMobile: ON } },
            ]);
            const expectRendered = (expected, context) =>
                Object.entries(expected).forEach(([name, shown]) => {
                    cy.log(`${context}: ${name} ${shown ? 'rendered' : 'absent'}`);
                    if (shown) cy.get(S.toolbarLabel(name)).should('be.visible').and('have.text', T.monthLabel);
                    else cy.get(S.calendar(name)).should('not.exist');
                });
            cy.openApp('', undefined, undefined, S.calendar('both'));
            expectRendered({ desktoponly: true, mobileonly: false, both: true }, 'editor desktop');
            switchLayout('mobile');
            expectRendered({ desktoponly: false, mobileonly: true, both: true }, 'editor mobile');
            switchLayout('desktop');
            expectRendered({ desktoponly: true, mobileonly: false, both: true }, 'editor desktop again');

            openDateAppInViewer(S.calendar('both'));
            expectRendered({ desktoponly: true, mobileonly: false, both: true }, 'running app desktop');
        });

        it('exposed-value context — the editor canvas and the running app publish the same values', () => {
            const expected = { currentView: 'week', currentDate: T.defaultDate };
            addCalendarsViaApi([
                { name: 'cal', layout: { top: 40, left: 2, width: 30, height: 500 }, properties: calendarProperties({ view: expected.currentView }) },
                dateProbe('probe', 'cal', Object.keys(expected), { top: 560 }),
            ]);
            cy.openApp('', undefined, undefined, S.timeView('cal'));
            cy.get(S.toolbarLabel('cal')).should('have.text', T.weekLabel);
            expectDateProbe('probe', expected, 'editor');

            openDateAppInViewer(S.timeView('cal'));
            cy.get(S.toolbarLabel('cal')).should('have.text', T.weekLabel);
            expectDateProbe('probe', expected, 'viewer');
        });
    });
});
