---
id: testing
title: Testing
---

Suivez les étapes ci-dessous pour configurer et exécuter les spécifications de test à l'aide de Cypress. Nous vous recommandons de [configurer ToolJet en local](/docs/contributing-guide/setup/macos) avant de continuer.

## Configuration

- Accédez au répertoire `cypress-tests` et saisissez la commande suivante :
  ```bash
  npm install
  ```

## Exécution des tests

#### Mode avec interface (headed)

- Pour exécuter Cypress en mode **headed**, exécutez la commande suivante :
  ```bash
  npm run cy:open
  ```
- En mode **headed**, l'utilisateur pourra choisir les specs de test depuis le test runner :
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/testing/headed.png" alt="Cypress headed mode" />

  </div>

#### Mode sans interface (headless)

- Pour exécuter Cypress en mode **headless**, exécutez la commande suivante :

  ```bash
  npm run cy:run
  ```

- Pour exécuter une spec spécifique en mode headless, exécutez la commande suivante :
  
  ```bash
  npm run cy:run --  --spec "cypress/e2e/dashboard/multi-workspace/manageSSO.cy.js
  ```

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/testing/headless.png" alt="Cypress headless mode" />

  </div>

  :::caution
  Si certaines specs de test nécessitent des variables d'environnement, l'utilisateur peut les transmettre de manière similaire à la commande suivante :

  ```bash
  npm run cy:open -- --env='{"pg_host":"localhost","pg_user":"postgres", "pg_password":"postgres"}'
  ```

  ou l'utilisateur peut ajouter les variables d'environnement dans le fichier **cypress.config.js**
  :::

:::info
Consultez toutes les commandes Cypress [ici](https://docs.cypress.io/guides/guides/command-line#Commands)
:::
