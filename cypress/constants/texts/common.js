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
  parameterBorderRadius: "Border radius",
  borderRadiusInput: ["{{", "20}}"],

  codeMirrorLabelTrue: "{{true}}",
  codeMirrorLabelFalse: "{{false}}",
  codeMirrorInputTrue: codeMirrorInputLabel(true),
  codeMirrorInputFalse: codeMirrorInputLabel("false"),

  addEventHandlerLink: "+ Add event handler",
  inspectorComponentLabel: "components",
  componentValueLabel: "Value",

  datepickerDocumentationLink: "Datepicker documentation",
};

export const createBackspaceText = (text) => {
  let backspace = "";
  [...text].forEach((c) => (backspace += "{backspace}"));
  return backspace;
};
