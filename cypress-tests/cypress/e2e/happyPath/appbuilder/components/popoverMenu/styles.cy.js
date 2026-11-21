/**
 * SPEC — Popover Menu — styles facet.
 * FOR AI: TESTING.md browser scenario:
 *   PopoverMenu-BRW-001 — builder-configured colours (background / text / border / loader / box-shadow) resolve to the
 *                         correct computed CSS in the light and the dark theme, and against custom-CSS overrides.
 * Paint (CustomButton.jsx:44-120): primary → background backgroundColor, text '#FFFFFF' sentinel → --text-on-solid,
 * border, box-shadow; outline → transparent background, no box-shadow, and the brand / '#FFFFFF' / surface sentinels
 * swap to --cc-default-border / --cc-primary-text / --cc-primary-brand. Authored (non-sentinel) colours are never
 * swapped. The loader is ToolJetUI/Loader: an <svg color=…> whose two arcs stroke url(#spinner-firstHalf) /
 * url(#spinner-secondHalf) gradients (stop-color currentColor). The menu surface is popoverMenu.scss:3 and carries
 * `dark-theme` itself (PopoverMenu.jsx:210) because it is portalled out of the canvas.
 * Custom CSS = Workspace settings → Custom styles, scoped by the `_tooljet-<name>` class RenderWidget puts on the box.
 * KNOWN PRODUCT BUG (kept red): with two loading widgets on a page every Loader paints with the FIRST loader's colour —
 * the gradient ids are fixed, so url(#spinner-firstHalf) resolves to the first <linearGradient> in the document.
 * Helpers: addPopoverMenusViaApi, openPopoverMenuInViewer, openPopoverMenu, closePopoverMenu, popoverMenuState,
 * readPopoverMenuState, getWorkspaceCss, setWorkspaceCss, resolveCssVarColor.
 */
import { fake } from "Fixtures/fake";
import { popoverMenuSelector as S } from "Selectors/appBuilder/components/popoverMenu";
import { popoverMenuText as T } from "Texts/appBuilder/components/popoverMenu";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import {
    addPopoverMenusViaApi,
    openPopoverMenuInViewer,
    openPopoverMenu,
    closePopoverMenu,
    popoverMenuState,
    readPopoverMenuState,
    getWorkspaceCss,
    setWorkspaceCss,
} from "Support/utils/appBuilder/components/popoverMenu";

// dynamic: authored colours (popoverMenu.js:113-250 colorSwatches / boxShadow)
const AUTHORED = {
    backgroundColor: { hex: '#7b2cbf', rgb: 'rgb(123, 44, 191)' },
    textColor: { hex: '#ffd60a', rgb: 'rgb(255, 214, 10)' },
    borderColor: { hex: '#2a9d8f', rgb: 'rgb(42, 157, 143)' },
    loaderColor: { hex: '#e63946', rgb: 'rgb(230, 57, 70)' },
    boxShadow: { value: '2px 3px 4px 1px #ff000080', css: 'rgba(255, 0, 0, 0.5) 2px 3px 4px 1px' },
};
const authoredStyles = {
    backgroundColor: { value: AUTHORED.backgroundColor.hex },
    textColor: { value: AUTHORED.textColor.hex },
    borderColor: { value: AUTHORED.borderColor.hex },
    loaderColor: { value: AUTHORED.loaderColor.hex },
    boxShadow: { value: AUTHORED.boxShadow.value },
};
const outline = { buttonType: { value: T.buttonTypeOutline } }; // source: popoverMenu.js:27
const loading = { loadingState: { value: '{{true}}' } }; // source: popoverMenu.js:68-72

// resolves the theme tokens the trigger paints with, inside one widget box (the theme scope of the canvas)
const resolveTokens = (name) => {
    const P = {};
    Object.entries(T.tokens).forEach(([k, token]) => resolveCssVarColor(token, S.draggableWidget(name)).then((c) => (P[k] = c)));
    return cy.wrap(P);
};

const expectTrigger = (name, at, expected) =>
    popoverMenuState(name, (s) => {
        const t = s.trigger;
        expect(t, `${at} ${name}: trigger`).to.not.eq(null);
        Object.entries(expected).forEach(([k, v]) => expect(t[k], `${at} ${name}: ${k}`).to.eq(v));
    });

// the loader shows, carries the expected colour, and every arc paints with it
const expectLoader = (name, at, rgb) =>
    popoverMenuState(name, (s) => {
        expect(s.loader, `${at} ${name}: loader rendered`).to.not.eq(null);
        expect(s.loader.color, `${at} ${name}: loader colour`).to.eq(rgb);
        s.loader.paints.forEach((p, i) => {
            expect(p.colors.length, `${at} ${name}: arc ${i} paint resolved`).to.be.gt(0);
            p.colors.forEach((c) => expect(c, `${at} ${name}: arc ${i} paints (${p.ref || 'stroke'} from ${p.owner})`).to.eq(rgb));
        });
    });

const expectDefaultPalette = (P, at) => {
    // primary: brand fill + border, --text-on-solid text (the '#FFFFFF' sentinel), the default zero box-shadow
    expectTrigger('pmprimary', at, {
        backgroundColor: P.brand, // source: popoverMenu.js:371
        color: P.textOnSolid, // source: CustomButton.jsx:57
        labelColor: P.textOnSolid,
        borderColor: P.brand, // source: popoverMenu.js:377
        borderStyle: 'solid',
        boxShadow: T.defaultBoxShadowCss, // source: popoverMenu.js:385
    });
    // outline: transparent fill, swapped text + border, no box-shadow
    expectTrigger('pmoutline', at, {
        backgroundColor: T.transparent, // source: CustomButton.jsx:72
        color: P.primaryText, // source: CustomButton.jsx:58
        labelColor: P.primaryText,
        borderColor: P.defaultBorder, // source: CustomButton.jsx:51
        boxShadow: 'none', // source: CustomButton.jsx:110
    });
    // outline loader: the surface sentinel swaps to the brand colour (CustomButton.jsx:61-66)
    expectLoader('pmoutlineload', at, P.brand);
};

describe('Popover Menu — styles facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-PopoverMenu-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiLogin();
        cy.apiDeleteApp();
    });

    // ── PopoverMenu-BRW-001 — default palette, light theme ─────────────────
    it('[PopoverMenu-BRW-001] Default primary and outline triggers and the outline loader paint the light theme tokens in the editor and the viewer', () => {
        addPopoverMenusViaApi([
            { name: 'pmprimary', layout: { top: 40, left: 2 } },
            { name: 'pmoutline', layout: { top: 40, left: 12 }, properties: outline },
            { name: 'pmoutlineload', layout: { top: 40, left: 22 }, properties: { ...outline, ...loading } },
        ]);
        cy.openApp('', undefined, undefined, S.trigger('pmprimary'));
        cy.get('.dark-theme').should('not.exist');
        resolveTokens('pmprimary').then((P) => {
            expect(P.brand, 'brand token resolves').to.match(/^rgb/);
            expectDefaultPalette(P, 'editor');
        });

        openPopoverMenuInViewer(S.trigger('pmprimary'));
        resolveTokens('pmprimary').then((P) => expectDefaultPalette(P, 'viewer'));
    });

    // ── PopoverMenu-BRW-001 — authored colours ───────────────────────────────
    it('[PopoverMenu-BRW-001] Authored background, text, border, loader and box-shadow paint verbatim; outline keeps the authored text and border but drops fill and shadow', () => {
        addPopoverMenusViaApi([
            { name: 'pmcustom', layout: { top: 40, left: 2 }, styles: authoredStyles },
            { name: 'pmcustomout', layout: { top: 40, left: 12 }, properties: outline, styles: authoredStyles },
            { name: 'pmcustomload', layout: { top: 40, left: 22 }, properties: loading, styles: authoredStyles },
        ]);
        const expectAuthored = (at) => {
            expectTrigger('pmcustom', at, {
                backgroundColor: AUTHORED.backgroundColor.rgb,
                color: AUTHORED.textColor.rgb,
                labelColor: AUTHORED.textColor.rgb,
                borderColor: AUTHORED.borderColor.rgb,
                boxShadow: AUTHORED.boxShadow.css,
            });
            // a non-sentinel colour is never swapped by buttonType (CustomButton.jsx:47-75)
            expectTrigger('pmcustomout', at, {
                backgroundColor: T.transparent, // source: CustomButton.jsx:72-75
                color: AUTHORED.textColor.rgb,
                labelColor: AUTHORED.textColor.rgb,
                borderColor: AUTHORED.borderColor.rgb,
                boxShadow: 'none', // source: CustomButton.jsx:110
            });
            expectTrigger('pmcustomload', at, { backgroundColor: AUTHORED.backgroundColor.rgb, disabled: true });
            expectLoader('pmcustomload', at, AUTHORED.loaderColor.rgb);
        };
        cy.openApp('', undefined, undefined, S.trigger('pmcustom'));
        expectAuthored('editor');
        openPopoverMenuInViewer(S.trigger('pmcustom'));
        expectAuthored('viewer');
    });

    // ── PopoverMenu-BRW-001 — dark theme ─────────────────────────────────────
    it('[PopoverMenu-BRW-001] In the dark theme the default colours repaint from the dark tokens (trigger and menu), authored colours stay put', () => {
        addPopoverMenusViaApi([
            { name: 'pmprimary', layout: { top: 40, left: 2 } },
            { name: 'pmoutline', layout: { top: 40, left: 12 }, properties: outline },
            { name: 'pmoutlineload', layout: { top: 40, left: 22 }, properties: { ...outline, ...loading } },
            { name: 'pmcustom', layout: { top: 40, left: 32 }, styles: authoredStyles },
        ]);
        cy.openApp('', undefined, undefined, S.trigger('pmprimary'));
        resolveTokens('pmprimary').as('light');

        // globalSettings.appMode drives the app's dark theme (AppCanvas `dark-theme`)
        cy.apiUpdateGlobalSettings({ appMode: 'dark' });

        const expectDark = (at) => {
            cy.get('.dark-theme').should('exist');
            resolveTokens('pmprimary').then((P) => {
                cy.get('@light').then((L) => {
                    // the theme really changed the tokens the defaults point at
                    ['brand', 'primaryText', 'defaultBorder', 'surface'].forEach((k) =>
                        expect(P[k], `${at}: dark ${k} differs from light`).to.not.eq(L[k]));
                });
                expectDefaultPalette(P, at);
            });
            expectTrigger('pmcustom', at, {
                backgroundColor: AUTHORED.backgroundColor.rgb,
                color: AUTHORED.textColor.rgb,
                borderColor: AUTHORED.borderColor.rgb,
                boxShadow: AUTHORED.boxShadow.css,
            });
            // the portalled menu carries the theme class itself and paints the dark surface + option label tokens
            openPopoverMenu('pmprimary');
            cy.get(S.content).should('have.class', 'dark-theme'); // source: PopoverMenu.jsx:210
            resolveCssVarColor(T.tokens.surface, S.content).then((surface) =>
                resolveCssVarColor(T.tokens.primaryText, S.content).then((text) =>
                    popoverMenuState('pmprimary', (s) => {
                        expect(s.menu.backgroundColor, `${at}: menu surface`).to.eq(surface); // source: popoverMenu.scss:3
                        expect(s.menu.options.map((o) => o.labelColor), `${at}: option labels`).to.deep.eq([text, text, text]); // source: popoverMenu.js:388
                    })));
            cy.get('@light').then((L) =>
                popoverMenuState('pmprimary', (s) => expect(s.menu.backgroundColor, `${at}: menu surface is not the light one`).to.not.eq(L.surface)));
            closePopoverMenu('pmprimary');
        };

        cy.reload();
        cy.get(S.trigger('pmprimary'), { timeout: 30000 }).should('be.visible');
        expectDark('editor');
        openPopoverMenuInViewer(S.trigger('pmprimary'));
        expectDark('viewer');
    });

    // ── PopoverMenu-BRW-001 — workspace custom CSS ───────────────────────────
    describe('workspace custom CSS', () => {
        let previousCss = '';
        const uid = Cypress._.random(1e5, 1e6); // dynamic: workspace-wide CSS → unique widget class
        const target = `pmcss${uid}`;
        const OVERRIDE = {
            backgroundColor: 'rgb(11, 22, 33)',
            color: 'rgb(200, 210, 220)',
            borderColor: 'rgb(250, 128, 114)',
            boxShadow: 'rgb(0, 128, 0) 4px 4px 0px 0px',
        };
        const rule = `._tooljet-${target} .jet-btn { background-color: ${OVERRIDE.backgroundColor} !important; color: ${OVERRIDE.color} !important; border-color: ${OVERRIDE.borderColor} !important; box-shadow: 4px 4px 0px 0px rgb(0, 128, 0) !important; }`;

        before(() => {
            cy.apiLogin();
            getWorkspaceCss().then((css) => (previousCss = css));
        });

        after(() => {
            cy.apiLogin();
            setWorkspaceCss(previousCss);
        });

        it('[PopoverMenu-BRW-001] A Custom styles rule on the widget class overrides the builder colours of that trigger only', () => {
            addPopoverMenusViaApi([
                { name: target, layout: { top: 40, left: 2 }, styles: authoredStyles },
                { name: 'pmplain', layout: { top: 40, left: 12 }, styles: authoredStyles },
            ]);
            cy.then(() => setWorkspaceCss(`${previousCss}\n${rule}`));

            const expectOverride = (at) => {
                cy.get('#workspace-custom-css').should(($s) => expect($s.text(), `${at}: custom CSS injected`).to.contain(`_tooljet-${target}`));
                expectTrigger(target, at, OVERRIDE);
                // the label keeps its own inline colour (the rule targets the button only)
                expectTrigger(target, at, { labelColor: AUTHORED.textColor.rgb });
                // a sibling without the class keeps every builder colour
                expectTrigger('pmplain', at, {
                    backgroundColor: AUTHORED.backgroundColor.rgb,
                    color: AUTHORED.textColor.rgb,
                    borderColor: AUTHORED.borderColor.rgb,
                    boxShadow: AUTHORED.boxShadow.css,
                });
            };
            cy.openApp('', undefined, undefined, S.trigger(target));
            expectOverride('editor');
            openPopoverMenuInViewer(S.trigger(target));
            expectOverride('viewer');

            // control: without the rule the same trigger paints the builder colours again
            cy.then(() => setWorkspaceCss(previousCss));
            cy.reload();
            cy.get(S.trigger(target), { timeout: 30000 }).should('be.visible');
            expectTrigger(target, 'viewer, rule removed', {
                backgroundColor: AUTHORED.backgroundColor.rgb,
                color: AUTHORED.textColor.rgb,
                borderColor: AUTHORED.borderColor.rgb,
                boxShadow: AUTHORED.boxShadow.css,
            });
        });
    });

    // ── PopoverMenu-BRW-001 — several loaders on one page ────────────────────
    // KNOWN PRODUCT BUG: ToolJetUI/Loader uses fixed gradient ids, so the 2nd+ loader on a page paints with the 1st.
    it('[PopoverMenu-BRW-001] Each loading trigger paints its own loader colour when several are loading on one page', () => {
        addPopoverMenusViaApi([
            { name: 'pmloadprimary', layout: { top: 40, left: 2 }, properties: loading },
            { name: 'pmloadoutline', layout: { top: 40, left: 12 }, properties: { ...outline, ...loading } },
            { name: 'pmloadcustom', layout: { top: 40, left: 22 }, properties: loading, styles: { loaderColor: { value: AUTHORED.loaderColor.hex } } },
        ]);
        openPopoverMenuInViewer(S.loader('pmloadcustom'));
        resolveTokens('pmloadprimary').then((P) => {
            // each <svg> carries the right colour …
            popoverMenuState('pmloadprimary', (s) => expect(s.loader.color, 'primary loader colour').to.eq(P.surface)); // source: popoverMenu.js:378
            popoverMenuState('pmloadoutline', (s) => expect(s.loader.color, 'outline loader colour').to.eq(P.brand)); // source: CustomButton.jsx:65
            popoverMenuState('pmloadcustom', (s) => expect(s.loader.color, 'authored loader colour').to.eq(AUTHORED.loaderColor.rgb));
            // … and each must also PAINT it (fails: arcs resolve to the first loader's gradients)
            const paint = (s) => s.loader.paints.map((p) => `${p.colors.join('→')} (via ${p.owner})`);
            const own = (rgb, name) => [`${rgb}→${rgb} (via ${name})`, `${rgb}→${rgb} (via ${name})`, `${rgb} (via null)`];
            readPopoverMenuState('pmloadprimary').then((a) =>
                readPopoverMenuState('pmloadoutline').then((b) =>
                    readPopoverMenuState('pmloadcustom').then((c) =>
                        expect({ pmloadprimary: paint(a), pmloadoutline: paint(b), pmloadcustom: paint(c) }, 'what each loader paints').to.deep.eq({
                            pmloadprimary: own(P.surface, 'pmloadprimary'),
                            pmloadoutline: own(P.brand, 'pmloadoutline'),
                            pmloadcustom: own(AUTHORED.loaderColor.rgb, 'pmloadcustom'),
                        }))));
        });
    });
});
