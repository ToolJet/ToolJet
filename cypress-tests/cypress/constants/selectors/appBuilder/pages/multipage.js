// Pages UI migrated from the LEFT sidebar to the RightSideBar "Page settings" tab
// (frontend/src/AppBuilder/RightSideBar/PageSettingsTab/*). Selectors below are
// verified against that source. Many controls in the new AddEditPagePopup
// (page name / handle / mark-as-home / hide / disable / events) render as plain
// inputs/switches WITHOUT data-cy, so those are driven via scoped text in utils.
export const multipageSelector = {
  // Left-rail "Pages" trigger — LeftSidebar SidebarItem builds data-cy from tip "Pages"
  // via generateCypressDataCy => left-sidebar-pages-button
  pageSettingsButton: '[data-cy="left-sidebar-pages-button"]',

  // Pages-and-navigation panel header — PageSettings.jsx:160,169
  panelHeaderTitle: ".pages-settings .panel-header-title",
  panelCloseButton: '[data-cy="pages-close-button"]',

  // Add-new-page menu — AddNewPageMenu.jsx:36 ("New page" button, id="add-new-page")
  addNewPageButton: "#add-new-page",

  // Page rows — PageMenuItem.jsx:201 data-cy=`pages-name-${generateCypressDataCy(name)}`
  pageRow: (name) => `[data-cy="pages-name-${name}"]`,

  // AddEditPagePopup (opened by clicking a page row or the New page button) — AddNewPagePopup.jsx
  addEditPagePopup: "#add-new-page-popup",
  // first .form-control inside the popup is the Page name input (AddNewPagePopup.jsx:355)
  pageNameInput: '#add-new-page-popup input.form-control[type="text"]',
  // Handle invalid feedback — AddNewPagePopup.jsx:382
  pageHandleInvalidFeedback: '[data-cy="page-handle-invalid-feedback"]',
  // Header actions of the page configuration, now shown in the right panel (AddNewPagePopup.jsx)
  deletePageButton: '[data-cy="delete-page-button"]',
  closePageConfigurationButton: '[data-cy="close-page-configuration-button"]',

  // Delete confirmation modal — DeletePageConfirmationModal.jsx:91,97,99,102
  deleteModalTitle: ".delete-page-modal .modal-title",
  modalMessage: '[data-cy="modal-message"]',
  modalConfirmButton: '[data-cy="modal-confirm-button"]',
  modalCancelButton: '[data-cy="modal-cancel-button"]',

  // Hidden / home / disabled indicators rendered on the page row (PageMenuItem.jsx:210-233)
  homePageIcon: ".main-page-icon-wrapper",
};
