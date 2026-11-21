// Texts for the PDF widget. Config: packages/widget-definitions/src/widgets/pdf.js
// Runtime: frontend/src/AppBuilder/Widgets/PDF.jsx (react-pdf 10.1 / pdfjs-dist 5) + theme.scss `.download-icon-outer-wrapper:hover`
export const pdfText = {
  componentType: "PDF", // pdf.js:2
  displayName: "PDF", // pdf.js:3
  defaultWidgetName: "pdf1",
  widgetPrefix: "pdf",
  defaultSize: { width: 20, height: 640 }, // pdf.js:37-40
  // pdf.js:78 — the definition url every freshly dropped PDF loads (intercepted with the multi-page fixture)
  defaultUrl:
    "https://upload.wikimedia.org/wikipedia/commons/e/ee/Guideline_No._GD-Ed-2214_Marman_Clamp_Systems_Design_Guidelines.pdf",
  scaleLabel: "Scale page to width", // pdf.js:17

  // Saved definition defaults — merged under every PDF that addPdfsViaApi posts (pdf.js:70-97)
  definition: {
    others: {
      showOnDesktop: { value: "{{true}}" }, // pdf.js:72
      showOnMobile: { value: "{{false}}" }, // pdf.js:73
    },
    properties: {
      scale: { value: "{{true}}" }, // pdf.js:81
      pageControls: { value: "{{true}}" }, // pdf.js:84
      showDownloadOption: { value: "{{true}}" }, // pdf.js:87
      collapseWhenHidden: { value: "{{false}}" }, // pdf.js:89
    },
    styles: {
      visibility: { value: "{{true}}" }, // pdf.js:93
      borderColor: { value: "var(--cc-weak-border)" }, // pdf.js:94
      borderRadius: { value: 6 }, // pdf.js:95
    },
  },

  // Local fixtures (cypress/fixtures/pdf, generated with jsPDF 4.2 — fixed creation date + file id). Every page is
  // 300x400pt (3:4 portrait), carries "<label> <n>" as real text and a filled rectangle in a per-page colour.
  // They are served on a fake host through cy.intercept, so no external network is touched.
  fixtures: {
    multiPage: {
      path: "pdf/multiPage.pdf",
      url: "https://pdf-fixtures.tooljet.test/multi-page.pdf",
      bytes: 3789,
      pages: 3,
      label: "Page",
      // page fill colours (RGB) sampled at the page centre
      colors: [
        [74, 144, 217],
        [80, 180, 120],
        [230, 150, 60],
      ],
    },
    passwordProtected: {
      path: "pdf/passwordProtected.pdf",
      url: "https://pdf-fixtures.tooljet.test/password-protected.pdf",
      password: "tooljet", // user password (RC4, jsPDF standard security handler)
      pages: 2,
      label: "Secret",
    },
    missingUrl: "https://pdf-fixtures.tooljet.test/missing.pdf", // answered 404
    notPdfUrl: "https://pdf-fixtures.tooljet.test/not-a-pdf.pdf", // answered 200 text/html
    pageRatio: 4 / 3, // height / width of every fixture page
  },

  // PDF.jsx (rendered strings)
  noUrlMessage: "No PDF file specified", // PDF.jsx:237
  loadErrorMessage: "Failed to load PDF file.", // react-pdf Document default `error` message (also PDF.jsx:237)
  pageIndicator: (n, of) => `${n} of ${of}`, // PDF.jsx:258-260
  prevLabel: "Previous page", // PDF.jsx:253
  nextLabel: "Next page", // PDF.jsx:265
  downloadLabel: "Download PDF", // PDF.jsx:286
  passwordClosedMessage: "Password prompt closed", // PDF.jsx:156
  retryLabel: "Retry", // PDF.jsx:166
  passwordPrompt: "Enter the password to open this PDF file.", // PDF.jsx:139
  invalidPasswordPrompt: "Invalid password. Please try again.", // PDF.jsx:144

  // PDF.jsx:184-185 — fit-to-width page width is the widget width minus 12; PDF.jsx:215 — the root is width - 3
  scaleWidthInset: 12,
  rootWidthInset: 3,
  // theme.scss `.download-icon-outer-wrapper:hover` → the theme hover token; PDF.jsx:115 → the idle surface token
  hoverToken: "--cc-surface3-surface",
  idleToken: "--cc-surface1-surface",
  legacyHoverGray: "rgb(230, 230, 230)", // the pre-fix hard-coded #e6e6e6 (TESTING.md D-15)
  contrastFloor: 4.5, // WCAG AA body text
};
