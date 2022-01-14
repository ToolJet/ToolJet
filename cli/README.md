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
tooljet/0.0.0 darwin-x64 node-v14.17.3
$ tooljet --help [COMMAND]
USAGE
  $ tooljet COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`tooljet help [COMMAND]`](#tooljet-help-command)
* [`tooljet plugin create PLUGIN [--type]`](#tooljet-plugin-create-plugin)
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

## `tooljet plugin create PLUGIN`

Creates boilerplate plugin file related code.

```
USAGE
  $ tooljet plugin create PLUGIN [--type]

FLAGS
  --type  database | api | cloud-storage

DESCRIPTION
  Creates all related files for the new plugin inside plugins folder.

EXAMPLES
  $ tooljet plugin create airtable --type=api
```

<!-- commandsstop -->
