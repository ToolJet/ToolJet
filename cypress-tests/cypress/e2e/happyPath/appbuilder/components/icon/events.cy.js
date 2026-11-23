/**
 * SPEC — Icon — events facet (real pointer vs disabled state).
 * FOR AI: TESTING.md browser scenario:
 *   Icon-BRW-003 — with disabled state on, a real pointer triggers neither onClick nor onHover; restoring the
 *                  enabled state restores both
 * D-01: Icon has no JS refusal — its onClick/onMouseEnter handlers stay live (Icon.jsx:109-117). The block is
 * the shared `.disabled { pointer-events: none }` (theme.scss) on the RenderWidget box (RenderWidget.jsx:333),
 * so it is only observable with real CDP pointer events (realHover / realClick) in the running app.
 * Dispatches are counted through set-custom-variable handlers rendered by Text widgets, so "once" is exact.
 * Both ways of setting the state are exercised: the `disabledState` property (bound to a text input) and the
 * `setDisable` component action fired from buttons (Icon.jsx:80-83).
 * Helpers: addIconsViaApi, openIconAppInViewer, counterEvent, counterText, expectCounter, hitTarget.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { iconSelector } from "Selectors/appBuilder/components/icon";
import { iconText } from "Texts/appBuilder/components/icon";
import {
    addIconsViaApi,
    openIconAppInViewer,
    counterEvent,
    counterText,
    expectCounter,
    hitTarget,
} from "Support/utils/appBuilder/components/icon";

const T = iconText;
const SETTLE = 800; // dynamic: time for a (wrong) dispatch to land before asserting it did not

const moveMouseAway = () => cy.get('body').realHover({ position: 'topLeft', scrollBehavior: false });
const pointerTargets = (name) => [iconSelector.svg(name), iconSelector.root(name)];

const counters = [
    counterText('clickcount', 'clicks', { top: 300, left: 2 }),
    counterText('hovercount', 'hovers', { top: 360, left: 2 }),
];
const iconWithCounters = (extra = {}) => ({
    name: 'icon1',
    layout: { top: 40, left: 4, width: 10, height: 60 },
    events: [counterEvent(T.eventOnClick, 'clicks'), counterEvent(T.eventOnHover, 'hovers')],
    ...extra,
});

// real hover + click on the glyph and on the box beside it; nothing may dispatch
const expectPointerBlocked = (clicks, hovers) => {
    cy.get(iconSelector.draggableWidget('icon1')).should('have.class', 'disabled');
    hitTarget(iconSelector.svg('icon1')).then(({ el }) => {
        expect(el.closest(iconSelector.root('icon1')), 'pointer passes through the disabled Icon').to.eq(null);
    });
    pointerTargets('icon1').forEach((sel) => {
        moveMouseAway();
        cy.get(sel).realHover({ scrollBehavior: false });
        cy.get(sel).realClick({ scrollBehavior: false });
    });
    // leave the Icon: a cursor resting over it when it is re-enabled would get a genuine mouseover → onHover
    moveMouseAway();
    cy.wait(SETTLE);
    expectCounter('clickcount', 'clicks', clicks);
    expectCounter('hovercount', 'hovers', hovers);
};

// one real hover then one real click on the glyph: exactly one dispatch each
const expectPointerLive = (clicks, hovers) => {
    cy.get(iconSelector.draggableWidget('icon1')).should('not.have.class', 'disabled');
    moveMouseAway();
    cy.get(iconSelector.svg('icon1')).realHover({ scrollBehavior: false });
    expectCounter('hovercount', 'hovers', hovers + 1);
    cy.get(iconSelector.svg('icon1')).realClick({ scrollBehavior: false });
    expectCounter('clickcount', 'clicks', clicks + 1);
    cy.wait(SETTLE);
    expectCounter('hovercount', 'hovers', hovers + 1); // the click itself did not re-enter
    expectCounter('clickcount', 'clicks', clicks + 1);
};

describe('Icon — events facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Icon-events-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Icon-BRW-003 (disabledState property) ────────────────────────────────
    it('[Icon-BRW-003] Disabled state blocks a real pointer click and hover; enabling restores both', () => {
        const unlock = fake.firstName.toLowerCase(); // dynamic: typing anything enables the Icon
        addIconsViaApi([
            { type: 'TextInput', name: 'textinput1', layout: { top: 140, left: 4, width: 10, height: 40 } },
            // disabled while the input is empty. source: icon.js:66-73 (disabledState)
            iconWithCounters({ properties: { disabledState: { value: '{{!components.textinput1.value}}' } } }),
            ...counters,
        ]);
        // park the real cursor first: CDP keeps its last position across page loads, and an Icon that renders
        // under a resting cursor gets a genuine mouseover → onHover
        moveMouseAway();
        openIconAppInViewer(iconSelector.svg('icon1'));
        expectCounter('clickcount', 'clicks', 0);

        expectPointerBlocked(0, 0);

        cy.get(`${commonWidgetSelector.draggableWidget('textinput1')} input`).type(unlock);
        expectPointerLive(0, 0);

        cy.get(`${commonWidgetSelector.draggableWidget('textinput1')} input`).clear();
        expectPointerBlocked(1, 1);
    });

    // ── Icon-BRW-003 (setDisable component action) ───────────────────────────
    it('[Icon-BRW-003] setDisable(true) blocks real pointer click and hover; setDisable(false) restores both', () => {
        const setDisable = (value) => ({
            eventId: 'onClick',
            actionId: 'control-component',
            componentName: 'icon1',
            componentSpecificActionHandle: 'setDisable', // icon.js:140-142
            componentSpecificActionParams: [{ handle: 'setDisable', value }],
        });
        addIconsViaApi([
            iconWithCounters(),
            { type: 'Button', name: 'disablebtn', layout: { top: 140, left: 4, width: 6, height: 40 }, events: [setDisable('{{true}}')] },
            { type: 'Button', name: 'enablebtn', layout: { top: 140, left: 12, width: 6, height: 40 }, events: [setDisable('{{false}}')] },
            ...counters,
        ]);
        // park the real cursor first: CDP keeps its last position across page loads, and an Icon that renders
        // under a resting cursor gets a genuine mouseover → onHover
        moveMouseAway();
        openIconAppInViewer(iconSelector.svg('icon1'));

        expectPointerLive(0, 0);

        cy.get(`${commonWidgetSelector.draggableWidget('disablebtn')} button`).click();
        expectPointerBlocked(1, 1);

        cy.get(`${commonWidgetSelector.draggableWidget('enablebtn')} button`).click();
        expectPointerLive(1, 1);
    });
});
