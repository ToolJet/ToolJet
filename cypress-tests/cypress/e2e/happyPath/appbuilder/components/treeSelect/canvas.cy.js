/**
 * SPEC — Tree Select — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo), plus the geometry / reflow / scroll half of TESTING.md browser scenario:
 *   TreeSelect-QA-001 — with real geometry, dynamic height measures the tree as branches expand and collapse
 *                       (siblings reflow, nothing scrolls), collapse-when-hidden reclaims the space and the tree is
 *                       re-measured — not stale — when shown again, the non-dynamic tree keeps its authored height
 *                       and scrolls, and a viewport resize re-measures wrapped node captions.
 * (Editor-vs-running-app and device visibility in contexts.cy.js; padding in styles.cy.js; focus order in
 * userflow.cy.js.)
 * Dynamic height and collapse only run in view mode (TreeSelect.jsx:73, RenderWidget.jsx:302-311), so those apps are
 * seeded through the components API (addTreeSelectsViaApi) and opened in the viewer. Root geometry:
 * TreeSelect.jsx:434-450 (height auto | 100%, treeSelect.scss:2 overflow-y auto); grid box: WidgetWrapper.jsx:199-204.
 * Decision: dynamic height fits the content in both directions — a collapsed tree shrinks BELOW its authored height
 * and the sibling follows it up (dynamicHeightReflow.js:595-597 "the authored size is just the user's initial guess").
 * Helpers: addTreeSelectsViaApi, openTreeAppInViewer, treeBoxes, readTreeBoxes, expectHugsTree, expectAuthoredTree,
 * toggleNode, treeTop, expectStackedBelow, getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount,
 * duplicateWidgetByKeyboard, duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget,
 * selectAllWidgets, multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo,
 * redo.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { treeSelectSelector } from "Selectors/appBuilder/components/treeSelect";
import { treeSelectText } from "Texts/appBuilder/components/treeSelect";
import {
    addTreeSelectsViaApi,
    openTreeAppInViewer,
    treeBoxes,
    readTreeBoxes,
    expectHugsTree,
    expectAuthoredTree,
    toggleNode,
    treeTop,
} from "Support/utils/appBuilder/components/treeSelect";
import { expectStackedBelow } from "Support/utils/appBuilder/components/timeline";
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

const T = treeSelectText;
const W = T.defaultWidgetName;
const PREFIX = T.widgetPrefix;
const PX = 1.5; // sub-pixel layout tolerance
const GAP = 10; // dynamic: authored gap between a tree and the widget under it
const AUTHORED = 150; // dynamic: authored tree height (px) — shorter than the default tree's content
const ON = { value: '{{true}}' }; // treeSelect.js:340-343 toggle value
const input = (name) => `${commonWidgetSelector.draggableWidget(name)} input`;
const word = () => fake.firstName.replace(/\W/g, '').slice(0, 8) || 'Item';
const opt = T.option;

// the default tree as plain { label, value, children } nodes — the `data` shape of Dynamic options (treeSelect.js:335)
const plainNodes = (nodes) =>
    nodes.map(({ label, value, children }) => ({ label, value, ...(children ? { children: plainNodes(children) } : {}) }));
const DEFAULT_DATA = plainNodes(T.definition.properties.options.value);
// every node of the default tree, depth first, when all four parents are expanded
const ALL_TITLES = [
    'Asia', 'China', 'Beijing', 'Shanghai', 'Japan', 'India', 'Delhi', 'Mumbai', 'Bengaluru',
    'Europe', 'France', 'Spain', 'England', 'Africa',
];
// the default tree with every parent expanded (static options)
const expandedTree = () => [
    opt('Asia', 'asia', { expanded: true }, [
        opt('China', 'china', { expanded: true }, [opt('Beijing', 'beijing'), opt('Shanghai', 'shanghai')]),
        opt('Japan', 'japan'),
        opt('India', 'india', { expanded: true }, [opt('Delhi', 'delhi'), opt('Mumbai', 'mumbai'), opt('Bengaluru', 'bengaluru')]),
    ]),
    opt('Europe', 'europe', { expanded: true }, [opt('France', 'france'), opt('Spain', 'spain'), opt('England', 'england')]),
    opt('Africa', 'africa'),
];

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Tree Select — canvas facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-TreeSelect-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places a 12-column, 200px Tree Select with the default tree: Asia expanded and selected down its branch', () => {
            verifyWidgetCount(PREFIX, 1);
            cy.get('#real-canvas').then(($c) => {
                const column = $c[0].getBoundingClientRect().width / T.gridColumns;
                treeBoxes(W, (b) => {
                    expect(b.wrapper.width, 'registered width').to.be.closeTo(column * T.defaultGridWidth, PX);
                    expectAuthoredTree(b, T.defaultHeight, 'dropped');
                    expect(b.titles, 'Asia expanded, the rest collapsed').to.deep.eq(T.defaultTopTitles);
                    expect(b.nodes.map((n) => n.checked), 'Asia and its descendants selected').to.deep.eq([
                        true, true, true, true, false, false,
                    ]);
                });
            });
        });

        it('move repositions the widget', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.moveComponent(W, 650, 450);
                verifyWidgetMoved(W, before);
            });
        });

        it('resize changes the widget dimensions and the tree root follows', () => {
            getWidgetRect(W).as('r0');
            cy.get('@r0').then((before) => {
                cy.resizeWidget(W, before.x + before.w + 160, before.y + before.h + 60);
                verifyWidgetResized(W, before);
                treeBoxes(W, (b) => {
                    expect(b.box.width, 'wider').to.be.gt(before.w + 100);
                    expect(b.root.height, 'root fills the taller box').to.be.closeTo(b.box.height - 2 * T.boxPadding, PX);
                    expect(b.root.width, 'root fills the wider box').to.be.closeTo(b.box.width - 2 * T.boxPadding, PX);
                });
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
            treeBoxes(`${PREFIX}2`, (b) => expect(b.titles, 'duplicate keeps the tree').to.deep.eq(T.defaultTopTitles));
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
            treeBoxes(W, (b) => expect(b.titles, 'pasted tree').to.deep.eq(T.defaultTopTitles));
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 650, 300);
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'regions'); // asserts new name internally
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

    describe('running app', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-TreeSelect-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiDeleteApp();
        });

        // ── TreeSelect-QA-001: expand / collapse re-measures, siblings reflow ──
        // `tsdyn` (dynamic height) and `tsfixed` (dynamic height off — the treeSelect.js:340 default) show the same
        // default tree at the same authored height; each has a Text GAP px below it.
        it('[TreeSelect-QA-001] Dynamic height follows the tree as branches expand and collapse, the sibling below keeps its gap, and nothing scrolls; without it the tree keeps its authored height and scrolls', () => {
            addTreeSelectsViaApi([
                { name: 'tsdyn', layout: { top: 40, left: 2, width: 12, height: AUTHORED }, properties: { dynamicHeight: ON } },
                {
                    type: 'Text',
                    name: 'below',
                    layout: { top: 40 + AUTHORED + GAP, left: 2, width: 12, height: 40 },
                    properties: { text: { value: word() } },
                },
                { name: 'tsfixed', layout: { top: 40, left: 15, width: 12, height: AUTHORED } },
                {
                    type: 'Text',
                    name: 'belowfixed',
                    layout: { top: 40 + AUTHORED + GAP, left: 15, width: 12, height: 40 },
                    properties: { text: { value: word() } },
                },
            ]);
            openTreeAppInViewer(treeSelectSelector.root('tsdyn'));
            treeTop('belowfixed').as('fixedBelowTop');

            // six rows already overflow 150px: the dynamic tree grows to fit them, the control scrolls instead
            treeBoxes('tsdyn', (b) => {
                expect(b.titles, 'default rows').to.deep.eq(T.defaultTopTitles);
                expectHugsTree(b, 'default');
                expect(b.wrapper.height, 'taller than authored').to.be.gt(AUTHORED);
            });
            expectStackedBelow('tsdyn', 'below', GAP, 'default');
            treeBoxes('tsfixed', (b) => {
                expectAuthoredTree(b, AUTHORED, 'control');
                expect(b.scrollHeight, 'control: rows overflow').to.be.gt(b.clientHeight);
            });

            // expand China, India and Europe: eight more rows, the widget grows by them and pushes the Text down
            readTreeBoxes('tsdyn').then((b0) => {
                ['China', 'India', 'Europe'].forEach((title) => toggleNode('tsdyn', title));
                treeBoxes('tsdyn', (b) => {
                    expect(b.titles, 'every branch open').to.deep.eq(ALL_TITLES);
                    expectHugsTree(b, 'expanded');
                    const rowPitch = b.nodes[1].rect.top - b.nodes[0].rect.top;
                    expect(b.wrapper.height - b0.wrapper.height, 'grew by eight rows').to.be.closeTo(8 * rowPitch, 2);
                });
            });
            expectStackedBelow('tsdyn', 'below', GAP, 'expanded');

            // collapse Asia and Europe: three rows — the widget shrinks below its authored height and the Text follows
            toggleNode('tsdyn', 'Asia');
            toggleNode('tsdyn', 'Europe');
            treeBoxes('tsdyn', (b) => {
                expect(b.titles, 'top level only').to.deep.eq(['Asia', 'Europe', 'Africa']);
                expectHugsTree(b, 'collapsed');
                expect(b.wrapper.height, 'shorter than authored').to.be.lt(AUTHORED);
            });
            expectStackedBelow('tsdyn', 'below', GAP, 'collapsed');

            // the control never moved
            treeBoxes('tsfixed', (b) => expectAuthoredTree(b, AUTHORED, 'control after'));
            cy.get('@fixedBelowTop').then((top0) =>
                treeTop('belowfixed').should((top) => expect(top, 'control sibling unchanged').to.be.closeTo(top0, PX))
            );
        });

        // ── TreeSelect-QA-001: collapse when hidden + fresh height on show ────
        // Lane A: `tsa` (Dynamic options, expandedData bound to the `expand` TextInput, dynamic height + collapse when
        // hidden — treeSelect.js:90-95) with `belowa` under it. Lane B: `tsb` (dynamic height, collapse off — the
        // treeSelect.js:343 default) with `belowb`. Both hide on the `hide` TextInput.
        it('[TreeSelect-QA-001] Collapse when hidden reclaims the space, a tree re-expanded while hidden is measured fresh when shown, and without collapse the space stays reserved', () => {
            const hideWord = word().toLowerCase(); // dynamic: typed to hide both trees
            const visibility = { value: `{{components.hide.value !== "${hideWord}"}}` };
            addTreeSelectsViaApi([
                { type: 'TextInput', name: 'hide', layout: { top: 10, left: 30, width: 10, height: 40 } },
                { type: 'TextInput', name: 'expand', layout: { top: 60, left: 30, width: 10, height: 40 } },
                {
                    name: 'tsa',
                    layout: { top: 40, left: 2, width: 12, height: AUTHORED },
                    properties: {
                        advanced: ON, // treeSelect.js:48-54
                        data: { value: `{{${JSON.stringify(DEFAULT_DATA)}}}` },
                        expandedData: {
                            value: '{{components.expand.value === "all" ? ["asia", "china", "india", "europe"] : []}}',
                        },
                        dynamicHeight: ON,
                        collapseWhenHidden: ON,
                        visibility,
                    },
                },
                {
                    type: 'Text',
                    name: 'belowa',
                    layout: { top: 40 + AUTHORED + GAP, left: 2, width: 12, height: 40 },
                    properties: { text: { value: 'A' } },
                },
                { name: 'tsb', layout: { top: 40, left: 15, width: 12, height: AUTHORED }, properties: { dynamicHeight: ON, visibility } },
                {
                    type: 'Text',
                    name: 'belowb',
                    layout: { top: 40 + AUTHORED + GAP, left: 15, width: 12, height: 40 },
                    properties: { text: { value: 'B' } },
                },
            ]);
            openTreeAppInViewer(treeSelectSelector.root('tsa'));

            treeBoxes('tsa', (b) => {
                expect(b.titles, 'collapsed tree').to.deep.eq(['Asia', 'Europe', 'Africa']);
                expectHugsTree(b, 'lane A shown');
            });
            expectStackedBelow('tsa', 'belowa', GAP, 'lane A shown');
            expectStackedBelow('tsb', 'belowb', GAP, 'lane B shown');
            treeTop('tsa').as('tsaTop');
            treeTop('belowa').as('belowaTop');
            treeTop('belowb').as('belowbTop');

            // hide: lane A collapses into the tree's top, lane B keeps the space
            cy.get(input('hide')).type(hideWord);
            treeBoxes('tsa', (b) => {
                expect(b.rootDisplay, 'lane A hidden').to.eq('none');
                expect(b.wrapper.height, 'lane A takes no space').to.eq(0);
            });
            treeBoxes('tsb', (b) => expect(b.rootDisplay, 'lane B hidden').to.eq('none'));
            cy.get('@tsaTop').then((tsaTop) =>
                treeTop('belowa').should((top) => expect(top, 'belowa moved up to the tree top').to.be.closeTo(tsaTop, 2))
            );
            cy.get('@belowbTop').then((top0) =>
                treeTop('belowb').should((top) => expect(top, 'belowb keeps its place').to.be.closeTo(top0, PX))
            );

            // expand every branch while hidden: nothing moves yet
            cy.get(input('expand')).type('all');
            treeBoxes('tsa', (b) => {
                expect(b.titles, 'rows rendered while hidden').to.deep.eq(ALL_TITLES);
                expect(b.wrapper.height, 'still no space').to.eq(0);
            });
            cy.get('@tsaTop').then((tsaTop) =>
                treeTop('belowa').should((top) => expect(top, 'belowa still at the tree top').to.be.closeTo(tsaTop, 2))
            );

            // show: measured with all fourteen rows (not the three it had when hidden); belowa clears it
            cy.get(input('hide')).clear();
            treeBoxes('tsa', (b) => {
                expectHugsTree(b, 'lane A shown expanded');
                const rowPitch = b.nodes[1].rect.top - b.nodes[0].rect.top;
                expect(b.root.height, 'fresh height holds fourteen rows').to.be.gte(ALL_TITLES.length * rowPitch);
            });
            expectStackedBelow('tsa', 'belowa', GAP, 'lane A shown expanded');
            expectStackedBelow('tsb', 'belowb', GAP, 'lane B shown again');

            // hide, collapse while hidden, show: shrinks back and belowa returns to its first place
            cy.get(input('hide')).type(hideWord);
            treeBoxes('tsa', (b) => expect(b.rootDisplay, 'hidden again').to.eq('none'));
            cy.get(input('expand')).clear();
            cy.get(input('hide')).clear();
            treeBoxes('tsa', (b) => {
                expect(b.titles, 'collapsed again').to.deep.eq(['Asia', 'Europe', 'Africa']);
                expectHugsTree(b, 'lane A shown collapsed');
            });
            expectStackedBelow('tsa', 'belowa', GAP, 'lane A shown collapsed');
            cy.get('@belowaTop').then((top0) =>
                treeTop('belowa').should((top) => expect(top, 'belowa back at its first place').to.be.closeTo(top0, PX))
            );
        });

        // ── TreeSelect-QA-001: non-dynamic tree scrolls ──────────────────────
        it('[TreeSelect-QA-001] Without dynamic height a tall expanded tree keeps its authored height, scrolls to its last node with a real wheel, and the scrolled-in node is selectable', () => {
            addTreeSelectsViaApi([
                {
                    name: 'tsscroll',
                    layout: { top: 40, left: 2, width: 12, height: AUTHORED },
                    properties: { options: { value: expandedTree() } },
                },
                {
                    type: 'Text',
                    name: 'below',
                    layout: { top: 40 + AUTHORED + GAP, left: 2, width: 12, height: 40 },
                    properties: { text: { value: word() } },
                },
            ]);
            openTreeAppInViewer(treeSelectSelector.root('tsscroll'));

            treeBoxes('tsscroll', (b) => {
                expect(b.titles, 'every row rendered').to.deep.eq(ALL_TITLES);
                expectAuthoredTree(b, AUTHORED, 'viewer');
                expect(b.scrollTop, 'starts at the top').to.eq(0);
                expect(b.scrollHeight, 'rows overflow').to.be.gt(b.clientHeight + 100);
                expect(b.nodes[b.nodes.length - 1].rect.top, 'last row below the visible area').to.be.gt(b.root.bottom);
            });
            expectStackedBelow('tsscroll', 'below', GAP, 'before scroll');

            cy.get(treeSelectSelector.root('tsscroll')).realMouseWheel({ deltaY: 2000, scrollBehavior: false });
            treeBoxes('tsscroll', (b) => {
                expect(b.scrollTop, 'scrolled to the end').to.be.closeTo(b.scrollHeight - b.clientHeight, PX);
                const last = b.nodes[b.nodes.length - 1];
                expect(last.rect.bottom, 'last row visible').to.be.lte(b.root.bottom + PX);
                expect(last.rect.top, 'last row visible (top)').to.be.gte(b.root.top - PX);
                expect(b.nodes[0].rect.bottom, 'first row scrolled out').to.be.lt(b.root.top);
                expectAuthoredTree(b, AUTHORED, 'after scroll');
            });
            expectStackedBelow('tsscroll', 'below', GAP, 'after scroll');

            // the scrolled-in row takes a real click
            cy.get(`${treeSelectSelector.nodes('tsscroll')}:last .rct-title > div`).realClick({ scrollBehavior: false });
            treeBoxes('tsscroll', (b) => {
                const last = b.nodes[b.nodes.length - 1];
                expect(last.title, 'last row').to.eq('Africa');
                expect(last.checked, 'Africa selected').to.eq(true);
                expect(b.nodes.filter((n) => n.checked).map((n) => n.title), 'only Africa').to.deep.eq(['Africa']);
            });
        });

        // ── TreeSelect-QA-001: viewport resize re-measures wrapped captions ──
        it('[TreeSelect-QA-001] Resizing the viewport re-measures a dynamic-height tree whose captions wrap: narrower grows it, wider restores it, and the sibling keeps its gap', () => {
            // dynamic: captions long enough (>= 90 chars) to wrap onto more lines when the widget narrows
            const caption = (i) => {
                let text = `${i}`;
                while (text.length < 90) text += ` ${word()}`;
                return text;
            };
            const both = { showOnMobile: ON };
            addTreeSelectsViaApi([
                {
                    name: 'tswrap',
                    layout: { top: 40, left: 2, width: 12, height: 100 },
                    others: both,
                    properties: {
                        label: { value: '' },
                        dynamicHeight: ON,
                        options: { value: [1, 2, 3, 4].map((i) => opt(caption(i), `r${i}`)) },
                    },
                },
                {
                    type: 'Text',
                    name: 'below',
                    layout: { top: 150, left: 2, width: 12, height: 40 },
                    properties: { text: { value: word() } },
                },
            ]);
            openTreeAppInViewer(treeSelectSelector.root('tswrap'));

            treeBoxes('tswrap', (b) => {
                expect(b.nodes, 'four rows').to.have.length(4);
                expectHugsTree(b, 'wide');
            });
            expectStackedBelow('tswrap', 'below', GAP, 'wide');
            readTreeBoxes('tswrap').then((wide) => {
                cy.viewport(1000, Cypress.config('viewportHeight')); // dynamic: narrower window
                treeBoxes('tswrap', (b) => {
                    expect(b.wrapper.width, 'narrower').to.be.lt(wide.wrapper.width - 50);
                    b.nodes.forEach((n, i) =>
                        expect(n.rect.height, `row ${i} never fewer lines`).to.be.gte(wide.nodes[i].rect.height - 0.5)
                    );
                    expect(b.root.height, 'more lines in total').to.be.gt(wide.root.height + 10);
                    expectHugsTree(b, 'narrow');
                });
                expectStackedBelow('tswrap', 'below', GAP, 'narrow');

                cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
                treeBoxes('tswrap', (b) => {
                    expect(b.wrapper.width, 'wide again').to.be.closeTo(wide.wrapper.width, PX);
                    expect(b.wrapper.height, 'same height as before').to.be.closeTo(wide.wrapper.height, PX);
                    expectHugsTree(b, 'wide again');
                });
                expectStackedBelow('tswrap', 'below', GAP, 'wide again');
            });
        });
    });
});
