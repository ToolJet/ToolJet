
import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';

export const decorators = [
  (Story) => (
    <div className="dark-theme">
      {Story()}
    </div>
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
  backgrounds: {
    default: 'tooljet',
    values: [
      {
        name: 'tooljet',
        value: '#F8F9FA',
      }
    ],
  },
}
