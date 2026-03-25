import {
  genralProperties,
  verifyDisability,
  verifyLoadingState,
  verifyVisibility,
  setNumberInputValue,
} from "Support/utils/appBuilder/components/properties/common";
import {
  uploadAndVerifyFile,
  clearUploadedFiles,
  verifyFilePickerMultiple,
  verifyFilePickerSizeInfo,
  verifyFilePickerFileSizeValidation,
  verifyFileTypeValidation,
  verifyCountInputCase,
  selectFileTypeOption,
  verifyFileExposedProperties,
} from "Support/utils/appBuilder/components/properties/filepickerComponent";

describe(
  "File Picker Component - Feature Validation",
  { baseUrl: null },
  () => {
    const componentSelector = '[data-cy="draggable-widget-filepicker1"]';
    const desktopToggle = '[data-cy="draggable-widget-desktop"] .d-flex';
    const mobileToggle = '[data-cy="draggable-widget-Mobile"] .d-flex';
    const visibilityToggle = '[data-cy="draggable-widget-visibility"] .d-flex';
    const loadingState = '[data-cy="toggleswitch5"] .d-flex';

    // JS action toggles
    const jsVisibilityToggle = '[data-cy="jsvisibilitytoggle"] .d-flex';
    const jsDisableToggle = '[data-cy="jsdisabletoggle"] .d-flex';
    const jsLoadingToggle = '[data-cy="jsloadingtoggle"] .d-flex';

    // CSA checkboxes/toggles
    const csaVisibilityToggle = '[data-cy="csavisibility"] .d-flex';
    const csaLoadingToggle = '[data-cy="csaloading"] .d-flex';
    const csaDisableToggle = '[data-cy="csadisable"] .d-flex';

    // File picker specific controls
    const multipleFilesToggle =
      '[data-cy="draggable-widget-multiplefiles"] input[type="checkbox"]';
    const maxSizeInput =
      '[data-cy="draggable-widget-maxsize"] input[type="number"]';
    const minSizeInput =
      '[data-cy="draggable-widget-minsize"] input[type="number"]';
    const countInput =
      '[data-cy="draggable-widget-count"] input[type="number"]';
    const borderRadius =
      '[data-cy="draggable-widget-borderRadius"] input[type="number"]';
    const dropZoneToggle =
      '[data-cy="draggable-widget-usedropzone"] input[type="checkbox"]';
    const filePickerToggle =
      '[data-cy="draggable-widget-UseFilepicker"] input[type="checkbox"]';
    const clearFilesButton = '[data-cy="draggable-widget-button1"] .d-flex';
    const parseContentToggle =
      '[data-cy="draggable-widget-parsecontent"] input[type="checkbox"]';
    const setfilename = '[data-cy="draggable-widget-setfilename"]';

    const appUrl =
      "https://appbuilder-v3-lts-eetestsystem.tooljet.com/applications/61054fe5-1545-4ad9-95c5-5f81b7c10e10";

    const setup = () => {
      genralProperties(componentSelector, desktopToggle, { state: "exist" });
      genralProperties(componentSelector, visibilityToggle, {
        state: "be.visible",
      });
    };

    const testFiles = [
      {
        name: "tooljet.png",
        type: "image/png",
        fixturePath: "cypress/fixtures/Image/tooljet.png",
      },
      {
        name: "test.txt",
        type: "text/plain",
        fixturePath: "cypress/fixtures/test.txt",
      },
      {
        name: "document.pdf",
        type: "application/pdf",
        fixturePath: "cypress/fixtures/document.pdf",
      },
      {
        name: "test-data.csv",
        type: "text/csv",
        fixturePath: "cypress/fixtures/test-data.csv",
      },
    ];

    beforeEach(() => {
      cy.visit(appUrl);
      cy.viewport(1800, 1400);
    });

    it("should verify visibility, disable, and loading states", () => {
      genralProperties(componentSelector, desktopToggle, { state: "exist" });

      verifyVisibility(componentSelector, {
        toggle: visibilityToggle,
        csa: csaVisibilityToggle,
        jsSet: jsVisibilityToggle,
        jsReset: jsVisibilityToggle,
      });

      verifyDisability(
        componentSelector,
        {
          csa: csaDisableToggle,
          jsSet: jsDisableToggle,
          jsReset: jsDisableToggle,
        },
        { assertClass: "disabled" },
      );

      verifyLoadingState(componentSelector, {
        toggle: loadingState,
        csa: csaLoadingToggle,
        jsSet: jsLoadingToggle,
        jsReset: jsLoadingToggle,
      });
    });

    it("should verify file upload functionality", () => {
      setup();

      uploadAndVerifyFile(componentSelector, testFiles[0]);
    });

    it("should verify count functionality", () => {
      setup();

      ["0", "1", "5"].forEach((value) => {
        cy.log(`Testing count = ${value}`);

        verifyCountInputCase(componentSelector, testFiles[0], value, {
          countInput,
        });
      });
    });

    it("should verify multiple file upload", () => {
      setup();

      const count = "2";

      cy.get(countInput).clear().type(count);
      cy.get(countInput).should("have.value", count);

      verifyFilePickerMultiple(
        componentSelector,
        multipleFilesToggle,
        testFiles,
        Number(count),
      );
    });

    it("should verify file size info with default and updated values", () => {
      setup();

      selectFileTypeOption(
        '[data-cy="filetype-actionable-section"]',
        "Text files",
      );

      setNumberInputValue(minSizeInput, "100");
      setNumberInputValue(maxSizeInput, "10485760");

      verifyFilePickerSizeInfo(componentSelector, {
        minSizeInput,
        maxSizeInput,
      });

      verifyFilePickerFileSizeValidation(componentSelector, {
        minSizeInput,
        maxSizeInput,
        sizeCases: [
          { sizeBytes: 10 },
          { sizeBytes: 100 },
          { sizeBytes: 5000 },
          { sizeBytes: 20000000 },
        ],
      });
      setNumberInputValue(minSizeInput, "50");
      setNumberInputValue(maxSizeInput, "51200000");
    });

    it("should verify the file type of uploaded file", () => {
      setup();
      verifyFileTypeValidation(
        '[data-cy="filetype-actionable-section"]',
        componentSelector,
        '[data-cy="file-picker-error-message"]',
      );
    });

    it("should verify border radius of filepicker", () => {
      setup();

      const borderRadiusCases = [
        { input: "0", expected: "0px" },
        { input: "10", expected: "10px" },
        { input: "50", expected: "50px" },
        { input: "100", expected: "100px" },
      ];

      borderRadiusCases.forEach(({ input, expected }) => {
        setNumberInputValue(borderRadius, input);
        cy.get(borderRadius).should("have.value", input);
        cy.get(componentSelector)
          .find(".file-picker-dropzone")
          .should("have.css", "border-radius", expected);
      });
    });

    it("should verify set file name", () => {
      setup();
      uploadAndVerifyFile(componentSelector, testFiles[0]);

      cy.get(setfilename).click();

      cy.get(componentSelector)
        .find('[data-cy="testname-png-file-name"]')
        .should("be.visible")
        .and("contain.text", "testName");
    });

    it("should verify clear uploaded files", () => {
      setup();

      uploadAndVerifyFile(componentSelector, testFiles[0]);

      cy.get(componentSelector)
        .find('[data-cy="tooljet-png-file-name"]')
        .should("be.visible");

      clearUploadedFiles();

      cy.get(componentSelector)
        .find('[data-cy="tooljet-png-file-name"]')
        .should("not.exist");

      cy.get(componentSelector)
        .find('[data-cy="filepicker1-drag-drop-instruction-text"]')
        .should("be.visible");
    });

    it("should verify filepicker exposed properties update dynamically", () => {
      setup();

      const textWidget = '[data-cy="draggable-widget-text1"]';
      const csvFile = testFiles[3];

      selectFileTypeOption(
        '[data-cy="filetype-actionable-section"]',
        "Text files",
      );
      cy.get(parseContentToggle).check({ force: true });
      cy.get(parseContentToggle).should("be.checked");

      // -------- BEFORE UPLOAD: properties should be empty --------
      verifyFileExposedProperties(textWidget, null, {
        includeParsedAndPath: true,
      });

      // -------- UPLOAD FILE --------
      uploadAndVerifyFile(componentSelector, csvFile);

      // -------- AFTER UPLOAD: properties should update dynamically --------
      verifyFileExposedProperties(textWidget, csvFile);

      cy.get(textWidget)
        .should("be.visible")
        .within(() => {
          cy.contains("td", "file[0].parsedData")
            .next("td")
            .invoke("text")
            .should("not.be.empty")
            .and("include", "Alice")
            .and("include", "Bob");
        });
    });
  },
);
