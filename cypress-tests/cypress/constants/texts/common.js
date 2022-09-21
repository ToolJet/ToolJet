export const codeMirrorInputLabel = (content) => {
  return ["{{", `${content}}}`];
};

export const path = {
  loginPath: "/login",
  profilePath: "/settings",
  manageUsers: "/users",
  confirmInvite: "/confirm-invite",
  manageGroups: "/groups",
  manageSSO: "/manage-sso",
};

export const commonText = {
  autoSave: "All changes are saved",
  email: "dev@tooljet.io",
  password: "password",
  loginErrorToast: "Invalid email or password",
  introductionMessage:
    "You can get started by creating a new application or by creating an application using a template in ToolJet Library.",
  changeIconOption: "Change icon",
  addToFolderOption: "Add to folder",
  removeFromFolderOption: "Remove from folder",
  cloneAppOption: "Clone app",
  exportAppOption: "Export app",
  deleteAppOption: "Delete app",
  cancelButton: "Cancel",
  folderCreatedToast: "Folder created.",
  createFolder: "Create folder",
  AddedToFolderToast: "Added to folder.",
  appRemovedFromFolderMessage:
    "The app will be removed from this folder, do you want to continue?",
  appRemovedFromFolderTaost: "Removed from folder.",
  modalYesButton: "Yes",
  emptyFolderText: "This folder is empty",
  allApplicationsLink: "All applications",
  deleteAppModalMessage:
    "The app and the associated data will be permanently deleted, do you want to continue?",
  appDeletedToast: "App deleted successfully.",
  folderDeletedToast: "Folder has been deleted.",
  createNewFolderButton: "+ Create new folder",
  folderInfo: "Folders",
  folderInfoText:
    "You haven't created any folders. Use folders to organize your apps",
  createFolderButton: "Create folder",
  editFolderOption: "Edit folder",
  deleteFolderOption: "Delete folder",
  updateFolderTitle: "Update Folder",
  updateFolderButton: "Update folder",
  folderDeleteModalMessage:
    "Are you sure you want to delete the folder? Apps within the folder will not be deleted.",
  closeButton: "modal close",
};

export const commonWidgetText = {
  accordionProperties: "Properties",
  accordionEvents: "Events",
  accordionGenaral: "General",
  accordionValidation: "Validation",
  accordionLayout: "Layout",

  parameterCustomValidation: "Custom validation",
  parameterShowOnDesktop: "Show on desktop",
  parameterShowOnMobile: "Show on mobile",
  parameterVisibility: "Visibility",
  parameterDisable: "Disable",
  parameterBorderRadius: "Border Radius",
  borderRadiusInput: ["{{", "20}}"],
  parameterOptionLabels: "Option labels",
  parameterBoxShadow: "Box Shadow",
  boxShadowDefaultValue: "0px 0px 0px 0px #00000040",
  parameterOptionvalues: "Option values",
  boxShadowColor: "Box Shadow Color",
  boxShadowFxValue: "-5px 6px 5px 8px #ee121240",

  codeMirrorLabelTrue: "{{true}}",
  codeMirrorLabelFalse: "{{false}}",
  codeMirrorInputTrue: codeMirrorInputLabel(true),
  codeMirrorInputFalse: codeMirrorInputLabel("false"),

  addEventHandlerLink: "+ Add event handler",
  inspectorComponentLabel: "components",
  componentValueLabel: "Value",
  labelDefaultValue: "Default Value",
  parameterLabel: "Label",

  datepickerDocumentationLink: "Datepicker documentation",
  text1: "text1",
  textinput1: "textinput1",
  toggleswitch1: "toggleswitch1",
  toggleSwitch: "Toggle Switch",
  button1: "button1",
  image1: "image1",
};

export const createBackspaceText = (text) => {
  let backspace = "{end}";
  [...text].forEach((c) => {
    backspace += "{backspace}{del}";
  });
  return backspace;
};
