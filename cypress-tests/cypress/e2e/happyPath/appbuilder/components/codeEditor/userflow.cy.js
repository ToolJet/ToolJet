/**
 * SPEC — Code Editor — userflow facet.
 * FOR AI: TESTING.md browser scenario driven with REAL keyboard input (CDP) in the running app:
 *   CodeEditor-BRW-004 — Tab indents rather than moving focus; bracket matching and autocompletion appear
 * CodeEditor.jsx:70-80 basicSetup (bracketMatching, autocompletion, completionKeymap) and :131 indentWithTab.
 * A Text probe bound to the exposed value proves the keyboard edits reach the document, not just the paint.
 * Helpers: openLinkAppInViewer, addCodeEditorsViaApi.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { codeEditorSelector } from "Selectors/appBuilder/components/codeEditor";
import { codeEditorText } from "Texts/appBuilder/components/codeEditor";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { addCodeEditorsViaApi, alphaOf } from "Support/utils/appBuilder/components/codeEditor";

const T = codeEditorText;
const S = codeEditorSelector;
const CE = 'codeeditor1';
const probe = commonWidgetSelector.draggableWidget('text1');

// where keyboard focus is: 'editor' (this editor's content), 'textinput' or the focused tag
const focusOwner = () =>
    cy.document().then((doc) => {
        const el = doc.activeElement;
        if (el && el.closest(S.content(CE))) return 'editor';
        if (el && el.closest(commonWidgetSelector.draggableWidget('textinput1'))) return 'textinput';
        return el ? el.tagName.toLowerCase() : 'none';
    });

describe('Code Editor — userflow facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-CodeEditor-userflow-${Cypress._.uniqueId()}`);
        addCodeEditorsViaApi([
            { type: 'TextInput', name: 'textinput1', layout: { top: 10, left: 2, width: 12, height: 40 } },
            { name: CE, layout: { top: 70, left: 2, width: 15, height: 160 }, properties: { mode: { value: T.modes.javascript } } },
            {
                type: 'Text',
                name: 'text1',
                layout: { top: 70, left: 20, width: 15, height: 40 },
                properties: { text: { value: '{{JSON.stringify(components.codeeditor1.value)}}' } },
            },
        ]);
        openLinkAppInViewer(S.content(CE));
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── CodeEditor-BRW-004 ───────────────────────────────────────────────────
    it('[CodeEditor-BRW-004] Tab indents the line and keeps focus in the editor; Shift+Tab outdents', () => {
        // control: elsewhere on the page Tab really moves focus
        cy.get(S.textInput('textinput1')).realClick();
        focusOwner().should('eq', 'textinput');
        cy.realPress('Tab');
        focusOwner().should('not.eq', 'textinput');

        cy.get(S.content(CE)).realClick();
        focusOwner().should('eq', 'editor');
        cy.realPress('Tab');
        focusOwner().should('eq', 'editor');
        cy.get(S.line(CE)).should('have.length', 1).and('have.text', '  '); // one indent unit (2 spaces)
        cy.realType('x');
        cy.realPress('Escape'); // close any completion popup the letter opened
        cy.realPress('Tab'); // indentMore on the whole line
        focusOwner().should('eq', 'editor');
        cy.get(S.line(CE)).should('have.text', '    x');
        cy.get(probe).should('have.text', '"    x"'); // the exposed value carries the indentation
        cy.realPress(['Shift', 'Tab']); // indentLess
        focusOwner().should('eq', 'editor');
        cy.get(S.line(CE)).should('have.text', '  x');
        cy.get(probe).should('have.text', '"  x"');
    });

    it('[CodeEditor-BRW-004] Brackets auto-close and the matching pair is highlighted; autocompletion offers and inserts a keyword', () => {
        const fn = `${fake.firstName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 6)}fn`; // dynamic: identifier
        cy.get(S.content(CE)).realClick();
        cy.realType(`${fn}(x`);
        cy.realPress('Escape');
        // the opening bracket is closed for us and, with the caret between them, both halves are highlighted
        cy.get(S.line(CE)).first().should('have.text', `${fn}(x)`);
        cy.get(S.matchingBracket(CE)).should(($b) => {
            expect($b.toArray().map((b) => b.textContent), 'matched pair').to.deep.eq(['(', ')']);
            $b.toArray().forEach((b) =>
                expect(alphaOf(b.ownerDocument.defaultView.getComputedStyle(b).backgroundColor), 'pair is painted').to.be.gt(0));
        });
        // moving the caret away from the brackets clears the highlight
        cy.realPress('End');
        cy.realType(' y');
        cy.realPress('Escape');
        cy.get(S.line(CE)).first().should('have.text', `${fn}(x) y`);
        cy.get(S.matchingBracket(CE)).should('not.exist');

        // autocompletion: a partial keyword opens the list with the keyword selected; Enter inserts it
        cy.realPress('Enter');
        cy.realType('cons');
        cy.get(S.autocomplete(CE)).should('be.visible');
        cy.get(S.autocompleteOption(CE)).first().should('have.text', 'const').and('have.attr', 'aria-selected', 'true');
        // @codemirror/autocomplete ignores keyboard accepts for `interactionDelay` (75ms) after the list (re)opens,
        // so a human-paced pause before Enter — otherwise Enter falls through to a newline
        cy.wait(300);
        cy.realPress('Enter');
        cy.get(S.autocomplete(CE)).should('not.exist');
        cy.get(S.line(CE)).should('have.length', 2).last().should('have.text', 'const');
        cy.get(probe).should('have.text', JSON.stringify(`${fn}(x) y\nconst`));
    });
});
