/**
 * SPEC — File Picker — styles facet.
 * FOR AI: the visual part of the TESTING.md browser scenario (frontend/ee/test/app-builder/widgets/FilePicker):
 *   FilePicker-BRW-001 — scrollbar-hover affordance: the widget root (`.files-pane-scrollable`, FilePicker.jsx:214)
 *                        keeps its scrollbar transparent until the pointer is over it, then paints the thumb with
 *                        --utilities-scrollbar (style.scss .files-pane-scrollable / :hover), and the list really scrolls
 * Only this scenario's styles are in scope (not the config's styles). Verified in the viewer — editor-canvas hover is
 * not reliable. Helpers: addFilePickersViaApi, pickerFiles, dropFiles, pickerMetrics, resolveCssVarColor,
 * openLinkAppInViewer, moveMouseAway.
 */
import { fake } from "Fixtures/fake";
import { filePickerSelector as SEL } from "Selectors/appBuilder/components/filePicker";
import { filePickerText } from "Texts/appBuilder/components/filePicker";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import { resolveCssVarColor } from "Support/utils/appBuilder/components/baseInput";
import { moveMouseAway } from "Support/utils/appBuilder/components/radioButtonV2";
import {
    addFilePickersViaApi,
    pickerFiles,
    dropFiles,
    pickerMetrics,
} from "Support/utils/appBuilder/components/filePicker";

const T = filePickerText;
const FP = "fp";
const TRANSPARENT = "rgba(0, 0, 0, 0)"; // computed form of `transparent`
const ROW = T.fileRowHeight;

describe("File Picker — styles facet", { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-FilePicker-styles-${Cypress._.uniqueId()}`);
        addFilePickersViaApi([
            {
                name: FP,
                layout: { top: 40, left: 2, width: 15, height: T.defaultSize.height }, // source: filepicker.js:8
                properties: { enableMultiple: { value: "{{true}}", fxActive: false } },
                validation: { maxFileCount: { value: "{{10}}" } }, // dynamic: room for an overflowing list
            },
            { type: "Text", name: "elsewhere", layout: { top: 40, left: 25, width: 10, height: 40 }, properties: { text: { value: "x" } } },
        ]);
    });

    afterEach(() => {
        moveMouseAway();
        cy.apiDeleteApp();
    });

    // ── FilePicker-BRW-001 (scrollbar-hover affordance) ──────────────────────
    it("[FilePicker-BRW-001] The file list's scrollbar is hidden until hovered, then painted, and the list scrolls", () => {
        const files = pickerFiles(6, "scroll"); // dynamic: six rows overflow the 220px box
        moveMouseAway();
        openLinkAppInViewer(SEL.dropzone(FP));
        dropFiles(FP, files);
        moveMouseAway();

        // idle: the root overflows (fixed height ≥ 200 → overflow-y scroll, FilePicker.jsx:148) but the scrollbar is
        // transparent and thin
        pickerMetrics(FP, (m) => {
            expect(m.rows, "rows").to.eq(files.length);
            expect(m.overflowY, "root scrolls").to.eq("scroll");
            expect(m.scrollHeight, "list overflows the box").to.be.gt(m.clientHeight + ROW);
            expect(m.isHovered, "pointer elsewhere").to.eq(false);
            expect(m.scrollbarWidth, "thin scrollbar").to.eq("thin");
            expect(m.scrollbarColor, "idle: transparent thumb and track").to.eq(`${TRANSPARENT} ${TRANSPARENT}`);
        });

        // hover: the thumb takes --utilities-scrollbar, the track stays transparent
        resolveCssVarColor("--utilities-scrollbar", SEL.widget(FP)).then((thumb) => {
            expect(thumb, "theme scrollbar colour is visible").not.to.eq(TRANSPARENT);
            cy.get(SEL.widget(FP)).realHover({ position: "right", scrollBehavior: false });
            pickerMetrics(FP, (m) => {
                expect(m.isHovered, "pointer over the picker").to.eq(true);
                expect(m.scrollbarColor, "hover: painted thumb").to.eq(`${thumb} ${TRANSPARENT}`);
            });
        });

        // the list really scrolls under a real wheel
        cy.get(SEL.widget(FP)).realMouseWheel({ deltaY: 400, scrollBehavior: false });
        pickerMetrics(FP, (m) => {
            expect(m.scrollTop, "wheel scrolled the list").to.be.gt(0);
            const last = Cypress.$(SEL.fileRow(FP)).last()[0].getBoundingClientRect();
            expect(last.bottom, "last row scrolled into the box").to.be.lte(m.wrapper.bottom + 1);
        });

        // control: pointer leaves → transparent again
        moveMouseAway();
        pickerMetrics(FP, (m) => {
            expect(m.isHovered).to.eq(false);
            expect(m.scrollbarColor, "idle again").to.eq(`${TRANSPARENT} ${TRANSPARENT}`);
        });
    });
});
