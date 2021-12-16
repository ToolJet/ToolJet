# STEPS

Below steps need to be run from the root repository

- npx lerna create <package-name> -y
- npx lerna add <npm-page-name> // make sure we have the same version of the npm-package-name in each package by calling lerna add from the root of the repository.
- npx lerna add <package-name> // this links <package-name> to all packages
- npx lerna clean -y && npx lerna bootstrap --hoist // Hoisting dependencies to the root

# TODO
- used docker cp ./plugins tooljet_server_1:plugins to move plugins for local install
- will have to move it to docker files
