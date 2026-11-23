/**
 * SPEC — Popover Menu — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo)
 * + browser-only geometry scenarios from TESTING.md:
 *   PopoverMenu-BRW-002 — the menu repositions to avoid clipping at the viewport edge (Radix avoidCollisions +
 *                         collisionPadding 8, PopoverMenu.jsx:222-224) and its option list scrolls internally past
 *                         323px (CustomOptions.jsx:132)
 *   PopoverMenu-BRW-004 — dragging / resizing the widget on the editor canvas does not leave a stale or mispositioned
 *                         menu portal
 * Observed contract (BRW-004): a drag that starts ON the trigger keeps the menu open (the press is not an outside
 * interaction) and the menu follows the trigger during and after the drag; a drag from the box edge or a resize-handle
 * press is an outside interaction and closes it (the portal unmounts). Positions are measured against #real-canvas.
 * Seeded apps go through the components API (addPopoverMenusViaApi).
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * moveMouseAway, addPopoverMenusViaApi, popoverMenuOptions, openPopoverMenuInViewer, openPopoverMenu,
 * closePopoverMenu, popoverMenuState, readPopoverMenuState.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { popoverMenuSelector as S } from "Selectors/appBuilder/components/popoverMenu";
import { popoverMenuText as T } from "Texts/appBuilder/components/popoverMenu";
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
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";
import {
    addPopoverMenusViaApi,
    popoverMenuOptions,
    openPopoverMenuInViewer,
    openPopoverMenu,
    closePopoverMenu,
    popoverMenuState,
    readPopoverMenuState,
} from "Support/utils/appBuilder/components/popoverMenu";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const W = T.defaultWidgetName;
const PX = 2; // sub-pixel + one-frame tolerance for anchored positions
const GAP = T.sideOffset + 2; // sideOffset 2 (PopoverMenu.jsx:212) + margin-top 2px (popoverMenu.scss:12)
const noScroll = { scrollBehavior: false };
// dynamic: 20 rows (≈ 32px each) — far more than the 323px list cap
const manyLabels = () => Array.from({ length: 20 }, (_, i) => `${fake.firstName.slice(0, 6)} ${i}`);

// the open menu sits right under the trigger, left-aligned with it (side bottom, align start)
const expectAnchoredBelow = (s, at) => {
    expect(s.menu, `${at}: menu open`).to.not.eq(null);
    expect(s.portals, `${at}: one menu portal`).to.eq(1);
    expect(s.menu.side, `${at}: side`).to.eq('bottom'); // source: PopoverMenu.jsx:222
    expect(s.menu.left, `${at}: menu left = trigger left`).to.be.closeTo(s.trigger.left, PX); // source: PopoverMenu.jsx:213 align start
    expect(s.menu.top - s.trigger.bottom, `${at}: menu right under the trigger`).to.be.within(0, GAP + PX);
};

// widget position relative to the canvas (real mouse events can scroll the page)
const offsetOnCanvas = (s) => ({ x: s.trigger.left - s.canvas.left, y: s.trigger.top - s.canvas.top });

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Popover Menu — canvas facet', { testIsolation: false }, () => {
    describe('dropped widget', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-PopoverMenu-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget with its label and default options', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            verifyWidgetCount(T.widgetPrefix, 1);
            cy.get(S.triggerLabel(W)).should('have.text', T.defaultLabel); // source: popoverMenu.js:320
            openPopoverMenu(W);
            popoverMenuState(W, (s) =>
                expect(s.menu.options.map((o) => o.text), 'default rows').to.deep.eq(T.defaultOptionLabels)); // source: popoverMenu.js:332,342,352
            closePopoverMenu(W);
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
            closeQueryPanel();

            multiSelectWidgets([W, `${T.widgetPrefix}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'actionsmenu'); // asserts new name internally
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });

        it('delete via ⋮ menu, undo restores, redo removes', () => {
            deleteWidgetFromMenu(W);
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
            undo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            // undo re-selects the restored widget; give the canvas keyboard focus back before the redo chord
            cy.forceClickOnCanvas();
            redo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should('not.exist');
        });
    });

    describe('seeded apps', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-PopoverMenu-canvas-${Cypress._.uniqueId()}`);
        });

        afterEach(() => {
            moveMouseAway();
            cy.apiDeleteApp();
        });

        // ── PopoverMenu-BRW-002 — vertical collision + 323px clamp ──────────
        it('[PopoverMenu-BRW-002] A long menu opens below a trigger with room, flips above a trigger at the viewport bottom, and its list scrolls inside 323px', () => {
            const labels = manyLabels();
            addPopoverMenusViaApi([
                { name: 'pmtop', layout: { top: 40, left: 2 }, properties: { options: popoverMenuOptions(labels) } },
                // dynamic: near the bottom of the 960px viewport — less room below than the 323px list
                { name: 'pmbottom', layout: { top: 860, left: 2 }, properties: { options: popoverMenuOptions(labels) } },
                { name: 'pmshort', layout: { top: 40, left: 14 } }, // the 3 default options
            ]);
            openPopoverMenuInViewer(S.trigger('pmtop'));

            // room below → opens below, list capped at 323px and scrollable
            openPopoverMenu('pmtop', { real: true });
            popoverMenuState('pmtop', (s) => {
                expectAnchoredBelow(s, 'top trigger');
                expect(s.menu.list.maxHeight, 'list max-height').to.eq(`${T.listMaxHeight}px`); // source: CustomOptions.jsx:132
                expect(s.menu.list.overflowY, 'list overflow-y').to.eq('auto');
                expect(s.menu.list.clientHeight, 'list clamped to 323px').to.eq(T.listMaxHeight);
                expect(s.menu.list.scrollHeight, 'content taller than the cap').to.be.gt(T.listMaxHeight + 200);
                expect(s.menu.options.length, 'every row rendered').to.eq(labels.length);
                expect(s.menu.bottom, 'menu inside the viewport').to.be.lte(s.viewport.height - T.collisionPadding + PX);
                const last = s.menu.options[s.menu.options.length - 1];
                expect(last.top, 'last row starts below the visible list').to.be.gte(s.menu.list.bottom);
            });
            // a real wheel over the list scrolls the list (not the page) until the last row is in view
            cy.get(S.listbox).realMouseWheel({ deltaY: 2000, scrollBehavior: false });
            popoverMenuState('pmtop', (s) => {
                expect(s.menu.list.scrollTop, 'list scrolled to its end').to.be.closeTo(s.menu.list.scrollHeight - s.menu.list.clientHeight, PX);
                const last = s.menu.options[s.menu.options.length - 1];
                expect(last.text, 'last row').to.eq(labels[labels.length - 1]);
                expect(last.bottom, 'last row visible inside the list').to.be.within(s.menu.list.top, s.menu.list.bottom + PX);
                expectAnchoredBelow(s, 'top trigger after scrolling');
            });
            cy.get(S.option(labels.length - 1)).realClick(noScroll);
            cy.get(S.content).should('not.exist');

            // control: 3 rows are shorter than the cap → no internal scroll
            openPopoverMenu('pmshort', { real: true });
            popoverMenuState('pmshort', (s) => {
                expect(s.menu.list.clientHeight, 'short list below the cap').to.be.lt(T.listMaxHeight);
                expect(s.menu.list.scrollHeight, 'short list does not scroll').to.eq(s.menu.list.clientHeight);
            });
            closePopoverMenu('pmshort');

            // no room below → flips above the trigger, stays fully inside the viewport, keeps the 323px list
            readPopoverMenuState('pmbottom').then((s) =>
                expect(s.viewport.height - s.trigger.bottom, 'room below the bottom trigger').to.be.lt(T.listMaxHeight));
            openPopoverMenu('pmbottom', { real: true });
            popoverMenuState('pmbottom', (s) => {
                expect(s.menu.side, 'flipped side').to.eq('top');
                expect(s.trigger.top - s.menu.bottom, 'menu right above the trigger').to.be.within(0, GAP + PX);
                expect(s.menu.left, 'still left-aligned with the trigger').to.be.closeTo(s.trigger.left, PX);
                expect(s.menu.top, 'top edge inside the viewport').to.be.gte(T.collisionPadding - PX);
                expect(s.menu.bottom, 'bottom edge inside the viewport').to.be.lte(s.viewport.height);
                expect(s.menu.list.clientHeight, 'flipped list still clamped to 323px').to.eq(T.listMaxHeight);
            });
            closePopoverMenu('pmbottom');
        });

        // ── PopoverMenu-BRW-002 — horizontal collision ──────────────────────
        it('[PopoverMenu-BRW-002] A wide menu on a trigger at the right edge shifts left to stay 8px inside the viewport, keeping its width', () => {
            const customWidth = 400; // dynamic: wider than the 4-column trigger
            addPopoverMenusViaApi([
                // left + width = 43 columns → flush with the right edge of the canvas
                {
                    name: 'pmright',
                    layout: { top: 40, left: 39, width: 4 },
                    styles: { menuWidthMode: { value: T.menuWidthCustom }, menuCustomWidth: { value: String(customWidth) } }, // source: popoverMenu.js:258,264
                },
                {
                    name: 'pmleft',
                    layout: { top: 40, left: 2, width: 4 },
                    styles: { menuWidthMode: { value: T.menuWidthCustom }, menuCustomWidth: { value: String(customWidth) } },
                },
            ]);
            openPopoverMenuInViewer(S.trigger('pmright'));

            openPopoverMenu('pmleft', { real: true });
            popoverMenuState('pmleft', (s) => {
                expectAnchoredBelow(s, 'left trigger'); // control: room on the right → align start
                expect(s.menu.width, 'custom width').to.be.closeTo(customWidth, PX);
            });
            closePopoverMenu('pmleft');

            openPopoverMenu('pmright', { real: true });
            popoverMenuState('pmright', (s) => {
                expect(s.trigger.left + customWidth, 'align start would overflow the viewport').to.be.gt(s.viewport.width);
                expect(s.menu.width, 'custom width kept').to.be.closeTo(customWidth, PX);
                expect(s.menu.right, 'right edge = viewport − collision padding').to.be.closeTo(s.viewport.width - T.collisionPadding, PX); // source: PopoverMenu.jsx:224
                expect(s.menu.left, 'shifted left of the trigger').to.be.lt(s.trigger.left);
                expect(s.menu.side, 'still below').to.eq('bottom');
                expect(s.menu.top - s.trigger.bottom, 'still right under the trigger').to.be.within(0, GAP + PX);
            });
            closePopoverMenu('pmright');
        });

        // ── PopoverMenu-BRW-004 — drag with the menu open ───────────────────
        it('[PopoverMenu-BRW-004] Dragging the widget by its trigger with the menu open carries the menu along, anchored, during and after the drop', () => {
            addPopoverMenusViaApi([{ name: 'pm', layout: { top: 60, left: 4 } }]);
            cy.openApp('', undefined, undefined, S.trigger('pm'));
            closeQueryPanel();

            openPopoverMenu('pm', { real: true });
            readPopoverMenuState('pm').then((before) => {
                expectAnchoredBelow(before, 'opened');
                cy.get(S.trigger('pm')).realMouseDown(noScroll);
                cy.get(S.trigger('pm')).realMouseMove(30, 20, noScroll); // past the drag threshold first
                cy.get(S.trigger('pm')).realMouseMove(200, 150, noScroll);
                popoverMenuState('pm', (s) => {
                    expect(offsetOnCanvas(s).y - offsetOnCanvas(before).y, 'mid-drag: widget follows the pointer').to.be.gt(50);
                    expectAnchoredBelow(s, 'mid-drag');
                });
                cy.get(S.trigger('pm')).realMouseMove(260, 200, noScroll);
                cy.get(S.trigger('pm')).realMouseUp({ ...noScroll, x: 260, y: 200 });
                popoverMenuState('pm', (s) => {
                    const a = offsetOnCanvas(before);
                    const b = offsetOnCanvas(s);
                    expect(Math.abs(b.x - a.x) + Math.abs(b.y - a.y), 'dropped somewhere else').to.be.gt(100);
                    expect(s.trigger.ariaExpanded, 'menu still open after the drop').to.eq('true');
                    expectAnchoredBelow(s, 'after the drop');
                    expect(s.menu.width, 'still the trigger width').to.be.closeTo(before.menu.width, PX);
                });
            });
            // the dropped position is kept, and the menu stays usable there
            cy.get(S.option(0)).realClick(noScroll);
            cy.get(S.content).should('not.exist');
            popoverMenuState('pm', (s) => expect(s.portals, 'no portal left after picking').to.eq(0));
            openPopoverMenu('pm', { real: true });
            popoverMenuState('pm', (s) => expectAnchoredBelow(s, 'reopened at the new position'));
            closePopoverMenu('pm');
        });

        // ── PopoverMenu-BRW-004 — outside drag / resize close it ────────────
        it('[PopoverMenu-BRW-004] Dragging by the box edge or resizing closes the open menu without a stale portal; reopening anchors it to the new geometry', () => {
            addPopoverMenusViaApi([{ name: 'pm', layout: { top: 60, left: 4 } }]);
            cy.openApp('', undefined, undefined, S.trigger('pm'));
            closeQueryPanel();

            // drag from the box padding (outside the trigger)
            openPopoverMenu('pm', { real: true });
            readPopoverMenuState('pm').then((before) => {
                const edge = { ...noScroll, position: 'topLeft' };
                cy.get(S.draggableWidget('pm')).realMouseDown(edge);
                cy.get(S.draggableWidget('pm')).realMouseMove(100, 100, edge);
                cy.get(S.draggableWidget('pm')).realMouseMove(150, 150, edge);
                cy.get(S.draggableWidget('pm')).realMouseUp(edge);
                popoverMenuState('pm', (s) => {
                    const a = offsetOnCanvas(before);
                    const b = offsetOnCanvas(s);
                    expect(Math.abs(b.x - a.x) + Math.abs(b.y - a.y), 'widget moved').to.be.gt(100);
                    expect(s.trigger.ariaExpanded, 'menu closed').to.eq('false');
                    expect(s.menu, 'no menu').to.eq(null);
                    expect(s.portals, 'no stale portal').to.eq(0);
                });
            });
            openPopoverMenu('pm', { real: true });
            popoverMenuState('pm', (s) => expectAnchoredBelow(s, 'reopened after the move'));

            // resize from the SE handle with the menu open
            readPopoverMenuState('pm').then((before) => {
                cy.get(S.draggableWidget('pm')).then(($b) => {
                    const r = $b[0].getBoundingClientRect();
                    cy.resizeWidget('pm', r.right + 200, r.bottom); // width only: keep the trigger in view
                });
                popoverMenuState('pm', (s) => {
                    expect(s.trigger.width, 'trigger wider').to.be.gt(before.trigger.width + 100);
                    expect(s.menu, 'resize closed the menu').to.eq(null);
                    expect(s.portals, 'no stale portal').to.eq(0);
                });
                openPopoverMenu('pm', { real: true });
                popoverMenuState('pm', (s) => {
                    expectAnchoredBelow(s, 'reopened after the resize');
                    // matchField (popoverMenu.js:386) → the menu follows the resized trigger width
                    expect(s.menu.width, 'menu width follows the resize').to.be.gt(before.menu.width + 100);
                    expect(s.menu.width, 'menu width ≈ trigger width').to.be.closeTo(s.trigger.width, 8);
                });
                closePopoverMenu('pm');
            });
        });
    });
});
