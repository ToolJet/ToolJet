/**
 * SPEC — File Input — userflow facet.
 * FOR AI: the one TESTING.md browser scenario (frontend/ee/test/app-builder/widgets/FileInput):
 *   FileInput-BRW-001 — clicking Browse opens the real native file-selection dialog.
 * Mechanism (react-dropzone 14, useFsAccessApi off): the dropzone root's onClick calls inputRef.click() on the hidden
 * <input type="file"> (FileInput.jsx:211,276-285; useFilePicker.js:407-418). Chromium shows the OS chooser for that
 * activation only when the page holds transient user activation and nothing cancels the click's default action.
 * The OS window itself is outside the page; the spec turns CDP file-chooser interception on (so no native window
 * can block the run) and asserts the browser-level contract that makes the window appear: a REAL (trusted) click
 * on Browse reaches the file input with user activation, un-cancelled — then completes the round trip by handing
 * the input the file a user would pick and asserting the widget and its exposed `files` take it.
 * Controls prove each assertion can fail: a script-dispatched click lacks user activation; a disabled field never
 * activates its input.
 * Helpers: addFileInputsViaApi, interceptFileChooser, trackFileInputActivation, fileInputActivations,
 * openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { fileInputSelector as SEL } from "Selectors/appBuilder/components/fileInput";
import { fileInputText, fileInputFixtures as FX } from "Texts/appBuilder/components/fileInput";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    addFileInputsViaApi,
    interceptFileChooser,
    trackFileInputActivation,
    fileInputActivations,
} from "Support/utils/appBuilder/components/fileInput";

const T = fileInputText;
const W = 'fipicker'; // dynamic: seeded widget names
const DISABLED = 'fidisabled';
const PROBE = 'fipicked';
const SHOWN = { showOnDesktop: { value: '{{true}}' } };

describe('File Input — userflow facet', { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-FileInput-userflow-${Cypress._.uniqueId()}`);
        addFileInputsViaApi([
            { name: W, layout: { top: 40, left: 2, width: 14, height: 60 } },
            {
                name: DISABLED,
                layout: { top: 140, left: 2, width: 14, height: 60 },
                properties: { disabledState: { value: '{{true}}' } }, // fileinput.js:499
            },
            {
                type: 'Text',
                name: PROBE,
                layout: { top: 240, left: 2, width: 14, height: 40 },
                others: SHOWN,
                properties: { text: { value: `{{components.${W}.files.map((f) => f.name).join(',') || 'none'}}` } },
            },
        ]);
        interceptFileChooser();
        openLinkAppInViewer(SEL.button(W));
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    it('[FileInput-BRW-001] Clicking Browse opens the native file picker on the real file input, and the picked file lands in the widget', () => {
        const input = SEL.inputField(W);
        cy.get(input).should('have.attr', 'type', 'file').and('not.be.disabled');
        cy.get(SEL.summary(W)).should('have.text', T.defaultPlaceholder); // fileinput.js:492
        cy.get(commonWidgetSelector.draggableWidget(PROBE)).should('contain.text', 'none');

        // Control first (transient user activation outlives a real click by seconds, so this must precede it): a
        // script-dispatched click reaches the input too, but WITHOUT user activation — the browser refuses to show
        // a chooser for it. Proves the userActivation check below discriminates.
        trackFileInputActivation(input);
        cy.get(SEL.button(W)).click();
        fileInputActivations(input).then((activations) => {
            expect(activations, 'synthetic click → one activation').to.have.length(1);
            expect(activations[0].userActivation, 'synthetic click carries no user activation').to.eq(false);
        });

        // 1. A real click on Browse activates the hidden file input exactly once, with user activation, un-cancelled.
        trackFileInputActivation(input);
        cy.get(SEL.button(W)).realClick({ scrollBehavior: false });
        fileInputActivations(input).then((activations) => {
            expect(activations, 'Browse click → one activation of the file input').to.have.length(1);
            expect(activations[0], 'activation that opens the native chooser').to.deep.eq({
                type: 'file',
                disabled: false,
                connected: true,
                userActivation: true,
                trusted: false, // inputRef.click() — a programmatic click inside the trusted click's handler
                prevented: false,
            });
        });

        // 2. The chooser's result: the file the user picks lands in the widget and its exposed value.
        cy.get(input).selectFile(FX.pngFile, { force: true });
        cy.get(SEL.summary(W)).should('have.text', FX.pngFileName);
        cy.get(commonWidgetSelector.draggableWidget(PROBE)).should('contain.text', FX.pngFileName);

        // The picker is the only way in: FileInput forces enableDropzone off ("click-to-browse only, no drag area",
        // FileInput.jsx:108-113), so a file dropped on the field is ignored and the picked file stays.
        cy.get(SEL.fieldByName(W)).selectFile(FX.csvFile, { action: 'drag-drop' });
        cy.get(SEL.summary(W)).should('have.text', FX.pngFileName);
        cy.get(commonWidgetSelector.draggableWidget(PROBE)).should('contain.text', FX.pngFileName)
            .and('not.contain.text', FX.csvFileName);

        // Control: a disabled field's Browse never activates its input (FileInput.jsx:306 native disabled;
        // react-dropzone `disabled` drops the root click handler, useFilePicker.js:415).
        const disabledInput = SEL.inputField(DISABLED);
        trackFileInputActivation(disabledInput);
        cy.get(SEL.button(DISABLED)).should('be.disabled').realClick({ scrollBehavior: false });
        fileInputActivations(disabledInput).should('have.length', 0);
        cy.get(SEL.summary(DISABLED)).should('have.text', T.defaultPlaceholder);
    });
});
