/**
 * SPEC — Date Time Picker — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo) + the geometry / dynamic-height half of TESTING.md browser scenario:
 *   DatetimePickerV2-BRW-002 — the date/time popup geometry: react-datepicker portalled into #component-portal,
 *                              placement bottom-start with offset -7 and no flip (BaseDateComponent.jsx:196-207);
 *                              the time panel (customTimeInput, DatetimePickerV2.jsx:431) sits beside the month grid
 *                              at the popup's full height (2026-10-16 divider design); month / year mode keep the
 *                              anchor. Dynamic height = Collapse when hidden (datetimepickerV2.js:110-115, PR 15993):
 *                              a hidden picker gives its space back to the widgets under it in a running app.
 *                              (Month/year navigation behaviour → userflow.cy.js; timezone offsets → properties.cy.js.)
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * addDatetimePickersViaApi, openDateAppInViewer, openDatePopup, datePopupBoxes, readDatePopupBoxes, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { dateTimeCommonSelector as P } from "Selectors/appBuilder/components/dateTimeCommon";
import { datetimePickerV2Selector as S } from "Selectors/appBuilder/components/datetimePickerV2";
import { datetimePickerV2Text as T } from "Texts/appBuilder/components/datetimePickerV2";
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
import { addDatetimePickersViaApi } from "Support/utils/appBuilder/components/datetimePickerV2";
import {
    pinBrowserTimezone,
    openDateAppInViewer,
    openDatePopup,
    datePopupBoxes,
    readDatePopupBoxes,
} from "Support/utils/appBuilder/components/dateTimeCommon";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const PX = 1.5; // sub-pixel / border tolerance

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Date Time Picker — canvas facet', { testIsolation: false }, () => {
    describe('canvas operations', () => {
        const W = T.defaultWidgetName;
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DatetimePickerV2-canvas-${Cypress._.uniqueId()}`);
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
            renameWidgetFromMenu(W, 'meetingtime'); // asserts new name internally
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
            cy.apiCreateApp(`${fake.companyName}-DatetimePickerV2-canvas-${Cypress._.uniqueId()}`);
            pinBrowserTimezone(T.browserTimezone);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        // the shared geometry contract of an open popup, in any context
        const expectPopupGeometry = (input, context) =>
            datePopupBoxes(input, (b) => {
                expect(b.popup, `${context}: popup rendered`).to.not.eq(null);
                // bottom-start: left edges aligned, top right under the field (offset -7 → small gap/overlap)
                expect(b.popup.left, `${context}: popup left = field left`).to.be.closeTo(b.input.left, 2);
                expect(b.popup.top - b.input.bottom, `${context}: popup hugs the field bottom`).to.be.within(-8, 8);
                // month grid left, time panel right, same top and bottom → the divider spans the full height
                expect(b.time.left, `${context}: time panel right of the month grid`).to.be.closeTo(b.month.right, PX);
                expect(b.time.top, `${context}: time panel top`).to.be.closeTo(b.month.top, PX);
                expect(b.time.bottom, `${context}: time panel bottom`).to.be.closeTo(b.month.bottom, PX);
                expect(b.time.height, `${context}: time panel full popup height`).to.be.closeTo(b.calendar.height, 3);
                // nothing spills: both panes inside the popup, the time columns fit without horizontal scroll,
                // and the popup stays inside the viewport
                expect(b.month.left, `${context}: grid inside popup`).to.be.gte(b.popup.left - PX);
                expect(b.time.right, `${context}: time inside popup`).to.be.lte(b.popup.right + PX);
                expect(b.timeBody.scrollWidth, `${context}: time columns fit`).to.be.lte(b.timeBody.clientWidth + 1);
                expect(b.popup.right, `${context}: inside viewport (x)`).to.be.lte(b.viewport.width);
                expect(b.popup.bottom, `${context}: inside viewport (y)`).to.be.lte(b.viewport.height);
            });

        // ── DatetimePickerV2-BRW-002 (geometry) ──────────────────────────────
        it('[DatetimePickerV2-BRW-002] The popup opens under the field with the time panel beside the calendar, in the editor and the running app', () => {
            addDatetimePickersViaApi([
                // dynamic: fixed explicit dates; 24-hour default format and a 12-hour (three time columns) variant
                { name: 'h24', layout: { top: 40, left: 2, width: 10, height: 40 }, properties: { defaultValue: { value: '15/06/2026 10:30' } } },
                {
                    name: 'h12',
                    layout: { top: 40, left: 20, width: 10, height: 40 },
                    properties: { timeFormat: { value: 'hh:mm A' }, defaultValue: { value: '15/06/2026 09:05 AM' } },
                },
            ]);
            const close = () => {
                // an outside click closes the popup (the input ignores react-datepicker's Escape handler)
                cy.get('body').click(1100, 700, { force: true });
                cy.get(P.popup).should('not.exist');
            };

            cy.openApp('', undefined, undefined, S.input('h24'));
            openDatePopup(S.input('h24'));
            expectPopupGeometry(S.input('h24'), 'editor, 24h');
            close();

            openDateAppInViewer(S.input('h24'));
            ['h24', 'h12'].forEach((name) => {
                openDatePopup(S.input(name));
                expectPopupGeometry(S.input(name), `viewer, ${name}`);
                if (name === 'h24') {
                    // switching to month and year mode keeps the popup anchored where it opened
                    readDatePopupBoxes(S.input(name)).then((date) => {
                        cy.get(P.monthSelector).click();
                        cy.get(P.popup).should('have.class', 'react-datepicker-month-component');
                        datePopupBoxes(S.input(name), (b) => {
                            expect(b.time, 'month mode: no time panel').to.eq(null);
                            expect(b.popup.left, 'month mode: same left').to.be.closeTo(date.popup.left, PX);
                            expect(b.popup.top, 'month mode: same top').to.be.closeTo(date.popup.top, PX);
                        });
                        cy.get(P.yearSelector).click();
                        cy.get(P.popup).should('have.class', 'react-datepicker-year-component');
                        datePopupBoxes(S.input(name), (b) => {
                            expect(b.popup.left, 'year mode: same left').to.be.closeTo(date.popup.left, PX);
                            expect(b.popup.top, 'year mode: same top').to.be.closeTo(date.popup.top, PX);
                        });
                    });
                }
                close();
            });
        });

        // ── DatetimePickerV2-BRW-002 (Escape) ────────────────────────────────
        // KNOWN PRODUCT BUG: pressing Escape with the popup open leaves it open — the user has to click outside to
        // close it. DatepickerInput.jsx (customInput of BaseDateComponent.jsx:209) never forwards the onKeyDown
        // react-datepicker passes to its custom input, so react-datepicker's Escape handling never runs.
        it('[DatetimePickerV2-BRW-002] Escape closes the open popup', () => {
            addDatetimePickersViaApi([
                // dynamic: fixed explicit date
                { name: 'esc', layout: { top: 40, left: 2, width: 10, height: 40 }, properties: { defaultValue: { value: '15/06/2026 10:30' } } },
            ]);
            openDateAppInViewer(S.input('esc'));
            openDatePopup(S.input('esc'));
            cy.get(S.input('esc')).should('be.focused');
            cy.realPress('Escape');
            cy.get(P.popup).should('not.exist');
        });

        // ── DatetimePickerV2-BRW-002 (dynamic height) ────────────────────────
        // properties.collapseWhenHidden on + visibility off: the picker is taken out of flow in a running app and
        // the Text below moves up by its height; lane B (collapse off) is the control and keeps its place.
        it('[DatetimePickerV2-BRW-002] Collapse when hidden: a hidden picker gives its height back in the running app; showing it restores the layout', () => {
            const hideWord = fake.firstName.toLowerCase() || 'hide'; // dynamic: typed to hide both pickers
            const visibility = { value: `{{components.toggler.value !== "${hideWord}"}}` };
            const H = 40; // datetimepickerV2.js:9 default height (px)
            const GAP = 20; // dynamic: authored gap between each picker and the Text below it
            addDatetimePickersViaApi([
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
