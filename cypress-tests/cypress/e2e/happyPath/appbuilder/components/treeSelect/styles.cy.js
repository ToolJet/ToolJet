/**
 * SPEC — Tree Select — styles facet (computed padding).
 * FOR AI: the computed-style half of TESTING.md browser scenario:
 *   TreeSelect-QA-001 — computed padding stays correct with real geometry: padding 'default' insets the tree root by
 *                       BOX_PADDING on all four sides, 'none' makes it flush with the widget box, the root keeps its own
 *                       2px vertical padding (`tw-py-0.5`) so the first row is not cut, and with dynamic height the
 *                       measured widget is exactly the tree plus that padding — in the editor and the running app,
 *                       and live from the Styles panel.
 * Padding → RenderWidget box padding BOX_PADDING / 0 (RenderWidget.jsx:343, treeSelect.js:266-279); root →
 * TreeSelect.jsx:437 `custom-checkbox-tree tw-py-0.5`. (Geometry / reflow in canvas.cy.js.)
 * Helpers: addTreeSelectsViaApi, openTreeAppInViewer, treeBoxes, readTreeBoxes, expectHugsTree, selectStyleSwitch,
 * openEditorSidebar.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { treeSelectSelector } from "Selectors/appBuilder/components/treeSelect";
import { treeSelectText } from "Texts/appBuilder/components/treeSelect";
import { openEditorSidebar } from "Support/utils/commonWidget";
import { selectStyleSwitch } from "Support/utils/appBuilder/components/baseInput";
import {
    addTreeSelectsViaApi,
    openTreeAppInViewer,
    treeBoxes,
    readTreeBoxes,
    expectHugsTree,
} from "Support/utils/appBuilder/components/treeSelect";

const T = treeSelectText;
const PX = 0.75; // sub-pixel layout tolerance
const ON = { value: '{{true}}' }; // treeSelect.js:340 toggle value
const AUTHORED = 200; // source: treeSelect.js:7 default height — the six default rows fit, nothing scrolls

// the root sits `pad` px inside the RenderWidget box on all four sides; the root's own vertical padding keeps the first
// row clear of its top edge
const expectInset = (b, pad, label, { dynamic = false } = {}) => {
    const px = `${pad}px`;
    expect(b.boxPadding, `${label}: box padding on all sides`).to.deep.eq({ top: px, right: px, bottom: px, left: px });
    expect(b.root.left - b.box.left, `${label}: left inset`).to.be.closeTo(pad, PX);
    expect(b.box.right - b.root.right, `${label}: right inset`).to.be.closeTo(pad, PX);
    expect(b.root.top - b.box.top, `${label}: top inset`).to.be.closeTo(pad, PX);
    expect(b.box.bottom - b.root.bottom, `${label}: bottom inset`).to.be.closeTo(pad, PX);
    expect(b.rootPaddingTop, `${label}: root padding-top`).to.eq(`${T.rootPaddingY}px`);
    expect(b.rootPaddingBottom, `${label}: root padding-bottom`).to.eq(`${T.rootPaddingY}px`);
    expect(b.nodes[0].rect.top, `${label}: first row below the root padding`).to.be.gte(b.root.top + T.rootPaddingY - PX);
    if (!dynamic) expect(b.root.height, `${label}: root = box - padding`).to.be.closeTo(b.box.height - 2 * pad, PX);
};

describe('Tree Select — styles facet', () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-TreeSelect-styles-${Cypress._.uniqueId()}`);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── TreeSelect-QA-001: computed padding ──────────────────────────────────
    it('[TreeSelect-QA-001] Padding default insets the tree by the box padding and none makes it flush, in the editor and the running app, and a dynamic-height tree measures exactly its rows plus that padding', () => {
        addTreeSelectsViaApi([
            { name: 'tspad', layout: { top: 40, left: 2, width: 12, height: AUTHORED } },
            { name: 'tsnone', layout: { top: 40, left: 15, width: 12, height: AUTHORED }, styles: { padding: { value: T.paddingNone } } },
            { name: 'tspaddyn', layout: { top: 300, left: 2, width: 12, height: 100 }, properties: { dynamicHeight: ON } },
            {
                name: 'tsnonedyn',
                layout: { top: 300, left: 15, width: 12, height: 100 },
                properties: { dynamicHeight: ON },
                styles: { padding: { value: T.paddingNone } },
            },
        ]);

        const run = (where, dynamic) => {
            treeBoxes('tspad', (b) => expectInset(b, T.boxPadding, `${where}: default`));
            treeBoxes('tsnone', (b) => expectInset(b, 0, `${where}: none`));
            treeBoxes('tspaddyn', (b) => expectInset(b, T.boxPadding, `${where}: default + dynamic`, { dynamic }));
            treeBoxes('tsnonedyn', (b) => expectInset(b, 0, `${where}: none + dynamic`, { dynamic }));
        };

        // editor canvas: dynamic height is off in the editor, so all four keep their authored box
        cy.openApp('', undefined, undefined, treeSelectSelector.root('tsnonedyn'));
        run('editor', false);

        // running app: the dynamic pair hugs the same six rows; only the padding differs (2·BOX_PADDING)
        openTreeAppInViewer(treeSelectSelector.root('tsnonedyn'));
        run('viewer', true);
        treeBoxes('tspaddyn', (b) => expectHugsTree(b, 'viewer default + dynamic', T.boxPadding));
        treeBoxes('tsnonedyn', (b) => expectHugsTree(b, 'viewer none + dynamic', 0));
        readTreeBoxes('tspaddyn').then((withPad) =>
            readTreeBoxes('tsnonedyn').then((noPad) => {
                expect(noPad.root.height, 'same rows, same root height').to.be.closeTo(withPad.root.height, PX);
                expect(withPad.wrapper.height - noPad.wrapper.height, 'padding adds 2·BOX_PADDING').to.be.closeTo(
                    2 * T.boxPadding,
                    PX
                );
            })
        );
    });

    // ── TreeSelect-QA-001: Styles panel drives the live editor canvas ────────
    it('[TreeSelect-QA-001] Switching Padding in the Styles panel moves the tree flush with the widget box and back, live on the editor canvas', () => {
        const W = T.defaultWidgetName;
        cy.openApp();
        cy.dragAndDropWidget(T.displayName, 400, 200);
        cy.get('[data-cy="query-manager-toggle-button"]').click();
        treeBoxes(W, (b) => expectInset(b, T.boxPadding, 'dropped'));

        openEditorSidebar(W);
        cy.get(commonWidgetSelector.buttonStylesEditorSideBar).click();
        selectStyleSwitch(T.paddingNone);
        treeBoxes(W, (b) => expectInset(b, 0, 'none'));
        selectStyleSwitch(T.paddingDefault);
        treeBoxes(W, (b) => expectInset(b, T.boxPadding, 'default again'));
    });
});
