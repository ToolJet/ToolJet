// Granular-access selectors for app, workflow and module folder grants; app folder tiers carry no data-cy prefix.
const folderGrant = (resourceType, rowPrefix, tierPrefix, noun) => ({
  addButton: `[data-cy="add-${resourceType}-button"]`,
  row: `[data-cy="${rowPrefix}folder-granular-access"]`,
  editRow: `[data-cy="edit-${rowPrefix}folder-granular-access"]`,
  editFolderRadio: `[data-cy="${tierPrefix}edit-folder-permission-radio"]`,
  editItemsRadio: `[data-cy="${tierPrefix}edit-apps-permission-radio"]`,
  viewItemsRadio: `[data-cy="${tierPrefix}view-apps-permission-radio"]`,
  editFolderLabel: `[data-cy="${tierPrefix}edit-folder-permission-label"]`,
  editItemsLabel: `[data-cy="${tierPrefix}edit-apps-permission-label"]`,
  viewItemsLabel: `[data-cy="${tierPrefix}view-apps-permission-label"]`,
  allFoldersLabel: `[data-cy="all-${noun}-folders-label"]`,
});

export const folderGrantSelectors = {
  app: folderGrant('folder', '', '', 'app'),
  workflow: folderGrant('workflow_folder', 'workflow-', 'workflow-folder-', 'workflow'),
  module: folderGrant('module_folder', 'module-', 'module-folder-', 'module'),
};
