export const verifyBasicStyles = (data) => {
  verifyWidgetColorCss(selectorInput, "border-color", data.borderColor);
  verifyWidgetColorCss(selectorInput, "background-color", data.bgColor);
  verifyWidgetColorCss(selectorInput, "color", data.textColor);
};
