
import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useDarkMode } from 'storybook-dark-mode'

export const decorators = [
  (Story) => {
    console.log(useDarkMode())

    return<div className={useDarkMode()&&'dark-theme'}><Story /></div>
  }
]
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  backgrounds: {
  },
  darkMode: {
    darkClass: 'dark-theme',
    lightClass: ''
  }
}
