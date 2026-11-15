/**
 * SPEC — Key Value Pair — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo)
 * + browser-only geometry scenarios from frontend/ee/test/app-builder/widgets/KeyValuePair/TESTING.md:
 *   KeyValuePair-BRW-005 — dynamic height in a viewed app: the real height tracks the content, no scrollbar
 *   KeyValuePair-BRW-006 — the Save/Cancel bar stays visible and positioned on the widget across viewport and
 *                          container sizes
 *   KeyValuePair-BRW-008 — at 335 / 200 / 137 / 52px the bar never leaves the component; text bar ≥8px inside,
 *                          docked footer full-width on the bottom edge with radius-following corners, last row never
 *                          covered (also with dynamic height), "Save changes" on one line
 * Dynamic height and exact pixel widths only exist in the running app (KeyValuePair.jsx:113 dynamic height needs
 * currentMode 'view'; layout width may be fractional, WidgetWrapper.jsx:173), so those apps are seeded through the
 * components API and opened in the viewer.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * openLinkAppInViewer, addKeyValuePairsViaApi, kvField, seedAtPixelWidths, editStringField, kvMetrics,
 * scrollKvContentToEnd, expectHitInside.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { keyValuePairSelector } from "Selectors/appBuilder/components/keyValuePair";
import { keyValuePairText } from "Texts/appBuilder/components/keyValuePair";
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
    addKeyValuePairsViaApi,
    kvField,
    seedAtPixelWidths,
    editStringField,
    kvMetrics,
    scrollKvContentToEnd,
    expectHitInside,
} from "Support/utils/appBuilder/components/keyValuePair";

const W = keyValuePairText.defaultWidgetName;
const T = keyValuePairText;
const S = keyValuePairSelector;
const B = T.bar;
const PX = 0.75; // sub-pixel layout tolerance

// Four editable string rows (KeyValueRow.jsx: an editable cell enters edit mode on click).
const ROW_KEYS = ["first", "second", "third", "fourth"];
const rowData = () => `{{ ${JSON.stringify(Object.fromEntries(ROW_KEYS.map((k) => [k, fake.firstName.slice(0, 6)])))} }}`; // dynamic
const editableRows = { value: ROW_KEYS.map((k) => kvField(k, { isEditable: "{{true}}" })) };

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Key Value Pair — canvas facet', { testIsolation: false }, () => {
    describe('editor canvas', () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-KeyValuePair-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget with its definition fields', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('be.visible');
            // definition fields render as labelled rows. source: keyValuePair.js:324-481
            cy.get(S.labels(W)).should(($l) => expect(Cypress._.map($l, 'textContent')).to.deep.eq(T.defaultFieldLabels));
            cy.get(S.valueCells(W)).first().should('contain.text', T.defaultNameValue); // source: keyValuePair.js:322
            cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
                expect($w[0].getBoundingClientRect().height, 'default height').to.be.closeTo(T.defaultSize.height, 2)); // source: keyValuePair.js:8
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
            renameWidgetFromMenu(W, 'details'); // asserts new name internally
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

    describe('seeded apps (running app)', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-KeyValuePair-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.viewport(Cypress.config('viewportWidth'), Cypress.config('viewportHeight'));
            cy.apiDeleteApp();
        });

        // ── KeyValuePair-BRW-005 ─────────────────────────────────────────────
        // KeyValuePair.jsx:113-126: dynamic height in view mode → useHeightObserver (ResizeObserver on the root) →
        // useDynamicHeight resizes the grid box; the value list stops scrolling (overflowY hidden, :253). The row count
        // is bound to textinput1 through dynamic fields. kvfixed (dynamic height off) is the control.
        it('[KeyValuePair-BRW-005] Dynamic height follows the rows in the running app, with no scrollbar; siblings reflow', () => {
            const configured = 150; // dynamic: authored height
            const GAP = 20; // dynamic: authored gap to the widget below
            const count = 'Number(components.textinput1.value) || 2'; // row count bound to textinput1
            const dynamicProps = {
                useDynamicField: { value: '{{true}}' },
                data: { value: `{{Object.fromEntries(Array.from({length: ${count}}, (_, i) => ['k' + i, 'Value ' + i]))}}` },
                fieldDynamicData: { value: `{{Array.from({length: ${count}}, (_, i) => ({name: 'Row ' + i, key: 'k' + i}))}}` },
            };
            addKeyValuePairsViaApi([
                { type: 'TextInput', name: 'textinput1', layout: { top: 10, left: 28, width: 8, height: 40 } },
                { name: 'kvdyn', layout: { top: 100, left: 2, width: 10, height: configured }, properties: { ...dynamicProps, dynamicHeight: { value: '{{true}}' } } },
                { type: 'Text', name: 'below', layout: { top: 100 + configured + GAP, left: 2, width: 10, height: 40 }, properties: { text: { value: 'below' } } },
                { name: 'kvfixed', layout: { top: 100, left: 14, width: 10, height: configured }, properties: dynamicProps },
            ]);
            openLinkAppInViewer(S.rows('kvdyn'));

            // root = rows·38 + gaps·12 + 2·12 padding + 2 border; grid box adds the 2px canvas-component padding each side
            // (row min-height keyValuePair.scss:243, gap :152, paddingInside default keyValuePair.js:509)
            const expectedBox = (rows) => rows * 38 + (rows - 1) * 12 + 2 * 12 + 2 + 4;
            const expectFits = (rows) => {
                kvMetrics('kvdyn', (m) => {
                    expect(m.rows.length, 'rows rendered').to.eq(rows);
                    expect(m.widget.height, `box hugs ${rows} rows`).to.be.closeTo(expectedBox(rows), 1);
                    expect(m.scrollHeight, 'no inner scroll').to.be.lte(m.clientHeight + 1);
                    expect(m.lastRow.bottom, 'last row inside the root').to.be.lte(m.root.bottom - 12 + PX);
                });
                cy.get(S.content('kvdyn')).should('have.css', 'overflow-y', 'hidden'); // KeyValuePair.jsx:253
                cy.document().should((doc) => {
                    const kv = doc.querySelector(commonWidgetSelector.draggableWidget('kvdyn')).getBoundingClientRect();
                    const below = doc.querySelector(commonWidgetSelector.draggableWidget('below')).getBoundingClientRect();
                    expect(below.top - kv.bottom, 'widget below keeps its gap').to.be.closeTo(GAP, 1);
                });
            };

            expectFits(2); // shorter than configured: the box shrinks to the content
            cy.get(commonWidgetSelector.draggableWidget('textinput1')).find('input').type('8');
            expectFits(8); // grows well past the configured height
            // control: without dynamic height the same 8 rows overflow the fixed box and scroll
            kvMetrics('kvfixed', (m) => {
                expect(m.widget.height, 'fixed box keeps its height').to.be.closeTo(configured, 1);
                expect(m.scrollHeight, 'fixed box scrolls').to.be.gt(m.clientHeight + 100);
            });
            cy.get(commonWidgetSelector.draggableWidget('textinput1')).find('input').clear().type('1');
            expectFits(1);
            cy.get(commonWidgetSelector.draggableWidget('textinput1')).find('input').clear().type('5');
            expectFits(5);
        });

        // ── KeyValuePair-BRW-008 ─────────────────────────────────────────────
        // KeyValuePair.jsx:133-134 + keyValuePair.scss:20-139: >= 200px floating text bar (left/right 8px), < 200px
        // full-width docked footer (border-top only, bottom radius calc(radius - 1px)); `.kv-content-docked` reserves
        // 52px under the list (:158-161). Widths are exact: layout width = px / grid column width.
        it('[KeyValuePair-BRW-008] The changeset bar stays inside the component at 335, 200, 137 and 52px', () => {
            const WIDTHS = { kv335: 335, kv200: 200, kv137: 137, kv52: 52 }; // source: TESTING.md KeyValuePair-BRW-008
            const LEFT = { kv335: 1, kv200: 13, kv137: 21, kv52: 27 };
            const RADIUS = 16; // dynamic: authored border radius for the dynamic-height case
            seedAtPixelWidths((g) => [
                ...Object.entries(WIDTHS).map(([name, px]) => ({
                    name,
                    layout: { top: 60, left: LEFT[name], width: px / g, height: 220 },
                    properties: { data: { value: rowData() }, fields: editableRows },
                })),
                {
                    name: 'kvdyn',
                    layout: { top: 330, left: 1, width: 137 / g, height: 150 },
                    properties: { data: { value: rowData() }, fields: editableRows, dynamicHeight: { value: '{{true}}' } },
                    styles: { borderRadius: { value: String(RADIUS) } },
                },
            ]);
            cy.get(S.rows('kv52'), { timeout: 30000 }).should('have.length', ROW_KEYS.length);

            // the seeded boxes really are the widths under test
            Object.entries(WIDTHS).forEach(([name, px]) =>
                kvMetrics(name, (m) => expect(m.widget.width, `${name} width`).to.be.closeTo(px, PX)));

            let dynBefore;
            kvMetrics('kvdyn', (m) => {
                expect(m.scrollHeight, 'dynamic: no scroll before the edit').to.be.lte(m.clientHeight + 1);
                dynBefore = m.widget.height;
            });

            // pending edit on the LAST row of every widget
            // (Enter commits and blurs — StringRenderer onKeyDown)
            [...Object.keys(WIDTHS), 'kvdyn'].forEach((name) => editStringField(name, ROW_KEYS.length - 1, 'Z'));

            const expectInsideHorizontally = (m, name) => {
                expect(m.bar.left, `${name}: bar left edge inside`).to.be.gte(m.root.left - PX);
                expect(m.bar.right, `${name}: bar right edge inside`).to.be.lte(m.root.right + PX);
                [m.cancel, m.save].forEach((b, i) => {
                    expect(b.left, `${name}: button ${i} left inside`).to.be.gte(m.root.left - PX);
                    expect(b.right, `${name}: button ${i} right inside`).to.be.lte(m.root.right + PX);
                });
            };

            // floating text tier (335, 200)
            ['kv335', 'kv200'].forEach((name) =>
                kvMetrics(name, (m) => {
                    expect(m.popoverClass, `${name}: floating`).not.to.contain('kv-changeset-docked');
                    expectInsideHorizontally(m, name);
                    expect(m.bar.left - m.root.left, `${name}: >= 8px inside the left edge`).to.be.gte(B.floatingInset);
                    expect(m.root.right - m.bar.right, `${name}: >= 8px inside the right edge`).to.be.gte(B.floatingInset);
                    expect(m.bar.bottom, `${name}: above the bottom edge`).to.be.lte(m.root.bottom - B.floatingBottom + PX);
                    expect(m.saveLabel, `${name}: text label`).to.eq(T.saveText);
                    expect(m.saveLines, `${name}: "Save changes" on one line`).to.eq(1);
                    expect(m.saveOverflow, `${name}: label not clipped`).to.be.lte(0);
                }));

            // docked footer tier (137, 52 — default radius 6) and the dynamic-height case (137, radius 16)
            const expectDocked = (name, radius) => {
                scrollKvContentToEnd(name);
                kvMetrics(name, (m) => {
                    expect(m.popoverClass, `${name}: docked`).to.contain('kv-changeset-docked');
                    expectInsideHorizontally(m, name);
                    expect(m.bar.left, `${name}: footer starts at the inner left edge`).to.be.closeTo(m.root.left + B.containerBorder, PX);
                    expect(m.bar.right, `${name}: footer ends at the inner right edge`).to.be.closeTo(m.root.right - B.containerBorder, PX);
                    expect(m.bar.bottom, `${name}: footer on the bottom edge`).to.be.closeTo(m.root.bottom - B.containerBorder, PX);
                    expect(m.barRadius, `${name}: bottom corners follow borderRadius`).to.deep.eq({
                        topLeft: '0px',
                        topRight: '0px',
                        bottomLeft: `${radius - B.containerBorder}px`,
                        bottomRight: `${radius - B.containerBorder}px`,
                    });
                    expect(m.contentPaddingBottom, `${name}: list reserves the footer`).to.eq(`${B.dockedContentPadding}px`);
                    expect(m.lastRow.bottom, `${name}: last row never under the footer`).to.be.lte(m.bar.top + PX);
                });
            };
            expectDocked('kv137', 6); // default radius. source: keyValuePair.js:512
            expectDocked('kv52', 6);
            expectDocked('kvdyn', RADIUS);
            // dynamic height: the footer's reserved space is part of the measured height — the box grows, nothing scrolls
            kvMetrics('kvdyn', (m) => {
                expect(m.widget.height, 'dynamic box grew by the reserved footer space').to.be.closeTo(dynBefore + B.dockedContentPadding, 2);
                expect(m.scrollHeight, 'dynamic: still no scroll').to.be.lte(m.clientHeight + 1);
                expect(m.scrollTop, 'dynamic: nothing scrolled').to.eq(0);
            });
        });

        // ── KeyValuePair-BRW-006 ─────────────────────────────────────────────
        // KeyValuePair.jsx:279-310: the bar is absolutely positioned inside the root (floating: centred, 10px above the
        // bottom; docked: on the bottom edge). The widget width follows the canvas, so resizing the viewport changes the
        // tier; kvin sits in a Container, so its width follows the Container.
        it('[KeyValuePair-BRW-006] The Save/Cancel bar stays visible and positioned on the widget across viewport and container sizes', () => {
            const boxId = crypto.randomUUID();
            addKeyValuePairsViaApi([
                { name: 'kvtop', layout: { top: 40, left: 2, width: 7, height: 240 }, properties: { data: { value: rowData() }, fields: editableRows } },
                { type: 'Container', id: boxId, name: 'box', layout: { top: 40, left: 16, width: 20, height: 330 } },
                { name: 'kvin', parent: boxId, layout: { top: 0, left: 1, width: 20, height: 240 }, properties: { data: { value: rowData() }, fields: editableRows } },
            ]);
            openLinkAppInViewer(S.rows('kvin'));
            ['kvtop', 'kvin'].forEach((name) => editStringField(name, 0, 'Q'));

            const VIEWPORTS = [[1440, 960], [1024, 768], [800, 700]]; // dynamic: desktop → narrow window
            const tiers = {};
            VIEWPORTS.forEach(([w, h]) => {
                cy.viewport(w, h);
                cy.get('#real-canvas').should(($c) => expect($c[0].getBoundingClientRect().width, 'canvas follows the viewport').to.be.lte(w));
                ['kvtop', 'kvin'].forEach((name) => {
                    cy.get(S.saveButton(name)).scrollIntoView({ block: 'center' });
                    kvMetrics(name, (m) => {
                        const docked = m.popoverClass.includes('kv-changeset-docked');
                        expect(docked, `${name}@${w}: tier matches width ${m.widget.width}`).to.eq(m.widget.width < T.ctaTextMinWidth);
                        tiers[`${name}@${w}`] = `${docked ? 'docked' : 'floating'} ${Math.round(m.widget.width)}px`;
                        expect(m.bar.left, `${name}@${w}: left inside`).to.be.gte(m.root.left - PX);
                        expect(m.bar.right, `${name}@${w}: right inside`).to.be.lte(m.root.right + PX);
                        expect(m.bar.top, `${name}@${w}: top inside`).to.be.gte(m.root.top - PX);
                        if (docked) {
                            expect(m.bar.bottom, `${name}@${w}: footer on the bottom edge`).to.be.closeTo(m.root.bottom - B.containerBorder, PX);
                            expect(m.bar.width, `${name}@${w}: full width`).to.be.closeTo(m.root.width - 2 * B.containerBorder, PX);
                        } else {
                            expect((m.bar.left + m.bar.right) / 2, `${name}@${w}: centred`).to.be.closeTo((m.root.left + m.root.right) / 2, 1);
                            expect(m.root.bottom - m.bar.bottom, `${name}@${w}: 10px above the bottom edge`).to.be.closeTo(B.floatingBottom + B.containerBorder, 1);
                        }
                    });
                    expectHitInside(S.saveButton(name));
                    expectHitInside(S.cancelButton(name));
                });
            });
            // both tiers were exercised across the sizes
            cy.then(() => expect(Object.values(tiers).map((t) => t.split(' ')[0]), `tiers seen: ${JSON.stringify(tiers)}`).to.include.members(['floating', 'docked']));
        });
    });
});
