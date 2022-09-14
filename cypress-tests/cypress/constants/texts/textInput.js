export const textInputText = {
  customValidation: (name, message,) => {
    return ["{{",`components.${name}.value ? true : '${message}'}}`,];
  },

  defaultWidgetName: "textinput1",
  textInputRegex: "^[A-Z]*$",
  textMinimumLength: "4",
  textMaximumLength: "10",
  customValidadtionError: "Value should be something",
  textInputDocumentationLink: "TextInput documentation",
}