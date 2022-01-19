tooljet cli
=================
<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g tooljet
$ tooljet COMMAND
running command...
$ tooljet (--version)
tooljet/0.0.5 darwin-x64 node-v15.14.0
$ tooljet --help [COMMAND]
USAGE
  $ tooljet COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`tooljet plugin create PLUGIN_NAME`](#tooljet-plugin-create-plugin_name)
* [`tooljet plugin delete PLUGIN_NAME`](#tooljet-plugin-delete-plugin_name)
* [`tooljet plugin install NPM_MODULE`](#tooljet-plugin-install-npm_module)

## `tooljet plugin create PLUGIN_NAME`

Create a new tooljet plugin

```
USAGE
  $ tooljet plugin create [PLUGIN_NAME] [--type database|api|cloud-storage]

ARGUMENTS
  PLUGIN_NAME  Name of the plugin

FLAGS
  --type=<option>  <options: database|api|cloud-storage>

DESCRIPTION
  Create a new tooljet plugin

EXAMPLES
  $ tooljet plugin create <name> --type=<database | api | cloud-storage>
```

## `tooljet plugin delete PLUGIN_NAME`

Delete a tooljet plugin

```
USAGE
  $ tooljet plugin delete [PLUGIN_NAME]

ARGUMENTS
  PLUGIN_NAME  Name of the plugin

DESCRIPTION
  Delete a tooljet plugin

EXAMPLES
  $ tooljet plugin delete <name>
```

## `tooljet plugin install NPM_MODULE`

Installs a new npm module inside a tooljet plugin

```
USAGE
  $ tooljet plugin install [NPM_MODULE] --plugin <value>

ARGUMENTS
  NPM_MODULE  Name of the npm module

FLAGS
  --plugin=<value>  (required)

DESCRIPTION
  Installs a new npm module inside a tooljet plugin

EXAMPLES
  $ tooljet plugin install <npm_module> --plugin <plugin_name>
```
<!-- commandsstop -->
