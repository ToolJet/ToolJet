/**
 * SPEC — HTML Viewer — userflow facet.
 * FOR AI: real keyboard + pointer interaction with controls authored inside the widget (TESTING.md):
 *   Html-BRW-005 — while the HTML Viewer is disabled, Tab skips its authored button / link / input and a real
 *                  pointer cannot activate them; enabling again restores both (decision D-03)
 * Html.jsx:184-198 marks the scroller aria-disabled + `inert` and turns pointer-events off while isDisabled. The
 * disabled flag is bound to textinput1 so the same running app flips between enabled and disabled.
 * Helpers: openLinkAppInViewer, addHtmlWidgetsViaApi, trackAuthoredClicks, authoredClicks, tabFrom.
 */
import { fake } from "Fixtures/fake";
import { htmlSelector } from "Selectors/appBuilder/components/html";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    addHtmlWidgetsViaApi,
    trackAuthoredClicks,
    authoredClicks,
    tabFrom,
} from "Support/utils/appBuilder/components/html";

const H = 'html1';
const BTN = 'authored-btn';
const LINK = 'authored-link';
const INPUT = 'authored-input';
const start = htmlSelector.textInput('textinput1');
const authored = (id) => htmlSelector.authored(H, id);

describe('HTML Viewer — userflow facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-Html-userflow-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── Html-BRW-005 ─────────────────────────────────────────────────────────
    it('[Html-BRW-005] Disabled: Tab skips and the pointer cannot activate authored controls; enabling restores them', () => {
        const lockWord = fake.firstName.toLowerCase().replace(/\W/g, ''); // dynamic: typed to disable html1
        const typed = fake.lastName.toLowerCase().replace(/\W/g, '').slice(0, 8); // dynamic: typed into the authored input
        addHtmlWidgetsViaApi([
            { type: 'TextInput', name: 'textinput1', layout: { top: 30, left: 2, width: 8, height: 40 } },
            {
                name: H,
                layout: { top: 90, left: 2, width: 12, height: 160 },
                properties: {
                    disabledState: { value: `{{components.textinput1.value === "${lockWord}"}}` },
                    rawHtml: {
                        value: `<div><button id="${BTN}">Go</button> <a id="${LINK}" href="https://example.com/">Docs</a> <input id="${INPUT}" placeholder="authored"/></div>`,
                    },
                },
            },
            { type: 'TextInput', name: 'textinput2', layout: { top: 280, left: 2, width: 8, height: 40 } },
        ]);
        openLinkAppInViewer(authored(BTN));
        trackAuthoredClicks();

        const clickAll = () => [BTN, LINK, INPUT].forEach((id) => cy.get(authored(id)).realClick({ scrollBehavior: false }));
        const resetClicks = () => cy.window().then((win) => { win.__htmlAuthoredClicks.length = 0; });

        // ── enabled baseline: Tab walks through every authored control, the pointer reaches each of them
        cy.get(htmlSelector.container(H)).should('have.attr', 'aria-disabled', 'false').and('not.have.attr', 'inert');
        tabFrom(start, 4).should('deep.equal', [BTN, LINK, INPUT, 'textinput2']);
        clickAll();
        authoredClicks().should('deep.equal', [BTN, LINK, INPUT]);
        cy.focused().should('have.attr', 'id', INPUT);
        cy.realType(typed);
        cy.get(authored(INPUT)).should('have.value', typed);
        cy.get(authored(INPUT)).clear();
        resetClicks();

        // ── disabled: semantics exposed, Tab jumps straight past the widget, pointer activation never lands
        cy.get(start).type(lockWord);
        cy.get(htmlSelector.container(H))
            .should('have.attr', 'aria-disabled', 'true')
            .and('have.attr', 'inert');
        tabFrom(start, 1).should('deep.equal', ['textinput2']);
        clickAll();
        authoredClicks().should('have.length', 0);
        cy.document().should((doc) =>
            expect(doc.activeElement.closest(htmlSelector.container(H)), 'focus never enters the disabled widget').to.be.null);
        cy.get(authored(INPUT)).should('have.value', '');

        // ── enabled again: keyboard and pointer interaction restored
        cy.get(start).clear();
        cy.get(htmlSelector.container(H)).should('have.attr', 'aria-disabled', 'false').and('not.have.attr', 'inert');
        tabFrom(start, 3).should('deep.equal', [BTN, LINK, INPUT]);
        clickAll();
        authoredClicks().should('deep.equal', [BTN, LINK, INPUT]);
        cy.realType(typed);
        cy.get(authored(INPUT)).should('have.value', typed);
    });
});
