/**
 * SPEC — Date Picker — canvas facet.
 * FOR AI: 11 always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/
 * delete+undo) + the dynamic-height part of TESTING.md browser scenario:
 *   DatePickerV2-BRW-002 — dynamic height = Collapse when hidden (datepickerV2.js:94-99, PR 15993): in the editor a
 *                          hidden picker keeps a collapsed, dashed-marked slot; in a running app it is display:none
 *                          and gives its space back to the widgets under it. (Typing/parsing → userflow.cy.js;
 *                          timezone display → contexts.cy.js.)
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * addDatePickersViaApi, openDateAppInViewer, pinBrowserTimezone.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { datePickerV2Selector as S } from "Selectors/appBuilder/components/datePickerV2";
import { datePickerV2Text as T } from "Texts/appBuilder/components/datePickerV2";
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
import { addDatePickersViaApi } from "Support/utils/appBuilder/components/datePickerV2";
import { pinBrowserTimezone, openDateAppInViewer } from "Support/utils/appBuilder/components/dateTimeCommon";

const PX = 1.5; // sub-pixel / border tolerance

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe('Date Picker — canvas facet', { testIsolation: false }, () => {
    describe('canvas operations', () => {
        const W = T.defaultWidgetName;
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DatePickerV2-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
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
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get('.moveable-area').should('exist');
        });

        it('rename via ⋮ menu', () => {
            renameWidgetFromMenu(W, 'duedate'); // asserts new name internally
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

    describe('dynamic height (editor vs running app)', () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-DatePickerV2-canvas-${Cypress._.uniqueId()}`);
            pinBrowserTimezone(T.browserTimezone);
        });

        afterEach(() => {
            cy.apiLogin();
            cy.apiDeleteApp();
        });

        // ── DatePickerV2-BRW-002 (dynamic height) ────────────────────────────
        // properties.collapseWhenHidden on + visibility off (datepickerV2.js:94-99, PR 15993). Lane A collapses,
        // lane B (collapse off) is the control. Editor: the hidden picker keeps a 0-height slot marked by a dashed
        // top border (WidgetWrapper.jsx gridOuterStyle) and nothing reflows; running app: display:none and the Text under lane A moves
        // up by the picker height while lane B keeps its place.
        it('[DatePickerV2-BRW-002] Collapse when hidden: the editor marks the hidden slot, the running app gives the height back', () => {
            const hideWord = fake.firstName.toLowerCase().replace(/[^a-z]/g, '') || 'hide'; // dynamic: typed to hide both pickers
            const visibility = { value: `{{components.toggler.value !== "${hideWord}"}}` };
            const H = T.defaultSize.height; // datepickerV2.js:8 default height (px)
            const GAP = 20; // dynamic: authored gap between each picker and the Text below it
            addDatePickersViaApi([
                { type: 'TextInput', name: 'toggler', layout: { top: 100, left: 32, width: 8, height: 40 } }, // beside the lanes: the editor header covers the canvas top
                {
                    name: 'collapsing',
                    layout: { top: 100, left: 2, width: 10, height: H },
                    properties: { collapseWhenHidden: { value: '{{true}}' }, visibility },
                },
                { type: 'Text', name: 'texta', layout: { top: 100 + H + GAP, left: 2, width: 8, height: 40 }, properties: { text: { value: 'A' } } },
                { name: 'keeping', layout: { top: 100, left: 16, width: 10, height: H }, properties: { visibility } },
                { type: 'Text', name: 'textb', layout: { top: 100 + H + GAP, left: 16, width: 8, height: 40 }, properties: { text: { value: 'B' } } },
            ]);
            const box = (doc, n) => doc.querySelector(commonWidgetSelector.draggableWidget(n)).getBoundingClientRect();
            const rel = (doc, n) => box(doc, n).top - box(doc, 'toggler').top; // against a widget that never moves
            const togglerInput = `${commonWidgetSelector.draggableWidget('toggler')} input`;
            // the WidgetWrapper element around a RenderWidget box (ele-<id>)
            const wrapperOf = (doc, n) => doc.querySelector(commonWidgetSelector.draggableWidget(n)).closest('[class*="ele-"]');

            // ── editor ──
            cy.openApp('', undefined, undefined, S.input('collapsing'));
            // the editor canvas settles into the authored layout first (widgets slide in on load)
            const AUTHORED = H + GAP; // each Text sits H + GAP under its picker's top
            const expectAuthoredLayout = (doc, context) => {
                expect(box(doc, 'collapsing').top, `${context}: toggler and pickers share a row`).to.be.closeTo(box(doc, 'toggler').top, PX);
                expect(rel(doc, 'texta'), `${context}: lane A Text at its authored place`).to.be.closeTo(AUTHORED, PX);
                expect(rel(doc, 'textb'), `${context}: lane B Text at its authored place`).to.be.closeTo(AUTHORED, PX);
            };
            cy.document().should((doc) => {
                expectAuthoredLayout(doc, 'editor');
                expect(box(doc, 'collapsing').height, 'editor: picker full height').to.be.closeTo(H, 2);
            });
            cy.get(togglerInput).type(hideWord, { scrollBehavior: 'center' });
            cy.document().should((doc) => {
                const wrapper = wrapperOf(doc, 'collapsing');
                const style = getComputedStyle(wrapper);
                expect(style.display, 'editor: hidden picker slot still in the DOM').to.eq('block');
                expect(wrapper.getBoundingClientRect().height, 'editor: slot collapsed to its border').to.be.lte(2);
                expect(style.borderTopStyle, 'editor: dashed marker on the authored position').to.eq('dashed');
                expect(getComputedStyle(wrapperOf(doc, 'keeping')).borderTopStyle, 'editor: lane B marked too').to.eq('dashed');
                // the editor does not reflow: the Text under the collapsing picker keeps its authored place
                expect(rel(doc, 'texta'), 'editor: lane A Text not pulled up').to.be.closeTo(AUTHORED, PX);
                expect(rel(doc, 'textb'), 'editor: lane B Text in place').to.be.closeTo(AUTHORED, PX);
            });
            cy.get(togglerInput).clear({ scrollBehavior: 'center' });
            cy.get(S.input('collapsing')).should('be.visible');
            cy.document().should((doc) => expectAuthoredLayout(doc, 'editor, shown again'));
            cy.waitForAutoSave();

            // ── running app ──
            openDateAppInViewer(S.input('collapsing'));
            let before;
            cy.document().should((doc) => {
                expectAuthoredLayout(doc, 'viewer');
                const picker = box(doc, 'collapsing');
                const top0 = box(doc, 'toggler').top;
                before = { texta: rel(doc, 'texta'), textb: rel(doc, 'textb'), picker: picker.top - top0 };
                expect(before.texta - (picker.bottom - top0), 'authored gap under the picker').to.be.closeTo(GAP, 4);
            });

            cy.get(togglerInput).type(hideWord, { scrollBehavior: 'center' });
            cy.get(S.input('collapsing')).should('not.be.visible');
            cy.get(S.input('keeping')).should('not.be.visible');
            cy.document().should((doc) => {
                expect(getComputedStyle(wrapperOf(doc, 'collapsing')).display, 'viewer: hidden picker not displayed').to.eq('none');
                expect(before.texta - rel(doc, 'texta'), 'lane A: Text moved up by the picker height').to.be.gte(H - 4);
                expect(rel(doc, 'texta'), 'lane A: Text not above the picker slot').to.be.gte(before.picker - PX);
                expect(rel(doc, 'textb'), 'lane B (no collapse): Text keeps its place').to.be.closeTo(before.textb, PX);
            });

            cy.get(togglerInput).clear({ scrollBehavior: 'center' });
            cy.get(S.input('collapsing')).should('be.visible');
            cy.document().should((doc) => {
                expect(rel(doc, 'texta'), 'lane A restored').to.be.closeTo(before.texta, PX);
                expect(rel(doc, 'textb'), 'lane B unchanged').to.be.closeTo(before.textb, PX);
            });
        });
    });
});
