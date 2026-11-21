/**
 * SPEC — Custom Component — properties facet (scenario-scoped: the Code property's runtime).
 * FOR AI: TESTING.md browser scenario on how the frame runs the Code property:
 *   CustomComponent-BRW-003 — the frame loads its pinned Babel and React bundles (iframe.html:3-5) and transpiles
 *                             author JSX; author code that imports a further module from a CDN renders once that
 *                             import resolves; the default code's own CDN imports (commit d059a99f80) resolve too.
 * Decision: the scenario is about real third-party loading, so the bundles and the imported module come from the real
 * CDNs (unpkg / jsDelivr, pinned versions). The import is held back with cy.intercept + setDelay so "not rendered while
 * pending → rendered once resolved" is observed deterministically; a unique query string keeps the browser cache out.
 * Helpers: addCustomComponentsViaApi, inFrame, frameRuntime, openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { customComponentSelector } from "Selectors/appBuilder/components/customComponent";
import { customComponentText } from "Texts/appBuilder/components/customComponent";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { addCustomComponentsViaApi, inFrame, frameRuntime } from "Support/utils/appBuilder/components/customComponent";

const T = customComponentText;
const S = customComponentSelector;
const RT = T.frameRuntime;
const CDN_MODULE = 'https://cdn.jsdelivr.net/npm/dayjs@1.11.10/+esm'; // dynamic: a pinned, dependency-free ES module
const HOLD_MS = 4000; // dynamic: how long the CDN response is held back

describe('Custom Component — properties facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-CustomComponent-properties-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── CustomComponent-BRW-003 ──────────────────────────────────────────────
    it('[CustomComponent-BRW-003] The frame loads its pinned Babel/React bundles, transpiles JSX, and renders a CDN-importing component once the import resolves', () => {
        const label = fake.firstName.slice(0, 12) || 'label'; // dynamic: Data value the JSX renders
        const moduleUrl = `${CDN_MODULE}?tj=${Date.now()}`; // dynamic: cache-busting query, same CDN module
        // JSX + an arrow component + a CDN import; renders only after the module script's import has resolved
        const code = [
            `import dayjs from '${moduleUrl}';`,
            'const Probe = ({ data }) => (',
            '  <div id="cc-probe">',
            '    <span id="cc-jsx">{data.label}</span>',
            "    <span id=\"cc-date\">{dayjs('2024-01-15').format('DD/MM/YYYY')}</span>",
            '  </div>',
            ');',
            'const Connected = Tooljet.connectComponent(Probe);',
            'ReactDOM.render(<Connected />, document.body);',
        ].join('\n');

        const seen = { requestedAt: null };
        cy.intercept({ method: 'GET', url: `${CDN_MODULE}*` }, (req) => {
            seen.requestedAt = Date.now();
            req.on('response', (res) => {
                res.setDelay(HOLD_MS);
            });
        }).as('cdnImport');

        addCustomComponentsViaApi([
            {
                name: 'customcomponent1',
                layout: { top: 40, left: 2, width: 15, height: 160 },
                properties: { data: { value: `{{{ label: '${label}' }}}` }, code: { value: code } },
            },
            { name: 'customcomponent2', layout: { top: 40, left: 20, width: 15, height: 220 } }, // definition default code
        ]);
        openLinkAppInViewer(S.frame('customcomponent1'));

        // pinned runtime bundles loaded and executed (an SRI or network failure would leave these globals undefined)
        frameRuntime('customcomponent1', (rt) => {
            expect(rt.scripts, 'pinned bundle URLs').to.deep.eq(RT.scripts); // source: iframe.html:3-5
            expect(rt.babel, 'Babel standalone').to.eq(RT.babel); // source: iframe.html:3
            expect(rt.react, 'React').to.eq(RT.react); // source: iframe.html:4
            expect(rt.reactDomRender, 'ReactDOM.render from the react-dom bundle').to.eq(true); // iframe.html:5
            expect(rt.bridge, 'Tooljet.connectComponent transpiled from the bundled JSX').to.eq(true); // iframe.html:112-129
        });

        // the frame requested the module; while the CDN response is held back the author component has not rendered
        cy.wrap(seen).its('requestedAt', { timeout: 40000 }).should('be.a', 'number');
        cy.get(S.frame('customcomponent1')).should(($f) =>
            expect($f[0].contentDocument.querySelector('#cc-probe'), 'nothing rendered before the import resolves').to.be.null);
        cy.wait(HOLD_MS / 2); // dynamic: still inside the hold window
        cy.get(S.frame('customcomponent1')).should(($f) =>
            expect($f[0].contentDocument.querySelector('#cc-probe'), 'still pending').to.be.null);

        // the import resolves → the transpiled JSX renders with the imported module's output and the Data value
        cy.wait('@cdnImport').then((i) => {
            expect(i.response.statusCode, 'real CDN response').to.eq(200);
        });
        inFrame('customcomponent1', '#cc-probe #cc-jsx').should('have.text', label);
        inFrame('customcomponent1', '#cc-date').should('have.text', '15/01/2024'); // dayjs('2024-01-15') DD/MM/YYYY

        // the default code's React 17 / Material-UI CDN imports resolve and render too. source: customComponent.js:61-77
        inFrame('customcomponent2', '.MuiContainer-root h1').should('have.text', T.defaultTitle); // source: customComponent.js:58
        inFrame('customcomponent2', 'button.MuiButton-root.MuiButton-outlinedPrimary').should('have.text', T.defaultButtonText);
    });
});
