/**
 * SPEC — JSON Explorer — canvas facet.
 * FOR AI: always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo)
 * + the browser-only geometry scenario from TESTING.md (frontend/ee/test/app-builder/widgets/JSONExplorer):
 *   JSONExplorer-BRW-002 — Dynamic height follows the tree as nodes open and close (viewer)
 * Dynamic height only runs in view mode (JSONExplorer.jsx:30): the container goes height:100% + min-height = authored
 * height (:72-73), a MutationObserver on the subtree re-triggers sizing whenever nodes are added or removed
 * (:155-170), and a runtime flip of Expand entire JSON remounts the tree and re-triggers sizing too (:119-124,179).
 * So the app is seeded through the components API (addJsonExplorersViaApi) and opened in the viewer.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * openLinkAppInViewer, addJsonExplorersViaApi, explorerMetrics, readExplorerMetrics, toggleNode.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { jsonExplorerSelector as SEL } from "Selectors/appBuilder/components/jsonExplorer";
import { jsonExplorerText } from "Texts/appBuilder/components/jsonExplorer";
import {
    getWidgetRect,
    verifyWidgetMoved,
    verifyWidgetResized,
    verifyWidgetCount,
    duplicateWidgetByKeyboard,
    duplicateWidgetFromMenu,
    copyPasteWidget,
    cutWidget,
    pasteWidget,
    nudgeWidget,
    selectAllWidgets,
    multiSelectWidgets,
    verifySelectedWidgetCount,
    renameWidgetFromMenu,
    deleteWidgetFromMenu,
    undo,
    redo,
} from "Support/utils/commonWidget";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    addJsonExplorersViaApi,
    explorerMetrics,
    readExplorerMetrics,
    toggleNode,
} from "Support/utils/appBuilder/components/jsonExplorer";

const T = jsonExplorerText;
const W = T.defaultWidgetName;
const PX = 2; // layout tolerance (px)
const GAP = T.layoutGap;

const box = (name) => {
    const el = Cypress.$(commonWidgetSelector.draggableWidget(name))[0];
    expect(el, `widget ${name}`).to.exist;
    return el.getBoundingClientRect();
};

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('JSON Explorer — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-JSONExplorer-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
            // the definition document renders fully expanded under a root node. source: jsonExplorer.js:191,194-195
            explorerMetrics(W, (m) => {
                expect(m.labels[0], 'root node shown').to.eq(T.defaultRootLabel);
                expect(m.labels[1], 'first key').to.eq(T.defaultFirstKey);
                expect(m.text).to.contain(T.defaultFirstValue);
                expect(m.nodes, 'every node expanded').to.eq(T.defaultNodeCount);
            });
            cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
                expect($w[0].getBoundingClientRect().height, 'default height').to.be.closeTo(T.defaultSize.height, PX)); // source: jsonExplorer.js:8
            verifyWidgetCount(PREFIX, 1);
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 650, 450);
                verifyWidgetMoved(W, before);
            });
        });

        it('resize changes the widget dimensions', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.resizeWidget(W, before.x + before.w + 160, before.y + before.h + 90);
                verifyWidgetResized(W, before);
            });
        });

        it('nudge (arrow keys) moves the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                nudgeWidget(W, 'ArrowRight', 12);
                verifyWidgetMoved(W, before);
            });
        });

        it('duplicate via keyboard (Cmd/Ctrl+D)', () => {
            duplicateWidgetByKeyboard(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('duplicate via ⋮ menu', () => {
            duplicateWidgetFromMenu(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('copy-paste (Cmd/Ctrl+C then +V)', () => {
            copyPasteWidget(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it('cut removes the widget, paste restores it', () => {
            cutWidget(W); // asserts removal internally
            cy.forceClickOnCanvas();
            pasteWidget();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            explorerMetrics(W, (m) => expect(m.nodes, 'pasted tree rendered').to.eq(T.defaultNodeCount));
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 900, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'payloadtree'); // asserts new name internally
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });

        it('delete via ⋮ menu, undo restores, redo removes', () => {
            deleteWidgetFromMenu(W);
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
            undo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            redo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });
    });

    describe('seeded apps (viewer)', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-JSONExplorer-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── JSONExplorer-BRW-002 ─────────────────────────────────────────────
        // `grow` (dynamic height on) follows its tree; `fixed` (dynamic height off — jsonExplorer.js:201 default) is the
        // control. Both start closed and are opened/closed by real clicks; `grow`'s Expand entire JSON is bound to a
        // TextInput so the runtime remount (JSONExplorer.jsx:179) is covered too.
        it('[JSONExplorer-BRW-002] Dynamic height grows the explorer as nodes open, shrinks it as they close, and reflows the widget below', () => {
            const authored = 120; // dynamic: authored widget height (px)
            // 12 strings under `list` overflow the authored height once open; root + list + meta alone fit it
            const doc = `{{{ list: Array.from({ length: 12 }, (_, i) => 'item' + i), meta: { a: 1, b: 2 } }}}`; // dynamic
            const expandAll = 'all'; // dynamic: typing it into `expand` expands every node
            addJsonExplorersViaApi([
                { type: 'TextInput', name: 'expand', layout: { top: 10, left: 32, width: 8, height: 40 } },
                {
                    name: 'grow',
                    layout: { top: 80, left: 2, width: 12, height: authored },
                    properties: {
                        dynamicHeight: { value: '{{true}}' },
                        value: { value: doc },
                        shouldExpandEntireJSON: { value: `{{components.expand.value === "${expandAll}"}}` },
                    },
                },
                { type: 'Text', name: 'below', layout: { top: 80 + authored + GAP, left: 2, width: 12, height: 40 }, properties: { text: { value: 'below' } } },
                {
                    name: 'fixed',
                    layout: { top: 80, left: 16, width: 12, height: authored },
                    properties: { value: { value: doc }, shouldExpandEntireJSON: { value: '{{false}}' } },
                },
                { type: 'Text', name: 'belowfixed', layout: { top: 80 + authored + GAP, left: 16, width: 12, height: 40 }, properties: { text: { value: 'fixed' } } },
            ]);
            openLinkAppInViewer(SEL.tree('grow'));

            // the box hugs the tree: nothing scrolls inside, the authored height is the floor, `below` keeps its gap
            const expectHugs = (label, nodes) =>
                explorerMetrics('grow', (m) => {
                    expect(m.nodes, `${label}: rendered rows`).to.eq(nodes);
                    expect(m.box.scrollHeight, `${label}: no inner scroll`).to.be.lte(m.box.clientHeight + 1);
                    expect(m.box.bottom, `${label}: tree inside the widget`).to.be.lte(m.widget.bottom + 1);
                    expect(m.widget.height, `${label}: authored floor`).to.be.gte(authored - PX);
                    expect(box('below').top - m.widget.bottom, `${label}: below keeps its gap`).to.be.closeTo(GAP, PX);
                });
            const expectAuthored = (label) =>
                cy.document().should(() => expect(box('grow').height, `${label}: back to the authored height`).to.be.closeTo(authored, PX));

            // closed root, then root open (list + meta still closed): both fit, so the authored height holds
            expectHugs('root closed', 1);
            expectAuthored('root closed');
            toggleNode('grow', 'root');
            expectHugs('root open', 3);
            expectAuthored('root open');
            readExplorerMetrics('grow').as('small');

            // opening `list` adds 12 rows: the explorer grows past the authored height and pushes `below` down
            toggleNode('grow', 'list', 'arrow');
            expectHugs('list open', 15);
            cy.get('@small').then((small) =>
                explorerMetrics('grow', (m) => {
                    const row = (m.box.scrollHeight - small.box.scrollHeight) / 12;
                    expect(row, 'each opened row adds height').to.be.gt(10);
                    expect(m.widget.height, 'grew past the authored height').to.be.gt(authored + 100);
                }));
            readExplorerMetrics('grow').as('open');

            // opening `meta` grows it further by its two rows
            toggleNode('grow', 'meta', 'label');
            expectHugs('meta open', 17);
            cy.get('@open').then((open) =>
                explorerMetrics('grow', (m) => expect(m.widget.height, 'grew by two more rows').to.be.gt(open.widget.height + 20)));

            // closing hands the space back: list closed → shrinks; meta closed → authored height, `below` back in place
            toggleNode('grow', 'list', 'arrow');
            expectHugs('list closed', 5);
            toggleNode('grow', 'meta', 'label');
            expectHugs('meta closed', 3);
            expectAuthored('everything closed'); // + expectHugs' gap check: `below` is back right under the authored box

            // Expand entire JSON flipped at runtime: the remounted, fully open tree is sized too — and shrinks back
            // real keystrokes (CDP): with synthetic cy.type the remounted tree grows but `below` is never reflowed —
            // reproduced 3/3 in Cypress, never with real input (realType / Playwright). Reported as a suspected race:
            // the expand side effect (JSONExplorer.jsx:122) and the MutationObserver (:160) each flip the same boolean,
            // and two flips landing in one batch leave useDynamicHeight's `value` dep unchanged.
            cy.get(SEL.textInput('expand')).realClick({ scrollBehavior: false });
            cy.realType(expandAll);
            expectHugs('expand all', 17);
            cy.document().should(() => expect(box('grow').height, 'expanded by the property').to.be.gt(authored + 100));
            Cypress._.times(expandAll.length, () => cy.realPress('Backspace')); // real deletes (cy.clear hits the same race)
            expectHugs('collapse all', 1);
            expectAuthored('collapse all');

            // control: a fixed-height explorer keeps its box and scrolls instead; its sibling never moves
            readExplorerMetrics('fixed').then((f0) => {
                const belowFixed0 = box('belowfixed').top;
                toggleNode('fixed', 'root');
                toggleNode('fixed', 'list', 'arrow');
                explorerMetrics('fixed', (m) => {
                    expect(m.nodes, 'fixed: list open').to.eq(15);
                    expect(m.widget.height, 'fixed: height unchanged').to.be.closeTo(f0.widget.height, PX);
                    expect(m.box.scrollHeight, 'fixed: scrolls instead').to.be.gt(m.box.clientHeight + 100);
                });
                cy.document().should(() => expect(box('belowfixed').top, 'fixed sibling did not move').to.be.closeTo(belowFixed0, PX));
            });
        });
    });
});
