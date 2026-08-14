---
id: eslint
title: EsLint
---

# ESLint

ESLint, en tant qu'outil de qualité de code, vérifie votre code à la recherche d'erreurs, vous aide à les corriger et impose un style de codage.

## Configuration

1. Installez l'[extension ESLint](https://eslint.org/docs/latest/user-guide/integrations) pour votre éditeur de code.
2. Définissez le formateur par défaut de votre éditeur sur `ESLint`.

:::tip
Pour les utilisateurs de VSCode, vous pouvez définir le formateur sur `ESLint` dans le fichier [**settings.json**](https://code.visualstudio.com/docs/getstarted/settings#_settingsjson).
:::

3. Installez les dépendances.
   ```bash
   npm install
   npm install --prefix server
   npm install --prefix frontend
   ```
4. Exécutez le linter.
   ```bash
   npm run --prefix server lint
   npm run --prefix frontend lint
   ```
5. Corrigez les erreurs et avertissements ESLint.
   ```bash
   npm run --prefix server format
   npm run --prefix frontend format
   ```

## Exigences

1. **Node version 22.15.1**
2. **npm version 10.9.2**

:::tip
Il est recommandé de vérifier le fichier VSCode **Setting.json** (appuyez sur `ctrl/cmnd + P` et recherchez `>Settings (JSON)`) pour vous assurer qu'il n'y a pas de surcharges des règles de configuration eslint. Commentez les règles suivantes pour eslint : **eslint.options : `{...}`**.
:::