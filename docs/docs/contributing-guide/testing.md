---
id: testing
title: Testing
---

Follow the steps below to setup and run the test specifications using Cypress. We recommend [setting up ToolJet locally](/docs/contributing-guide/setup/macos) before proceeding.

### Setting up

- Navigate to the `cypress-tests` directory and enter the following command:
  ```bash
  npm install
  ```

- Cypress will be now installed as npm module. Once done, use the headed mode to select a particular spec from the UI:
  ```bash
  npx cypress run
  ```

### Running Tests

- To run **specific spec** we can run the following command from the `cypress-tests` directory:
  ```bash
  npx cypress run -spec "cypress/e2e/rel_path_of_the_spec"
  ```

- For the **current spec** the command should be like:
  ```bash
  `npx cypress run --spec "cypress/e2e/dashboard/multi-workspace/manageSSO.cy.js"`
  ```


:::info
Check all the Cypress commands [here](https://docs.cypress.io/guides/guides/command-line#Commands)
:::