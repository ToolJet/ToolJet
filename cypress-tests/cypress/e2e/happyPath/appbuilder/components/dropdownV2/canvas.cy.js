/**
 * SPEC — Dropdown (DropdownV2) — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/
 * rename/delete+undo) + browser-only geometry scenarios from TESTING.md:
 *   DropdownV2-BRW-002 — collapse when hidden releases the layout slot (keeps it when off) without touching the
 *                        selection
 *   DropdownV2-BRW-004 — match-field / match-content / custom menu widths and their viewport clamp
 *   DropdownV2-BRW-005 — a long option list is virtualized, scrolls, and reveals the selected option on open
 * Collapse runs only in view mode and menu geometry needs real layout, so those apps are seeded through the
 * components API (addDropdownsViaApi) and opened in the viewer (the editor's Preview URL).
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * addDropdownsViaApi, dropdownOptions, visitDropdownApp, openDropdownMenu, closeDropdownMenu, pickDropdownOption,
 * expectDropdownValue, dropdownState, getDropdownState, scrollDropdownMenuTo.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dropdownV2Selector } from "Selectors/appBuilder/components/dropdownV2";
import { dropdownV2Text } from "Texts/appBuilder/components/dropdownV2";
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
import {
    addDropdownsViaApi,
    dropdownOptions,
    visitDropdownApp,
    openDropdownMenu,
    closeDropdownMenu,
    pickDropdownOption,
    expectDropdownValue,
    dropdownState,
    getDropdownState,
    scrollDropdownMenuTo,
} from "Support/utils/appBuilder/components/dropdownV2";

const W = dropdownV2Text.defaultWidgetName;
const T = dropdownV2Text;
const PX = 2; // layout tolerance (px)

const box = (name) => {
    const el = Cypress.$(commonWidgetSelector.draggableWidget(name))[0];
    expect(el, `widget ${name}`).to.exist;
    return el.getBoundingClientRect();
};
// dynamic: distinct lowercase option labels
const words = (n) =>
    Cypress._.uniq(Array.from({ length: n * 4 }, () => fake.firstName).filter((w) => w.length >= 3)).slice(0, n);

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Dropdown (DropdownV2) — canvas facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DropdownV2-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget with its default selection', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            verifyWidgetCount(T.widgetPrefix, 1);
            expectDropdownValue(W, T.option2); // default option. source: dropdownV2.js:424
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
            verifyWidgetCount(T.widgetPrefix, 2);
        });

        it('duplicate via ⋮ menu', () => {
            duplicateWidgetFromMenu(W);
            verifyWidgetCount(T.widgetPrefix, 2);
        });

        it('copy-paste (Cmd/Ctrl+C then +V)', () => {
            copyPasteWidget(W);
            verifyWidgetCount(T.widgetPrefix, 2);
        });

        it('cut removes the widget, paste restores it', () => {
            cutWidget(W); // asserts removal internally
            cy.forceClickOnCanvas();
            pasteWidget();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
        });

        it('multi-select then select-all', () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 650, 300);
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${T.widgetPrefix}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'countrypicker'); // asserts new name internally
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });

        it('delete via ⋮ menu, undo restores, redo removes', () => {
            deleteWidgetFromMenu(W);
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
            undo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            // undo re-selects the restored Dropdown; give the canvas keyboard focus back before the redo chord
            cy.forceClickOnCanvas();
            redo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });
    });

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DropdownV2-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // ── DropdownV2-BRW-002 ───────────────────────────────────────────────
        // properties.collapseWhenHidden (dropdownV2.js:118-123, default {{false}} :445): RenderWidget schedules a
        // reflow when visibility flips in view mode and the grid drops a collapsed widget's height. Lane A
        // collapses, lane B (collapse off) is the control. The selection is internal state (DropdownV2.jsx:121)
        // and must survive the hide/show round-trip.
        it('[DropdownV2-BRW-002] Collapse when hidden releases the slot (off keeps it) and the selection survives', () => {
            const labels = words(3);
            const hideWord = fake.firstName.toLowerCase(); // dynamic: typed to hide both Dropdowns
            const visibility = { value: `{{components.gate.value !== "${hideWord}"}}` };
            const options = dropdownOptions(labels, labels[0]);
            addDropdownsViaApi([
                { type: 'TextInput', name: 'gate', layout: { top: 10, left: 30, width: 10, height: 40 } },
                {
                    name: 'dda',
                    layout: { top: 100, left: 2, width: 10, height: 40 },
                    properties: { options, visibility, collapseWhenHidden: { value: '{{true}}' } },
                },
                { type: 'Text', name: 'texta', layout: { top: 160, left: 2, width: 10, height: 40 }, properties: { text: { value: '{{components.dda.value}}' } } },
                {
                    name: 'ddb',
                    layout: { top: 100, left: 15, width: 10, height: 40 },
                    properties: { options, visibility }, // collapseWhenHidden stays {{false}} (dropdownV2.js:445)
                },
                { type: 'Text', name: 'textb', layout: { top: 160, left: 15, width: 10, height: 40 }, properties: { text: { value: '{{components.ddb.value}}' } } },
            ]);
            visitDropdownApp(dropdownV2Selector.field('dda'));

            // user picks a non-default option in both lanes
            openDropdownMenu('dda');
            pickDropdownOption(labels[2]);
            openDropdownMenu('ddb');
            pickDropdownOption(labels[1]);
            expectDropdownValue('dda', labels[2]);
            expectDropdownValue('ddb', labels[1]);

            let before;
            cy.document().should(() => {
                before = { texta: box('texta').top, textb: box('textb').top, ddaTop: box('dda').top };
                // authored 20px gap below both Dropdowns (top 100 + height 40 → 160)
                expect(before.texta - box('dda').bottom, 'texta gap').to.be.closeTo(20, PX);
                expect(before.textb - box('ddb').bottom, 'textb gap').to.be.closeTo(20, PX);
                expect(Cypress.$(commonWidgetSelector.draggableWidget('texta')).text().trim()).to.eq(labels[2]);
            });

            cy.get(`${commonWidgetSelector.draggableWidget('gate')} input`).type(hideWord, { scrollBehavior: 'center' });
            cy.get(dropdownV2Selector.root('dda')).should('have.class', 'invisible');
            cy.get(dropdownV2Selector.root('ddb')).should('have.class', 'invisible');
            cy.document().should(() => {
                // lane A: texta moved up into the released slot (by at least the Dropdown's 40px height)
                expect(before.texta - box('texta').top, 'texta moved up').to.be.gte(40 - PX);
                expect(box('texta').top, 'texta not above the Dropdown\'s old top').to.be.gte(before.ddaTop - PX);
                // lane B: no collapse → textb keeps its place
                expect(box('textb').top, 'textb unchanged').to.be.closeTo(before.textb, PX);
                // the exposed selection is untouched while hidden
                expect(Cypress.$(commonWidgetSelector.draggableWidget('texta')).text().trim()).to.eq(labels[2]);
                expect(Cypress.$(commonWidgetSelector.draggableWidget('textb')).text().trim()).to.eq(labels[1]);
            });

            cy.get(`${commonWidgetSelector.draggableWidget('gate')} input`).clear({ scrollBehavior: 'center' });
            cy.get(dropdownV2Selector.root('dda')).should('not.have.class', 'invisible');
            cy.document().should(() => {
                expect(box('texta').top, 'texta restored').to.be.closeTo(before.texta, PX);
                expect(box('textb').top, 'textb unchanged').to.be.closeTo(before.textb, PX);
                expect(before.texta - box('dda').bottom, 'gap restored').to.be.closeTo(20, PX);
            });
            // the selection the user made is still shown and exposed
            expectDropdownValue('dda', labels[2]);
            expectDropdownValue('ddb', labels[1]);
            cy.get(commonWidgetSelector.draggableWidget('texta')).should('have.text', labels[2]);
        });

        // ── DropdownV2-BRW-004 ───────────────────────────────────────────────
        // useMenuWidth.js:11-51 — matchField: width = trigger width; matchContent: max(content, trigger), content
        // capped at 520px (DropdownV2.jsx:348-373) and max-width min(520px, 100vw − 24px); custom: the given width,
        // max-width calc(100vw − 24px). styles.menuWidthMode / menuCustomWidth: dropdownV2.js:321-348.
        it('[DropdownV2-BRW-004] Match-field menu takes the field width and starts at the field', () => {
            addDropdownsViaApi([{ name: 'ddfield', layout: { top: 40, left: 2, width: 10, height: 40 } }]);
            visitDropdownApp(dropdownV2Selector.field('ddfield'));
            openDropdownMenu('ddfield');
            dropdownState('ddfield', (s) => {
                expect(s.menu.width, 'menu width = field width').to.be.closeTo(s.field.width, 1);
                expect(s.menu.left, 'menu starts at the field').to.be.closeTo(s.field.left, 1);
                expect(s.menu.top, 'menu opens below the field').to.be.gte(s.field.bottom - 1);
            });
        });

        it('[DropdownV2-BRW-004] Match-content menu fits the longest option, never narrower than the field, capped at 520px', () => {
            // dynamic: a label wider than the narrow field but well under the cap (≈ 40 chars ≈ 300px)
            const wide = Array.from({ length: 4 }, () => fake.fullName).join(' ').slice(0, 40).trim();
            // dynamic: a label far wider than the 520px cap
            const huge = Array.from({ length: 12 }, () => fake.fullName).join(' ');
            const short = words(2);
            const mode = { menuWidthMode: { value: T.menuWidthMatchContent } }; // source: dropdownV2.js:330
            addDropdownsViaApi([
                { name: 'ddwide', layout: { top: 40, left: 2, width: 6, height: 40 }, styles: mode, properties: { options: dropdownOptions([wide, short[0]]) } },
                { name: 'ddhuge', layout: { top: 120, left: 2, width: 6, height: 40 }, styles: mode, properties: { options: dropdownOptions([huge, short[0]]) } },
                { name: 'ddshort', layout: { top: 200, left: 2, width: 14, height: 40 }, styles: mode, properties: { options: dropdownOptions(short) } },
            ]);
            visitDropdownApp(dropdownV2Selector.field('ddwide'));

            openDropdownMenu('ddwide');
            dropdownState('ddwide', (s) => {
                expect(s.menu.width, 'wider than the field').to.be.gt(s.field.width + 10);
                expect(s.menu.width, 'under the cap').to.be.lt(T.matchContentCap);
                const row = s.menu.options.find((o) => o.text === wide);
                expect(row, 'long option rendered').to.exist;
                expect(row.labelTruncated, 'long option shown in full').to.eq(false);
            });
            closeDropdownMenu('ddwide');

            openDropdownMenu('ddhuge');
            dropdownState('ddhuge', (s) => {
                expect(s.menu.width, 'capped at 520px').to.be.closeTo(T.matchContentCap, 1);
                expect(s.menu.options.find((o) => o.text === huge).labelTruncated, 'over-cap label truncates').to.eq(true);
            });
            closeDropdownMenu('ddhuge');

            openDropdownMenu('ddshort');
            dropdownState('ddshort', (s) => {
                expect(s.menu.width, 'short content falls back to the field width').to.be.closeTo(s.field.width, 1);
            });
        });

        it('[DropdownV2-BRW-004] Custom menu width applies the configured pixels', () => {
            const custom = 300; // dynamic: test width (default '256' — dropdownV2.js:473)
            addDropdownsViaApi([
                {
                    name: 'ddcustom',
                    layout: { top: 40, left: 2, width: 6, height: 40 },
                    styles: { menuWidthMode: { value: T.menuWidthCustom }, menuCustomWidth: { value: String(custom) } }, // source: dropdownV2.js:331
                },
            ]);
            visitDropdownApp(dropdownV2Selector.field('ddcustom'));
            openDropdownMenu('ddcustom');
            dropdownState('ddcustom', (s) => {
                expect(s.field.width, 'field narrower than the custom width').to.be.lt(custom - 10);
                expect(s.menu.width, 'custom width').to.be.closeTo(custom, 1);
                expect(s.menu.left, 'menu starts at the field').to.be.closeTo(s.field.left, 1);
            });
        });

        it('[DropdownV2-BRW-004] Wide custom and content menus never escape the viewport', () => {
            const huge = Array.from({ length: 12 }, () => fake.fullName).join(' '); // dynamic: > 520px label
            addDropdownsViaApi([
                // custom far wider than the viewport, field near the left edge
                { name: 'ddhuge', layout: { top: 40, left: 2, width: 10, height: 40 }, styles: { menuWidthMode: { value: T.menuWidthCustom }, menuCustomWidth: { value: '3000' } } },
                // custom 600px, field near the right edge
                { name: 'ddright', layout: { top: 120, left: 30, width: 10, height: 40 }, styles: { menuWidthMode: { value: T.menuWidthCustom }, menuCustomWidth: { value: '600' } } },
                // match-content (capped 520px), field near the right edge
                { name: 'ddcontent', layout: { top: 200, left: 33, width: 6, height: 40 }, styles: { menuWidthMode: { value: T.menuWidthMatchContent } }, properties: { options: dropdownOptions([huge]) } },
            ]);
            visitDropdownApp(dropdownV2Selector.field('ddhuge'));
            ['ddhuge', 'ddright', 'ddcontent'].forEach((name) => {
                cy.window().then((win) => win.scrollTo(0, 0));
                openDropdownMenu(name);
                dropdownState(name, (s) => {
                    expect(s.menu.width, `${name}: menu width clamped to 100vw − 24px`).to.be.lte(s.viewport.innerWidth - T.viewportGutter + 1);
                    expect(s.menu.left, `${name}: menu left edge inside the viewport`).to.be.gte(0);
                    expect(s.menu.right, `${name}: menu right edge inside the viewport`).to.be.lte(s.viewport.clientWidth);
                    expect(s.viewport.scrollWidth, `${name}: the menu adds no horizontal page overflow`).to.be.lte(s.viewport.clientWidth);
                });
                closeDropdownMenu(name);
            });
        });

        // ── DropdownV2-BRW-005 ───────────────────────────────────────────────
        // CustomMenuList.jsx:30-35 virtualizes rows (@tanstack/react-virtual, estimate 40px, overscan 15) and
        // CustomMenuList.jsx:56-67 scrolls the first selected option to the centre once per open.
        const COUNT = 500; // dynamic: long list size
        const MAX_ROWS = 60; // a window, not the list: visible rows + 2 × overscan 15
        const longLabels = () => Array.from({ length: COUNT }, (_, i) => `${i} ${fake.firstName.slice(0, 8)}`); // dynamic
        const expectWindow = (s, labels, mustInclude) => {
            const idx = s.menu.options.map((o) => o.index);
            expect(idx.length, 'rendered rows').to.be.gt(3).and.lte(MAX_ROWS);
            expect(Math.max(...idx) - Math.min(...idx) + 1, 'rendered rows are contiguous').to.eq(idx.length);
            expect(idx, `row ${mustInclude} rendered`).to.include(mustInclude);
            s.menu.options.forEach((o) => expect(o.text, `row ${o.index} label`).to.eq(labels[o.index]));
            expect(s.menu.body.scrollHeight, 'scroller sized for the whole list').to.be.gt(COUNT * 30);
        };
        const expectRowVisible = (s, index) => {
            const row = s.menu.options.find((o) => o.index === index);
            expect(row, `row ${index}`).to.exist;
            expect(row.top, `row ${index} top in view`).to.be.gte(s.menu.body.top - 1);
            expect(row.bottom, `row ${index} bottom in view`).to.be.lte(s.menu.body.bottom + 1);
        };

        it('[DropdownV2-BRW-005] A long list renders only a window of rows, scrolls, and reveals the selection on open', () => {
            const SELECTED = 420; // dynamic: default deep in the list
            const labels = longLabels();
            addDropdownsViaApi([
                { name: 'ddlong', layout: { top: 40, left: 2, width: 10, height: 40 }, properties: { options: dropdownOptions(labels, labels[SELECTED]) } },
            ]);
            visitDropdownApp(dropdownV2Selector.field('ddlong'));
            expectDropdownValue('ddlong', labels[SELECTED]);

            openDropdownMenu('ddlong');
            dropdownState('ddlong', (s) => {
                expectWindow(s, labels, SELECTED);
                expect(s.menu.options.map((o) => o.index), 'first row not rendered').to.not.include(0);
                expect(s.menu.body.scrollTop, 'scrolled to the selection').to.be.gt(0);
                expectRowVisible(s, SELECTED);
                expect(s.menu.options.find((o) => o.index === SELECTED).checkFill, 'selected row carries the check mark').to.not.eq(null);
            });

            scrollDropdownMenuTo('top');
            dropdownState('ddlong', (s) => {
                expect(s.menu.body.scrollTop, 'scroller at the top').to.eq(0);
                expectWindow(s, labels, 0);
                expectRowVisible(s, 0);
                expect(s.menu.options.map((o) => o.index), 'selection row recycled').to.not.include(SELECTED);
            });

            scrollDropdownMenuTo('bottom');
            dropdownState('ddlong', (s) => {
                expectWindow(s, labels, COUNT - 1);
                expectRowVisible(s, COUNT - 1);
            });
            // a row picked from the scrolled-in window selects the right option
            pickDropdownOption(labels[COUNT - 3]);
            expectDropdownValue('ddlong', labels[COUNT - 3]);

            // a fresh open reveals the new selection
            openDropdownMenu('ddlong');
            dropdownState('ddlong', (s) => {
                expectWindow(s, labels, COUNT - 3);
                expectRowVisible(s, COUNT - 3);
            });
        });

        // align:'center' cannot centre the last row; the scroller must still end with that row fully visible.
        it('[DropdownV2-BRW-005] Reopening with the last option selected reveals that row completely', () => {
            const labels = longLabels();
            addDropdownsViaApi([
                { name: 'ddlast', layout: { top: 40, left: 2, width: 10, height: 40 }, properties: { options: dropdownOptions(labels, labels[COUNT - 1]) } },
            ]);
            visitDropdownApp(dropdownV2Selector.field('ddlast'));
            expectDropdownValue('ddlast', labels[COUNT - 1]);
            openDropdownMenu('ddlast');
            dropdownState('ddlast', (s) => {
                expectWindow(s, labels, COUNT - 1);
                expectRowVisible(s, COUNT - 1);
            });
        });
    });
});
