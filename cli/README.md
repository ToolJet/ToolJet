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

Command should be executed inside `Tooljet` directory

# Commands
<!-- commands -->
* [`tooljet info`](#tooljet-info)
* [`tooljet lib build`](#tooljet-lib-build)
* [`tooljet lib deploy`](#tooljet-lib-deploy)
* [`tooljet lib dev`](#tooljet-lib-dev)
* [`tooljet lib init LIBRARY_DIRECTORY_NAME`](#tooljet-lib-init-library_directory_name)
* [`tooljet library build`](#tooljet-library-build)
* [`tooljet library deploy`](#tooljet-library-deploy)
* [`tooljet library dev`](#tooljet-library-dev)
* [`tooljet library init LIBRARY_DIRECTORY_NAME`](#tooljet-library-init-library_directory_name)
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

_See code: [src/commands/info.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/src/commands/info.ts)_

## `tooljet lib build`

Build the component library locally to dist/ (no upload, no auth required)

```
USAGE
  $ tooljet lib build

DESCRIPTION
  Build the component library locally to dist/ (no upload, no auth required)

ALIASES
  $ tooljet lib build

EXAMPLES
  $ tooljet library build

  $ tooljet lib build
```

## `tooljet lib deploy`

Build and publish a new immutable production revision of a component library

```
USAGE
  $ tooljet lib deploy [--message <value>] [--force]

FLAGS
  --force            Publish even if the build reports TypeScript errors
  --message=<value>  Optional label for the revision (shown in app builder revision picker)

DESCRIPTION
  Build and publish a new immutable production revision of a component library

ALIASES
  $ tooljet lib deploy

EXAMPLES
  $ tooljet library deploy

  $ tooljet library deploy --message "Add dark mode support"

  $ tooljet lib deploy

  $ tooljet lib deploy --message "Add dark mode support"
```

## `tooljet lib dev`

Watch src/ and upload to the dev track on every save

```
USAGE
  $ tooljet lib dev [--debounce <value>]

FLAGS
  --debounce=<value>  [default: 300] Debounce ms between saves

DESCRIPTION
  Watch src/ and upload to the dev track on every save

ALIASES
  $ tooljet lib dev

EXAMPLES
  $ tooljet library dev

  $ tooljet library dev --debounce 500

  $ tooljet lib dev

  $ tooljet lib dev --debounce 500
```

## `tooljet lib init LIBRARY_DIRECTORY_NAME`

Initialize a new custom component library

```
USAGE
  $ tooljet lib init LIBRARY_DIRECTORY_NAME

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

_See code: [src/commands/library/build.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/src/commands/library/build.ts)_

## `tooljet library deploy`

Build and publish a new immutable production revision of a component library

```
USAGE
  $ tooljet library deploy [--message <value>] [--force]

FLAGS
  --force            Publish even if the build reports TypeScript errors
  --message=<value>  Optional label for the revision (shown in app builder revision picker)

DESCRIPTION
  Build and publish a new immutable production revision of a component library

ALIASES
  $ tooljet lib deploy

EXAMPLES
  $ tooljet library deploy

  $ tooljet library deploy --message "Add dark mode support"

  $ tooljet lib deploy

  $ tooljet lib deploy --message "Add dark mode support"
```

_See code: [src/commands/library/deploy.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/src/commands/library/deploy.ts)_

## `tooljet library dev`

Watch src/ and upload to the dev track on every save

```
USAGE
  $ tooljet library dev [--debounce <value>]

FLAGS
  --debounce=<value>  [default: 300] Debounce ms between saves

DESCRIPTION
  Watch src/ and upload to the dev track on every save

ALIASES
  $ tooljet lib dev

EXAMPLES
  $ tooljet library dev

  $ tooljet library dev --debounce 500

  $ tooljet lib dev

  $ tooljet lib dev --debounce 500
```

_See code: [src/commands/library/dev.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/src/commands/library/dev.ts)_

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

_See code: [src/commands/library/init.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/src/commands/library/init.ts)_

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

_See code: [src/commands/login.ts](https://github.com/tooljet/tooljet/blob/v0.0.15-beta.0/src/commands/login.ts)_

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
