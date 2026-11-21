/**
 * SPEC — File Picker — contexts facet.
 * FOR AI: always-on device + exposed-value contexts. The File Picker's only browser scenario (FilePicker-BRW-001) is
 * covered in userflow (real drag-and-drop), styles (scrollbar hover) and canvas (dynamic-height reflow).
 * Helpers: switchLayout, openEditorSidebar, openAccordion, verifyAndModifyToggleFx, openNode, openAndVerifyNode,
 * verifyNodeData, addFilePickersViaApi, pickerFiles, dropFiles, openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { commonWidgetText } from "Texts/common";
import { filePickerSelector as SEL } from "Selectors/appBuilder/components/filePicker";
import { filePickerText } from "Texts/appBuilder/components/filePicker";
import { openEditorSidebar, openAccordion, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { switchLayout } from "Support/utils/appBuilder/layout";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { addFilePickersViaApi, pickerFiles, dropFiles } from "Support/utils/appBuilder/components/filePicker";
import { closeQueryPanel } from "Support/utils/appBuilder/querymanager/queryPanel";

const T = filePickerText;
const W = T.defaultWidgetName;

describe("File Picker — contexts facet", { testIsolation: false }, () => {
    describe("dropped widget", () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-FilePicker-contexts-${Cypress._.uniqueId()}`);
            cy.openApp();
            cy.dragAndDropWidget(T.displayName, 400, 200);
            closeQueryPanel();
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        it("device context — Show on desktop / Show on mobile gate the widget on the matching editor layout", () => {
            const widget = commonWidgetSelector.draggableWidget(W);

            // defaults (filepicker.js:372-373): on the desktop canvas, absent from the mobile canvas
            cy.get(SEL.label(W)).should("have.text", T.defaultLabel); // source: filepicker.js:376
            switchLayout("mobile");
            cy.get(widget).should("not.exist");
            switchLayout("desktop");
            cy.get(widget).should("exist");

            // desktop off → gone from desktop; mobile on → shown on the mobile canvas only
            openEditorSidebar(W);
            openAccordion(commonWidgetText.accordionLayout);
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(widget).should("not.exist");
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.waitForAutoSave();
            switchLayout("mobile");
            cy.get(widget).should("be.visible");
            cy.get(SEL.label(W)).should("have.text", T.defaultLabel);
            switchLayout("desktop");
            cy.get(widget).should("not.exist");
        });

        it("exposed-value context — state flags observable in the inspector tree", () => {
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode("components");
            openAndVerifyNode(W, [
                { key: "isValid", type: "Boolean", value: "true" }, // filepicker.js:363
                { key: "isMandatory", type: "Boolean", value: "false" }, // filepicker.js:365
                { key: "isLoading", type: "Boolean", value: "false" }, // filepicker.js:366
                { key: "isVisible", type: "Boolean", value: "true" }, // filepicker.js:367
                { key: "isDisabled", type: "Boolean", value: "false" }, // filepicker.js:368
            ], verifyNodeData);
        });
    });

    describe("running app", () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-FilePicker-contexts-${Cypress._.uniqueId()}`);
            addFilePickersViaApi([
                { name: W },
                {
                    type: "Text",
                    name: "probe",
                    layout: { top: 280, left: 2, width: 15, height: 40 },
                    properties: { text: { value: `{{"count:" + (components.${W}.files || []).length + " size:" + components.${W}.fileSize}}` } },
                },
            ]);
        });

        afterEach(() => {
            cy.apiDeleteApp();
        });

        // exposed files / fileSize (useFilePicker.js:585-592) drive a binding in the running app
        it("exposed-value context — a dropped file updates files and fileSize for bindings in the viewer", () => {
            const bytes = 200; // dynamic: file size
            const [file] = pickerFiles(1, "ctx", { bytes });
            openLinkAppInViewer(SEL.dropzone(W));
            cy.get(commonWidgetSelector.draggableWidget("probe")).should("have.text", "count:0 size:0");
            dropFiles(W, [file]);
            cy.get(SEL.fileRow(W)).should("have.length", 1);
            cy.get(commonWidgetSelector.draggableWidget("probe")).should("have.text", `count:1 size:${bytes}`);
        });
    });
});
