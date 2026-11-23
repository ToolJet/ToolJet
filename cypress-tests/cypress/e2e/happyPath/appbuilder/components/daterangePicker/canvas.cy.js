/**
 * SPEC — Date Range Picker — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo) + the geometry half of TESTING.md browser scenario:
 *   DaterangePicker-BRW-006 — the field is responsive: it fills the widget's width / height after a resize
 *                             (BaseDateComponent.jsx:76-85,184-189) and at any authored width; dynamic height =
 *                             Collapse when hidden (daterangepicker.js:112-117, PR b79c7e2254): a hidden picker gives its
 *                             space back to the widgets under it in a running app. The dual-month popup
 *                             (DaterangePicker.jsx:334 monthsShown 2) opens under the field, bottom-start, offset -7, no
 *                             flip (BaseDateComponent.jsx:200-207), both months side by side inside the viewport.
 *                             (The calendar closing after the end date → userflow.cy.js.)
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * addDaterangePickersViaApi, openDateAppInViewer, openDatePopup, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { daterangePickerSelector as S } from "Selectors/appBuilder/components/daterangePicker";
import { daterangePickerText as T } from "Texts/appBuilder/components/daterangePicker";
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
import { addDaterangePickersViaApi } from "Support/utils/appBuilder/components/daterangePicker";
import {
    pinBrowserTimezone,
    openDateAppInViewer,
    openDatePopup,
} from "Support/utils/appBuilder/components/dateTimeCommon";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const PX = 1.5; // sub-pixel / border tolerance

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Date Range Picker — canvas facet', { testIsolation: false }, () => {
    describe('canvas operations', () => {
        const W = T.defaultWidgetName;
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DaterangePicker-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
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
            cy.dragAndDropWidget(T.displayName, 650, 300);
            closeQueryPanel();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'bookingrange'); // asserts new name internally
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
    
        // ── DaterangePicker-BRW-006 (responsive field) ──────────────────────
        it('[DaterangePicker-BRW-006] Resizing the widget resizes the field: it fills the new width and height', () => {
            const fieldOf = (doc) => {
                const box = doc.querySelector(commonWidgetSelector.draggableWidget(W)).getBoundingClientRect();
                const input = doc.querySelector(S.input(W)).getBoundingClientRect();
                return { box, input };
            };
            let before;
            cy.get(S.input(W)).should('be.visible');
            cy.document().then((doc) => {
                const { box, input } = fieldOf(doc);
                before = { boxW: box.width, boxH: box.height, inputW: input.width, inputH: input.height };
                expect(input.right, 'field reaches the widget right edge').to.be.closeTo(box.right, 4);
            });
            getWidgetRect(W).then((r) => cy.resizeWidget(W, r.x + r.w + 160, r.y + r.h + 40));
            cy.document().should((doc) => {
                const { box, input } = fieldOf(doc);
                expect(box.width - before.boxW, 'widget grew wider').to.be.gt(60);
                expect(box.height - before.boxH, 'widget grew taller').to.be.gt(10);
                expect(input.width - before.inputW, 'field width follows the widget').to.be.closeTo(box.width - before.boxW, 4);
                expect(input.height - before.inputH, 'field height follows the widget').to.be.closeTo(box.height - before.boxH, 4);
                expect(input.right, 'field still reaches the widget right edge').to.be.closeTo(box.right, 4);
            });
        });
    });

    describe('popup geometry, field width and dynamic height (running app)', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DaterangePicker-canvas-${Cypress._.uniqueId()}`);
            pinBrowserTimezone(T.browserTimezone);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        // dynamic: fixed explicit range
        const range = { defaultStartDate: { value: '10/06/2026' }, defaultEndDate: { value: '14/06/2026' } };

        // the dual-month popup contract, in any context
        const expectDualPopupGeometry = (input, context) =>
            cy.document().should((doc) => {
                const rect = (el) => el.getBoundingClientRect();
                const field = rect(doc.querySelector(input));
                const popup = doc.querySelector(S.rangePopup);
                expect(popup, `${context}: range popup rendered`).to.not.eq(null);
                const p = rect(popup);
                const months = [...doc.querySelectorAll(P.monthContainer)].map(rect);
                expect(months, `${context}: two months`).to.have.length(2);
                // bottom-start: left edges aligned, top right under the field (offset -7 → small gap/overlap)
                expect(p.left, `${context}: popup left = field left`).to.be.closeTo(field.left, 2);
                expect(p.top - field.bottom, `${context}: popup hugs the field bottom`).to.be.within(-8, 8);
                // months side by side: same top, the second starts where the first ends, both inside the popup
                expect(months[1].top, `${context}: months on one row`).to.be.closeTo(months[0].top, PX);
                expect(months[1].left, `${context}: second month right of the first`).to.be.gte(months[0].right - PX);
                expect(months[0].left, `${context}: first month inside popup`).to.be.gte(p.left - PX);
                expect(months[1].right, `${context}: second month inside popup`).to.be.lte(p.right + PX);
                expect(p.right, `${context}: inside viewport (x)`).to.be.lte(doc.defaultView.innerWidth);
                expect(p.bottom, `${context}: inside viewport (y)`).to.be.lte(doc.defaultView.innerHeight);
            });

        // ── DaterangePicker-BRW-006 (popup geometry) ────────────────────────
        it('[DaterangePicker-BRW-006] The two-month calendar opens under the field, months side by side, in the editor and the running app', () => {
            addDaterangePickersViaApi([{ name: 'drp', layout: { top: 40, left: 2, width: 12, height: 40 }, properties: range }]);
            cy.openApp('', undefined, undefined, S.input('drp'));
            openDatePopup(S.input('drp'));
            expectDualPopupGeometry(S.input('drp'), 'editor');
            cy.get('body').click(1100, 700, { force: true });
            cy.get(P.popup).should('not.exist');

            openDateAppInViewer(S.input('drp'));
            openDatePopup(S.input('drp'));
            expectDualPopupGeometry(S.input('drp'), 'viewer');
        });

        // ── DaterangePicker-BRW-006 (responsive width) ──────────────────────
        it('[DaterangePicker-BRW-006] At any authored width the field fills the widget, keeping the label width', () => {
            addDaterangePickersViaApi([
                { name: 'narrow', layout: { top: 40, left: 2, width: 5, height: 40 }, properties: range },
                { name: 'wide', layout: { top: 120, left: 2, width: 24, height: 40 }, properties: range },
            ]);
            openDateAppInViewer(S.input('wide'));
            cy.document().should((doc) => {
                const measure = (name) => {
                    const box = doc.querySelector(commonWidgetSelector.draggableWidget(name)).getBoundingClientRect();
                    const input = doc.querySelector(S.input(name)).getBoundingClientRect();
                    return { box, input, labelW: input.left - box.left };
                };
                const n = measure('narrow');
                const w = measure('wide');
                expect(w.box.width, 'authored widths differ').to.be.gt(n.box.width * 2);
                [n, w].forEach((m, i) =>
                    expect(m.input.right, `${['narrow', 'wide'][i]}: field reaches the widget right edge`).to.be.closeTo(m.box.right, 4));
                expect(w.labelW, 'same label width at both sizes').to.be.closeTo(n.labelW, PX);
                expect(w.input.width - n.input.width, 'the field takes all the extra width').to.be.closeTo(w.box.width - n.box.width, 4);
            });
            // the narrow field truncates the display rather than overflowing the widget
            cy.get(S.input('narrow')).should('have.class', 'text-truncate').and(($i) =>
                expect($i[0].scrollWidth, 'narrow field content wider than the field').to.be.gt($i[0].clientWidth));
        });

        // ── DaterangePicker-BRW-006 (dynamic height) ────────────────────────
        // properties.collapseWhenHidden on + visibility off: the picker is taken out of flow in a running app and
        // the Text below moves up by its height; lane B (collapse off) is the control and keeps its place.
        it('[DaterangePicker-BRW-006] Collapse when hidden: a hidden picker gives its height back in the running app; showing it restores the layout', () => {
            const hideWord = fake.firstName.toLowerCase() || 'hide'; // dynamic: typed to hide both pickers
            const visibility = { value: `{{components.toggler.value !== "${hideWord}"}}` };
            const H = 40; // daterangepicker.js:8 default height (px)
            const GAP = 20; // dynamic: authored gap between each picker and the Text below it
            addDaterangePickersViaApi([
                { type: 'TextInput', name: 'toggler', layout: { top: 10, left: 32, width: 8, height: 40 } },
                {
                    name: 'collapsing',
                    layout: { top: 100, left: 2, width: 12, height: H },
                    properties: { ...range, collapseWhenHidden: { value: '{{true}}' }, visibility },
                },
                { type: 'Text', name: 'texta', layout: { top: 100 + H + GAP, left: 2, width: 8, height: 40 }, properties: { text: { value: 'A' } } },
                { name: 'keeping', layout: { top: 100, left: 16, width: 12, height: H }, properties: { ...range, visibility } },
                { type: 'Text', name: 'textb', layout: { top: 100 + H + GAP, left: 16, width: 8, height: 40 }, properties: { text: { value: 'B' } } },
            ]);
            openDateAppInViewer(S.input('collapsing'));
            const top = (doc, n) => doc.querySelector(`[data-cy="draggable-widget-${n}"]`).getBoundingClientRect().top;
            const rel = (doc, n) => top(doc, n) - top(doc, 'toggler'); // measured against a widget that never moves

            let before;
            cy.document().should((doc) => {
                const picker = doc.querySelector(commonWidgetSelector.draggableWidget('collapsing')).getBoundingClientRect();
                before = { texta: rel(doc, 'texta'), textb: rel(doc, 'textb'), picker: picker.top - top(doc, 'toggler') };
                expect(before.texta - (picker.bottom - top(doc, 'toggler')), 'authored gap under the picker').to.be.closeTo(GAP, 4);
            });

            cy.get(`${commonWidgetSelector.draggableWidget('toggler')} input`).type(hideWord);
            cy.get(S.input('collapsing')).should('not.be.visible');
            cy.get(S.input('keeping')).should('not.be.visible');
            cy.document().should((doc) => {
                expect(before.texta - rel(doc, 'texta'), 'lane A: Text moved up by the picker height').to.be.gte(H - 4);
                expect(rel(doc, 'texta'), 'lane A: Text not above the picker slot').to.be.gte(before.picker - PX);
                expect(rel(doc, 'textb'), 'lane B (no collapse): Text keeps its place').to.be.closeTo(before.textb, PX);
            });

            cy.get(`${commonWidgetSelector.draggableWidget('toggler')} input`).clear();
            cy.get(S.input('collapsing')).should('be.visible');
            cy.document().should((doc) => {
                expect(rel(doc, 'texta'), 'lane A restored').to.be.closeTo(before.texta, PX);
                expect(rel(doc, 'textb'), 'lane B unchanged').to.be.closeTo(before.textb, PX);
            });
        });
    });
});
