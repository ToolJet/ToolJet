import { commonSelectors } from "Selectors/common";

const FILE_PICKER = {
  input: 'input[type="file"]',
  fileMeta: '[data-cy$="-file-meta"]',
  countInfo: '[data-cy="filepicker1-count-validation-info"]',
  maxMsg: '[data-cy="filepicker1-maximum-files-uploaded-message"]',
  instruction: '[data-cy="filepicker1-drag-drop-instruction-text"]',
  clearBtn: '[data-cy="clearfiles-button"]',
  toast: '[data-cy="toast-message"]',
};

export const clearUploadedFiles = () => {
  cy.get("body").then(($body) => {
    if ($body.find('[data-cy="clearfiles-button"]').length > 0) {
      cy.get('[data-cy="clearfiles-button"]').click({ force: true });
    }
  });
};

export const uploadFile = (componentSelector, file) => {
  const input = cy.get(componentSelector).find(FILE_PICKER.input);

  if (file.fixturePath) {
    input.selectFile(file.fixturePath, { force: true });
  } else {
    input.selectFile(
      {
        contents: file.content,
        fileName: file.name,
        mimeType: file.type,
      },
      { force: true },
    );
  }
};

export const verifyUploadedFile = (componentSelector, file) => {
  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const extension = file.name.split(".").pop().toLowerCase();

  cy.verifyToastMessage(
    commonSelectors.toastMessage,
    "File uploaded successfully",
  );

  cy.get(componentSelector)
    .find(`[data-cy="${file.name.replace(/\./g, "-")}-file-name"]`)
    .verifyVisibleElement("contain.text", baseName);

  cy.get(componentSelector)
    .find(FILE_PICKER.fileMeta)
    .should("be.visible")
    .and(($el) => {
      const text = $el.text().toLowerCase();
      expect(text).to.include(extension);
    });
};

export const uploadAndVerifyFile = (componentSelector, file) => {
  uploadFile(componentSelector, file);
  verifyUploadedFile(componentSelector, file);
};

export const verifyCountInputCase = (
  componentSelector,
  file,
  value,
  { countInput },
) => {
  cy.get(countInput).clear().type(value);
  cy.get(countInput).should("have.value", value);

  const count = Number(value);

  if (count === 0) {
    cy.get("body").find(FILE_PICKER.instruction).should("not.exist");

    return;
  }

  if (count === 1) {
    uploadAndVerifyFile(componentSelector, file);

    cy.get(
      '[data-cy="filepicker1-maximum-files-uploaded-message"]',
    ).verifyVisibleElement("have.text", "Maximum files uploaded");

    cy.get("body").find(FILE_PICKER.instruction).should("not.exist");

    clearUploadedFiles();
    return;
  }

  uploadAndVerifyFile(componentSelector, file);

  cy.get(FILE_PICKER.instruction).verifyVisibleElement(
    "have.text",
    "Drag and drop files here or click to select files",
  );
};

export const verifyFilePickerMultiple = (
  componentSelector,
  multipleToggle,
  testFiles,
  maxCount,
) => {
  const count = Number(maxCount);

  // Enable multiple ONLY for this test
  cy.get("body").then(($body) => {
    if ($body.find(multipleToggle).length > 0) {
      cy.get(multipleToggle).check();
    }
  });

  const filesToUpload = testFiles.slice(0, count);

  filesToUpload.forEach((file, index) => {
    const currentCount = index + 1;

    uploadAndVerifyFile(componentSelector, file);

    if (currentCount < count) {
      cy.get(
        '[data-cy="filepicker1-count-validation-info"]',
      ).verifyVisibleElement("contain.text", `${currentCount}/${count}`);
    }

    if (currentCount === count) {
      cy.get(
        '[data-cy="filepicker1-maximum-files-uploaded-message"]',
      ).verifyVisibleElement("contain.text", "Maximum files uploaded");
      cy.get(
        '[data-cy="filepicker1-count-validation-info"]',
      ).verifyVisibleElement("contain.text", `${currentCount}/${count}`);
    }
  });
};

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} Bytes`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${parseFloat(kb.toFixed(2))} KB`;

  const mb = kb / 1024;
  return `${parseFloat(mb.toFixed(2))} MB`;
};

export const verifyFilePickerSizeInfo = (
  componentSelector,
  { minSizeInput, maxSizeInput },
) => {
  cy.get(minSizeInput)
    .invoke("val")
    .then((minVal) => {
      const minBytes = Number(minVal);

      cy.get(maxSizeInput)
        .invoke("val")
        .then((maxVal) => {
          const maxBytes = Number(maxVal);

          const expectedMinText = formatSize(minBytes);
          const expectedMaxText = formatSize(maxBytes);

          cy.log(`Expected Min: ${expectedMinText}`);
          cy.log(`Expected Max: ${expectedMaxText}`);

          cy.get(componentSelector)
            .find('[data-cy="filepicker1-size-validation-info"]')
            .should("be.visible")
            .invoke("text")
            .then((actualText) => {
              expect(actualText).to.include(expectedMinText);
              expect(actualText).to.include(expectedMaxText);
              expect(actualText).to.include(
                `${expectedMinText} to ${expectedMaxText}`,
              );
            });
        });
    });
};

export const verifyFilePickerFileSizeValidation = (
  componentSelector,
  { minSizeInput, maxSizeInput, sizeCases },
) => {
  cy.get(minSizeInput)
    .invoke("val")
    .then((minVal) => {
      const minBytes = Number(minVal);

      cy.get(maxSizeInput)
        .invoke("val")
        .then((maxVal) => {
          const maxBytes = Number(maxVal);

          sizeCases.forEach(({ sizeBytes }) => {
            const content = new Array(sizeBytes).fill("x").join("");
            const fileName = `test-${sizeBytes}.txt`;

            cy.get(componentSelector)
              .find('input[type="file"]')
              .selectFile(
                {
                  contents: Cypress.Buffer.from(content),
                  fileName: fileName,
                  mimeType: "text/plain",
                },
                { force: true },
              );

            if (sizeBytes < minBytes) {
              const expectedMinSize = formatSize(minBytes);
              const actualFileSize = formatSize(sizeBytes);

              cy.get(
                '[data-cy="file-picker-error-message"]',
              ).verifyVisibleElement(
                "have.text",
                `The file "${fileName}" (${actualFileSize}) is smaller than the minimum allowed size of ${expectedMinSize}.`,
              );

              cy.verifyToastMessage(
                commonSelectors.toastMessage,
                `The file "${fileName}" (${actualFileSize}) is smaller than the minimum allowed size of ${expectedMinSize}.`,
                false,
              );
            } else if (sizeBytes > maxBytes) {
              const expectedMaxSize = formatSize(maxBytes);
              const actualFileSize = formatSize(sizeBytes);

              cy.get(
                '[data-cy="file-picker-error-message"]',
              ).verifyVisibleElement(
                "have.text",
                `The file "${fileName}" (${actualFileSize}) exceeds the maximum allowed size of ${expectedMaxSize}.`,
              );

              cy.verifyToastMessage(
                commonSelectors.toastMessage,
                `The file "${fileName}" (${actualFileSize}) exceeds the maximum allowed size of ${expectedMaxSize}.`,
                false,
              );
            } else {
              cy.get('[data-cy="file-picker-error-message"]').should(
                "not.exist",
              );

              cy.verifyToastMessage(
                commonSelectors.toastMessage,
                "File uploaded successfully",
                false,
              );
            }

            clearUploadedFiles();
            cy.waitForElement('[data-cy="draggable-widget-filepicker1"]');
          });
        });
    });
};

export const selectFileTypeOption = (dropdownSelector, optionLabel) => {
  function clearDropdownSelection() {
    cy.get(dropdownSelector).then(($dropdown) => {
      const clearBtn = $dropdown.find(
        '[class*="clearIndicator"], [class*="clear-indicator"]',
      );
      if (clearBtn.length > 0) {
        cy.wrap(clearBtn).click({ force: true });
      }
    });
  }
  clearDropdownSelection();

  cy.get(dropdownSelector)
    .find('input[id^="react-select"]')
    .click({ force: true });

  cy.contains('[role="option"]', optionLabel)
    .should("be.visible")
    .click({ force: true });

  cy.get(dropdownSelector).should("contain.text", optionLabel);
};

export function verifyFileTypeValidation(
  dropdownSelector,
  componentSelector,
  errorSelector,
) {
  const fileTypeCases = [
    {
      optionLabel: "Image files",
      allowed: {
        name: "img.png",
        type: "image/png",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blocked: {
        name: "doc.pdf",
        type: "application/pdf",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blockedToast:
        'The file "doc.pdf" has an unsupported file type. Please upload files of type: image/*.',
    },
    {
      optionLabel: "Document files",
      allowed: {
        name: "doc.pdf",
        type: "application/pdf",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blocked: {
        name: "img.png",
        type: "image/png",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blockedToast:
        'The file "img.png" has an unsupported file type. Please upload files of type: .pdf,.doc,.docx,.ppt,.pptx.',
    },
    {
      optionLabel: "Spreadsheet files",
      allowed: {
        name: "sheet.xlsx",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blocked: {
        name: "txt.txt",
        type: "text/plain",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blockedToast:
        'The file "txt.txt" has an unsupported file type. Please upload files of type: .xls,.xlsx,.csv,.ods.',
    },
    {
      optionLabel: "Text files",
      allowed: {
        name: "txt.txt",
        type: "text/plain",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blocked: {
        name: "audio.mp3",
        type: "audio/mpeg",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blockedToast:
        'The file "audio.mp3" has an unsupported file type. Please upload files of type: text/*,.md,.json,.xml,.yaml.',
    },
    {
      optionLabel: "Audio files",
      allowed: {
        name: "audio.mp3",
        type: "audio/mpeg",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blocked: {
        name: "video.mp4",
        type: "video/mp4",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blockedToast:
        'The file "video.mp4" has an unsupported file type. Please upload files of type: audio/*.',
    },
    {
      optionLabel: "Video files",
      allowed: {
        name: "video.mp4",
        type: "video/mp4",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blocked: {
        name: "archive.zip",
        type: "application/zip",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blockedToast:
        'The file "archive.zip" has an unsupported file type. Please upload files of type: video/*.',
    },
    {
      optionLabel: "Archive/Compressed files",
      allowed: {
        name: "archive.zip",
        type: "application/zip",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blocked: {
        name: "img.png",
        type: "image/png",
        content: Cypress.Buffer.from("x".repeat(100)),
      },
      blockedToast:
        'The file "img.png" has an unsupported file type. Please upload files of type: .zip,.rar,.7z,.tar,.gz.',
    },
  ];

  fileTypeCases.forEach(({ optionLabel, allowed, blocked, blockedToast }) => {
    selectFileTypeOption(dropdownSelector, optionLabel);

    // -------- VALID FILE --------
    uploadFile(componentSelector, allowed);

    cy.get(componentSelector).find(errorSelector).should("not.exist");

    cy.get(componentSelector).contains(allowed.name).should("be.visible");

    clearUploadedFiles();

    // -------- INVALID FILE --------
    uploadFile(componentSelector, blocked);

    cy.get(componentSelector)
      .find(errorSelector)
      .verifyVisibleElement("have.text", blockedToast);

    cy.verifyToastMessage(commonSelectors.toastMessage, blockedToast);

    clearUploadedFiles();
  });
}
export const verifyFileExposedProperties = (
  textWidget,
  file = null,
  { includeParsedAndPath = false } = {},
) => {
  cy.get(textWidget)
    .should("be.visible")
    .within(() => {
      if (file) {
        cy.contains("td", "file[0].name")
          .next("td")
          .should("contain.text", file.name);
        cy.contains("td", "file[0].type")
          .next("td")
          .should("contain.text", file.type);
        cy.contains("td", "file[0].content")
          .next("td")
          .invoke("text")
          .should("not.be.empty");
        cy.contains("td", "file[0].dataURL")
          .next("td")
          .invoke("text")
          .should("not.be.empty");
        cy.contains("td", "file[0].base64Data")
          .next("td")
          .invoke("text")
          .should("not.be.empty");
        cy.contains("td", "isParsing")
          .next("td")
          .should("contain.text", "false");
        cy.contains("td", "clearFiles (function)")
          .next("td")
          .should("contain.text", "true");
        cy.contains("td", /^id$/)
          .next("td")
          .invoke("text")
          .should("not.be.empty");
      } else {
        const fields = [
          "file[0].name",
          "file[0].type",
          "file[0].content",
          "file[0].dataURL",
          "file[0].base64Data",
        ];

        if (includeParsedAndPath) {
          fields.push("file[0].parsedData", "file[0].filePath");
        }

        fields.forEach((field) => {
          cy.contains("td", field).next("td").should("have.text", "");
        });
      }
    });
};
