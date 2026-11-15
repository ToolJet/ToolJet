/**
 * SPEC — Code Editor — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   CodeEditor-BRW-003 — code is highlighted for the selected language, and the editor paints the light theme in
 *                        light mode and the dark theme in dark mode, readable in both
 * Theme: CodeEditor.jsx:82 `darkMode ? okaidia : githubLight`; the app's dark mode comes from globalSettings.appMode.
 * D-06 forbids pinning CodeMirror's generated theme classes, so the PAINTED colours are compared instead: keyword vs
 * plain text per grammar, light vs dark palettes, and WCAG contrast against the painted backgrounds.
 * Helpers: verifyLayout, openNode, openAndVerifyNode, verifyNodeData, openLinkAppInViewer, addCodeEditorsViaApi,
 * pasteCode, tokenColors, contrastRatio, relativeLuminance.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { codeEditorSelector } from "Selectors/appBuilder/components/codeEditor";
import { codeEditorText } from "Texts/appBuilder/components/codeEditor";
import { verifyLayout } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    addCodeEditorsViaApi,
    pasteCode,
    tokenColors,
    contrastRatio,
    relativeLuminance,
} from "Support/utils/appBuilder/components/codeEditor";

const W = codeEditorText.defaultWidgetName;
const T = codeEditorText;
const S = codeEditorSelector;

// One snippet, three grammars: each line opens with a keyword of exactly one of them.
const KEYWORD = { javascript: 'const', python: 'def', sql: 'SELECT' };
const SNIPPET = "const a = 'txt'\ndef b\nSELECT c"; // dynamic: grammar probe
const EDITORS = [
    { name: 'cejs', mode: T.modes.javascript, layout: { top: 30, left: 2 } },
    { name: 'cepy', mode: T.modes.python, layout: { top: 30, left: 16 } },
    { name: 'cesql', mode: T.modes.sql, layout: { top: 30, left: 30 } },
];

// testIsolation:false for cypress-real-dnd; each test re-creates its app.
describe('Code Editor — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-CodeEditor-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('device context — show on desktop / mobile toggles visibility', () => {
            verifyLayout(W);
        });

        it('exposed-value context — typed code observable in the inspector tree', () => {
            const value = `${fake.firstName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8)}x`; // dynamic: fake
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'value', type: 'String', value: T.defaultValueInspector }, // default ''. source: codeEditor.js:105
            ], verifyNodeData);

            cy.get(S.content(W)).realClick();
            cy.realType(value);
            cy.realPress('Escape'); // close any autocompletion popup
            cy.get(S.line(W)).should('have.text', value);
            verifyNodeData('value', 'String', `"${value}"`);
        });
    });

    describe('running app — theme and highlighting', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-CodeEditor-contexts-${Cypress._.uniqueId()}`);
            addCodeEditorsViaApi(EDITORS.map((e) => ({
                name: e.name,
                layout: { ...e.layout, width: 12, height: 160 },
                properties: { mode: { value: e.mode } },
            })));
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        const openAndFill = () => {
            openLinkAppInViewer(S.content('cesql'));
            EDITORS.forEach((e) => pasteCode(e.name, SNIPPET));
            // park the caret off the editors so no bracket / selection paint is read
            cy.get('body').realClick({ position: 'bottomRight', scrollBehavior: false });
        };
        // yields { cejs: colours, cepy: colours, cesql: colours }
        const readPalettes = () => {
            const palettes = {};
            EDITORS.forEach((e) => tokenColors(e.name).then((c) => (palettes[e.name] = c)));
            return cy.wrap(palettes);
        };
        const expectHighlighted = (P, theme) => {
            const K = P.cejs.const; // the theme's keyword colour
            EDITORS.forEach((e) => {
                const c = P[e.name];
                expect(c.language, `${theme} ${e.name}: grammar`).to.eq(e.mode); // public data-language seam
                // only this grammar's keyword is painted as a keyword, and that paint is not the plain text colour
                Object.entries(KEYWORD).forEach(([mode, word]) => {
                    if (mode === e.mode) expect(c[word], `${theme} ${e.name}: "${word}" is a keyword`).to.eq(K);
                    else expect(c[word], `${theme} ${e.name}: "${word}" is not a keyword here`).to.not.eq(K);
                });
                expect(c[KEYWORD[e.mode]], `${theme} ${e.name}: keyword differs from plain text`).to.not.eq(c.base);
                expect(c["'txt'"], `${theme} ${e.name}: string literal has its own colour`).to.not.be.oneOf([K, c.base]);
            });
        };
        const expectReadable = (P, theme) => {
            EDITORS.forEach((e) => {
                const c = P[e.name];
                const ratio = (fg) => Number(contrastRatio(fg, c.background).toFixed(2));
                expect(ratio(c.base), `${theme} ${e.name}: plain text contrast`).to.be.gte(T.contrast.text);
                ['const', 'def', 'SELECT', "'txt'", 'a', 'b', 'c'].forEach((w) =>
                    expect(ratio(c[w]), `${theme} ${e.name}: "${w}" (${c[w]}) contrast`).to.be.gte(T.contrast.token));
            });
        };

        // ── CodeEditor-BRW-003 ───────────────────────────────────────────────
        it('[CodeEditor-BRW-003] Code is highlighted for its language in the light theme in light mode and the dark theme in dark mode, readable in both', () => {
            openAndFill();
            cy.get('.dark-theme').should('not.exist');
            readPalettes().as('light');
            cy.get('@light').then((L) => {
                expectHighlighted(L, 'light');
                expectReadable(L, 'light');
                // a light editor: light background, dark text
                EDITORS.forEach((e) => {
                    expect(relativeLuminance(L[e.name].background), `light ${e.name}: light background`).to.be.gt(0.8);
                    expect(relativeLuminance(L[e.name].base), `light ${e.name}: dark text`).to.be.lt(0.1);
                });
            });

            // globalSettings.appMode drives the app's dark theme (darkMode prop → CodeEditor.jsx:82)
            cy.apiUpdateGlobalSettings({ appMode: 'dark' });
            openAndFill(); // the widget keeps no saved value, so a reload empties it — paste again
            cy.get('.dark-theme').should('exist');
            readPalettes().then((D) => {
                expectHighlighted(D, 'dark');
                expectReadable(D, 'dark');
                cy.get('@light').then((L) => {
                    EDITORS.forEach((e) => {
                        expect(relativeLuminance(D[e.name].background), `dark ${e.name}: dark background`).to.be.lt(0.1);
                        expect(relativeLuminance(D[e.name].base), `dark ${e.name}: light text`).to.be.gt(0.6);
                        // the palette really switched: the keyword and string paints are not the light theme's
                        expect(D[e.name][KEYWORD[e.mode]], `dark ${e.name}: keyword repainted`).to.not.eq(L[e.name][KEYWORD[e.mode]]);
                        expect(D[e.name]["'txt'"], `dark ${e.name}: string repainted`).to.not.eq(L[e.name]["'txt'"]);
                    });
                });
            });
        });

        // PRODUCT BUG (kept red): in dark mode the D-07 opaque gutter (`--cc-surface3-surface`, codeEditor.scss:21)
        // under the shared line-number colour (`--text-disabled`, CodeEditor/styles.scss:512) measures 2.95:1 —
        // below even the 3:1 large-text minimum. Light mode passes (3.98:1).
        it('[CodeEditor-BRW-003] Line numbers stay readable on the gutter in light and dark mode', () => {
            const gutterReadability = () =>
                readPalettes().then((P) =>
                    EDITORS.map((e) => ({
                        editor: e.name,
                        lineNumber: P[e.name].lineNumber,
                        gutter: P[e.name].gutterBackground,
                        ratio: Number(contrastRatio(P[e.name].lineNumber, P[e.name].gutterBackground).toFixed(2)),
                    })));
            const expectReadableNumbers = (rows, theme) =>
                rows.forEach((r) =>
                    expect(r.ratio, `${theme} ${r.editor}: line number ${r.lineNumber} on gutter ${r.gutter}`).to.be.gte(T.contrast.token));

            openAndFill();
            gutterReadability().then((rows) => expectReadableNumbers(rows, 'light'));
            cy.apiUpdateGlobalSettings({ appMode: 'dark' });
            openAndFill();
            cy.get('.dark-theme').should('exist');
            gutterReadability().then((rows) => expectReadableNumbers(rows, 'dark'));
        });
    });
});
