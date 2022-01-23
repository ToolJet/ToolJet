---
sidebar_position: 3
sidebar_label: Creating a plugin
---

- [About](#about)
- [Getting Started](#getting-started)

## About

Using tooljet cli we will be creating a new tooljet plugin which is a database integration in our case.

### What does a plugin look like?

There's actually very little to it. You have a file structure that looks like this:

```
plugins/
  package.json
  packages/
    package-1/
      package.json
      lib/
        icon.svg
        index.ts
        operations.json
        manifest.json
    package-2/
      package.json
      lib/
        icon.svg
        index.ts
        operations.json
        manifest.json
```

## Getting Started
Let's start by installing plugin dependencies of your the project with [npm](https://www.npmjs.com/).

```sh
$ cd plugins && npm i
```

For example let's try to create a new plugin for mssql datasource. 

1. Install [tooljet cli](https://www.npmjs.com/package/tooljet):
```sh
$ npm i -g tooljet
```

2. Create a new package
```sh
$ tooljet plugin create mssql
```

3. Install a new npm package
```sh
$ tooljet plugin install knex --plugin mssql
```

4. Go ahead and add all the code related to the package i.e. after following these steps your package structure should looks something like below: 

```
plugins/
  package.json
  packages/
    mssql/
      __tests__
        mssql.test.js
      package.json
      lib/
        icon.svg
        index.ts
        operations.json
        manifest.json
```
