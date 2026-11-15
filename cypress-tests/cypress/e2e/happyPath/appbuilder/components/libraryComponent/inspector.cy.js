/**
 * SPEC — Library component — inspector facet.
 * FOR AI: TESTING.md browser scenario:
 *   LibraryComponent-BRW-004 — selecting an instance shows Component and Revision rows, the manifest props grouped
 *                              by section, an Events section when the manifest declares events, the Additional
 *                              Actions accordion with Visibility and Loading state, and Devices — all for the PINNED
 *                              revision, not the library's latest
 * The fixture library has two revisions with different FocusProbe manifests (helpers manifestV1 / manifestV2):
 * 1.0.0 = an unsectioned prop, two sectioned groups, a hidden prop and one event; 2.0.0 (latest) = one prop in a
 * "Content" section and no events. The app pins 1.0.0, then the test re-pins 2.0.0 through the Custom tab's
 * version picker.
 * Helpers: stubCclBackend, addLibraryComponentsViaApi, inspectorSections, pickRevision, openEditorSidebar.
 */
import { fake } from "Fixtures/fake";
import { libraryComponentSelector as S } from "Selectors/appBuilder/components/libraryComponent";
import { libraryComponentText } from "Texts/appBuilder/components/libraryComponent";
import { openEditorSidebar } from "Support/utils/commonWidget";
import {
    stubCclBackend,
    addLibraryComponentsViaApi,
    inspectorSections,
    pickRevision,
    manifestV1,
    manifestV2,
} from "Support/utils/appBuilder/components/libraryComponent";

const T = libraryComponentText;
const I = T.inspector;
const FOCUS = T.components.focus;
const W = FOCUS.runtimeName;

const byTitle = (sections) => Object.fromEntries(sections.map((s) => [s.title, s]));
// "Component" accordion rows (index.tsx:65-81): label/value pairs
const expectIdentityRows = (section, componentLabel, revision) => {
    expect(section.text, "Component row").to.contain(`${I.componentRow} ${componentLabel}`);
    expect(section.text, "Revision row").to.contain(`${I.revisionRow} ${revision}`);
};
const staticAccordions = (s) => {
    // index.tsx:132-156 — the widget's own section:'additionalActions' properties (libraryComponent.js:15-26)
    expect(s[I.additionalActionsAccordion].labels, "Additional Actions fields").to.deep.eq([I.visibilityLabel, I.loadingStateLabel]);
    // index.tsx:158-185 — showOnDesktop / showOnMobile
    expect(s[I.devicesAccordion].labels, "Devices fields").to.deep.eq([I.showOnDesktopLabel, I.showOnMobileLabel]);
};

describe("Library component — inspector facet", { testIsolation: false }, () => {
    beforeEach(() => {
        cy.apiLogin();
        cy.apiCreateApp(`${fake.companyName}-LibraryComponent-inspector-${Cypress._.uniqueId()}`);
        // revisions newest first: 2.0.0 is the latest, the app pins the older 1.0.0
        stubCclBackend({
            revisions: [
                { version: T.revisions.v2, manifest: manifestV2 },
                { version: T.revisions.v1, manifest: manifestV1 },
            ],
        });
        addLibraryComponentsViaApi([{ name: W, layout: { top: 40, left: 2, width: 12, height: T.defaultSize.height } }], {
            pin: T.revisions.v1,
        });
        cy.openApp("", undefined, undefined, S.draggableWidget(W));
    });

    afterEach(() => {
        cy.apiDeleteApp();
    });

    // ── LibraryComponent-BRW-004 ─────────────────────────────────────────────
    // index.tsx:43-56 resolves the manifest of the app-level pin (useEffectiveLibraryRevision → useLibraryManifest),
    // filterVisibleProps drops `inspector: 'hidden'`, groupPropsBySection keeps first-seen section order (utils.ts:17-31),
    // field labels are `label ?? name` (utils.ts:60).
    it("[LibraryComponent-BRW-004] the Inspector shows the manifest-driven panel of the pinned revision and follows a re-pin", () => {
        const v1 = manifestV1.components[FOCUS.exportName];
        const v2 = manifestV2.components[FOCUS.exportName];
        const labelsIn = (component, section) =>
            component.props.filter((p) => p.inspector !== "hidden" && (p.section ?? I.defaultSection) === section).map((p) => p.label);

        // pinned 1.0.0 — not the latest 2.0.0
        openEditorSidebar(W);
        cy.get(S.accordion(I.devicesAccordion)).should("exist"); // the docs footer can cover the last header
        inspectorSections().then((sections) => {
            expect(sections.map((s) => s.title), "accordion order").to.deep.eq([
                I.componentAccordion,
                I.defaultSection, // unsectioned props
                "Appearance",
                "Layout",
                I.eventsAccordion,
                I.additionalActionsAccordion,
                I.devicesAccordion,
            ]);
            const s = byTitle(sections);
            expectIdentityRows(s[I.componentAccordion], v1.displayName, T.revisions.v1);
            expect(s[I.defaultSection].labels, "Properties fields").to.deep.eq(labelsIn(v1, I.defaultSection));
            expect(s.Appearance.labels, "Appearance fields, declaration order").to.deep.eq(labelsIn(v1, "Appearance"));
            expect(s.Layout.labels, "Layout fields").to.deep.eq(labelsIn(v1, "Layout"));
            const hidden = v1.props.find((p) => p.inspector === "hidden").label;
            sections.forEach((sec) => expect(sec.text, `hidden prop not in ${sec.title}`).to.not.contain(hidden));
            staticAccordions(s);
        });
        // the Events accordion carries the event manager for the manifest's events (index.tsx:111-130)
        cy.get(S.accordion(I.eventsAccordion)).closest(".accordion-item").find('[data-cy="add-event-handler"]').should("be.visible");

        // re-pin to 2.0.0 from the Custom tab's version picker; the panel switches to that revision's manifest
        pickRevision(T.revisions.v2);
        openEditorSidebar(W);
        cy.get(S.accordion(I.devicesAccordion)).should("exist"); // the docs footer can cover the last header
        cy.get(S.accordion("Content")).should("exist");
        inspectorSections().then((sections) => {
            expect(sections.map((s) => s.title), "accordion order at 2.0.0 (no events declared → no Events)").to.deep.eq([
                I.componentAccordion,
                "Content",
                I.additionalActionsAccordion,
                I.devicesAccordion,
            ]);
            const s = byTitle(sections);
            expectIdentityRows(s[I.componentAccordion], v2.displayName, T.revisions.v2);
            expect(s.Content.labels, "Content fields").to.deep.eq(labelsIn(v2, "Content"));
            staticAccordions(s);
        });
    });
});
