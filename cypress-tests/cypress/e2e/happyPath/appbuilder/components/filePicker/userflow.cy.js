/**
 * SPEC — File Picker — userflow facet.
 * FOR AI: TESTING.md browser scenario (frontend/ee/test/app-builder/widgets/FilePicker), real-interaction part:
 *   FilePicker-BRW-001 — real HTML5 drag-and-drop onto the dropzone (drag-over affordance, accepted drop, rejected
 *                        drop, drop zone switched off), in the running app and on the editor canvas
 * The drop path is react-dropzone's root drag listeners (useFilePicker.js:412-434, `noDrag: !enableDropzone`), driven
 * with native DragEvents carrying a DataTransfer (hover until the drag state shows, then drop — dropFiles) and with
 * cy.selectFile({ action: 'drag-drop' }) — never the hidden <input>'s change event. Apps are seeded through the components API (addFilePickersViaApi).
 * Helpers: addFilePickersViaApi, pickerFiles, dropFiles, dragFilesOver, dragLeave, pickerMetrics, counterEvent,
 * counterText, expectCounter, openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { filePickerSelector as SEL } from "Selectors/appBuilder/components/filePicker";
import { filePickerText } from "Texts/appBuilder/components/filePicker";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { counterEvent, counterText, expectCounter } from "Support/utils/appBuilder/components/icon";
import {
    addFilePickersViaApi,
    pickerFiles,
    dropFiles,
    dragFilesOver,
    dragLeave,
    pickerMetrics,
} from "Support/utils/appBuilder/components/filePicker";

const T = filePickerText;
const FP = "fp";
const OFF = "nodrop";

// probe: the names the widget exposes in components.<name>.files (useFilePicker.js:587)
const namesProbe = (name, layout) => ({
    type: "Text",
    name: `${name}names`,
    layout: { left: 2, width: 15, height: 40, ...layout },
    properties: { text: { value: `{{"names:" + (components.${name}.files || []).map((f) => f.name).join("|")}}` } },
});
const expectNames = (name, names) =>
    cy.get(commonWidgetSelector.draggableWidget(`${name}names`)).should(($el) =>
        expect($el.text().trim(), `${name} exposed file names`).to.eq(`names:${names.join("|")}`));

const seedApp = () =>
    addFilePickersViaApi([
        {
            name: FP,
            layout: { top: 40, left: 2, width: 15, height: T.defaultSize.height },
            properties: { enableMultiple: { value: "{{true}}", fxActive: false } },
            validation: { maxFileCount: { value: "{{5}}" } }, // dynamic: room for the dropped files
            events: [counterEvent("onFileSelected", "selected"), counterEvent("onFileLoaded", "loaded")],
        },
        namesProbe(FP, { top: 280 }),
        counterText("selcount", "selected", { top: 340, left: 2 }),
        counterText("loadcount", "loaded", { top: 340, left: 10 }),
        {
            name: OFF,
            layout: { top: 40, left: 20, width: 15, height: T.defaultSize.height },
            properties: { enableDropzone: { value: "{{false}}", fxActive: false } }, // filepicker.js:62-70
        },
        namesProbe(OFF, { top: 280, left: 20 }),
    ]);

describe("File Picker — userflow facet", { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-FilePicker-userflow-${Cypress._.uniqueId()}`);
        seedApp();
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── FilePicker-BRW-001 (real drag-and-drop) ──────────────────────────────
    // Drag-over: FilePicker.jsx:161-167 + UploadArea.jsx:42-51 classes, UploadArea.jsx:80-101 messages.
    // Drop: onDrop → fileReader → selectedFiles → FileList rows + exposed files; onFileSelected fires first
    // (useFilePicker.js:295), onFileLoaded after processing (useFilePicker.js:367-370).
    it("[FilePicker-BRW-001] Real drag-and-drop in the running app: drag-over affordance, accepted drop, rejected drop", () => {
        const images = pickerFiles(2, fake.firstName.toLowerCase().replace(/[^a-z]/g, "").slice(0, 8) || "img"); // dynamic
        const csv = pickerFiles(1, "sheet", { ext: "csv", mimeType: "text/csv" }); // dynamic: outside image/*
        openLinkAppInViewer(SEL.dropzone(FP));

        // idle: instruction, no drag classes, no rows
        cy.get(SEL.instruction(FP)).should("have.text", T.defaultInstruction); // source: filepicker.js:377
        pickerMetrics(FP, (m) => {
            expect(m.dropzoneClass, "idle classes").not.to.match(/is-dragging|is-accepting|is-rejecting/);
            expect(m.rows, "no rows yet").to.eq(0);
        });

        // drag an accepted image over the zone → accepting affordance
        dragFilesOver(FP, images.slice(0, 1));
        cy.get(SEL.dropzone(FP)).should("have.class", "is-dragging").and("have.class", "is-accepting").and("not.have.class", "is-rejecting");
        cy.get(SEL.acceptDropMessage(FP)).should("contain.text", T.acceptDropMessage); // source: UploadArea.jsx:94
        cy.get(SEL.instruction(FP)).should("not.exist");
        // the accept affordance is painted: 2px brand border (style.scss .is-accepting)
        cy.get(SEL.dropzone(FP)).should("have.css", "border-top-width", "2px");

        // pointer leaves without dropping → back to idle
        dragLeave(FP);
        cy.get(SEL.dropzone(FP)).should("not.have.class", "is-dragging").and("not.have.class", "is-accepting");
        cy.get(SEL.instruction(FP)).should("have.text", T.defaultInstruction);

        // drag a file the zone does not accept → rejecting affordance
        dragFilesOver(FP, csv);
        cy.get(SEL.dropzone(FP)).should("have.class", "is-dragging").and("have.class", "is-rejecting").and("not.have.class", "is-accepting");
        cy.get(SEL.rejectDropMessage(FP)).should("have.text", T.rejectDropMessage); // source: UploadArea.jsx:99
        dragLeave(FP);
        cy.get(SEL.dropzone(FP)).should("not.have.class", "is-rejecting");

        // real drop of two images → two rows, exposed files, both events once
        dropFiles(FP, images);
        cy.get(SEL.fileRow(FP)).should("have.length", 2);
        cy.get(SEL.fileRowName(FP)).then(($n) =>
            expect([...$n].map((n) => n.textContent), "row names (extension trimmed, FileListItem.jsx:23)")
                .to.deep.eq(images.map((f) => f.fileName.replace(/\.png$/, ""))));
        expectNames(FP, images.map((f) => f.fileName));
        expectCounter("selcount", "selected", 1);
        expectCounter("loadcount", "loaded", 1);
        cy.get(SEL.dropzone(FP)).should("not.have.class", "is-dragging");

        // real drop of a rejected type → inline error, selection untouched, nothing loaded
        dropFiles(FP, csv);
        cy.get(SEL.errorText(FP)).should("have.text", T.invalidTypeError(csv[0].fileName, T.defaultAccept)); // source: filepicker.js:405
        cy.get(SEL.fileRow(FP)).should("have.length", 2);
        expectNames(FP, images.map((f) => f.fileName));
        expectCounter("loadcount", "loaded", 1);
    });

    // Control: with "Use drop zone" off (useFilePicker.js:415 `noDrag: !enableDropzone`) the same real drop adds
    // nothing and the zone shows no drag affordance — proves the drop above went through the drag path.
    it("[FilePicker-BRW-001] A real drop onto a picker with the drop zone switched off selects nothing", () => {
        const images = pickerFiles(1, "off"); // dynamic
        openLinkAppInViewer(SEL.dropzone(OFF));
        dragFilesOver(OFF, images);
        cy.get(SEL.dropzone(OFF)).should("not.have.class", "is-dragging");
        cy.get(SEL.instruction(OFF)).should("have.text", T.defaultInstruction);
        dropFiles(OFF, images, { hover: false }); // cy.selectFile drag-drop — no drag state to wait for
        cy.get(SEL.fileRow(OFF)).should("have.length", 0);
        expectNames(OFF, []);
        // the same drop on the enabled picker is accepted
        dropFiles(FP, images);
        cy.get(SEL.fileRow(FP)).should("have.length", 1);
        expectNames(FP, [images[0].fileName]);
    });

    // The editor canvas has its own drag-and-drop (widgets); a real file drop on the picker must still reach the
    // widget, not create or move anything on the canvas.
    it("[FilePicker-BRW-001] Real drag-and-drop on the editor canvas selects the files and leaves the canvas unchanged", () => {
        const images = pickerFiles(2, "canvas"); // dynamic
        cy.openApp("", undefined, undefined, SEL.dropzone(FP));
        cy.get('[data-cy="query-manager-toggle-button"]').click();
        cy.get(`[data-cy^="draggable-widget-"]`).its("length").as("widgetCount");

        dragFilesOver(FP, images.slice(0, 1));
        cy.get(SEL.dropzone(FP)).should("have.class", "is-accepting");
        dragLeave(FP);

        dropFiles(FP, images, { hover: false }); // one-shot cy.selectFile drag-drop
        cy.get(SEL.fileRow(FP)).should("have.length", 2);
        expectNames(FP, images.map((f) => f.fileName));
        expectCounter("loadcount", "loaded", 1);
        cy.get("@widgetCount").then((n) => cy.get(`[data-cy^="draggable-widget-"]`).should("have.length", n));
    });
});
