// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import "cypress-real-events/support";
import "@cypress/code-coverage/support";
import "cypress-real-events";

import "../commands/commands";
import "../commands/apiCommands";
import "../commands/workflowsApiCommands";
import '../commands/workflowCommands';

import '../commands/platform/platformApiCommands';

import '../commands/marketplace/marketplaceAPICommands';
import '../commands/marketplace/marketplaceCommands';

import '../commands/platform/gitSyncCommands';
import '../commands/platform/gitSyncAppCommands';

// Browser-side cy.realDragAndDrop / cy.realDrag commands. Real HTML5 drag
// via CDP — the only reliable way to trigger react-dnd's html5 backend from
// Cypress.
import 'cypress-real-dnd/commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')
Cypress.on("uncaught:exception", (err, runnable) => {
  return false;
});

