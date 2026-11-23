/**
 * SPEC — Library component — userflow facet.
 * FOR AI: TESTING.md browser scenario:
 *   LibraryComponent-BRW-002 — keyboard focus enters and leaves the sandboxed content in a sane order, in the
 *                              Editor and the Viewer
 * A TextInput sits above and below the instance. The fixture bundle (FocusProbe) renders two inputs and posts a
 * `{ type: 'qa-probe', event: 'focus', id }` message whenever one gets focus, so focus INSIDE the opaque-origin
 * iframe is observable without touching its document. Real CDP Tab / Shift+Tab presses drive the browser.
 * Helpers: stubCclBackend, addLibraryComponentsViaApi, installProbeLog, expectShellMounted, openLinkAppInViewer.
 */
import { fake } from "Fixtures/fake";
import { libraryComponentSelector as S } from "Selectors/appBuilder/components/libraryComponent";
import { libraryComponentText } from "Texts/appBuilder/components/libraryComponent";
import { openLinkAppInViewer } from "Support/utils/appBuilder/components/link";
import {
    stubCclBackend,
    addLibraryComponentsViaApi,
    installProbeLog,
    expectShellMounted,
} from "Support/utils/appBuilder/components/libraryComponent";

const T = libraryComponentText;
const W = T.components.focus.runtimeName;
const input = (name) => `${S.draggableWidget(name)} input`;

// After each key press: where the PARENT document's focus is, and the last control focused inside the iframe.
const focusState = () =>
    cy.document().then((doc) => {
        const el = doc.activeElement;
        const box = el && el.closest ? el.closest('[data-cy^="draggable-widget-"]') : null;
        const inside = (doc.defaultView.__libProbe || []).filter((m) => m.event === "focus" && m.frame === W);
        return {
            parent: el && el.tagName === "IFRAME" ? `iframe:${el.getAttribute("data-cy")}` : box ? box.getAttribute("data-cy").replace("draggable-widget-", "") : el ? el.tagName.toLowerCase() : null,
            innerCount: inside.length,
            inner: inside.length ? inside[inside.length - 1].id : null,
        };
    });

// presses `keys` and asserts the parent focus + (when focus is in the iframe) the newly focused inner control
const pressAndExpect = (keys, expected, label) => {
    focusState().then((before) => {
        cy.realPress(keys);
        cy.document().should((doc) => {
            const el = doc.activeElement;
            const inside = (doc.defaultView.__libProbe || []).filter((m) => m.event === "focus" && m.frame === W);
            if (expected.inner) {
                expect(el && el.tagName, `${label}: parent focus is the iframe`).to.eq("IFRAME");
                expect(el.getAttribute("data-cy"), `${label}: that instance's iframe`).to.eq(W);
                expect(inside.length, `${label}: a new focus inside the sandbox`).to.eq(before.innerCount + 1);
                expect(inside[inside.length - 1].id, `${label}: inner control`).to.eq(expected.inner);
            } else {
                const box = el && el.closest ? el.closest('[data-cy^="draggable-widget-"]') : null;
                expect(el && el.tagName, `${label}: focus left the iframe for an input`).to.eq("INPUT");
                expect(box && box.getAttribute("data-cy"), `${label}: widget`).to.eq(`draggable-widget-${expected.widget}`);
                expect(inside.length, `${label}: no extra focus inside the sandbox`).to.eq(before.innerCount);
            }
        });
    });
};

const walkFocus = (where) => {
    // Tab forward: before → inner-a → inner-b → after
    cy.get(input("before")).first().realClick({ scrollBehavior: false });
    cy.focused().should("have.attr", "data-cy", "before-input");
    pressAndExpect("Tab", { inner: "inner-a" }, `${where}: Tab from the input above`);
    pressAndExpect("Tab", { inner: "inner-b" }, `${where}: Tab inside the sandbox`);
    pressAndExpect("Tab", { widget: "after" }, `${where}: Tab out of the sandbox`);
    // Shift+Tab back: after → inner-b → inner-a → before
    pressAndExpect(["Shift", "Tab"], { inner: "inner-b" }, `${where}: Shift+Tab back into the sandbox`);
    pressAndExpect(["Shift", "Tab"], { inner: "inner-a" }, `${where}: Shift+Tab inside the sandbox`);
    pressAndExpect(["Shift", "Tab"], { widget: "before" }, `${where}: Shift+Tab out of the sandbox`);
};

describe("Library component — userflow facet", { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-LibraryComponent-userflow-${Cypress._.uniqueId()}`);
        stubCclBackend();
        addLibraryComponentsViaApi(
            [
                { type: "TextInput", name: "before", layout: { top: 10, left: 2, width: 10, height: 40 } },
                { name: W, layout: { top: 70, left: 2, width: 12, height: T.defaultSize.height } },
                { type: "TextInput", name: "after", layout: { top: 290, left: 2, width: 10, height: 40 } },
            ],
            { pin: T.revisions.v1 }
        );
        cy.on("window:before:load", installProbeLog);
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── LibraryComponent-BRW-002 ─────────────────────────────────────────────
    // The iframe (LibraryComponent.jsx:273-284) has no tabindex override, so it joins the page's sequential focus
    // order where it sits in the DOM, and the sandbox's own inputs take focus in their order before focus leaves.
    it("[LibraryComponent-BRW-002] keyboard focus enters and leaves the sandboxed content in order in the Editor", () => {
        cy.openApp("", undefined, undefined, S.draggableWidget(W));
        expectShellMounted(W, T.components.focus.exportName);
        walkFocus("editor");
    });

    it("[LibraryComponent-BRW-002] keyboard focus enters and leaves the sandboxed content in order in the Viewer", () => {
        openLinkAppInViewer(S.iframe(W));
        expectShellMounted(W, T.components.focus.exportName);
        walkFocus("viewer");
    });
});
