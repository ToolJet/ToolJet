/**
 * SPEC — Time Picker — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo) + the geometry / dynamic-height half of TESTING.md browser scenario:
 *   TimePicker-BRW-002 — the time-selector popup geometry: react-datepicker time-only popup (showTimeSelectOnly,
 *                        TimePicker.jsx:165-185) portalled into #component-portal, placement bottom-start, offset -7,
 *                        no flip (BaseDateComponent.jsx:196-207); the hour / minute (/ am-pm) columns sit side by side
 *                        inside the popup and scroll on their own with the auto-hiding overlay scrollbar
 *                        (TimepickerInput.jsx:15-110) — a wheel over a column scrolls the column, not the page.
 *                        Dynamic height = Collapse when hidden (timepicker.js:82-87): a hidden picker gives its space
 *                        back to the widgets under it in a running app.
 *                        (Typing / parsing → userflow.cy.js.)
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * addTimePickersViaApi, timeColumnState, openDateAppInViewer, openDatePopup, datePopupBoxes, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { timePickerSelector as S } from "Selectors/appBuilder/components/timePicker";
import { timePickerText as T } from "Texts/appBuilder/components/timePicker";
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
import { addTimePickersViaApi, timeColumnState } from "Support/utils/appBuilder/components/timePicker";
import {
    pinBrowserTimezone,
    openDateAppInViewer,
    openDatePopup,
    datePopupBoxes,
} from "Support/utils/appBuilder/components/dateTimeCommon";

const PX = 1.5; // sub-pixel / border tolerance

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Time Picker — canvas facet', { testIsolation: false }, () => {
    describe('canvas operations', () => {
        const W = T.defaultWidgetName;
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-TimePicker-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it('drag-and-drop places the widget', () => {
            cy.get(commonWidgetSelector.draggableWidget(W)).should('exist');
            cy.get(S.input(W)).should('have.value', T.defaultValue); // timepicker.js:375
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
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'starttime'); // asserts new name internally
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

    describe('popup geometry and dynamic height (running app)', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-TimePicker-canvas-${Cypress._.uniqueId()}`);
            pinBrowserTimezone(T.browserTimezone);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        const close = () => {
            // an outside click closes the popup
            cy.get('body').click(1100, 700, { force: true });
            cy.get(P.popup).should('not.exist');
        };

        // the shared geometry contract of an open time popup, in any context; `columns` = 2 (24h) or 3 (12h)
        const expectTimePopupGeometry = (input, columns, context) => {
            cy.get(S.timePopup).should('exist');
            cy.get(S.timeOnlyDialog).should('exist'); // time-only: no month grid
            datePopupBoxes(input, (b) => {
                expect(b.popup, `${context}: popup rendered`).to.not.eq(null);
                expect(b.month, `${context}: no month grid`).to.eq(null);
                // bottom-start: left edges aligned, top right under the field (offset -7 → small gap/overlap)
                expect(b.popup.left, `${context}: popup left = field left`).to.be.closeTo(b.input.left, 2);
                expect(b.popup.top - b.input.bottom, `${context}: popup hugs the field bottom`).to.be.within(-8, 8);
                // the time panel fills the popup; nothing spills out of it or out of the viewport
                expect(b.time.left, `${context}: time panel left`).to.be.gte(b.popup.left - PX);
                expect(b.time.right, `${context}: time panel right`).to.be.lte(b.popup.right + PX);
                expect(b.time.bottom, `${context}: time panel bottom`).to.be.lte(b.popup.bottom + PX);
                expect(b.timeBody.scrollWidth, `${context}: columns fit without horizontal scroll`).to.be.lte(b.timeBody.clientWidth + 1);
                expect(b.popup.right, `${context}: inside viewport (x)`).to.be.lte(b.viewport.width);
                expect(b.popup.bottom, `${context}: inside viewport (y)`).to.be.lte(b.viewport.height);
            });
            // the columns sit side by side, same top, each inside the popup, each a vertical scroller
            cy.get(S.timePopup).then(($p) => {
                const popup = $p[0].getBoundingClientRect();
                timeColumnState().then((cols) => {
                    expect(cols, `${context}: column count`).to.have.length(columns);
                    cols.forEach((c, i) => {
                        expect(c.col.left, `${context}: column ${i} inside popup (left)`).to.be.gte(popup.left - PX);
                        expect(c.col.right, `${context}: column ${i} inside popup (right)`).to.be.lte(popup.right + PX);
                        expect(c.col.bottom, `${context}: column ${i} inside popup (bottom)`).to.be.lte(popup.bottom + PX);
                        expect(c.col.top, `${context}: column ${i} top aligned`).to.be.closeTo(cols[0].col.top, PX);
                        if (i > 0) expect(c.col.left, `${context}: column ${i} right of column ${i - 1}`).to.be.gte(cols[i - 1].col.right - PX);
                    });
                    // hours (24 or 12 items) and minutes (60) overflow → scroll inside the column
                    expect(cols[0].scrollHeight, `${context}: hours scroll`).to.be.gt(cols[0].clientHeight);
                    expect(cols[1].scrollHeight, `${context}: minutes scroll`).to.be.gt(cols[1].clientHeight);
                });
            });
        };

        // ── TimePicker-BRW-002 (geometry) ────────────────────────────────────
        it('[TimePicker-BRW-002] The time popup opens under the field with side-by-side columns, in the editor and the running app', () => {
            addTimePickersViaApi([
                // dynamic: fixed explicit times; 24-hour default format and a 12-hour (three columns) variant
                { name: 'h24', layout: { top: 40, left: 2, width: 10, height: 40 }, properties: { defaultValue: { value: '10:30' } } },
                {
                    name: 'h12',
                    layout: { top: 40, left: 20, width: 10, height: 40 },
                    properties: { timeFormat: { value: 'hh:mm A' }, defaultValue: { value: '09:05 AM' } },
                },
            ]);

            cy.openApp('', undefined, undefined, S.input('h24'));
            openDatePopup(S.input('h24'));
            expectTimePopupGeometry(S.input('h24'), 2, 'editor, 24h');
            close();

            openDateAppInViewer(S.input('h24'));
            openDatePopup(S.input('h24'));
            expectTimePopupGeometry(S.input('h24'), 2, 'viewer, 24h');
            close();
            openDatePopup(S.input('h12'));
            expectTimePopupGeometry(S.input('h12'), 3, 'viewer, 12h');
            close();
        });

        // ── TimePicker-BRW-002 (column scrolling) ────────────────────────────
        it('[TimePicker-BRW-002] A wheel over a time column scrolls that column only; its overlay thumb follows', () => {
            addTimePickersViaApi([
                { name: 'tp', layout: { top: 40, left: 2, width: 10, height: 40 }, properties: { defaultValue: { value: '10:30' } } },
            ]);
            openDateAppInViewer(S.input('tp'));
            openDatePopup(S.input('tp'));
            cy.window().then((win) => cy.wrap(win.scrollY).as('pageY'));
            timeColumnState().then((before) => {
                expect(before[1].scrollTop, 'minutes start at the top').to.eq(0);
                expect(before[1].scrolling, 'scrollbar hidden at rest').to.eq(false);
                cy.get(P.timeColumn).eq(1).realMouseWheel({ deltaY: 300, scrollBehavior: false });
                cy.get(P.timeColumn).eq(1).should(($c) => expect($c[0].scrollTop, 'minutes scrolled').to.be.gt(0));
                timeColumnState().then((after) => {
                    expect(after[0].scrollTop, 'hours column untouched').to.eq(before[0].scrollTop);
                    expect(after[1].thumb.top, 'minutes thumb moved down').to.be.gt(before[1].thumb.top);
                    expect(after[1].thumb.bottom, 'thumb stays inside the column').to.be.lte(after[1].col.bottom + PX);
                    expect(after[1].scrolling, 'scrollbar shown while scrolling').to.eq(true);
                });
            });
            cy.get('@pageY').then((pageY) => cy.window().its('scrollY').should('eq', pageY)); // the page did not scroll
            cy.get(P.calendar).should('be.visible'); // scrolling keeps the popup open
        });

        // ── TimePicker-BRW-002 (dynamic height) ──────────────────────────────
        // properties.collapseWhenHidden on + visibility off: the picker is taken out of flow in a running app and
        // the Text below moves up by its height; lane B (collapse off) is the control and keeps its place.
        it('[TimePicker-BRW-002] Collapse when hidden: a hidden picker gives its height back in the running app; showing it restores the layout', () => {
            const hideWord = fake.firstName.toLowerCase() || 'hide'; // dynamic: typed to hide both pickers
            const visibility = { value: `{{components.toggler.value !== "${hideWord}"}}` };
            const H = 40; // timepicker.js:9 default height (px)
            const GAP = 20; // dynamic: authored gap between each picker and the Text below it
            addTimePickersViaApi([
                { type: 'TextInput', name: 'toggler', layout: { top: 10, left: 32, width: 8, height: 40 } },
                {
                    name: 'collapsing',
                    layout: { top: 100, left: 2, width: 10, height: H },
                    properties: { collapseWhenHidden: { value: '{{true}}' }, visibility },
                },
                { type: 'Text', name: 'texta', layout: { top: 100 + H + GAP, left: 2, width: 8, height: 40 }, properties: { text: { value: 'A' } } },
                { name: 'keeping', layout: { top: 100, left: 16, width: 10, height: H }, properties: { visibility } },
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
