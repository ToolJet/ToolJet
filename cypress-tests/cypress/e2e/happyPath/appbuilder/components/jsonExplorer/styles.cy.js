/**
 * SPEC — JSON Explorer — styles facet (browser-only scenario).
 * FOR AI: TESTING.md browser scenario (frontend/ee/test/app-builder/widgets/JSONExplorer):
 *   JSONExplorer-BRW-003 — each of the four documented themes paints the tree with readable contrast, and the
 *                          container's own Background shows through rather than being painted over.
 * Theme: getBase16Theme(theme) from react-base16-styling with base00 forced to `transparent` (JSONExplorer.jsx:65-69),
 * so the tree draws no background and every text run sits on the `.json-explorer` container, whose background is
 * the Background style (default var(--cc-surface1-surface) — jsonExplorer.js:111-118,209). D-01: no palette colour
 * is pinned (third-party output) — the oracle is the contrast actually painted, in light and dark app mode.
 * App mode: globalSettings.appMode → `.dark-theme` (the token var resolves dark).
 * Helpers: addJsonExplorersViaApi, explorerMetrics, treeTextRuns, openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { jsonExplorerSelector as SEL } from "Selectors/appBuilder/components/jsonExplorer";
import { jsonExplorerText } from "Texts/appBuilder/components/jsonExplorer";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { addJsonExplorersViaApi, explorerMetrics, treeTextRuns } from "Support/utils/appBuilder/components/jsonExplorer";

const T = jsonExplorerText;
const THEMES = T.themes; // jsonExplorer.js:26-31
const nameOf = (theme) => `jx${theme}`;
// a document exercising every value class react-json-tree colours: keys, strings, numbers, booleans, null,
// nested object/array item strings ("{} 2 keys", "[] 2 items") and an empty array
const TOKEN_DOC = `{{{ text: 'Hello', number: 64, flag: true, off: false, nothing: null, list: ['a', 'b'], obj: { k: 1.5 }, empty: [] }}}`; // dynamic
// a literal Background the tree must show through (a light warm tone none of the themes use as text)
const CUSTOM_BG = { css: '#fdf6e3', rgb: 'rgb(253, 246, 227)' }; // dynamic
const CUSTOM = 'jxcustom';

describe('JSON Explorer — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-JSONExplorer-styles-${Cypress._.uniqueId()}`);
        addJsonExplorersViaApi([
            ...THEMES.map((theme, i) => ({
                name: nameOf(theme),
                layout: { top: 40 + Math.floor(i / 2) * 330, left: 2 + (i % 2) * 20, width: 18, height: 300 },
                properties: { theme: { value: theme }, value: { value: TOKEN_DOC } },
            })),
            {
                name: CUSTOM,
                layout: { top: 700, left: 2, width: 18, height: 300 },
                properties: { theme: { value: 'monokai' }, value: { value: TOKEN_DOC } },
                styles: { backgroundColor: { value: CUSTOM_BG.css } },
            },
        ]);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    const openViewer = (mode) => {
        if (mode === 'dark') cy.apiUpdateGlobalSettings({ appMode: 'dark' });
        openLinkAppInViewer(SEL.tree(nameOf(THEMES[THEMES.length - 1])));
        cy.get('.dark-theme').should(mode === 'dark' ? 'exist' : 'not.exist');
        // every tree fully rendered (expanded by default — jsonExplorer.js:194): root + 8 keys + 2 list items + 1 obj key
        [...THEMES.map(nameOf), CUSTOM].forEach((name) => explorerMetrics(name, (m) => expect(m.nodes, `${name} rendered`).to.eq(12)));
    };

    // every painted run sits on the container itself, and the container paints the Background style
    const showsThrough = (name, expectedBackground) =>
        treeTextRuns(name).then((runs) => {
            expect(runs.length, `${name}: text runs found`).to.be.gte(20);
            const notOnContainer = runs.filter((r) => !r.paintedByContainer).map((r) => `${r.text} on ${r.background}`);
            expect(notOnContainer, `${name}: tree paints no background of its own`).to.deep.eq([]);
            const backgrounds = Cypress._.uniq(runs.map((r) => r.background));
            if (expectedBackground) expect(backgrounds, `${name}: Background shows through`).to.deep.eq([expectedBackground]);
            return backgrounds[0];
        });

    // every painted run against the background it actually sits on; one failure row per theme + colour
    const expectLegible = (mode) => {
        const failures = [];
        const palettes = {};
        THEMES.forEach((theme) =>
            treeTextRuns(nameOf(theme)).then((runs) => {
                palettes[theme] = Cypress._.uniq(runs.map((r) => r.color)).sort().join(' ');
                runs.filter((r) => r.ratio < T.contrast.token).forEach((r) => failures.push(`${theme}: ${r.color} on ${r.background} = ${r.ratio}:1 (e.g. "${r.text}")`));
            }));
        cy.then(() => {
            expect(new Set(Object.values(palettes)).size, 'the four themes paint four distinct palettes').to.eq(THEMES.length);
            const unique = Cypress._.uniqBy(failures, (f) => f.replace(/ \(e\.g\..*$/, ''));
            expect(unique, `${mode} mode: painted runs below ${T.contrast.token}:1`).to.deep.eq([]);
        });
    };

    // ── JSONExplorer-BRW-003 ─────────────────────────────────────────────────
    it('[JSONExplorer-BRW-003] The container Background shows through the tree for every theme (default and custom Background)', () => {
        openViewer('light');
        // default Background: all four themes sit on the same container colour — the resolved token, not a theme base00
        const seen = [];
        THEMES.forEach((theme) =>
            cy.get(SEL.box(nameOf(theme))).then(($b) => {
                expect($b[0].style.backgroundColor, `${theme}: container carries the Background style`).to.eq(T.definition.styles.backgroundColor.value); // source: jsonExplorer.js:209
                const painted = $b.css('background-color');
                expect(painted, `${theme}: Background resolves to an opaque colour`).to.not.match(/rgba\(.*, 0\)$/);
                showsThrough(nameOf(theme), painted).then((bg) => seen.push(bg));
            }));
        cy.then(() => expect(Cypress._.uniq(seen), 'one Background behind all four themes').to.have.length(1));

        // a literal Background is what the reader sees behind a (dark) theme's text
        explorerMetrics(CUSTOM, (m) => expect(m.box.background).to.eq(CUSTOM_BG.rgb));
        showsThrough(CUSTOM, CUSTOM_BG.rgb);

        // control: a tree that paints its own background (what base00 would do without the transparent override)
        // must fail the same check — proves the oracle can see an over-painted Background
        const paintedOver = 'rgb(39, 40, 34)'; // dynamic: any opaque colour
        cy.get(SEL.tree(CUSTOM)).then(($ul) => $ul[0].style.setProperty('background-color', paintedOver, 'important'));
        treeTextRuns(CUSTOM).then((runs) => {
            expect(runs.every((r) => !r.paintedByContainer), 'control: over-painted tree detected').to.eq(true);
            expect(Cypress._.uniq(runs.map((r) => r.background))).to.deep.eq([paintedOver]);
        });
        cy.get(SEL.tree(CUSTOM)).then(($ul) => $ul[0].style.setProperty('background-color', 'transparent'));
        showsThrough(CUSTOM, CUSTOM_BG.rgb);
    });

    // PRODUCT BUG (kept red): all four base16 palettes are dark-theme palettes (light text), but base00 is forced
    // transparent so they are painted over the light default Background (--cc-surface1-surface = white in light mode).
    // Measured: monokai keys 1.65:1 / strings 1.55:1, tomorrow strings 2.01:1, bespin strings 2.40:1 on white.
    it('[JSONExplorer-BRW-003] Each theme renders the tree legibly over the default Background in light mode', () => {
        openViewer('light');
        expectLegible('light');
    });

    // PRODUCT BUG (kept red): in dark mode bespin's item strings ("{} 2 keys", "[] 2 items") are rgb(102, 102, 102)
    // on rgb(30, 34, 38) = 2.79:1; the other three themes clear 3:1.
    it('[JSONExplorer-BRW-003] Each theme renders the tree legibly over the default Background in dark mode', () => {
        openViewer('dark');
        expectLegible('dark');
    });
});
