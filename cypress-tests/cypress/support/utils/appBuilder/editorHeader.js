// ┌─ AUTO-GENERATED from @tj annotations below — do not edit by hand ─┐
// editorHeader.js
//   renameApp                        -                    → editor
//   verifyAppName                    -                    → editor
//   verifyCurrentEnvironment         -                    → editor
//   verifyCurrentVersion             -                    → editor
//   addNewVersion                    -                    → editor
//   promoteEnv                       -                    → editor
// └──────────────────────────────────────────────────────────────────┘
/**
 * MODULE — appBuilder/editorHeader: top app-builder header bar helpers.
 * FOR AI: act on the editor header — rename the app, read/assert app name, current
 * environment and version, create a new version, and promote across environments.
 * NOT here: page navigation → pages.js · component config → properties.js / styles.js.
 */

/**
 * @tjBlock  editor
 * @tjUsage  renameApp('My App')
 * @tjDom    editor-app-name-input → app-name-input field → rename-app confirm
 */
export const renameApp = (name) => {
  cy.get('[data-cy="editor-app-name-input"]').click();
  cy.get("[data-cy='app-name-input']").type(`{selectAll}{backspace}${name}`, {
    force: true,
  });
  cy.get("[data-cy='rename-app']").click();
};

/**
 * @tjBlock  editor
 * @tjUsage  verifyAppName('My App')
 * @tjDom    editor-app-name-input — asserts displayed app name text
 */
export const verifyAppName = (name) => {
  cy.get('[data-cy="editor-app-name-input"]').should("have.text", name);
};

/**
 * @tjBlock  editor
 * @tjUsage  verifyCurrentEnvironment('Development')
 * @tjDom    list-current-env-name — asserts active environment label
 */
export const verifyCurrentEnvironment = (envName) => {
  cy.get('[data-cy="list-current-env-name"]').should("have.text", envName);
};

/**
 * @tjBlock  editor
 * @tjUsage  verifyCurrentVersion('v1')
 * @tjDom    *-current-version-text — asserts active version label
 */
export const verifyCurrentVersion = (version) => {
  cy.get('[data-cy*="-current-version-text"]').should("have.text", version);
};

/**
 * @tjBlock  editor
 * @tjUsage  addNewVersion('v2', 'v1')
 * @tjDom    version dropdown → create-new-version-button → optional from-version select → version-name-input
 */
export const addNewVersion = (newVersion, fromVersion) => {
  cy.get('[data-cy*="-current-version-text"]').click();
  cy.get('[data-cy="create-new-version-button"]').click();
  if (fromVersion) {
    cy.get('[data-cy="create-version-from-input-field"]').click();
    cy.contains('[id*="react-select"]', fromVersion).click();
  }
  cy.get('[data-cy="version-name-input-field"]').type(newVersion, {
    force: true,
  });
  cy.get('[data-cy="create-new-version-button"]').click();
  cy.verifyToastMessage("Version Created");
};

/**
 * @tjBlock  editor
 * @tjUsage  promoteEnv()
 * @tjDom    promote-button (open promote flow, then confirm) — advances the app to the next environment
 */
export const promoteEnv = () => {
  cy.get('[data-cy="promote-button"]').first().click();
  cy.get('[data-cy="promote-button"]').last().click();
};
