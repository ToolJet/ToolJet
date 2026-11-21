/**
 * SPEC — Tabs — userflow facet.
 * FOR AI: the real pointer / keyboard TESTING.md browser scenarios:
 *   Tabs-COMBO-004 — with Disable on, the running Tabs is non-interactive: a header click does not switch tabs or
 *                    fire On tab switch, and Tab does not enter the panel; enforced only by `inert` + data-disabled
 *                    on the root (Tabs.jsx:242-244, custom.scss div[data-disabled='true']). Toggled both ways in one
 *                    running app through a TextInput the property is bound to, so the enabled control step proves
 *                    the same click / Tab do work.
 *   Tabs-BRW-007 — keyboard: the tab headers are reachable with Tab in order and a disabled tab is skipped.
 * Observed through: a Text bound to components.<name>.currentTab and an onTabSwitch counter (set-variable).
 * Helpers: addTabsViaApi, tabsData, openTabsAppInViewer, tabsBoxes, focusTrail, counterEvent, counterText,
 * expectCounter, moveMouseAway.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { tabsSelector } from "Selectors/appBuilder/components/tabs";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";
import {
    addTabsViaApi,
    tabsData,
    openTabsAppInViewer,
    tabsBoxes,
    focusTrail,
} from "Support/utils/appBuilder/components/tabs";

const input = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;
const currentText = (name, tabsName, layout) => ({
    type: 'Text',
    name,
    layout: { top: 300, left: 14, width: 8, height: 40, ...layout },
    properties: { text: { value: `{{"cur:" + components.${tabsName}.currentTab}}` } }, // tabs.js:394
});
const expectCurrent = (textName, tabsName, id, index) => {
    cy.get(commonWidgetSelector.draggableWidget(textName)).should(($el) =>
        expect($el.text().trim(), `${tabsName}.currentTab`).to.eq(`cur:${id}`)
    );
    tabsBoxes(tabsName, (b) =>
        b.headers.forEach((h, i) => expect(h.active, `${tabsName}: header ${i} active`).to.eq(i === index))
    );
};

describe('Tabs — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Tabs-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        moveMouseAway();
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── Tabs-COMBO-004 — disabled component blocks switching ────────────────
    it('[Tabs-COMBO-004] A disabled Tabs ignores header clicks and keeps Tab out of its panel; enabled again, the same click and Tab work', () => {
        const ID = crypto.randomUUID();
        const tabs = [
            { title: fake.firstName.slice(0, 6) || 'first', id: 'a' },
            { title: fake.lastName.slice(0, 6) || 'second', id: 'b' },
        ];
        addTabsViaApi([
            { type: 'TextInput', name: 'switch', layout: { top: 10, left: 2, width: 8, height: 40 } },
            { type: 'TextInput', name: 'before', layout: { top: 10, left: 12, width: 8, height: 40 } },
            {
                id: ID,
                name: 'tb',
                layout: { top: 70, left: 2, width: 20, height: 200 },
                // tabs.js:48-56 disabledState, bound so one running app can flip it both ways
                properties: { ...tabsData(tabs, 'a'), disabledState: { value: '{{components.switch.value === "off"}}' } },
                events: [counterEvent('onTabSwitch', 'sw')], // tabs.js:160
            },
            { type: 'TextInput', name: 'ina', parent: `${ID}-a`, layout: { top: 10, left: 2, width: 10, height: 40 } },
            { type: 'TextInput', name: 'inb', parent: `${ID}-b`, layout: { top: 10, left: 2, width: 10, height: 40 } },
            { type: 'TextInput', name: 'after', layout: { top: 290, left: 2, width: 8, height: 40 } },
            currentText('cur', 'tb', { top: 290, left: 12 }),
            counterText('swcount', 'sw', { top: 290, left: 22 }),
        ]);

        moveMouseAway();
        openTabsAppInViewer(tabsSelector.headers('tb'));
        expectCurrent('cur', 'tb', 'a', 0);

        // disable it
        cy.get(input('switch')).type('off');
        tabsBoxes('tb', (b) => {
            expect(b.root.inert, 'disabled root is inert').to.eq(true);
            expect(b.root.dataDisabled, 'disabled root data-disabled').to.eq('true');
        });

        // pointer: clicking the second header does nothing
        cy.get(tabsSelector.headers('tb')).eq(1).realClick({ scrollBehavior: false });
        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.wait(500); // give a (wrong) switch time to land
        expectCurrent('cur', 'tb', 'a', 0);
        expectCounter('swcount', 'sw', 0);
        cy.get(commonWidgetSelector.draggableWidget('inb')).should('not.be.visible');

        // keyboard: Tab from the field before the Tabs skips the whole Tabs (its panel input included)
        focusTrail(input('before'), 1).then((trail) => {
            expect(trail[0].widget, 'Tab skips the disabled Tabs panel').to.not.be.oneOf(['tb', 'ina', 'inb']);
        });
        cy.focused().then(($el) => expect($el[0].closest('[data-cy="draggable-widget-ina"]'), 'panel input not focused').to.eq(null));

        // enable again: the same click switches and fires the event once; Tab reaches the active panel's input
        cy.get(input('switch')).clear();
        tabsBoxes('tb', (b) => expect(b.root.inert, 'enabled root not inert').to.eq(false));
        focusTrail(input('before'), 1).then((trail) => {
            expect(trail[0].widget, 'Tab enters the enabled panel').to.eq('ina');
        });
        cy.get(tabsSelector.headers('tb')).eq(1).realClick({ scrollBehavior: false });
        expectCurrent('cur', 'tb', 'b', 1);
        expectCounter('swcount', 'sw', 1);
        cy.get(commonWidgetSelector.draggableWidget('inb')).should('be.visible');
    });

    // ── Tabs-BRW-007 — keyboard focus order across headers ──────────────────
    it('[Tabs-BRW-007] Tab walks the tab headers in order and skips a disabled tab', () => {
        const tabs = [
            { title: 'Alpha', id: 'a' },
            { title: 'Beta', id: 'b', disable: true }, // per-tab disable (Tabs.jsx:370, 384)
            { title: 'Gamma', id: 'c' },
        ];
        addTabsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 10, left: 2, width: 8, height: 40 } },
            { name: 'tb', layout: { top: 70, left: 2, width: 20, height: 150 }, properties: tabsData(tabs, 'a') },
            { type: 'TextInput', name: 'after', layout: { top: 240, left: 2, width: 8, height: 40 } },
        ]);

        moveMouseAway();
        openTabsAppInViewer(tabsSelector.headers('tb'));
        // the enabled field after the Tabs is reachable, so a missing header stop is not a dead keyboard
        focusTrail(input('before'), 3).then((trail) => {
            const stops = trail.map((t) => (t.header ? `header:${t.headerText}` : t.widget));
            cy.log(`focus trail: ${stops.join(' → ')}`);
            expect(stops, 'Tab order: Alpha header, Gamma header (Beta disabled), then the next field').to.deep.eq([
                'header:Alpha',
                'header:Gamma',
                'after',
            ]);
        });
    });
});
