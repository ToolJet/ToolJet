/**
 * SPEC — Text Editor (RichTextEditor) — userflow facet.
 * FOR AI: TESTING.md browser scenarios driven with REAL mouse/keyboard input (CDP) in the running app:
 *   RichTextEditor-BRW-001 — toolbar controls (headings, blockquote, ul/ol, code-block, bold/italic/underline) apply
 *                            the block/inline style to the current selection
 *   RichTextEditor-BRW-002 — typing/editing in the contentEditable updates the exposed `value` (stateToHTML) as the
 *                            user types
 *   RichTextEditor-BRW-004 — a disabled editor cannot be edited (mouse or keyboard)
 * The toolbar toggles on mousedown (DraftEditor.jsx:46) through draft-js RichUtils (DraftEditor.jsx:266-272); every
 * change publishes stateToHTML(content) as `value` (DraftEditor.jsx:163-167). A plain-text Text probe shows
 * JSON.stringify(value), so the exposed HTML is compared exactly, alongside the painted DOM.
 * Disabled: RichTextEditor.jsx:75 `data-disabled`; the mouse block actually comes from RenderWidget's `.canvas-component
 * .disabled` (dimmed, pointer-events none). The draft-js Editor gets no `readOnly` (D-05), so keyboard reachability is
 * checked with a real Tab control.
 * Helpers: openLinkAppInViewer, addRichTextEditorsViaApi, valueProbe, focusEditor, selectAllInEditor, applyHeading,
 * clickToolbarIcon, toolbarState.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { richTextEditorSelector } from "Selectors/appBuilder/components/richTextEditor";
import { richTextEditorText } from "Texts/appBuilder/components/richTextEditor";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    addRichTextEditorsViaApi,
    valueProbe,
    focusEditor,
    selectAllInEditor,
    applyHeading,
    clickToolbarIcon,
    toolbarState,
} from "Support/utils/appBuilder/components/richTextEditor";

const T = richTextEditorText;
const S = richTextEditorSelector;
const RTE = T.defaultWidgetName;
const probe = (name = 'text1') => commonWidgetSelector.draggableWidget(name);
// the probe shows JSON.stringify(value) — compare against the same encoding of the expected HTML
const expectValue = (html, name = 'text1') => cy.get(probe(name)).should('have.text', JSON.stringify(html));
const word = () => `${fake.firstName.replace(/[^a-z]/g, '').slice(0, 6)}w`; // dynamic: fake, letters only
const MOD = Cypress.platform === 'darwin' ? 'Meta' : 'Control'; // draft-js hasCommandModifier

// painted style of the first text leaf in the editor
const leafStyle = (name) =>
    cy.get(`${S.content(name)} [data-text="true"]`).first().then(($t) => {
        const cs = $t[0].ownerDocument.defaultView.getComputedStyle($t[0].parentElement);
        return { weight: Number(cs.fontWeight), style: cs.fontStyle, decoration: cs.textDecorationLine };
    });
// tag chain of the first block (e.g. ['UL', 'LI'] or ['H1']) — draft-js renders block types as these elements
const blockTags = (name) =>
    cy.get(S.content(name)).then(($c) => {
        const leaf = $c[0].querySelector('[data-block="true"]');
        const tags = [];
        for (let el = leaf; el && el !== $c[0]; el = el.parentElement) {
            if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'PRE'].includes(el.tagName)) tags.unshift(el.tagName);
        }
        return tags;
    });

describe('Text Editor — userflow facet', () => {
    afterEach(() => {
        cy.apiDeleteApp();
    });

    describe('one editor', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-RichTextEditor-userflow-${Cypress._.uniqueId()}`);
            addRichTextEditorsViaApi([
                { name: RTE, layout: { top: 70, left: 2, width: 16, height: 260 } },
                valueProbe('text1', RTE, { top: 70, left: 20, width: 22, height: 60 }),
            ]);
            openLinkAppInViewer(S.content(RTE));
            expectValue(''); // default value ''. source: richtextarea.js:112
        });

        // ── RichTextEditor-BRW-002 ───────────────────────────────────────────
        it('[RichTextEditor-BRW-002] Typing in the editor updates value keystroke by keystroke; Enter, Backspace and the bold key command edit it', () => {
            const a = word();
            const b = word();
            cy.get(S.placeholder(RTE)).should('have.text', T.defaultPlaceholder); // source: richtextarea.js:111
            focusEditor(RTE);

            cy.realType(a.slice(0, 2));
            expectValue(`<p>${a.slice(0, 2)}</p>`);
            cy.get(S.placeholder(RTE)).should('not.exist'); // the placeholder gives way to content
            cy.realType(a.slice(2));
            expectValue(`<p>${a}</p>`);

            // Enter splits into a second paragraph
            cy.realPress('Enter');
            cy.realType(b);
            expectValue(`<p>${a}</p>\n<p>${b}</p>`);
            cy.get(S.block(RTE)).should('have.length', 2);

            // Backspace deletes the second paragraph's text, then joins it back
            for (let i = 0; i <= b.length; i += 1) cy.realPress('Backspace');
            expectValue(`<p>${a}</p>`);
            cy.get(S.block(RTE)).should('have.length', 1).and('have.text', a);

            // the draft-js key command (Cmd/Ctrl+B → handleKeyCommand 'bold', DraftEditor.jsx:246-253) bolds the selection
            selectAllInEditor(RTE);
            cy.realPress([MOD, 'b']);
            expectValue(`<p><strong>${a}</strong></p>`);
            leafStyle(RTE).its('weight').should('be.gte', 600);
        });

        // ── RichTextEditor-BRW-001 ───────────────────────────────────────────
        it('[RichTextEditor-BRW-001] Bold, italic and underline toggle on the selected text and only on it', () => {
            const a = word();
            const b = `Z${word()}`; // capital Z: never a substring of the lower-case first word
            focusEditor(RTE);
            cy.realType(a);
            expectValue(`<p>${a}</p>`);

            // select the word the way a user does — Shift+ArrowLeft once per character from the caret at its end
            const selectBack = (n, text) => {
                Cypress._.times(n, () => cy.realPress(['Shift', 'ArrowLeft']));
                cy.document().should((doc) => expect(doc.getSelection().toString(), 'selection').to.eq(text));
            };
            selectBack(a.length, a);

            // on → value + paint + active button; off → plain again (draft-js keeps the selection across presses)
            const inline = [
                { icon: T.icons.bold, tag: 'strong', painted: (s) => expect(s.weight, 'bold weight').to.be.gte(600) },
                { icon: T.icons.italic, tag: 'em', painted: (s) => expect(s.style, 'italic').to.eq('italic') },
                { icon: T.icons.underline, tag: 'u', painted: (s) => expect(s.decoration, 'underline').to.contain('underline') },
            ];
            inline.forEach(({ icon, tag, painted }) => {
                clickToolbarIcon(RTE, icon);
                expectValue(`<p><${tag}>${a}</${tag}></p>`);
                leafStyle(RTE).then(painted);
                toolbarState(RTE).its('active').should('include', icon);
                clickToolbarIcon(RTE, icon); // the same selection, toggled back
                expectValue(`<p>${a}</p>`);
                leafStyle(RTE).should((s) => expect(s, 'plain paint').to.deep.eq({ weight: 400, style: 'normal', decoration: 'none' }));
            });

            // only the selected range is styled: collapse to the end, type a second word, select just it, bold it
            cy.realPress('ArrowRight');
            cy.realType(` ${b}`);
            expectValue(`<p>${a} ${b}</p>`);
            selectBack(b.length, b);
            clickToolbarIcon(RTE, T.icons.bold);
            expectValue(`<p>${a} <strong>${b}</strong></p>`);
            cy.get(`${S.content(RTE)} [data-text="true"]`).should(($leaves) => {
                const painted = $leaves.toArray().map((l) => ({
                    text: l.textContent,
                    bold: Number(l.ownerDocument.defaultView.getComputedStyle(l.parentElement).fontWeight) >= 600,
                }));
                expect(painted, 'only the selection is bold').to.deep.eq([{ text: `${a} `, bold: false }, { text: b, bold: true }]);
            });
        });

        it('[RichTextEditor-BRW-001] Headings, blockquote, lists and code block set the type of the current block', () => {
            const a = word();
            focusEditor(RTE);
            cy.realType(a);
            expectValue(`<p>${a}</p>`);

            // every heading level from the hover menu (DraftEditor.jsx:53-60) — each replaces the previous one
            T.headings.forEach((label, i) => {
                const tag = `h${i + 1}`;
                applyHeading(RTE, label);
                expectValue(`<${tag}>${a}</${tag}>`);
                blockTags(RTE).should('deep.eq', [tag.toUpperCase()]);
                cy.get(S.headingList(RTE)).contains('.RichEditor-styleButton', new RegExp(`^${label}$`)).should('have.class', 'RichEditor-activeButton');
            });
            applyHeading(RTE, T.headings[5]); // the active heading again → back to a paragraph
            expectValue(`<p>${a}</p>`);
            blockTags(RTE).should('deep.eq', []);
            cy.get(S.controls(RTE)).realHover({ position: 'right', scrollBehavior: false }); // let the menu close

            // icon block types (DraftEditor.jsx:62-79)
            const blocks = [
                { icon: T.icons.blockquote, html: `<blockquote>${a}</blockquote>`, tags: ['BLOCKQUOTE'] },
                { icon: T.icons.ul, html: `<ul>\n  <li>${a}</li>\n</ul>`, tags: ['UL', 'LI'] },
                { icon: T.icons.ol, html: `<ol>\n  <li>${a}</li>\n</ol>`, tags: ['OL', 'LI'] },
                { icon: T.icons.codeBlock, html: `<pre><code>${a}</code></pre>`, tags: ['PRE', 'PRE'] }, // draft-js wraps the <pre> block in a <pre>
            ];
            blocks.forEach(({ icon, html, tags }) => {
                clickToolbarIcon(RTE, icon);
                expectValue(html);
                blockTags(RTE).should('deep.eq', tags);
                toolbarState(RTE).its('active').should('deep.eq', [icon]);
            });
            // the blockquote is painted with its own style (getBlockStyle → RichEditor-blockquote, DraftEditor.jsx:21-28)
            clickToolbarIcon(RTE, T.icons.blockquote);
            expectValue(`<blockquote>${a}</blockquote>`);
            cy.get(`${S.content(RTE)} blockquote`).should(($q) => {
                expect($q, 'blockquote class').to.have.class('RichEditor-blockquote');
                const cs = $q[0].ownerDocument.defaultView.getComputedStyle($q[0]);
                expect({ style: cs.fontStyle, border: cs.borderLeftStyle }, 'blockquote paint').to.deep.eq({ style: 'italic', border: 'solid' });
            });
            clickToolbarIcon(RTE, T.icons.blockquote); // toggled off
            expectValue(`<p>${a}</p>`);
            toolbarState(RTE).its('active').should('deep.eq', []);
            // the caret stayed in the editor through every toolbar press (mousedown is prevented)
            cy.realType('z');
            expectValue(`<p>${a}z</p>`);
        });
    });

    // ── RichTextEditor-BRW-004 ───────────────────────────────────────────────
    describe('disabled editor', () => {
        const ON = 'rteon';
        const OFF = 'rteoff';
        const seed = 'Seed'; // dynamic: seeded default value

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-RichTextEditor-userflow-${Cypress._.uniqueId()}`);
            // two lanes: a text input above an enabled (control) / disabled editor, each with its own value probe
            addRichTextEditorsViaApi([
                { type: 'TextInput', name: 'inputon', layout: { top: 10, left: 2, width: 16, height: 40 } },
                { name: ON, layout: { top: 70, left: 2, width: 16, height: 220 }, properties: { defaultValue: { value: seed } } },
                valueProbe('probeon', ON, { top: 310, left: 2, width: 16 }),
                { type: 'TextInput', name: 'inputoff', layout: { top: 10, left: 22, width: 16, height: 40 } },
                {
                    name: OFF,
                    layout: { top: 70, left: 22, width: 16, height: 220 },
                    properties: { defaultValue: { value: seed } },
                    styles: { disabledState: { value: '{{true}}' } },
                },
                valueProbe('probeoff', OFF, { top: 310, left: 22, width: 16 }),
            ]);
            openLinkAppInViewer(S.content(OFF));
            cy.get(probe('probeoff')).should('have.text', JSON.stringify(seed)); // mount value = defaultValue (D-04)
        });

        // where keyboard focus is: the content of `name`, or something else
        const focusIsIn = (name) =>
            cy.document().then((doc) => !!(doc.activeElement && doc.activeElement.closest(S.content(name))));
        // from the lane's text input, press Tab up to 4 times; yields whether focus ever entered the editor content
        const tabFromInput = (input, name) => {
            cy.get(S.textInput(input)).realClick({ scrollBehavior: false });
            cy.document().its('activeElement.tagName').should('eq', 'INPUT');
            const reached = { value: false };
            Cypress._.times(4, () => {
                cy.then(() => {
                    if (reached.value) return;
                    cy.realPress('Tab');
                    focusIsIn(name).then((inside) => {
                        if (inside) reached.value = true;
                    });
                });
            });
            return cy.wrap(reached).its('value');
        };

        it('[RichTextEditor-BRW-004] The disabled editor is dimmed and ignores the mouse on its text and toolbar', () => {
            cy.get(S.root(OFF)).should(($w) => {
                expect($w, 'wrapper').to.have.attr('data-disabled', 'true'); // RichTextEditor.jsx:75
                expect($w, 'wrapper').to.have.attr('aria-disabled', 'true'); // RichTextEditor.jsx:87
                const win = $w[0].ownerDocument.defaultView;
                const grid = $w[0].closest('.canvas-component');
                expect(grid, 'grid box').to.have.class(T.disabledGridClass); // source: RenderWidget.jsx:332
                let opacity = 1; // effective opacity: product of every ancestor's
                for (let el = $w[0]; el; el = el.parentElement) opacity *= Number(win.getComputedStyle(el).opacity);
                expect({ pointerEvents: win.getComputedStyle($w[0]).pointerEvents, dimmed: opacity < 1 }, 'disabled paint')
                    .to.deep.eq({ pointerEvents: T.disabledPointerEvents, dimmed: true });
            });
            cy.get(S.root(ON)).should('have.attr', 'data-disabled', 'false');

            // control: a click puts the caret into the enabled editor
            focusEditor(ON);
            cy.get(S.textInput('inputon')).realClick({ scrollBehavior: false }); // move focus away

            // the disabled editor's text area is not hit-testable and a real click does not focus it
            cy.get(S.content(OFF)).then(($c) => {
                const r = $c[0].getBoundingClientRect();
                const hit = $c[0].ownerDocument.elementFromPoint(r.left + r.width / 2, r.top + Math.min(20, r.height / 2));
                expect(!!(hit && hit.closest(S.root(OFF))), 'disabled editor is hit by the pointer').to.eq(false);
            });
            cy.get(S.content(OFF)).realClick({ scrollBehavior: false });
            focusIsIn(OFF).should('eq', false);
            cy.realType('x');
            cy.get(probe('probeoff')).should('have.text', JSON.stringify(seed));
            cy.get(S.block(OFF)).should('have.text', seed);

            // toolbar: Bold does nothing on the disabled editor
            clickToolbarIcon(OFF, T.icons.bold);
            toolbarState(OFF).its('active').should('deep.eq', []);
            cy.get(probe('probeoff')).should('have.text', JSON.stringify(seed));
        });

        // PRODUCT BUG (kept red): disabling is CSS-only (pointer-events:none on the dimmed grid box) and
        // the draft-js Editor has no readOnly (DraftEditor.jsx:308-324), so Tab can still focus the contentEditable and
        // typing edits it and republishes `value`.
        it('[RichTextEditor-BRW-004] Keyboard cannot focus or edit the disabled editor', () => {
            // control: Tab from the text input above reaches the enabled editor and typing edits it
            tabFromInput('inputon', ON).should('eq', true);
            cy.realType('k');
            cy.get(probe('probeon')).invoke('text').should('not.eq', JSON.stringify(seed));

            const typed = 'q'; // dynamic: one keystroke
            tabFromInput('inputoff', OFF).then((reached) => {
                cy.realType(typed);
                cy.wait(500); // let a (buggy) edit re-render before the snapshot
                cy.document().should(() => {
                    expect({
                        focusReached: reached,
                        text: Cypress.$(S.block(OFF)).text(),
                        value: Cypress.$(probe('probeoff')).text(),
                    }, 'disabled editor untouched by the keyboard').to.deep.eq({
                        focusReached: false,
                        text: seed,
                        value: JSON.stringify(seed),
                    });
                });
            });
        });
    });
});
