tooljet cli
=================
<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g @tooljet/cli
$ tooljet COMMAND
running command...
$ tooljet (--version)
@tooljet/cli/0.0.13 darwin-x64 node-v14.17.3
$ tooljet --help [COMMAND]
USAGE
  $ tooljet COMMAND
...
```
<!-- usagestop -->

Command should be executed inside `Tooljet` directory

# Commands
<!-- commands -->
* [`tooljet info`](#tooljet-info)
* [`tooljet plugin create PLUGIN_NAME`](#tooljet-plugin-create-plugin_name)
* [`tooljet plugin delete PLUGIN_NAME`](#tooljet-plugin-delete-plugin_name)
* [`tooljet plugin install NPM_MODULE`](#tooljet-plugin-install-npm_module)

## `tooljet info`

This command returns the information about where tooljet is being run

```
USAGE
  $ tooljet info

DESCRIPTION
  This command returns the information about where tooljet is being run
```

_See code: [dist/commands/info.ts](https://github.com/tooljet/tooljet/blob/v0.0.13/dist/commands/info.ts)_

## `tooljet plugin create PLUGIN_NAME`

Create a new tooljet plugin

```
USAGE
  $ tooljet plugin create [PLUGIN_NAME] [--type database|api|cloud-storage] [-b] [-m]

ARGUMENTS
  PLUGIN_NAME  Name of the plugin

FLAGS
  -b, --build
  -m, --marketplace
  --type=<option>    <options: database|api|cloud-storage>

DESCRIPTION
  Create a new tooljet plugin

EXAMPLES
  $ tooljet plugin create <name> --type=<database | api | cloud-storage> [--build]
```

## `tooljet plugin delete PLUGIN_NAME`

Delete a tooljet plugin

```
USAGE
  $ tooljet plugin delete [PLUGIN_NAME] [-b]

ARGUMENTS
  PLUGIN_NAME  Name of the plugin

FLAGS
  -b, --build

DESCRIPTION
  Delete a tooljet plugin

EXAMPLES
  $ tooljet plugin delete <name> [--build]
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
