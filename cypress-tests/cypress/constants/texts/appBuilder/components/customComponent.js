// Texts for the Custom Component widget. Config: packages/widget-definitions/src/widgets/customComponent.js
export const customComponentText = {
  displayName: "Custom Component", // customComponent.js:3
  defaultWidgetName: "customcomponent1",
  widgetPrefix: "customcomponent",
  defaultSize: { width: 20, height: 140 }, // customComponent.js:10-13

  // What the definition Data + Code render in a freshly dropped widget
  defaultTitle: "Hi! There", // customComponent.js:58 (data.title → <h1>, :66)
  defaultButtonText: "Update Title", // customComponent.js:58 (data.buttonText → <Button>, :72)
  updatedTitle: "Hello World!!", // customComponent.js:70 — the default button's updateData({ title })

  // Saved style defaults (customComponent.js:82-87)
  defaultBorderColorVar: "--cc-weak-border", // customComponent.js:85
  defaultBorderRadius: 6, // customComponent.js:84
  defaultBoxShadow: "rgba(0, 0, 0, 0.25) 0px 0px 0px 0px", // customComponent.js:86 `0px 0px 0px 0px #00000040`
  borderColorProperty: "--cc-custom-component-border-color", // CustomComponent.jsx:174

  // Styles-tab labels (customComponent.js:28,37,43)
  borderColor: "Border color",
  boxShadowColor: "Box shadow Color",

  // iframe.html:3-5 — the pinned runtime bundles every frame loads before the author code
  frameRuntime: {
    babel: "7.17.9", // iframe.html:3 @babel/standalone@7.17.9
    react: "16.7.0", // iframe.html:4 react@16.7.0
    scripts: [
      "https://unpkg.com/@babel/standalone@7.17.9/babel.min.js", // iframe.html:3
      "https://unpkg.com/react@16.7.0/umd/react.production.min.js", // iframe.html:4
      "https://unpkg.com/react-dom@16.7.0/umd/react-dom.production.min.js", // iframe.html:5
    ],
  },

  // card.scss:4 — the `.card` outline the wrapper overrides with `outline: none` (CustomComponent.jsx:181)
  cardOutlineStyle: "solid",
};
