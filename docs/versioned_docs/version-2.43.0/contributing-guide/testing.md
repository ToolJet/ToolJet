---
id: testing
title: Testing
---

Follow the steps below to setup and run the test specifications using Cypress. We recommend [setting up ToolJet locally](/docs/contributing-guide/setup/macos) before proceeding.

## Setting up

- Navigate to the `cypress-tests` directory and enter the following command:
  ```bash
  npm install
  ```

## Running Tests
#### Headed mode
- To run cypress in **headed** mode, run the following command:
  ```bash
  npm run cy:open
  ```
- In **headed** mode, the user will be able to choose the test specs from the test runner:
  <div style={{textAlign: 'center'}}>
  
  <img className="screenshot-full" src="/img/testing/headed.png" alt="Cypress headed mode" />
  
  </div>

#### Headless mode

- To run cypress in **headless** mode, run the following command:
  ```bash
 npm run cy:run
 ```

- For running specific spec in headless mode, run for specific spec 
  ```bash
  npm run cy:run --  --spec "cypress/e2e/dashboard/multi-workspace/manageSSO.cy.js
  ```

  <div style={{textAlign: 'center'}}>
  
  <img className="screenshot-full" src="/img/testing/headless.png" alt="Cypress headless mode" />
  
  </div>

  :::caution
  If some test specs need the environment variables, the user can pass them similar to the following command:
  ```bash
  npm run cy:open -- --env='{"pg_host":"localhost","pg_user":"postgres", "pg_password":"postgres"}'
  ```
  or the user can add env-vars in the **cypress.config.js** file
  :::


:::info
Check all the Cypress commands [here](https://docs.cypress.io/guides/guides/command-line#Commands)
:::