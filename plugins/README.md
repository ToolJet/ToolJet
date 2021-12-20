# STEPS

Below steps need to be run from the root repository

- npx lerna create <package-name> -y
- npx lerna add <npm-page-name> // make sure we have the same version of the npm-package-name in each package by calling lerna add from the root of the repository. ex: npx lerna add aws-sdk
- npx lerna add <package-name> // this links <package-name> to all packages ex: npx lerna add common
- npx lerna clean -y && npx lerna bootstrap --hoist // Hoisting dependencies to the root
- Adding a npm package to a single tooljet package can be done as: npx lerna add aws-sdk --scope=dynamodb
- where aws-sdk is the npm package and dynamodb is a tooljet package name in lerna workspace

# TODO
- add prettier eslint etc
- types are missing in some packages like gcs operations etc
- right now imported "all" packages from index.ts
- in future add babel-plugin-import to get only required modules for a application where datasources are received from api
- ex: ["gcs", "postgres"] this can be a form of response from api on the client and on the fly gotta import "only" these modules

# Breaking changes
- globalThis in mssql cacheConnection helper might not work fine
- mongodb name changed to mongo as cannot have npm package name and package name as same