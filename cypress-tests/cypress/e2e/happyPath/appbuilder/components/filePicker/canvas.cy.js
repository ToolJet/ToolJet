/**
 * SPEC — File Picker — canvas facet.
 * FOR AI: always-on canvas ops (dnd/move/resize/nudge/duplicate/copy-paste/cut/multi-select/rename/delete+undo)
 * + the geometry part of the TESTING.md browser scenario (frontend/ee/test/app-builder/widgets/FilePicker):
 *   FilePicker-BRW-001 — useDynamicHeight's real layout reflow: a dynamic-height picker grows with its file list and
 *                        pushes the widgets below it down (and back), in the viewer only; the editor keeps the
 *                        authored box (FilePicker.jsx:74 `dynamicHeight && currentMode === 'view'`)
 * Dynamic-height apps are seeded through the components API (addFilePickersViaApi) and opened in the viewer.
 * Helpers: getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount, duplicateWidgetByKeyboard,
 * duplicateWidgetFromMenu, copyPasteWidget, cutWidget, pasteWidget, nudgeWidget, selectAllWidgets,
 * multiSelectWidgets, verifySelectedWidgetCount, renameWidgetFromMenu, deleteWidgetFromMenu, undo, redo,
 * openLinkAppInViewer, addFilePickersViaApi, pickerFiles, dropFiles, pickerMetrics, readPickerMetrics, removeFileRow.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { filePickerSelector as SEL } from "Selectors/appBuilder/components/filePicker";
import { filePickerText } from "Texts/appBuilder/components/filePicker";
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
    addFilePickersViaApi,
    pickerFiles,
    dropFiles,
    pickerMetrics,
    readPickerMetrics,
    removeFileRow,
} from "Support/utils/appBuilder/components/filePicker";

const T = filePickerText;
const W = T.defaultWidgetName;
const PX = 2; // layout tolerance (px)
const GAP = T.layoutGap;
const ROW = T.fileRowHeight; // style.scss .file-list-item height

const box = (name) => {
    const el = Cypress.$(commonWidgetSelector.draggableWidget(name))[0];
    expect(el, `widget ${name}`).to.exist;
    return el.getBoundingClientRect();
};

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run);
// each test re-creates its own app in beforeEach.
describe("File Picker — canvas facet", { testIsolation: false }, () => {
    describe("editor canvas", () => {
        const PREFIX = T.widgetPrefix;

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-FilePicker-canvas-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it("drag-and-drop places the widget", () => {
            cy.get(SEL.label(W)).should("have.text", T.defaultLabel); // source: filepicker.js:376
            cy.get(SEL.instruction(W)).should("have.text", T.defaultInstruction); // source: filepicker.js:377
            cy.get(commonWidgetSelector.draggableWidget(W)).should(($w) =>
                expect($w[0].getBoundingClientRect().height, "default height").to.be.closeTo(T.defaultSize.height, PX)); // source: filepicker.js:8
            verifyWidgetCount(PREFIX, 1);
        });

        it("move repositions the widget", () => {
            getWidgetRect(W).as("r0");
            cy.get("@r0").then((before) => {
                cy.moveComponent(W, 650, 450);
                verifyWidgetMoved(W, before);
            });
        });

        it("resize changes the widget dimensions", () => {
            getWidgetRect(W).as("r0");
            cy.get("@r0").then((before) => {
                cy.resizeWidget(W, before.x + before.w + 160, before.y + before.h + 90);
                verifyWidgetResized(W, before);
            });
        });

        it("nudge (arrow keys) moves the widget", () => {
            getWidgetRect(W).as("r0");
            cy.get("@r0").then((before) => {
                nudgeWidget(W, "ArrowRight", 12);
                verifyWidgetMoved(W, before);
            });
        });

        it("duplicate via keyboard (Cmd/Ctrl+D)", () => {
            duplicateWidgetByKeyboard(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it("duplicate via ⋮ menu", () => {
            duplicateWidgetFromMenu(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it("copy-paste (Cmd/Ctrl+C then +V)", () => {
            copyPasteWidget(W);
            verifyWidgetCount(PREFIX, 2);
        });

        it("cut removes the widget, paste restores it", () => {
            cutWidget(W); // asserts removal internally
            cy.forceClickOnCanvas();
            pasteWidget();
            cy.get(commonWidgetSelector.draggableWidget(W)).should("exist");
        });

        it("multi-select then select-all", () => {
            cy.get('[data-cy="right-sidebar-components-button"]').click();
            cy.dragAndDropWidget(T.displayName, 900, 200);
            cy.get('[data-cy="query-manager-toggle-button"]').click();

            multiSelectWidgets([W, `${PREFIX}2`]);
            verifySelectedWidgetCount(2);

            selectAllWidgets();
            verifySelectedWidgetCount(2);
            cy.get(".moveable-area").should("exist");
        });

        it("rename via ⋮ menu", () => {
            renameWidgetFromMenu(W, "attachments"); // asserts new name internally
            cy.get(commonWidgetSelector.draggableWidget(W)).should("not.exist");
        });

        it("delete via ⋮ menu, undo restores, redo removes", () => {
            deleteWidgetFromMenu(W);
            cy.get(commonWidgetSelector.draggableWidget(W)).should("not.exist");
            undo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should("exist");
            redo();
            cy.get(commonWidgetSelector.draggableWidget(W)).should("not.exist");
        });
    });

    describe("seeded apps (dynamic height)", () => {
        const authored = T.defaultSize.height; // source: filepicker.js:8
        const multi = {
            properties: { enableMultiple: { value: "{{true}}", fxActive: false } },
            validation: { maxFileCount: { value: "{{10}}" } }, // dynamic: room for the dropped files
        };

        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-FilePicker-canvas-${Cypress._.uniqueId()}`);
            addFilePickersViaApi([
                {
                    name: "grow",
                    layout: { top: 40, left: 2, width: 15, height: authored },
                    properties: { ...multi.properties, dynamicHeight: { value: "{{true}}" } }, // filepicker.js:144-149
                    validation: multi.validation,
                },
                { type: "Text", name: "below", layout: { top: 40 + authored + GAP, left: 2, width: 15, height: 40 }, properties: { text: { value: "below" } } },
                // control: dynamic height off (filepicker.js:387 default)
                { name: "fixed", layout: { top: 40, left: 20, width: 15, height: authored }, ...multi },
                { type: "Text", name: "belowfixed", layout: { top: 40 + authored + GAP, left: 20, width: 15, height: 40 }, properties: { text: { value: "fixed" } } },
            ]);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        const expectGapBelow = (upper, lower) =>
            cy.document().should(() => expect(box(lower).top - box(upper).bottom, `${lower} keeps its gap under ${upper}`).to.be.closeTo(GAP, PX));

        // ── FilePicker-BRW-001 (dynamic-height reflow geometry) ──────────────
        // FilePicker.jsx:141-152: dynamic height → root height auto, minHeight = authored floor, overflow visible;
        // useDynamicHeight (FilePicker.jsx:83-93) re-measures whenever the file count changes and reflows the grid.
        it("[FilePicker-BRW-001] Dynamic height grows the picker with its file list and reflows the widget below, in the viewer", () => {
            const files = pickerFiles(4, "grow"); // dynamic: four rows overflow the authored box
            openLinkAppInViewer(SEL.dropzone("grow"));

            // empty: authored height, nothing scrolls, sibling at its gap
            cy.document().should(() => expect(box("grow").height, "authored height").to.be.closeTo(authored, PX));
            expectGapBelow("grow", "below");
            cy.document().then(() => cy.wrap({ below: box("below").top, belowFixed: box("belowfixed").top }).as("tops0"));

            dropFiles("grow", files);
            dropFiles("fixed", files);
            pickerMetrics("grow", (m) => {
                expect(m.rows, "rows").to.eq(files.length);
                expect(m.overflowY, "dynamic root does not scroll").to.eq("visible");
                expect(m.scrollHeight, "whole list on screen").to.be.lte(m.clientHeight + 1);
                expect(m.pane.bottom, "file list inside the widget box").to.be.lte(m.box.bottom + 1);
                expect(m.box.height, "grew by the file rows").to.be.gte(authored + files.length * ROW);
                // the dropzone keeps its authored floor: the list is added below it, not squeezed into it
                expect(m.pane.top - m.wrapper.top, "drop area keeps the authored height").to.be.gte(authored - 4 - PX);
            });
            expectGapBelow("grow", "below");

            // control: dynamic height off keeps the authored box, scrolls instead, its sibling stays put
            cy.get("@tops0").then((tops0) => {
                pickerMetrics("fixed", (m) => {
                    expect(m.rows, "fixed rows").to.eq(files.length);
                    expect(m.box.height, "fixed: authored height").to.be.closeTo(authored, PX);
                    expect(m.scrollHeight, "fixed: scrolls instead").to.be.gt(m.clientHeight + ROW);
                });
                cy.document().should(() => expect(box("belowfixed").top, "fixed sibling did not move").to.be.closeTo(tops0.belowFixed, PX));
            });

            // remove one file → shrinks by one row, the sibling follows
            readPickerMetrics("grow").then((before) => {
                const belowTop = box("below").top;
                removeFileRow("grow", 0);
                pickerMetrics("grow", (m) => {
                    expect(m.rows).to.eq(files.length - 1);
                    expect(before.box.height - m.box.height, "shrank by one row").to.be.closeTo(ROW, PX);
                });
                cy.document().should(() => expect(belowTop - box("below").top, "sibling moved up one row").to.be.closeTo(ROW, PX));
            });
            expectGapBelow("grow", "below");

            // remove the rest → back to the authored floor, sibling back in place
            for (let i = 0; i < files.length - 1; i += 1) removeFileRow("grow", 0);
            cy.get("@tops0").then((tops0) =>
                cy.document().should(() => {
                    expect(Cypress.$(SEL.fileRow("grow")).length, "no rows").to.eq(0);
                    expect(box("grow").height, "back to the authored height").to.be.closeTo(authored, PX);
                    expect(box("below").top, "sibling back in place").to.be.closeTo(tops0.below, PX);
                }));
        });

        // Editor-inert half of the gate: FilePicker.jsx:74 only enables dynamic height in view mode.
        it("[FilePicker-BRW-001] On the editor canvas a dynamic-height picker keeps its authored box and scrolls its list", () => {
            const files = pickerFiles(4, "edit"); // dynamic
            cy.openApp("", undefined, undefined, SEL.dropzone("grow"));
            cy.document().then(() => cy.wrap(box("below").top).as("below0"));
            dropFiles("grow", files);
            pickerMetrics("grow", (m) => {
                expect(m.rows, "rows").to.eq(files.length);
                expect(m.box.height, "authored height in the editor").to.be.closeTo(authored, PX);
                expect(m.scrollHeight, "list scrolls inside the box").to.be.gt(m.clientHeight + ROW);
            });
            cy.get("@below0").then((below0) =>
                cy.document().should(() => expect(box("below").top, "sibling did not move").to.be.closeTo(below0, PX)));
            expectGapBelow("grow", "below");
        });
    });
});
