/**
 * SPEC — Library component — contexts facet.
 * FOR AI: always-on device + exposed-value contexts, plus TESTING.md browser scenario:
 *   LibraryComponent-DEVRELOAD-002 — a Viewer app never opens a dev-bundle live-reload stream, even with a
 *                                    dev-pinned library (the Editor does, for the pinning developer)
 * useCustomComponentDevPreviewSync is mounted only by AppBuilder.jsx (the Editor). The stream URL is
 * GET /api/custom-component-libraries/<libraryId>/dev/<userId>/stream, aliased `@devStream` by stubCclBackend
 * (answered with a one-comment SSE body). The CCL surface is stubbed in the browser (the local license lacks
 * `customComponentLibraries`).
 * Helpers: stubCclBackend, addLibraryComponentsViaApi, currentUserId, installProbeLog, expectShellMounted,
 * openEditorSidebar, verifyAndModifyToggleFx, openNode, openAndVerifyNode, verifyNodeData, openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { commonWidgetSelector } from "Selectors/common";
import { libraryComponentSelector as S } from "Selectors/appBuilder/components/libraryComponent";
import { libraryComponentText } from "Texts/appBuilder/components/libraryComponent";
import { commonWidgetText } from "Texts/common";
import { openEditorSidebar, verifyAndModifyToggleFx } from "Support/utils/commonWidget";
import { openNode, openAndVerifyNode, verifyNodeData } from "Support/utils/appBuilder/inspector";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    stubCclBackend,
    addLibraryComponentsViaApi,
    currentUserId,
    installProbeLog,
    expectShellMounted,
} from "Support/utils/appBuilder/components/libraryComponent";

const T = libraryComponentText;
const W = T.components.focus.runtimeName;
const I = T.inspector;
const QUIET_MS = 4000; // dynamic: how long the Viewer is watched for a late stream request

describe("Library component — contexts facet", { testIsolation: false }, () => {
    afterEach(() => {
        cy.apiDeleteApp();
    });

    describe("seeded instance", () => {
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-LibraryComponent-contexts-${Cypress._.uniqueId()}`);
            stubCclBackend();
            addLibraryComponentsViaApi([{ name: W, layout: { top: 40, left: 2, width: 12, height: T.defaultSize.height } }], {
                pin: T.revisions.v1,
            });
            cy.on("window:before:load", installProbeLog);
            cy.openApp("", undefined, undefined, S.draggableWidget(W));
            expectShellMounted(W, T.components.focus.exportName);
        });

        // verifyLayout's flow, with the manifest accordions collapsed first: on this panel Devices is the last
        // accordion and the fixed "Read documentation" footer covers its Show on mobile fx button.
        it("device context — show on desktop / mobile toggles visibility", () => {
            openEditorSidebar(W);
            [I.componentAccordion, I.defaultSection, "Appearance", "Layout", I.eventsAccordion].forEach((title) =>
                cy.get(S.accordion(title)).click());
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnDesktop, commonWidgetText.codeMirrorLabelTrue);
            cy.get(S.draggableWidget(W)).should("not.exist");
            verifyAndModifyToggleFx(commonWidgetText.parameterShowOnMobile, commonWidgetText.codeMirrorLabelFalse);
            cy.get(commonWidgetSelector.changeLayoutToMobileButton).click();
            cy.get(S.draggableWidget(W)).should("exist");
            cy.get(S.iframe(W)).should("have.attr", "title", T.components.focus.exportName);
        });

        it("exposed-value context — isVisible / isLoading observable in the inspector tree", () => {
            cy.get(commonWidgetSelector.sidebarinspector).click();
            cy.hideTooltip();
            openNode("components");
            openAndVerifyNode(W, [
                { key: "isVisible", type: "Boolean", value: "true" }, // libraryComponent.js:51
                { key: "isLoading", type: "Boolean", value: "false" }, // libraryComponent.js:52
            ], verifyNodeData);
        });
    });

    describe("dev-pinned library", () => {
        let uid;
        beforeEach(() => {
            cy.apiLogin();
            cy.apiCreateApp(`${fake.companyName}-LibraryComponent-contexts-${Cypress._.uniqueId()}`);
            currentUserId().then((id) => {
                uid = id;
                // the pinning developer is the logged-in user, so the Editor opens their stream
                // (resolveOwnDevPins in customComponentLibrariesStoreUtils)
                stubCclBackend({ devUserId: id });
                addLibraryComponentsViaApi([{ name: W, layout: { top: 40, left: 2, width: 12, height: T.defaultSize.height } }], {
                    pin: `dev:${id}`,
                });
            });
            cy.on("window:before:load", installProbeLog);
        });

        // ── LibraryComponent-DEVRELOAD-002 ───────────────────────────────────
        it("[LibraryComponent-DEVRELOAD-002] the Editor opens the dev-bundle stream; the Viewer never does", () => {
            const streamUrl = () => new RegExp(`/custom-component-libraries/${T.library.id}/dev/${uid}/stream`);

            // control: the Editor opens exactly the pinned developer's stream
            cy.openApp("", undefined, undefined, S.draggableWidget(W));
            expectShellMounted(W, T.components.focus.exportName);
            cy.wait("@devStream", { timeout: 20000 }).its("request.url").should("match", streamUrl());

            let editorStreams;
            cy.get("@devStream.all").then((all) => {
                editorStreams = all.length;
                expect(editorStreams, "editor stream requests").to.be.gte(1);
            });

            // the Viewer renders the dev bundle (the pin is honoured there) but opens no stream
            openLinkAppInViewer(S.iframe(W));
            expectShellMounted(W, T.components.focus.exportName);
            cy.get("@libraryFile.all").should((all) => {
                const devFiles = all.filter((i) => i.request.url.includes(`/dev/${uid}/files/`));
                expect(devFiles.length, "dev bundle files fetched for the dev pin").to.be.gte(1);
            });
            cy.wait(QUIET_MS);
            cy.get("@devStream.all").then((all) => {
                expect(all.length, "no stream request after entering the Viewer").to.eq(editorStreams);
            });
        });
    });
});
