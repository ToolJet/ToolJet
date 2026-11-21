/**
 * SPEC — Custom Component — userflow facet.
 * FOR AI: TESTING.md browser scenario driven with REAL pointer input (CDP) into the widget's srcdoc frame:
 *   CustomComponent-BRW-001 — the default author code renders its heading and button in a real app; clicking the
 *                             button updates the displayed data through updateData (frame + exposed `data`); editing
 *                             the Code property re-renders the frame in place, without a page reload.
 * The default code (customComponent.js:61-77) imports React 17, ReactDOM 17 and Material-UI from cdn.jsdelivr.net, so
 * the default-code half needs the CDN (scenario requirement); the edited code is self-contained and runs on the
 * frame's pinned React 16 bundle (iframe.html:4-5). A Text probe bound to `components.customcomponent1.data.title`
 * proves updateData reached the exposed value, not just the frame's paint.
 * Helpers: addCustomComponentsViaApi, inFrame, realClickInFrame, pasteCustomCode, openEditorSidebar,
 * openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { customComponentSelector } from "Selectors/appBuilder/components/customComponent";
import { customComponentText } from "Texts/appBuilder/components/customComponent";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    addCustomComponentsViaApi,
    inFrame,
    realClickInFrame,
    pasteCustomCode,
} from "Support/utils/appBuilder/components/customComponent";

const T = customComponentText;
const S = customComponentSelector;
const W = T.defaultWidgetName;
const probe = commonWidgetSelector.draggableWidget('text1');

// self-contained author code (no imports): global React/ReactDOM from the frame, Tooljet bridge from iframe.html:112-129
const editedCode = (tag, clickedTitle) =>
    [
        'const Card = ({ data, updateData }) => (',
        '  <section id="cc-edited">',
        '    <h2 id="cc-title">{data.title}</h2>',
        `    <p id="cc-tag">${tag}</p>`,
        `    <button id="cc-btn" onClick={() => updateData({ title: '${clickedTitle}' })}>{data.buttonText}</button>`,
        '  </section>',
        ');',
        'const Connected = Tooljet.connectComponent(Card);',
        'ReactDOM.render(<Connected />, document.body);',
    ].join('\n');

describe('Custom Component — userflow facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-CustomComponent-userflow-${Cypress._.uniqueId()}`);
        addCustomComponentsViaApi([
            { name: W, layout: { top: 40, left: 2, width: 15, height: 220 } }, // definition Data + Code
            {
                type: 'Text',
                name: 'text1',
                layout: { top: 40, left: 20, width: 12, height: 40 },
                properties: { text: { value: `{{components.${W}.data.title}}` } },
            },
        ]);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── CustomComponent-BRW-001 (running app) ────────────────────────────────
    it('[CustomComponent-BRW-001] Default author code renders its heading and button; a real click updates the data through updateData', () => {
        openLinkAppInViewer(S.frame(W));

        // the default code's CDN imports resolved and rendered the Material-UI tree. source: customComponent.js:61-77
        inFrame(W, '.MuiContainer-root h1').should('have.text', T.defaultTitle); // source: customComponent.js:58,66
        inFrame(W, 'button.MuiButton-root').should('have.text', T.defaultButtonText); // source: customComponent.js:58,72
        cy.get(probe).should('have.text', T.defaultTitle);

        // a real pointer click inside the frame → updateData({ title }) → frame re-renders AND the exposed value changes
        realClickInFrame(W, 'button.MuiButton-root');
        inFrame(W, 'h1').should('have.text', T.updatedTitle); // source: customComponent.js:70
        inFrame(W, 'button.MuiButton-root').should('have.text', T.defaultButtonText); // merged, not replaced
        cy.get(probe).should('have.text', T.updatedTitle);
    });

    // ── CustomComponent-BRW-001 (editor: Code edit re-renders in place) ──────
    it('[CustomComponent-BRW-001] Editing the Code property re-renders the frame without a page reload; the edited code still talks to the app', () => {
        const tag = fake.firstName.slice(0, 12) || 'tag'; // dynamic: authored text only the edited code renders
        const clickedTitle = fake.lastName.slice(0, 12) || 'clicked'; // dynamic: title the edited button publishes

        cy.then(() => cy.openApp('', undefined, undefined, S.frame(W)));
        inFrame(W, 'h1').should('have.text', T.defaultTitle); // source: customComponent.js:58,66

        // sentinels: a page reload drops the window flag; a remounted widget drops the iframe flag
        cy.window().then((win) => {
            win.__ccNoReload = true;
        });
        cy.get(S.frame(W)).then(($f) => {
            $f[0].__ccSameFrame = true;
        });

        openEditorSidebar(W);
        pasteCustomCode(editedCode(tag, clickedTitle));

        // the frame re-ran the new code: old Material-UI tree gone, the edited markup rendered with the current data
        inFrame(W, '#cc-edited #cc-tag').should('have.text', tag);
        inFrame(W, '#cc-title').should('have.text', T.defaultTitle);
        inFrame(W, '#cc-btn').should('have.text', T.defaultButtonText);
        cy.get(S.frame(W)).should(($f) => {
            const body = $f[0].contentDocument.body;
            expect(body.querySelector('.MuiContainer-root'), 'previous render replaced').to.be.null;
            expect(body.querySelectorAll('#cc-edited'), 'rendered once').to.have.length(1);
        });
        cy.window().its('__ccNoReload').should('eq', true);
        cy.get(S.frame(W)).should(($f) => expect($f[0].__ccSameFrame, 'same iframe element, no remount').to.eq(true));

        // the edited code's updateData still reaches the frame and the exposed value
        cy.get(probe).should('have.text', T.defaultTitle);
        realClickInFrame(W, '#cc-btn');
        inFrame(W, '#cc-title').should('have.text', clickedTitle);
        cy.get(probe).should('have.text', clickedTitle);
        cy.window().its('__ccNoReload').should('eq', true);

        // the edit was saved: the running app renders the edited code
        cy.waitForAutoSave();
        openLinkAppInViewer(S.frame(W));
        inFrame(W, '#cc-tag').should('have.text', tag);
        inFrame(W, '#cc-title').should('have.text', T.defaultTitle);
    });
});
