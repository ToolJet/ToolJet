/**
 * SPEC — JSON Editor — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus the TESTING.md browser scenario
 * (frontend/ee/test/app-builder/widgets/JSONEditor):
 *   JSONEditor-BRW-003 — each of the four documented themes renders legibly in light and dark app mode, the async
 *                        theme import settles (the editor is not left unthemed), and the lint error tooltip is
 *                        readable in both app modes (D-07)
 * Theme: loadCodeMirrorTheme (JSONEditor.jsx:16-30) resolves asynchronously; the ThemeOverride paints the scroller
 * with the widget's Background style (JSONEditor.jsx:133-141 — default var(--cc-surface1-surface), jsonEditor.js:203).
 * App mode: globalSettings.appMode → `.dark-theme` + darkMode prop.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openAndVerifyNode,
 * verifyNodeData, openLinkAppInViewer, addJsonWidgetsViaApi, jsonEditorMetrics, tokenContrast, contrastRatio,
 * typeIntoJsonEditor, hoverTwice.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { jsonEditorSelector as SEL } from "Selectors/appBuilder/components/jsonEditor";
import { jsonEditorText } from "Texts/appBuilder/components/jsonEditor";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    addJsonWidgetsViaApi,
    jsonEditorMetrics,
    tokenContrast,
    contrastRatio,
    typeIntoJsonEditor,
    hoverTwice,
} from "Support/utils/appBuilder/components/jsonEditor";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = jsonEditorText;
const W = T.defaultWidgetName;
const THEMES = Object.keys(T.themes); // jsonEditor.js:27-30
const editorName = (theme) => `je${theme}`;
// a document exercising every JSON token class: keys, strings, numbers, booleans, null, brackets, punctuation
const TOKEN_DOC = `{{{ text: 'Hello', number: 64, flag: true, off: false, nothing: null, list: ['a', 'b'], obj: { k: 1.5 } }}}`; // dynamic

describe('JSON Editor — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-JSONEditor-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('device context — Show on desktop / Show on mobile gate the widget on the matching editor layout', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults (jsonEditor.js:181-182): on the desktop canvas, absent from the mobile canvas
            cy.get(SEL.content(W)).should('contain.text', T.defaultDocumentText);
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            cy.get(widget).should('exist');

            // desktop off → gone from desktop; mobile on → shown on the mobile canvas only
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            cy.get(widget).should('be.visible');
            cy.get(SEL.content(W)).should('contain.text', T.defaultDocumentText);
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });

        it('exposed-value context — state flags observable in the inspector tree', () => {
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode('components');
            openAndVerifyNode(W, [
                { key: 'isValid', type: 'Boolean', value: 'true' }, // jsonEditor.js:152, JSONEditor.jsx:267
                { key: 'isVisible', type: 'Boolean', value: 'true' }, // jsonEditor.js:153
                { key: 'isLoading', type: 'Boolean', value: 'false' }, // jsonEditor.js:154
                { key: 'isDisabled', type: 'Boolean', value: 'false' }, // jsonEditor.js:155
            ], verifyNodeData);
        });
    });

    // ── JSONEditor-BRW-003 ───────────────────────────────────────────────────
    describe('themes in light and dark app mode (viewer)', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-JSONEditor-contexts-${Cypress._.uniqueId()}`);
            addJsonWidgetsViaApi(
                THEMES.map((theme, i) => ({
                    name: editorName(theme),
                    layout: { top: 40 + Math.floor(i / 2) * 290, left: 2 + (i % 2) * 20, width: 18, height: 260 },
                    properties: { theme: { value: theme }, value: { value: TOKEN_DOC } },
                }))
            );
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        const openViewer = (mode) => {
            if (mode === 'dark') cy.apiUpdateGlobalSettings({ appMode: 'dark' });
            openLinkAppInViewer(SEL.content(editorName(THEMES[THEMES.length - 1])));
            cy.get('.dark-theme').should(mode === 'dark' ? 'exist' : 'not.exist');
        };

        // the theme import resolved and was applied: each editor carries its own theme background, and the four
        // themes paint the document with four different palettes
        const expectThemesSettled = () => {
            THEMES.forEach((theme) =>
                jsonEditorMetrics(editorName(theme), (m) =>
                    expect(m.editorBackground, `${theme}: theme applied`).to.eq(T.themes[theme].background)));
            const palettes = {};
            THEMES.forEach((theme) =>
                tokenContrast(SEL.content(editorName(theme))).then((rows) => {
                    palettes[theme] = [...new Set(rows.map((r) => r.color))].sort().join(' ');
                }));
            cy.then(() => expect(new Set(Object.values(palettes)).size, 'four distinct palettes').to.eq(THEMES.length));
        };

        // every painted run of the document against the background it actually sits on
        const expectLegible = (mode) => {
            const failures = [];
            THEMES.forEach((theme) =>
                tokenContrast(SEL.content(editorName(theme))).then((rows) =>
                    rows
                        .filter((r) => r.ratio < T.contrast.token)
                        .forEach((r) => failures.push(`${theme}: ${r.color} on ${r.background} = ${r.ratio}:1 (e.g. "${r.text}")`))));
            // one row per theme + paint (the same token class repeats across the document)
            cy.then(() => {
                const unique = Cypress._.uniqBy(failures, (f) => f.replace(/ \(e\.g\..*$/, ''));
                expect(unique, `${mode} mode: painted runs below ${T.contrast.token}:1`).to.deep.eq([]);
            });
        };

        // PRODUCT BUG (kept red): in light mode the ThemeOverride paints `.cm-scroller` with the light
        // --cc-surface1-surface (JSONEditor.jsx:133-141) while all four themes are dark themes with light text, so
        // monokai/tomorrow brackets and bespin strings render near-white on white (≈1.0–1.2:1).
        it('[JSONEditor-BRW-003] Each theme settles and renders legibly in light mode', () => {
            openViewer('light');
            expectThemesSettled();
            expectLegible('light');
        });

        it('[JSONEditor-BRW-003] Each theme settles and renders legibly in dark mode', () => {
            openViewer('dark');
            expectThemesSettled();
            expectLegible('dark');
        });

        // D-07: the `.cm-diagnostic-error` background override was removed, so the lint tooltip keeps CodeMirror's
        // own dark tooltip (#333338, white text) in both app modes instead of white-on-white in light mode.
        it('[JSONEditor-BRW-003] The lint error tooltip is readable in light and dark mode', () => {
            const name = editorName('solarized');
            const expectReadableTooltip = (mode) => {
                typeIntoJsonEditor(name, 0, fake.firstName.toLowerCase().replace(/\W/g, '') || 'garbage'); // invalid JSON
                cy.get(SEL.lintMarker(name), { timeout: T.lintSettleMs * 4 }).should('be.visible');
                hoverTwice(SEL.lintMarker(name));
                cy.get(SEL.diagnostic(name)).should('be.visible').and(($d) => {
                    const d = $d[0];
                    const win = d.ownerDocument.defaultView;
                    const tooltip = d.closest('.cm-tooltip');
                    const color = win.getComputedStyle(d).color;
                    const background = win.getComputedStyle(tooltip).backgroundColor;
                    expect(d.textContent.trim(), `${mode}: tooltip explains the error`).to.not.eq('');
                    expect(contrastRatio(color, background), `${mode}: ${color} on ${background}`).to.be.gte(T.contrast.tooltip);
                });
            };
            openViewer('light');
            expectReadableTooltip('light');
            openViewer('dark');
            expectReadableTooltip('dark');
        });
    });
});
