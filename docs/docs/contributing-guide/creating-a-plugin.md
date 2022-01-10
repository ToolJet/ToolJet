---
sidebar_position: 3
sidebar_label: Creating a plugin
---

- [About](#about)
- [Getting Started](#getting-started)

## About

Splitting up large codebases into separate independently versioned packages
is extremely useful for code sharing. However, making changes across many
repositories is _messy_ and difficult to track, and testing across repositories
becomes complicated very quickly.

To solve these (and many other) problems, some projects will organize their
codebases into multi-package repositories (sometimes called [monorepos](https://github.com/babel/babel/blob/master/doc/design/monorepo.md)). Projects like [Babel](https://github.com/babel/babel/tree/master/packages), [React](https://github.com/facebook/react/tree/master/packages), [Angular](https://github.com/angular/angular/tree/master/modules),
[Ember](https://github.com/emberjs/ember.js/tree/master/packages), [Meteor](https://github.com/meteor/meteor/tree/devel/packages), [Jest](https://github.com/facebook/jest/tree/master/packages), and many others develop all of their packages within a
single repository.

**Lerna is a tool that optimizes the workflow around managing multi-package
repositories with git and npm.**

Using lerna commands we will be creating a new tooljet plugin which is a database integration in our case.

### What does a Lerna repo look like?

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

We would need to run the below steps from the lerna root directory (/plugins)

1. Create all boilerplate files for a new package:
```sh
$ npx lerna create mssql -y 
```

2. Add the npm module required for writing the operations of your new datasource, the `--scope` filter adds `knex` package only to the newly created `mssql` package, without the `--scope` filter the npm module `knex` gets added to all the available packages.
```sh
$ npx lerna add knex --scope=mssql
```

3. Go ahead and add all the code related to the package i.e. after following these steps your package structure should looks something like below: 

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

4. Add the package as symlink to the root lerna repo (/plugins):
```sh
$ npx lerna link convert
```


### Hoisting packages to root of Lerna repo

All packages can be pulled up to the root of a Lerna repo with `lerna link convert`

The above command will automatically hoist things and use relative `file:` specifiers.

Hoisting has a few benefits:

- All packages use the same version of a given dependency
- Can keep dependencies at the root up-to-date with an automated tool such as [Snyk](https://snyk.io/)
- Dependency installation time is reduced
- Less storage is needed

This command needs to be run to add the newly added plugin into the lerna root package json

