/**
 * SPEC — Text — events facet.
 * FOR AI: TESTING.md browser scenario only:
 *   Text-BRW-006 — a Text whose disabledState or loadingState is set fires neither On click nor On hover
 * Text.jsx:213-216 binds onClick / onMouseEnter regardless of state; the gate is one layer up: RenderWidget.jsx:330-334
 * adds the `disabled` class to the widget box while disabled or loading, and theme.scss `.disabled` sets
 * `pointer-events: none` — so only a real browser pointer can show it. Every widget's handlers bump an app-variable
 * counter (counterEvent); the disabled / loading flags are bound to a TextInput so the SAME widgets are proven to
 * fire once the flag is cleared.
 * Helpers: addTextsViaApi, counterEvent, counterText, expectCounter, hitTarget, openIconAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { textSelector } from "Selectors/appBuilder/components/text";
import { textText } from "Texts/appBuilder/components/text";
import {
    counterEvent,
    counterText,
    expectCounter,
    hitTarget,
    openIconAppInViewer,
} from "Support/utils/appBuilder/components/icon";
import { addTextsViaApi } from "Support/utils/appBuilder/components/text";

const T = textText;
const ENABLE_WORD = 'go'; // dynamic: gate value that clears the disabled / loading flags
const LANES = ['live', 'disabled', 'loading'];

const moveAway = () => cy.get('body').realMouseMove(1, 1, { position: 'topLeft', scrollBehavior: false });
const hoverAndClick = (name) => {
    cy.get(textSelector.draggableWidget(name)).realHover({ scrollBehavior: false });
    cy.get(textSelector.draggableWidget(name)).realClick({ scrollBehavior: false });
    moveAway();
};
const expectCounts = (name, clicks, hovers) => {
    expectCounter(`${name}clicks`, `${name}Click`, clicks);
    expectCounter(`${name}hovers`, `${name}Hover`, hovers);
};

describe('Text — events facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Text-events-${Cypress._.uniqueId()}`);
        moveAway();
    });

    afterEach(() => {
        moveAway();
        cy.apiDeleteApp();
    });

    // ── Text-BRW-006 ─────────────────────────────────────────────────────────
    it('[Text-BRW-006] A disabled or loading Text fires neither On click nor On hover; the same Text fires once the flag is cleared', () => {
        const gated = { value: `{{components.gate.value !== "${ENABLE_WORD}"}}` };
        addTextsViaApi([
            { type: 'TextInput', name: 'gate', layout: { top: 10, left: 30, width: 8, height: 40 } },
            ...LANES.map((lane, i) => ({
                name: lane,
                layout: { top: 10 + i * 60, left: 2, width: 8, height: 40 },
                properties: {
                    text: { value: lane },
                    ...(lane === 'disabled' ? { disabledState: gated } : {}), // source: text.js:66-74
                    ...(lane === 'loading' ? { loadingState: gated } : {}), // source: text.js:41-49
                },
                // events.onClick / onHover (text.js:105-108)
                events: [counterEvent('onClick', `${lane}Click`), counterEvent('onHover', `${lane}Hover`)],
            })),
            ...LANES.flatMap((lane, i) => [
                counterText(`${lane}clicks`, `${lane}Click`, { top: 10 + i * 60, left: 12, width: 8 }),
                counterText(`${lane}hovers`, `${lane}Hover`, { top: 10 + i * 60, left: 21, width: 8 }),
            ]),
        ]);
        openIconAppInViewer(textSelector.root('live'));

        // the interaction gate is in place: the widget box carries `disabled`, and a real pointer at the centre of
        // the Text lands outside it
        ['disabled', 'loading'].forEach((lane) => {
            cy.get(textSelector.draggableWidget(lane))
                .should('have.class', T.disabledClass) // source: RenderWidget.jsx:333
                .and('have.css', 'pointer-events', T.disabledPointerEvents); // source: theme.scss .disabled
            hitTarget(textSelector.draggableWidget(lane)).then(({ el }) =>
                expect(el && el.closest(textSelector.draggableWidget(lane)), `${lane}: pointer does not reach the Text`).to.eq(null));
        });
        cy.get(textSelector.loader('loading')).should('be.visible'); // Text.jsx:243-249

        // control: the enabled Text fires each event once
        hoverAndClick('live');
        expectCounts('live', 1, 1);

        // disabled and loading: real hover + click do nothing …
        hoverAndClick('disabled');
        hoverAndClick('loading');
        // … proven after a later dispatch on the control has landed
        hoverAndClick('live');
        expectCounts('live', 2, 2);
        expectCounts('disabled', 0, 0);
        expectCounts('loading', 0, 0);

        // clearing the flags makes the very same widgets fire
        cy.get(textSelector.textInput('gate')).type(ENABLE_WORD);
        cy.get(textSelector.draggableWidget('disabled')).should('not.have.class', T.disabledClass);
        cy.get(textSelector.scroller('loading')).should('contain.text', 'loading');
        hoverAndClick('disabled');
        hoverAndClick('loading');
        expectCounts('disabled', 1, 1);
        expectCounts('loading', 1, 1);
    });
});
