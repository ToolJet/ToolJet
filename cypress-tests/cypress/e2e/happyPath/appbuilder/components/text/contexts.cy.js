/**
 * SPEC — Text — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   Text-BRW-004 — hostile markup authored in either rich format (Markdown, HTML) is inert for a real viewer of a
 *                  released, public app
 * Text.jsx:223-240: the HTML arm runs DOMPurify. The Markdown-format half of BRW-004 is not automated here yet.
 * Execution is detected without any external payload: every hostile snippet only pushes onto
 * `window.__textExec` (or calls a stubbed dialog), installed by execProbe before the app loads.
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openAndVerifyNode,
 * verifyNodeData, releaseAndMakePublic, addTextsViaApi, execProbe, execRecord, guardNavigation, navigationAttempts.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { textSelector } from "Selectors/appBuilder/components/text";
import { textText } from "Texts/appBuilder/components/text";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { releaseAndMakePublic } from "Support/utils/appBuilder/components/baseInput";
import {
    addTextsViaApi,
    execProbe,
    execRecord,
    guardNavigation,
    navigationAttempts,
} from "Support/utils/appBuilder/components/text";

const W = textText.defaultWidgetName;
const T = textText;

// Hostile snippets. Each one, if it ever ran, records its key: code in the page itself pushes onto
// window.__textExec; code in a nested document reaches the page through `parent`. No network is involved.
const RUN = (key) => `(window.__textExec||parent.__textExec).push('${key}')`;
const HOSTILE = {
    imgonerror: `<img src="data:," onerror="${RUN('imgonerror')}">`,
    svgonload: `<svg width="10" height="10" onload="${RUN('svgonload')}"></svg>`,
    script: `<script>${RUN('script')}</script>`,
    iframesrcdoc: `<iframe width="40" height="20" srcdoc="<script>${RUN('iframesrcdoc')}</script>"></iframe>`,
    iframejs: `<iframe width="40" height="20" src="javascript:${RUN('iframejs')}"></iframe>`,
    detailsontoggle: `<details open ontoggle="${RUN('detailsontoggle')}"><summary>more</summary>x</details>`,
    alert: `<img src="data:," onerror="alert('alert')">`,
    // need a click from the viewer
    rawlink: `<a href="javascript:${RUN('rawlink')}">open</a>`,
    mdlink: `[open](javascript:${RUN('mdlink')})`,
    form: `<form action="javascript:${RUN('form')}"><button type="submit">send</button></form>`,
};
const CLICKABLE = ['rawlink', 'mdlink', 'form'];
// benign markers before and after each snippet: prove the widget rendered all of the authored markup
const SAFE = (key, side) => `<b id="safe-${key}-${side}">ok</b>`;

// Seeds one Text per snippet in the given format, releases the app publicly and opens it as an anonymous viewer.
const openHostileApp = (format) => {
    const slug = `text-${format}-${Cypress._.random(1e6, 9e6)}`; // dynamic
    const keys = Object.keys(HOSTILE);
    addTextsViaApi(
        keys.map((key, i) => ({
            name: `x${key}`,
            layout: { top: 10 + Math.floor(i / 2) * 70, left: 2 + (i % 2) * 15, width: 14, height: 60 },
            // blank lines keep each snippet its own Markdown block
            properties: { textFormat: { value: format }, text: { value: `${SAFE(key, 'before')}\n\n${HOSTILE[key]}\n\n${SAFE(key, 'after')}` } },
        }))
    );
    releaseAndMakePublic(slug);
    cy.clearCookies(); // a real public viewer: not signed in
    cy.then(() => cy.visit(`/applications/${slug}`, { onBeforeLoad: execProbe }));
    keys.forEach((key) =>
        ['before', 'after'].forEach((side) =>
            cy.get(textSelector.authored(`x${key}`, `safe-${key}-${side}`), { timeout: 30000 }).should('have.text', 'ok')));
    cy.wait(1500); // dynamic: let images fail, frames load and toggles fire (or not)

    // a viewer clicks every link / submit button the widgets rendered
    guardNavigation();
    CLICKABLE.forEach((key) =>
        cy.get(textSelector.root(`x${key}`)).then(($root) => {
            const targets = $root.find('a, form button');
            if (targets.length) cy.wrap(targets.first()).realClick({ scrollBehavior: 'center' });
        })
    );
    cy.wait(500); // dynamic: a javascript: URL runs asynchronously after the click
};

describe('Text — contexts facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Text-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('device context — Show on desktop / Show on mobile gate the Text in the matching layout', () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults (text.js:299-300): on the desktop canvas, absent from the mobile canvas
            cy.get(textSelector.scroller(W)).should('contain.text', T.greetingSuffix);
            switchLayout('mobile');
            cy.get(widget).should('not.exist');
            switchLayout('desktop');
            cy.get(widget).should('exist');

            // desktop off → gone from desktop
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should('not.exist');

            // mobile on → shown on the mobile canvas, still hidden on desktop
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout('mobile');
            cy.get(widget).should('be.visible');
            cy.get(textSelector.scroller(W)).should('contain.text', T.greetingSuffix);
            switchLayout('desktop');
            cy.get(widget).should('not.exist');
        });

        it('exposed-value context — text and state flags observable in the inspector tree', () => {
            cy.get(textSelector.scroller(W)).invoke('text').then((shown) => {
                cy.get(commonWidgetSelector.sidebarinspector).click();
                cy.hideTooltip();
                openNode('components');
                openAndVerifyNode(W, [
                    { key: 'text', type: 'String', value: `"${shown.trim()}"` }, // text.js:305, Text.jsx:118
                    { key: 'isVisible', type: 'Boolean', value: 'true' }, // text.js:308, Text.jsx:127
                    { key: 'isLoading', type: 'Boolean', value: 'false' }, // text.js:306, Text.jsx:128
                    { key: 'isDisabled', type: 'Boolean', value: 'false' }, // text.js:307, Text.jsx:129
                ], verifyNodeData);
            });
        });
    });

    // ── Text-BRW-004 ─────────────────────────────────────────────────────────
    describe('released public app', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-Text-contexts-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiLogin(); // the test signed out to view the public app
            cy.apiDeleteApp();
        });

        it('[Text-BRW-004] HTML format: hostile markup is inert for a real viewer of the released app', () => {
            openHostileApp(T.formats.html); // source: text.js:17
            execRecord().should('deep.equal', []);
            // no clicked link or form carried an executable URL
            navigationAttempts().then((nav) =>
                nav.forEach((n) => expect(n.url || '', `${n.kind} URL`).not.to.match(/^\s*javascript:/i)));
        });
    });
});
