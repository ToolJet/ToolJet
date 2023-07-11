---
id: eslint
title: EsLint
---

# ESLint 

ESLint as a code quality tool is a tool that checks your code for errors and helps you to fix them and enforces a coding style. 


## Setup


1. Install the [ESLint extension](https://eslint.org/docs/latest/user-guide/integrations) for your code editor.
2. Set your editor's default formatter to `ESLint`.

:::tip
For VSCode users, you can set the formatter to `ESLint` in the [**settings.json**](https://code.visualstudio.com/docs/getstarted/settings#_settingsjson).
:::

3. Install the dependencies.
    ```bash
    npm install
    npm install --prefix server
    npm install --prefix frontend
    ```
4. Run the linter.
    ```bash
    npm run --prefix server lint
    npm run --prefix frontend lint
    ```
5. Fix the ESlint errors and warnings.
    ```bash
    npm run --prefix server format
    npm run --prefix frontend format
    ```


## Requirements

1. **Node version 14.17.3**
2. **npm version 7.20.0**

