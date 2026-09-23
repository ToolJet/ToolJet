/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

/**
 * @type {Cypress.PluginConfig}
 */
// eslint-disable-next-line no-unused-vars
module.exports = (on, config) => {
  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
};
const webpack = require("@cypress/webpack-preprocessor");

module.exports = (on, config) => {
  const options = {
    webpackOptions: require("../webpack.config"),
    watchOptions: {},
  };
  on("file:preprocessor", webpack(options));

  // Real HTML5 drag-and-drop via CDP. Registers cdpRealDrag / cdpRealDragInit
  // tasks so cy.realDrag, cy.realDragAndDrop, and cy.realDragInit work in
  // every config that loads this plugin file (all current configs do).
  require("cypress-real-dnd/plugin").realDragDropPlugin(on);

  // Temporary diagnostic log task (used by _probe.cy.js). Safe to keep.
  on("task", {
    log(message) {
      console.log(message);
      return null;
    },
  });

  return config;
};
