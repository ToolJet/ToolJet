
import React from "react";
export const decorators = [
  (Story) => (
    <body className="dark-theme">
      {Story()}
    </body>
  ),
];
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}
