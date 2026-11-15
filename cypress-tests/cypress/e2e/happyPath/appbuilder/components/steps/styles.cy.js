/**
 * SPEC — Steps — styles facet.
 * FOR AI: the visual part of TESTING.md browser scenario:
 *   Steps-BRW-002 — computed colours, disabled opacity/cursor, tooltip placement and the approved focus ring remain
 *                   usable; here: configured accent/label colours per milestone state in every variant (editor +
 *                   viewer), component- and step-level disabled dimming and cursor under a real pointer, tooltip
 *                   above and centred on the hovered step (and absent for disabled steps), and the keyboard focus ring
 *                   (D-03 native buttons, Steps.jsx:200-213) drawn in the focus colour, unclipped, only for keyboard focus.
 * Geometry/overflow lives in canvas.cy.js; dark-theme colours in contexts.cy.js.
 * Helpers: addStepsViaApi, openStepsAppInViewer, stepsBoxes, expectStepColors, focusRing, resolveCssVarColor, hitTarget.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { stepsSelector } from "Selectors/appBuilder/components/steps";
import { stepsText } from "Texts/appBuilder/components/steps";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import { hitTarget } from "Support/utils/appBuilder/components/icon";
import {
    addStepsViaApi,
    openStepsAppInViewer,
    stepsBoxes,
    expectStepColors,
    focusRing,
} from "Support/utils/appBuilder/components/steps";

const T = stepsText;
const VARIANTS = [T.variantLabel, T.variantNumber, T.variantPlain];
const CURRENT = T.defaultCurrentStep - 1; // steps.js:231 currentStep {{3}} → index 2
const moveMouseAway = () => cy.get('body').realHover({ position: 'topLeft' });
const input = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;

// dynamic: five distinct authored colours (none equals a value Steps.jsx:107-111 remaps to a theme token)
const AUTHORED = {
    completedAccent: { hex: '#d6336c', rgb: 'rgb(214, 51, 108)' },
    incompletedAccent: { hex: '#20c997', rgb: 'rgb(32, 201, 151)' },
    completedLabel: { hex: '#1c7ed6', rgb: 'rgb(28, 126, 214)' },
    incompletedLabel: { hex: '#f08c00', rgb: 'rgb(240, 140, 0)' },
    currentStepLabel: { hex: '#7048e8', rgb: 'rgb(112, 72, 232)' },
};
const authoredStyles = Object.fromEntries(Object.entries(AUTHORED).map(([k, v]) => [k, { value: v.hex }])); // steps.js:149-193 colorSwatches
const authoredRgb = Object.fromEntries(Object.entries(AUTHORED).map(([k, v]) => [k, v.rgb]));

describe('Steps — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Steps-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── Steps-BRW-002 — configured colours ───────────────────────────────────
    it('[Steps-BRW-002] Authored accent and label colours paint the completed, current and upcoming steps and connectors in every variant, in the editor and the viewer', () => {
        addStepsViaApi(
            VARIANTS.map((variant, i) => ({
                name: `paint${variant}`,
                layout: { top: 40 + i * 70, left: 2, width: 22, height: 38 }, // dynamic: stacked slots
                properties: { variant: { value: variant } },
                styles: authoredStyles,
            }))
        );
        const expectPainted = (where) =>
            VARIANTS.forEach((variant) =>
                expectStepColors(`paint${variant}`, { variant, current: CURRENT, colors: authoredRgb, context: where })
            );

        cy.openApp('', undefined, undefined, stepsSelector.milestones(`paint${T.variantPlain}`));
        expectPainted('editor');
        openStepsAppInViewer(stepsSelector.milestones(`paint${T.variantPlain}`));
        expectPainted('viewer');

        // moving the current step repaints: step 4 current → steps 1-3 completed, connector 3 still upcoming
        cy.get(stepsSelector.milestones(`paint${T.variantNumber}`)).eq(3).click();
        expectStepColors(`paint${T.variantNumber}`, { variant: T.variantNumber, current: 3, colors: authoredRgb, context: 'after select' });
    });

    // ── Steps-BRW-002 — disabled opacity and cursor ──────────────────────────
    it('[Steps-BRW-002] A disabled Steps dims to half opacity and never takes the pointer; enabled steps show the pointer cursor', () => {
        addStepsViaApi([
            { name: 'enabled', layout: { top: 40, left: 2, width: 22, height: 38 } },
            { name: 'compdisabled', layout: { top: 110, left: 2, width: 22, height: 38 }, properties: { disabledState: { value: '{{true}}' } } }, // steps.js:48-52
            {
                name: 'numdisabled',
                layout: { top: 180, left: 2, width: 22, height: 38 },
                properties: { variant: { value: T.variantNumber }, disabledState: { value: '{{true}}' } },
            },
        ]);
        moveMouseAway();
        openStepsAppInViewer(stepsSelector.milestones('numdisabled'));

        stepsBoxes('enabled', (b) => {
            expect(b.root.opacity, 'enabled root opaque').to.eq(1);
            b.milestones.forEach((m, i) => {
                expect(m.effectiveOpacity, `enabled milestone ${i} opaque`).to.eq(1);
                expect(m.cursor, `enabled milestone ${i} cursor`).to.eq(T.enabledCursor);
                expect(m.disabled, `enabled milestone ${i} operable`).to.eq(false);
            });
        });
        hitTarget(`${stepsSelector.milestones('enabled')}:eq(3)`).then(({ el, cursor }) => {
            expect(el.closest('button.milestone'), 'the real pointer lands on the step').to.not.eq(null);
            expect(cursor, 'and shows the pointer cursor').to.eq(T.enabledCursor);
        });

        ['compdisabled', 'numdisabled'].forEach((name) => {
            stepsBoxes(name, (b) => {
                expect(b.root.className, `${name}: disabled root`).to.contain('disabled');
                expect(b.root.opacity, `${name}: root dimmed`).to.eq(T.disabledOpacity); // Steps.scss:7-9
                expect(b.root.ariaDisabled, `${name}: aria-disabled`).to.eq('true');
                b.milestones.forEach((m, i) => {
                    expect(m.effectiveOpacity, `${name}: milestone ${i} dimmed`).to.be.lte(T.disabledOpacity);
                    expect(m.cursor, `${name}: milestone ${i} not-allowed cursor`).to.eq(T.disabledCursor); // Steps.scss:60-63
                    expect(m.disabled, `${name}: milestone ${i} natively disabled`).to.eq(true);
                });
            });
            // the pointer passes through the disabled widget instead of landing on a step
            hitTarget(`${stepsSelector.milestones(name)}:eq(1)`).then(({ el }) =>
                expect(el.closest(stepsSelector.draggableWidget(name)), `${name}: no step under the pointer`).to.eq(null)
            );
        });
    });

    it('[Steps-BRW-002] A disabled step dims to half opacity and shows the not-allowed cursor under the real pointer while its neighbours stay operable', () => {
        addStepsViaApi([
            {
                name: 'stepdisabled',
                layout: { top: 40, left: 2, width: 22, height: 38 },
                properties: {
                    currentStep: { value: '{{1}}' },
                    steps: {
                        value: [
                            { name: fake.firstName.slice(0, 6) || 'first', id: 1 },
                            { name: fake.firstName.slice(0, 6) || 'second', id: 2, disabled: true },
                            { name: fake.firstName.slice(0, 6) || 'third', id: 3 },
                        ],
                    },
                },
            },
        ]);
        moveMouseAway();
        openStepsAppInViewer(stepsSelector.milestones('stepdisabled'));

        stepsBoxes('stepdisabled', (b) => {
            expect(b.root.opacity, 'the widget itself is not dimmed').to.eq(1);
            expect(b.milestones[1].effectiveOpacity, 'disabled step dimmed').to.eq(T.disabledOpacity); // Steps.scss:60-61
            expect(b.milestones[1].cursor, 'disabled step styled not-allowed').to.eq(T.disabledCursor); // Steps.scss:62
            [0, 2].forEach((i) => {
                expect(b.milestones[i].effectiveOpacity, `step ${i} opaque`).to.eq(1);
                expect(b.milestones[i].cursor, `step ${i} pointer`).to.eq(T.enabledCursor);
            });
        });
        hitTarget(`${stepsSelector.milestones('stepdisabled')}:eq(2)`).then(({ cursor }) =>
            expect(cursor, 'enabled neighbour shows the pointer cursor').to.eq(T.enabledCursor)
        );
        // what the user actually sees over the disabled step
        hitTarget(`${stepsSelector.milestones('stepdisabled')}:eq(1)`).then(({ cursor }) =>
            expect(cursor, 'disabled step shows the not-allowed cursor').to.eq(T.disabledCursor)
        );
    });

    // ── Steps-BRW-002 — tooltip placement ────────────────────────────────────
    it('[Steps-BRW-002] A step tooltip opens above the hovered step, centred on it and inside the window; disabled steps show none', () => {
        const tips = [fake.firstName, fake.lastName, fake.firstName, fake.lastName].map((t, i) => `${t || 'tip'} ${i + 1}`);
        addStepsViaApi([
            {
                name: 'tipped',
                layout: { top: 60, left: 0, width: 43, height: 38 }, // dynamic: full row — first/last steps at the edges
                properties: {
                    currentStep: { value: '{{1}}' },
                    steps: {
                        value: [
                            { name: 'a', id: 1, tooltip: tips[0] },
                            { name: 'b', id: 2, tooltip: tips[1] },
                            { name: 'c', id: 3, tooltip: tips[2], disabled: true },
                            { name: 'd', id: 4, tooltip: tips[3] },
                        ],
                    },
                },
            },
            { name: 'tippeddisabled', layout: { top: 140, left: 2, width: 22, height: 38 }, properties: {
                disabledState: { value: '{{true}}' },
                steps: { value: [{ name: 'a', id: 1, tooltip: tips[0] }, { name: 'b', id: 2, tooltip: tips[1] }] },
            } },
        ]);
        moveMouseAway();
        openStepsAppInViewer(stepsSelector.milestones('tippeddisabled'));

        const expectTipAbove = (index, text) => {
            cy.get(stepsSelector.milestones('tipped')).eq(index).realHover({ scrollBehavior: false });
            cy.get(stepsSelector.tooltip).should('have.length', 1).and('have.class', T.tooltipPlacementClass).and('have.text', text);
            cy.get(stepsSelector.milestones('tipped')).eq(index).then(($m) => {
                const m = $m[0].getBoundingClientRect();
                cy.get(stepsSelector.tooltip).should(($t) => {
                    const t = $t[0].getBoundingClientRect();
                    const win = $t[0].ownerDocument.defaultView;
                    const arrow = $t[0].querySelector(stepsSelector.tooltipArrow);
                    expect(arrow, `tooltip ${index} arrow`).to.not.eq(null);
                    const a = arrow.getBoundingClientRect();
                    expect(t.bottom, `tooltip ${index} above its step`).to.be.lte(m.top + 1);
                    expect(m.top - t.bottom, `tooltip ${index} close to its step`).to.be.lt(16);
                    expect(t.left, `tooltip ${index} inside the window (left)`).to.be.gte(0);
                    expect(t.right, `tooltip ${index} inside the window (right)`).to.be.lte(win.innerWidth);
                    // the bubble may shift away from a window edge, but its arrow always points at the step's centre
                    expect(a.left + a.width / 2, `tooltip ${index} arrow on its step`).to.be.closeTo(m.left + m.width / 2, 2);
                    expect(t.left, `tooltip ${index} bubble covers the step's centre (left)`).to.be.lte(m.left + m.width / 2);
                    expect(t.right, `tooltip ${index} bubble covers the step's centre (right)`).to.be.gte(m.left + m.width / 2);
                    if (index === 1) {
                        // a step away from the edges gets a bubble centred on it
                        expect(t.left + t.width / 2, `tooltip ${index} centred on its step`).to.be.closeTo(m.left + m.width / 2, 2);
                    }
                });
            });
        };

        expectTipAbove(0, tips[0]); // first step, next to the canvas' left edge
        expectTipAbove(1, tips[1]);
        expectTipAbove(3, tips[3]); // last step, next to the right edge

        // a disabled step suppresses its tooltip (Steps.jsx:197)
        moveMouseAway();
        cy.get(stepsSelector.tooltip).should('not.exist');
        cy.get(stepsSelector.milestones('tipped')).eq(2).realHover({ scrollBehavior: false });
        cy.wait(500); // eslint-disable-line cypress/no-unnecessary-waiting -- show delay 50ms (ToolTip.jsx:12)
        cy.get(stepsSelector.tooltip).should('not.exist');
        // …and so does a disabled Steps
        cy.get(stepsSelector.milestones('tippeddisabled')).eq(0).realHover({ scrollBehavior: false });
        cy.wait(500); // eslint-disable-line cypress/no-unnecessary-waiting
        cy.get(stepsSelector.tooltip).should('not.exist');
        moveMouseAway();
    });

    // ── Steps-BRW-002 — focus ring (D-03) ────────────────────────────────────
    it('[Steps-BRW-002] Keyboard focus draws the focus-colour ring around the step in every variant without clipping; pointer focus draws none', () => {
        const items = [];
        VARIANTS.forEach((variant, i) => {
            items.push({ type: 'TextInput', name: `before${variant}`, layout: { top: 40 + i * 110, left: 2, width: 8, height: 40 } }); // dynamic
            items.push({
                name: `ring${variant}`,
                layout: { top: 90 + i * 110, left: 0, width: 22, height: 38 }, // dynamic: flush with the canvas' left edge
                properties: { variant: { value: variant } },
                styles: { padding: { value: 'none' } }, // steps.js:194-205 padding none — no box padding: the tightest fit for the ring
            });
        });
        addStepsViaApi(items);
        moveMouseAway();
        openStepsAppInViewer(stepsSelector.milestones(`ring${T.variantPlain}`));
        resolveCssVarColor(T.tokenFocusOutline, stepsSelector.root(`ring${T.variantLabel}`)).as('focusColour');

        VARIANTS.forEach((variant) => {
            cy.get(input(`before${variant}`)).click();
            cy.realPress('Tab');
            cy.get('@focusColour').then((focusColour) =>
                focusRing().then((f) => {
                    expect(f.widget, `${variant}: Tab reaches the Steps`).to.eq(`ring${variant}`);
                    expect(f.tag, `${variant}: a native button`).to.eq('button');
                    expect(f.focusVisible, `${variant}: keyboard focus is focus-visible`).to.eq(true);
                    expect(f.spread, `${variant}: 1px offset + 2px ring`).to.eq(T.focusRingSpread);
                    expect(f.ringColor, `${variant}: ring in the focus colour`).to.eq(focusColour);
                    // the ring (step box grown by its spread) is not cut off by any clipping ancestor
                    expect(f.clip, `${variant}: clipping ancestor`).to.not.eq(null);
                    expect(f.rect.left - f.spread, `${variant}: ring left visible`).to.be.gte(f.clip.left - 0.5);
                    expect(f.rect.top - f.spread, `${variant}: ring top visible`).to.be.gte(f.clip.top - 0.5);
                    expect(f.rect.right + f.spread, `${variant}: ring right visible`).to.be.lte(f.clip.right + 0.5);
                    expect(f.rect.bottom + f.spread, `${variant}: ring bottom visible`).to.be.lte(f.clip.bottom + 0.5);
                })
            );
        });

        // pointer focus: the clicked step is focused but draws no ring
        cy.get(stepsSelector.milestones(`ring${T.variantNumber}`)).eq(3).realClick({ scrollBehavior: false });
        focusRing().then((f) => {
            expect(f.widget, 'clicked step focused').to.eq(`ring${T.variantNumber}`);
            expect(f.text, 'the clicked step').to.eq('4');
            expect(f.focusVisible, 'pointer focus is not focus-visible').to.eq(false);
            expect(f.spread, 'no ring for pointer focus').to.eq(0);
        });
        moveMouseAway();
    });
});
