// Texts for the Library component widget (Custom Component Library host).
// Config: packages/widget-definitions/src/widgets/libraryComponent.js
// Runtime: frontend/src/AppBuilder/Widgets/LibraryComponent.jsx (sandboxed iframe running
// frontend/assets/custom-components/shell.html) + Inspector Components/LibraryComponent/index.tsx.
//
// The local instance's license has `customComponentLibraries: false` and the library authoring
// endpoints answer 451, so specs stub the CCL surface in the browser (see stubCclBackend): the license
// flag, the library list and the published/dev bundle files are served from these fixtures.
export const libraryComponentText = {
  displayName: "Library component", // libraryComponent.js:3
  componentType: "LibraryComponent", // libraryComponent.js:5
  // libraryComponent.js:6-9 — registered drop size, also the manifest fallback (12 columns x 20 rows x 10px)
  defaultSize: { width: 12, height: 200 },
  gridRowHeightPx: 10, // ComponentManagerTab/utils.js GRID_ROW_HEIGHT_PX
  shellSrc: "/assets/custom-components/shell.html", // LibraryComponent.jsx:276
  sandbox: "allow-scripts", // LibraryComponent.jsx:281

  // Saved definition defaults merged under every seeded instance (libraryComponent.js:56-74)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // libraryComponent.js:58
      showOnMobile: { value: "{{false}}" }, // libraryComponent.js:59
    },
    properties: {
      visibility: { value: "{{true}}" }, // libraryComponent.js:66
      loadingState: { value: "{{false}}" }, // libraryComponent.js:67
    },
    styles: {
      boxShadow: { value: "0px 0px 0px 0px #00000040" }, // libraryComponent.js:71
    },
  },

  // Inspector panel (Inspector/Components/LibraryComponent/index.tsx)
  inspector: {
    componentAccordion: "Component", // index.tsx:66
    componentRow: "Component", // index.tsx:71
    revisionRow: "Revision", // index.tsx:72
    defaultSection: "Properties", // Components/LibraryComponent/utils.ts:4
    eventsAccordion: "Events", // index.tsx:113
    additionalActionsAccordion: "Additional Actions", // index.tsx:135
    devicesAccordion: "Devices", // index.tsx:159
    visibilityLabel: "Visibility", // libraryComponent.js:17
    loadingStateLabel: "Loading state", // libraryComponent.js:23
    showOnDesktopLabel: "Show on desktop", // libraryComponent.js:11
    showOnMobileLabel: "Show on mobile", // libraryComponent.js:12
    devPreviewLabel: "Dev preview", // Components/LibraryComponent/utils.ts:34
  },

  // The fixture library. ids are fixed: the whole CCL surface is stubbed per spec.
  library: {
    id: "7c1f3a52-5b6e-4f0a-9d3c-1a2b3c4d5e6f",
    name: "QA Probe Library",
    cardSlug: "qa-probe-library", // CustomComponentsTab.jsx:137 name.toLowerCase().replace(/\s+/g,'-')
    correlationId: "5e0c9b1a-2f3d-4c5b-8a6e-7f8091a2b3c4",
  },

  // bundle exports (what the shell resolves) and their manifest display names
  components: {
    focus: { exportName: "FocusProbe", displayName: "Focus probe", runtimeName: "focusprobe1" },
    sized: { exportName: "SizedProbe", displayName: "Sized probe", runtimeName: "sizedprobe1" },
  },
  // SizedProbe's manifest drop size: 8 columns x 30 rows (rows are 10px each)
  sizedManifest: { defaultWidth: 8, defaultHeight: 30 },

  revisions: { v1: "1.0.0", v2: "2.0.0" },
};
