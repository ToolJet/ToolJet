# STEPS

Below steps need to be run from inside the plugins folder

- npx lerna create <package-name> -y
- npx lerna add <package-name> // this links <package-name> to all packages ex: npx lerna add common
- npx lerna add <npm-page-name> // make sure we have the same version of the npm-package-name in each package by calling lerna add from the root of the repository. ex: npx lerna add aws-sdk
- npx lerna clean -y && npx lerna bootstrap --hoist // Hoisting dependencies to the root
- Adding a npm package to a single tooljet package can be done as: npx lerna add aws-sdk --scope=dynamodb
- where aws-sdk is the npm package and dynamodb is a tooljet package name in lerna workspace

# COMMON steps
- npx lerna create mssql -y   
- npx lerna add common 
- npx lerna add knex --scope=mssql
- npx lerna run build --stream [builds all packages]

# Testing
- NODE_OPTIONS=--experimental-vm-modules npx jest

# TODO
- add prettier eslint etc
- types are missing in some packages like gcs operations etc
- in future add babel-plugin-import to get only required modules for a application where datasources are received from api
- ex: ["gcs", "postgres"] this can be a form of response from api on the client and on the fly gotta import "only" these modules
- boilerplate file generation is happening in .js format, need to add .gitignore plus file generation in .ts format 

