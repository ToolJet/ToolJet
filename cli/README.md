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
tooljet/0.0.1 darwin-x64 node-v15.14.0
$ tooljet --help [COMMAND]
USAGE
  $ tooljet COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`tooljet help [COMMAND]`](#tooljet-help-command)
* [`tooljet plugin create PLUGIN_NAME`](#tooljet-plugin-create-plugin_name)
* [`tooljet plugin delete PLUGIN_NAME`](#tooljet-plugin-delete-plugin_name)
* [`tooljet plugin install NPM_MODULE`](#tooljet-plugin-install-npm_module)
* [`tooljet plugins`](#tooljet-plugins)
* [`tooljet plugins:inspect PLUGIN...`](#tooljet-pluginsinspect-plugin)
* [`tooljet plugins:install PLUGIN...`](#tooljet-pluginsinstall-plugin)
* [`tooljet plugins:link PLUGIN`](#tooljet-pluginslink-plugin)
* [`tooljet plugins:uninstall PLUGIN...`](#tooljet-pluginsuninstall-plugin)
* [`tooljet plugins update`](#tooljet-plugins-update)

## `tooljet help [COMMAND]`

Display help for tooljet.

```
USAGE
  $ tooljet help [COMMAND] [-n]

ARGUMENTS
  COMMAND  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for tooljet.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.1.9/src/commands/help.ts)_

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

Create a new tooljet plugin

```
USAGE
  $ tooljet plugin install [NPM_MODULE] --plugin <value>

ARGUMENTS
  NPM_MODULE  Name of the npm module

FLAGS
  --plugin=<value>  (required)

DESCRIPTION
  Create a new tooljet plugin

EXAMPLES
  $ tooljet plugin install <npm_module> --plugin=<plugin_name>
```

## `tooljet plugins`

List installed plugins.

```
USAGE
  $ tooljet plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ tooljet plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.0.11/src/commands/plugins/index.ts)_

## `tooljet plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ tooljet plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ tooljet plugins:inspect myplugin
```

## `tooljet plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ tooljet plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.

  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ tooljet plugins add

EXAMPLES
  $ tooljet plugins:install myplugin 

  $ tooljet plugins:install https://github.com/someuser/someplugin

  $ tooljet plugins:install someuser/someplugin
```

## `tooljet plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ tooljet plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLES
  $ tooljet plugins:link myplugin
```

## `tooljet plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ tooljet plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ tooljet plugins unlink
  $ tooljet plugins remove
```

## `tooljet plugins update`

Update installed plugins.

```
USAGE
  $ tooljet plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
