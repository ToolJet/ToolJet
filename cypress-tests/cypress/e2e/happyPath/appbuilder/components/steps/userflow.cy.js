/**
 * SPEC — Steps — userflow facet.
 * FOR AI: the interaction part of TESTING.md browser scenario:
 *   Steps-BRW-001 — in editor and viewer, enabled pointer/keyboard selection behaves consistently and hidden/disabled
 *                   components do not intercept interaction; local visibility combines with the device layout without
 *                   stale layout. Here: real pointer clicks in the editor and the viewer; Tab order and Enter/Space on
 *                   the native step buttons (D-03, Steps.jsx:200-213); a disabled step, a disabled / non-selectable /
 *                   hidden Steps kept out of pointer and Tab; setVisibility / setDisabled at runtime on the desktop
 *                   and the mobile layout, re-checked for a fresh layout.
 * Observed through: a Text bound to components.<name>.currentStepId and an onSelect counter (set-variable).
 * Device/visibility matrices live in contexts.cy.js.
 * Helpers: addStepsViaApi, openStepsAppInViewer, stepsBoxes, expectStepsGeometry, focusedWidget, counterEvent,
 * counterText, expectCounter, hitTarget.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { stepsSelector } from "Selectors/appBuilder/components/steps";
import { stepsText } from "Texts/appBuilder/components/steps";
import { counterEvent, counterText, expectCounter, hitTarget } from "Support/utils/appBuilder/components/icon";
import {
    addStepsViaApi,
    openStepsAppInViewer,
    stepsBoxes,
    expectStepsGeometry,
    focusedWidget,
} from "Support/utils/appBuilder/components/steps";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = stepsText;
const moveMouseAway = () => cy.get('body').realHover({ position: 'topLeft' });
const input = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;
const step = (name, index) => cy.get(stepsSelector.milestones(name)).eq(index);

// a Text that renders `cur:<currentStepId>` for one Steps
const currentText = (name, stepsName, layout) => ({
    type: 'Text',
    name,
    layout: { top: 300, left: 14, width: 8, height: 40, ...layout },
    properties: { text: { value: `{{"cur:" + components.${stepsName}.currentStepId}}` } },
});
const expectCurrent = (textName, stepsName, id, index) => {
    cy.get(commonWidgetSelector.draggableWidget(textName)).should(($el) =>
        expect($el.text().trim(), `${stepsName}.currentStepId`).to.eq(`cur:${id}`)
    );
    stepsBoxes(stepsName, (b) =>
        b.milestones.forEach((m, i) =>
            expect(m.ariaCurrent, `${stepsName}: aria-current on step ${i}`).to.eq(i === index ? T.ariaCurrentStep : null)
        )
    );
};

describe('Steps — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Steps-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── Steps-BRW-001 — pointer ↔ keyboard, editor ↔ viewer ──────────────────
    it('[Steps-BRW-001] Pointer click, Enter and Space select a step and fire On select once each, the same in the editor and the viewer', () => {
        addStepsViaApi([
            { name: 'flow', layout: { top: 40, left: 2, width: 22, height: 38 }, events: [counterEvent('onSelect', 'sel')] }, // steps.js:146
            currentText('cur', 'flow', { top: 120, left: 2 }),
            counterText('selcount', 'sel', { top: 120, left: 12 }),
        ]);

        const run = (where) => {
            cy.log(`selection — ${where}`);
            // definition default currentStep {{3}} (steps.js:231)
            expectCurrent('cur', 'flow', 3, 2);
            expectCounter('selcount', 'sel', 0);
            // wait for the settled layout (label padding is measured a frame after mount) before a real click
            expectStepsGeometry('flow', { context: `${where}: settled` });

            step('flow', 4).realClick({ scrollBehavior: false }); // pointer
            expectCurrent('cur', 'flow', 5, 4);
            expectCounter('selcount', 'sel', 1);

            step('flow', 0).focus();
            cy.realPress('Enter'); // keyboard: native button activation
            expectCurrent('cur', 'flow', 1, 0);
            expectCounter('selcount', 'sel', 2);

            step('flow', 1).focus();
            cy.realPress('Space');
            expectCurrent('cur', 'flow', 2, 1);
            expectCounter('selcount', 'sel', 3);
            // the layout follows the selection: steps before the current one are completed
            stepsBoxes('flow', (b) =>
                expect(b.milestones.map((m) => /\bcompleted\b/.test(m.className))).to.deep.eq([true, false, false, false, false])
            );
        };

        moveMouseAway();
        cy.openApp('', undefined, undefined, stepsSelector.milestones('flow'));
        closeQueryPanel();
        run('editor');

        moveMouseAway();
        openStepsAppInViewer(stepsSelector.milestones('flow'));
        run('viewer');
    });

    // ── Steps-BRW-001 — disabled / non-selectable / hidden do not intercept ──
    it('[Steps-BRW-001] Tab walks only operable steps; a disabled step, and a disabled, non-selectable or hidden Steps, take neither the pointer nor focus', () => {
        const three = [
            { name: 'one', id: 1 },
            { name: 'two', id: 2, disabled: true }, // step-level disabled
            { name: 'three', id: 3 },
        ];
        addStepsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 20, left: 2, width: 8, height: 40 } },
            {
                name: 'flow',
                layout: { top: 80, left: 2, width: 22, height: 38 },
                properties: { steps: { value: three }, currentStep: { value: '{{1}}' } },
                events: [counterEvent('onSelect', 'sel')],
            },
            {
                name: 'disabledsteps',
                layout: { top: 140, left: 2, width: 22, height: 38 },
                properties: { disabledState: { value: '{{true}}' } }, // steps.js:48-52
                events: [counterEvent('onSelect', 'sel')],
            },
            {
                name: 'readonlysteps',
                layout: { top: 200, left: 2, width: 22, height: 38 },
                properties: { stepsSelectable: { value: false } }, // steps.js:39-47
                events: [counterEvent('onSelect', 'sel')],
            },
            {
                name: 'hiddensteps',
                layout: { top: 260, left: 2, width: 22, height: 38 },
                properties: { visibility: { value: '{{false}}' } }, // steps.js:54-59
                events: [counterEvent('onSelect', 'sel')],
            },
            { type: 'TextInput', name: 'after', layout: { top: 320, left: 2, width: 8, height: 40 } },
            currentText('cur', 'flow', { top: 380, left: 2 }),
            currentText('curdisabled', 'disabledsteps', { top: 380, left: 12 }),
            currentText('curreadonly', 'readonlysteps', { top: 440, left: 2 }),
            counterText('selcount', 'sel', { top: 440, left: 12 }),
        ]);
        moveMouseAway();
        openStepsAppInViewer(stepsSelector.milestones('readonlysteps'));

        // keyboard: before → step one → step three → after (the disabled step and the three other Steps are skipped)
        cy.get(input('before')).click();
        const order = [];
        [0, 1, 2].forEach(() => {
            cy.realPress('Tab');
            cy.document().then((doc) => {
                const el = doc.activeElement;
                const w = el.closest('[data-cy^="draggable-widget-"]');
                order.push(`${w ? w.getAttribute('data-cy').replace('draggable-widget-', '') : el.tagName}:${el.textContent.trim()}`);
            });
        });
        cy.wrap(order).should('deep.equal', ['flow:one', 'flow:three', 'after:']);

        // pointer on the disabled step: nothing changes
        step('flow', 1).click({ force: true });
        expectCurrent('cur', 'flow', 1, 0);
        expectCounter('selcount', 'sel', 0);

        // disabled Steps: natively disabled, the real pointer passes through it, no selection, no event
        stepsBoxes('disabledsteps', (b) => b.milestones.forEach((m, i) => expect(m.disabled, `disabled step ${i}`).to.eq(true)));
        hitTarget(`${stepsSelector.milestones('disabledsteps')}:eq(4)`).then(({ el }) =>
            expect(el.closest(stepsSelector.draggableWidget('disabledsteps')), 'pointer not taken by the disabled Steps').to.eq(null)
        );
        step('disabledsteps', 4).click({ force: true });
        expectCurrent('curdisabled', 'disabledsteps', 3, 2);

        // non-selectable Steps: rendered and hit by the pointer, but out of the tab order and inert
        stepsBoxes('readonlysteps', (b) => b.milestones.forEach((m, i) => expect(m.tabIndex, `read-only step ${i}`).to.eq(-1)));
        step('readonlysteps', 4).realClick({ scrollBehavior: false });
        expectCurrent('curreadonly', 'readonlysteps', 3, 2);

        // hidden Steps: nothing painted, nothing to hit
        stepsBoxes('hiddensteps', (b) => {
            expect(b.root.display, 'hidden root').to.eq('none');
            b.milestones.forEach((m, i) => expect(m.width, `hidden step ${i} not painted`).to.eq(0));
        });
        expectCounter('selcount', 'sel', 0);

        // the enabled steps still work after all that
        step('flow', 2).realClick({ scrollBehavior: false });
        expectCurrent('cur', 'flow', 3, 2);
        expectCounter('selcount', 'sel', 1);
        moveMouseAway();
    });

    // ── Steps-BRW-001 — runtime visibility / disabled × device layout ────────
    it('[Steps-BRW-001] setVisibility and setDisabled hide and block the Steps at runtime and restore a fresh, operable layout, on the desktop and the mobile layout', () => {
        const action = (handle, param, value) => ({
            eventId: 'onClick',
            actionId: 'control-component',
            componentName: 'flow',
            componentSpecificActionHandle: handle, // steps.js:97-106
            componentSpecificActionParams: [{ handle: param, value }],
        });
        const button = (name, top, left, event) => ({
            type: 'Button',
            name,
            layout: { top, left, width: 5, height: 40 },
            others: { showOnMobile: { value: '{{true}}' } },
            events: [event],
        });
        const onBoth = { showOnMobile: { value: '{{true}}' } }; // steps.js:84 — on both layouts
        addStepsViaApi([
            { type: 'TextInput', name: 'before', layout: { top: 20, left: 0, width: 10, height: 40 }, others: onBoth },
            { name: 'flow', layout: { top: 80, left: 0, width: 40, height: 38 }, others: onBoth, events: [counterEvent('onSelect', 'sel')] },
            { type: 'TextInput', name: 'after', layout: { top: 140, left: 0, width: 10, height: 40 }, others: onBoth },
            button('hidebtn', 200, 0, action('setVisibility', 'visible', '{{false}}')),
            button('showbtn', 200, 6, action('setVisibility', 'visible', '{{true}}')),
            button('disablebtn', 200, 12, action('setDisabled', 'disable', '{{true}}')),
            button('enablebtn', 200, 18, action('setDisabled', 'disable', '{{false}}')),
            { ...currentText('cur', 'flow', { top: 260, left: 0, width: 10 }), others: onBoth },
            { ...counterText('selcount', 'sel', { top: 320, left: 0, width: 10 }), others: onBoth },
        ]);
        const press = (name) => cy.get(`${commonWidgetSelector.draggableWidget(name)} button`).first().click();
        const tabFromBefore = () => {
            cy.get(input('before')).click();
            cy.realPress('Tab');
            return focusedWidget();
        };

        const cycle = (where) => {
            cy.log(`runtime visibility / disabled — ${where}`);
            expectStepsGeometry('flow', { context: `${where}: initial` });

            // hidden: nothing painted, Tab goes straight to the next field, clicks at its place hit nothing of it
            press('hidebtn');
            stepsBoxes('flow', (b) => {
                expect(b.root.display, `${where}: hidden`).to.eq('none');
                b.milestones.forEach((m, i) => expect(m.width, `${where}: step ${i} not painted`).to.eq(0));
            });
            tabFromBefore().should('eq', 'after');

            // shown again: re-measured for the current width (no stale zero-size connectors/labels) and operable
            press('showbtn');
            expectStepsGeometry('flow', { context: `${where}: shown again` });
            step('flow', 0).realClick({ scrollBehavior: false });
            expectCurrent('cur', 'flow', 1, 0);
            expectCounter('selcount', 'sel', 1);
            tabFromBefore().should('eq', 'flow');

            // disabled at runtime: natively disabled, out of Tab, pointer passes through, no selection, no event
            press('disablebtn');
            stepsBoxes('flow', (b) => {
                expect(b.root.className, `${where}: disabled root`).to.contain('disabled');
                b.milestones.forEach((m, i) => expect(m.disabled, `${where}: step ${i} disabled`).to.eq(true));
            });
            tabFromBefore().should('eq', 'after');
            hitTarget(`${stepsSelector.milestones('flow')}:eq(3)`).then(({ el }) =>
                expect(el.closest(stepsSelector.draggableWidget('flow')), `${where}: pointer passes through`).to.eq(null)
            );
            step('flow', 3).click({ force: true });
            expectCurrent('cur', 'flow', 1, 0);
            expectCounter('selcount', 'sel', 1);

            // enabled again: pointer selection works and fires once more
            press('enablebtn');
            step('flow', 3).realClick({ scrollBehavior: false });
            expectCurrent('cur', 'flow', 4, 3);
            expectCounter('selcount', 'sel', 2);
            expectStepsGeometry('flow', { context: `${where}: enabled again` });
        };

        moveMouseAway();
        openStepsAppInViewer(stepsSelector.milestones('flow'));
        cycle('desktop');

        moveMouseAway();
        openStepsAppInViewer(stepsSelector.milestones('flow'), { query: '&layout=mobile' });
        // the mobile layout is narrower than the desktop one
        stepsBoxes('flow', (b) => expect(b.box.width, 'mobile width').to.be.lt(600));
        cycle('mobile');
        moveMouseAway();
    });
});
