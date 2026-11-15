/**
 * SPEC — Library component — canvas facet.
 * FOR AI: always-on canvas ops (drop / move / resize / duplicate / copy-paste / delete+undo) + browser-only
 * geometry scenarios from TESTING.md:
 *   LibraryComponent-BRW-001 — a component dropped from the Components panel › Custom tab occupies the manifest's
 *                              defaultWidth x defaultHeight (rows of 10px), or 12 columns x 200px without one
 *   LibraryComponent-BRW-003 — the sandboxed iframe fills its canvas slot and follows Editor resizes
 * The CCL surface (license flag, library list, bundle files) is stubbed in the browser by stubCclBackend: the
 * local license lacks `customComponentLibraries`. The real shell.html runs a real ES-module fixture bundle.
 * The drop itself uses the real Custom-tab card (DnD); every other test seeds a configured instance via the API.
 * Helpers: stubCclBackend, addLibraryComponentsViaApi, dragLibraryComponent, slotGeometry, installProbeLog,
 * probeLog, expectShellMounted, getWidgetRect, verifyWidgetMoved, verifyWidgetResized, verifyWidgetCount,
 * duplicateWidgetByKeyboard, copyPasteWidget, deleteWidgetFromMenu, undo, resizeWidgetBy, openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { libraryComponentSelector as S } from "Selectors/appBuilder/components/libraryComponent";
import { libraryComponentText } from "Texts/appBuilder/components/libraryComponent";
import {
    getWidgetRect,
    verifyWidgetMoved,
    verifyWidgetResized,
    verifyWidgetCount,
    duplicateWidgetByKeyboard,
    copyPasteWidget,
    deleteWidgetFromMenu,
    undo,
} from "Support/utils/commonWidget";
import { resizeWidgetBy } from "Support/utils/appBuilder/components/svgImage";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    stubCclBackend,
    addLibraryComponentsViaApi,
    dragLibraryComponent,
    slotGeometry,
    installProbeLog,
    probeLog,
    expectShellMounted,
} from "Support/utils/appBuilder/components/libraryComponent";

const T = libraryComponentText;
const FOCUS = T.components.focus;
const SIZED = T.components.sized;
const W = FOCUS.runtimeName;
const PX = 2; // layout tolerance (px)
const COLUMNS = 43; // canvas grid columns (NO_OF_GRIDS)

const gridColumnWidth = () => cy.get("#real-canvas").then(($c) => $c[0].getBoundingClientRect().width / COLUMNS);

// iframe fills the slot: same box as the padded inner box's content area, borderless, block
const expectFillsSlot = (g, label) => {
    expect(g.display, `${label}: iframe display`).to.eq("block");
    expect(g.border, `${label}: iframe border`).to.eq("0px");
    expect(g.iframe.left, `${label}: left edge`).to.be.closeTo(g.slot.left, 1);
    expect(g.iframe.top, `${label}: top edge`).to.be.closeTo(g.slot.top, 1);
    expect(g.iframe.width, `${label}: width`).to.be.closeTo(g.slot.width, 1);
    expect(g.iframe.height, `${label}: height`).to.be.closeTo(g.slot.height, 1);
};

// the bundle's own viewport (window.innerWidth/innerHeight inside the iframe) — last report from that frame
const expectInnerViewport = (name, g, label) =>
    cy.window().should((win) => {
        const last = (win.__libProbe || []).filter((m) => m.frame === name && (m.event === "mounted" || m.event === "size")).pop();
        expect(last, `${label}: viewport report from inside ${name}`).to.exist;
        expect(last.w, `${label}: content viewport width`).to.be.closeTo(g.iframe.width, 1);
        expect(last.h, `${label}: content viewport height`).to.be.closeTo(g.iframe.height, 1);
    });

// testIsolation:false for cypress-real-dnd (its CDP client is cached per spec run); each test makes its own app.
describe("Library component — canvas facet", { testIsolation: false }, () => {
    afterEach(() => {
        cy.apiDeleteApp();
    });

    describe("drop from the Custom tab", () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-LibraryComponent-canvas-${Cypress._.uniqueId()}`);
            stubCclBackend();
            cy.openApp();
        });

        // ── LibraryComponent-BRW-001 ─────────────────────────────────────────
        // CustomComponentsTab.jsx:292-307 builds the drag item with manifestDefaultSize (utils.js:30-33:
        // defaultWidth columns, defaultHeight rows x 10px); appCanvasUtils.js:84-88 lets it override the
        // registered 12 x 200 (libraryComponent.js:6-9).
        it("[LibraryComponent-BRW-001] a manifest-sized component drops at the manifest's defaultWidth x defaultHeight", () => {
            dragLibraryComponent(SIZED.exportName, 300, 150);
            gridColumnWidth().then((col) => {
                cy.get(S.draggableWidget(SIZED.runtimeName), { timeout: 15000 }).should(($w) => {
                    const r = $w[0].getBoundingClientRect();
                    expect(r.width, "width = manifest defaultWidth columns").to.be.closeTo(T.sizedManifest.defaultWidth * col, PX);
                    expect(r.height, "height = manifest defaultHeight rows x 10px").to.be.closeTo(T.sizedManifest.defaultHeight * T.gridRowHeightPx, PX);
                });
            });
            cy.get(S.iframe(SIZED.runtimeName)).should("have.attr", "title", SIZED.exportName);
        });

        it("[LibraryComponent-BRW-001] a component without a manifest size drops at 12 columns x 200px", () => {
            dragLibraryComponent(FOCUS.exportName, 300, 150);
            gridColumnWidth().then((col) => {
                cy.get(S.draggableWidget(W), { timeout: 15000 }).should(($w) => {
                    const r = $w[0].getBoundingClientRect();
                    expect(r.width, "width = 12 columns").to.be.closeTo(T.defaultSize.width * col, PX);
                    expect(r.height, "height = 200px").to.be.closeTo(T.defaultSize.height, PX);
                });
            });
            cy.get(S.iframe(W)).should("have.attr", "title", FOCUS.exportName);
        });
    });

    describe("seeded instance", () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-LibraryComponent-canvas-${Cypress._.uniqueId()}`);
            stubCclBackend();
            addLibraryComponentsViaApi([{ name: W, layout: { top: 40, left: 2, width: 12, height: T.defaultSize.height } }], {
                pin: T.revisions.v1,
            });
            cy.on("window:before:load", installProbeLog);
            cy.openApp("", undefined, undefined, S.draggableWidget(W));
            expectShellMounted(W, FOCUS.exportName);
        });

        it("move repositions the widget", () => {
            getWidgetRect(W).then((before) => {
                cy.moveComponent(W, 750, 450);
                verifyWidgetMoved(W, before);
            });
        });

        it("resize changes the widget dimensions", () => {
            getWidgetRect(W).then((before) => {
                resizeWidgetBy(W, 120, 60);
                verifyWidgetResized(W, before);
            });
        });

        it("duplicate via keyboard (Cmd/Ctrl+D)", () => {
            duplicateWidgetByKeyboard(W);
            verifyWidgetCount(T.components.focus.exportName.toLowerCase(), 2);
            // the clone is a configured instance too: its own shell mounts the same component
            cy.get('[data-cy^="draggable-widget-focusprobe"] iframe').should("have.length", 2);
        });

        it("copy-paste (Cmd/Ctrl+C then +V)", () => {
            copyPasteWidget(W);
            verifyWidgetCount(T.components.focus.exportName.toLowerCase(), 2);
        });

        it("delete via ⋮ menu, undo restores", () => {
            deleteWidgetFromMenu(W);
            cy.get(S.draggableWidget(W)).should("not.exist");
            undo();
            cy.get(S.iframe(W)).should("exist");
        });

        // ── LibraryComponent-BRW-003 ─────────────────────────────────────────
        // LibraryComponent.jsx:261-284 — the wrapper takes height = widget height - 4 (RenderWidget passes
        // `widgetHeight - 4`, the inner box has BOX_PADDING 2px) and the iframe is `tw-w-full tw-h-full tw-border-0
        // tw-block`. The bundle reports its own window.innerWidth/innerHeight on mount and on every resize.
        it("[LibraryComponent-BRW-003] the iframe fills its canvas slot and follows Editor resizes, in the Editor and the Viewer", () => {
            let editorBox;
            slotGeometry(W).then((g) => {
                expectFillsSlot(g, "editor, as seeded");
                expect(g.iframe.height, "seeded height - 4").to.be.closeTo(T.defaultSize.height - 4, 1);
                expectInnerViewport(W, g, "editor, as seeded");
                editorBox = g.box;
            });

            cy.then(() => resizeWidgetBy(W, 160, 90));
            cy.get(S.draggableWidget(W)).should(($w) => {
                const r = $w[0].getBoundingClientRect();
                expect(r.width, "box grew wider").to.be.gt(editorBox.width + 100);
                expect(r.height, "box grew taller").to.be.gt(editorBox.height + 60);
            });
            slotGeometry(W).then((g) => {
                expectFillsSlot(g, "editor, after resize");
                expect(g.iframe.height, "iframe height follows the box").to.be.closeTo(g.box.height - 4, 1);
                expectInnerViewport(W, g, "editor, after resize");
                editorBox = g.box;
            });
            probeLog().then((log) => {
                expect(log.filter((m) => m.frame === W && m.event === "size").length, "the bundle saw a resize").to.be.gte(1);
            });

            // the Viewer renders the saved (resized) height; columns scale with the viewer canvas width
            openLinkAppInViewer(S.iframe(W));
            expectShellMounted(W, FOCUS.exportName);
            slotGeometry(W).then((g) => {
                expectFillsSlot(g, "viewer");
                expect(g.box.height, "viewer keeps the resized height").to.be.closeTo(editorBox.height, PX);
                expectInnerViewport(W, g, "viewer");
            });
            cy.get(commonWidgetSelector.draggableWidget(W)).should("be.visible");
        });
    });
});
