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
@tooljet/cli/0.0.15-beta.0 darwin-arm64 node-v22.15.1
$ tooljet --help [COMMAND]
USAGE
  $ tooljet COMMAND
...
```
<!-- usagestop -->

`tooljet plugin create/delete/install` must be run from inside a clone of the [ToolJet](https://github.com/tooljet/tooljet) repository — they read and write marketplace plugin files relative to the repo root (`marketplace/`, `docs/`, `server/src/assets/marketplace/plugins.json`).

`tooljet login` and `tooljet library init` don't require any particular working directory. `tooljet library build/dev/publish` must be run from inside a component-library directory previously created with `tooljet library init` (i.e. one containing a `.tooljet/config.json`).

`lib` is a shorthand alias for `library` — e.g. `tooljet lib publish` works the same as `tooljet library publish`. Only the `library` form is documented below.

# Commands
<!-- commands -->
* [`tooljet info`](#tooljet-info)
* [`tooljet library build`](#tooljet-library-build)
* [`tooljet library dev`](#tooljet-library-dev)
* [`tooljet library init LIBRARY_DIRECTORY_NAME`](#tooljet-library-init-library_directory_name)
* [`tooljet library publish`](#tooljet-library-publish)
* [`tooljet login`](#tooljet-login)
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

_See code: [src/commands/info.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/cli/src/commands/info.ts)_

## `tooljet library build`

Build the component library locally to dist/ (no upload, no auth required)

```
USAGE
  $ tooljet library build

DESCRIPTION
  Build the component library locally to dist/ (no upload, no auth required)

ALIASES
  $ tooljet lib build

EXAMPLES
  $ tooljet library build

  $ tooljet lib build
```

_See code: [src/commands/library/build.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/cli/src/commands/library/build.ts)_

## `tooljet library dev`

Watch src/ and upload to the dev track on every save

```
USAGE
  $ tooljet library dev [--debounce <value>] [--url <value>] [--token <value>]

FLAGS
  --debounce=<value>  [default: 300] Debounce ms between saves
  --token=<value>     API token to connect with, bypassing the stored login (must be used with --url)
  --url=<value>       ToolJet origin URL to connect to, bypassing the stored login (must be used with --token)

DESCRIPTION
  Watch src/ and upload to the dev track on every save

ALIASES
  $ tooljet lib dev

EXAMPLES
  $ tooljet library dev

  $ tooljet library dev --debounce 500

  $ tooljet library dev --url https://app.tooljet.ai --token <token>

  $ tooljet lib dev

  $ tooljet lib dev --debounce 500
```

_See code: [src/commands/library/dev.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/cli/src/commands/library/dev.ts)_

## `tooljet library init LIBRARY_DIRECTORY_NAME`

Initialize a new custom component library

```
USAGE
  $ tooljet library init LIBRARY_DIRECTORY_NAME

ARGUMENTS
  LIBRARY_DIRECTORY_NAME  Directory name for the new component library

DESCRIPTION
  Initialize a new custom component library

ALIASES
  $ tooljet lib init

EXAMPLES
  $ tooljet library init <library_directory_name>

  $ tooljet lib init <library_directory_name>
```

_See code: [src/commands/library/init.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/cli/src/commands/library/init.ts)_

## `tooljet library publish`

Build and publish a new immutable production revision of a component library

```
USAGE
  $ tooljet library publish -v <value> [-m <value>] [--skip-type-check] [--url <value>] [--token <value>]

FLAGS
  -m, --message=<value>  Optional label for the revision (shown in app builder revision picker)
  -v, --version=<value>  (required) Version for this revision — X, X.Y, or X.Y.Z (e.g. 1, 1.1, or 1.2.0); missing parts
                         default to 0
      --skip-type-check  Publish even if the build reports TypeScript errors
      --token=<value>    API token to publish with, bypassing the stored login (must be used with --url)
      --url=<value>      ToolJet origin URL to publish to, bypassing the stored login (must be used with --token)

DESCRIPTION
  Build and publish a new immutable production revision of a component library

ALIASES
  $ tooljet lib publish

EXAMPLES
  $ tooljet library publish --version 1.0.0

  $ tooljet library publish -v 1.0.0

  $ tooljet library publish --version 1.0.0 --message "Add dark mode support"

  $ tooljet library publish --version 1.0.0 --url https://app.tooljet.ai --token <token>

  $ tooljet lib publish --version 1.0.0

  $ tooljet lib publish --version 1.0.0 --message "Add dark mode support"
```

_See code: [src/commands/library/publish.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/cli/src/commands/library/publish.ts)_

## `tooljet login`

Authenticate the CLI against a ToolJet workspace

```
USAGE
  $ tooljet login

DESCRIPTION
  Authenticate the CLI against a ToolJet workspace

EXAMPLES
  $ tooljet login
```

_See code: [src/commands/login.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/cli/src/commands/login.ts)_

## `tooljet plugin create PLUGIN_NAME`

Create a new tooljet plugin

```
USAGE
  $ tooljet plugin create PLUGIN_NAME [--type database|api|cloud-storage] [-b]

ARGUMENTS
  PLUGIN_NAME  Name of the plugin

FLAGS
  -b, --build
      --type=<option>  <options: database|api|cloud-storage>

DESCRIPTION
  Create a new tooljet plugin

EXAMPLES
  $ tooljet plugin create <name> --type=<database | api | cloud-storage> [--build]
```

_See code: [src/commands/plugin/create.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/cli/src/commands/plugin/create.ts)_

## `tooljet plugin delete PLUGIN_NAME`

Delete a tooljet plugin

```
USAGE
  $ tooljet plugin delete PLUGIN_NAME [-b] [-m]

ARGUMENTS
  PLUGIN_NAME  Name of the plugin

FLAGS
  -b, --build
  -m, --marketplace

DESCRIPTION
  Delete a tooljet plugin

EXAMPLES
  $ tooljet plugin delete <name> [--build]
```

_See code: [src/commands/plugin/delete.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/cli/src/commands/plugin/delete.ts)_

## `tooljet plugin install NPM_MODULE`

Installs a new npm module inside a tooljet plugin

```
USAGE
  $ tooljet plugin install NPM_MODULE --plugin <value>

ARGUMENTS
  NPM_MODULE  Name of the npm module

FLAGS
  --plugin=<value>  (required)

DESCRIPTION
  Installs a new npm module inside a tooljet plugin

EXAMPLES
  $ tooljet plugin install <npm_module> --plugin <plugin_name>
```

_See code: [src/commands/plugin/install.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/cli/src/commands/plugin/install.ts)_
<!-- commandsstop -->
