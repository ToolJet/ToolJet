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
@tooljet/cli/1.0.0 darwin-arm64 node-v22.23.4
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
* [`tooljet app check`](#tooljet-app-check)
* [`tooljet app checkout [VERSION]`](#tooljet-app-checkout-version)
* [`tooljet app clone APPID [DIR]`](#tooljet-app-clone-appid-dir)
* [`tooljet app dev`](#tooljet-app-dev)
* [`tooljet app init DIR`](#tooljet-app-init-dir)
* [`tooljet app install`](#tooljet-app-install)
* [`tooljet app publish`](#tooljet-app-publish)
* [`tooljet app pull`](#tooljet-app-pull)
* [`tooljet app source-pull`](#tooljet-app-source-pull)
* [`tooljet app vet PACKAGES`](#tooljet-app-vet-packages)
* [`tooljet auth login`](#tooljet-auth-login)
* [`tooljet info`](#tooljet-info)
* [`tooljet library build`](#tooljet-library-build)
* [`tooljet library dev`](#tooljet-library-dev)
* [`tooljet library init LIBRARY_DIRECTORY_NAME`](#tooljet-library-init-library_directory_name)
* [`tooljet library publish`](#tooljet-library-publish)
* [`tooljet library typecheck`](#tooljet-library-typecheck)
* [`tooljet login`](#tooljet-login)
* [`tooljet plugin create PLUGIN_NAME`](#tooljet-plugin-create-plugin_name)
* [`tooljet plugin delete PLUGIN_NAME`](#tooljet-plugin-delete-plugin_name)
* [`tooljet plugin install NPM_MODULE`](#tooljet-plugin-install-npm_module)
* [`tooljet skill install`](#tooljet-skill-install)

## `tooljet app check`

Fail when the code names a query, route or page the app does not have, or when the security scan (code, secrets, dependencies) fails the gate; list accessibility warnings (jsx-a11y recommended rules)

```
USAGE
  $ tooljet app check [--offline] [--scan] [--sarif <value>] [--policy <value>] [--json] [--url <value>]
    [--token <value>] [--instance <value>]

FLAGS
  --instance=<value>  Use this instance's stored login, even in a project that belongs to another (a project uses its
                      own instance's login by default)
  --json              Print one JSON report instead of text
  --offline           Check against the last `tooljet app pull` instead of reading the app now; the security scan skips
                      its network checks (they report "not run")
  --policy=<value>    Scan policy JSON (the workspace policy decides at publish)
  --sarif=<value>     Write the security scan as SARIF 2.1.0 to this file
  --[no-]scan         Run the security scan
  --token=<value>     Personal access token (else TOOLJET_PAT, else the stored login)
  --url=<value>       ToolJet API origin (else TOOLJET_URL, else the stored login)

DESCRIPTION
  Fail when the code names a query, route or page the app does not have, or when the security scan (code, secrets,
  dependencies) fails the gate; list accessibility warnings (jsx-a11y recommended rules)

EXAMPLES
  $ tooljet app check

  $ tooljet app check --offline   # against the last pull, and no network checks in the scan

  $ tooljet app check --sarif scan.sarif --json
```

_See code: [src/commands/app/check.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/app/check.ts)_

## `tooljet app checkout [VERSION]`

Work on one ToolJet version of the app (by name or id): pull, check, dev and publish then use it. With git sync, the git branch the folder is on already picks that branch's draft; checkout overrides it.

```
USAGE
  $ tooljet app checkout [VERSION] [--url <value>] [--token <value>] [--instance <value>] [--list] [--editing]

ARGUMENTS
  VERSION  Version name or id

FLAGS
  --editing           Follow the app's editing version again
  --instance=<value>  Use this instance's stored login, even in a project that belongs to another (a project uses its
                      own instance's login by default)
  --list              List the app's versions
  --token=<value>     Personal access token (else TOOLJET_PAT, else the stored login)
  --url=<value>       ToolJet API origin (else TOOLJET_URL, else the stored login)

DESCRIPTION
  Work on one ToolJet version of the app (by name or id): pull, check, dev and publish then use it. With git sync, the
  git branch the folder is on already picks that branch's draft; checkout overrides it.

EXAMPLES
  $ tooljet app checkout v3

  $ tooljet app checkout --list

  $ tooljet app checkout --editing
```

_See code: [src/commands/app/checkout.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/app/checkout.ts)_

## `tooljet app clone APPID [DIR]`

Create an app project linked to an existing ToolJet app (its Code mode routes, if it has any)

```
USAGE
  $ tooljet app clone APPID [DIR] [--url <value>] [--token <value>] [--instance <value>]

ARGUMENTS
  APPID  The ToolJet app id
  DIR    Folder for the project (default: the app slug)

FLAGS
  --instance=<value>  Use this instance's stored login, even in a project that belongs to another (a project uses its
                      own instance's login by default)
  --token=<value>     Personal access token (else TOOLJET_PAT, else the stored login)
  --url=<value>       ToolJet API origin (else TOOLJET_URL, else the stored login)

DESCRIPTION
  Create an app project linked to an existing ToolJet app (its Code mode routes, if it has any)

EXAMPLES
  $ tooljet app clone 55414690-beaa-4fa6-b41b-b8102bd7d1d8 orders
```

_See code: [src/commands/app/clone.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/app/clone.ts)_

## `tooljet app dev`

Build the app on every save and show it live in the ToolJet builder

```
USAGE
  $ tooljet app dev [--debounce <value>] [--trust-remote-config] [--prebuilt <value> --once] [--scan] [--url
    <value>] [--token <value>] [--instance <value>] [--source repository|platform] [--source-replace] [--verbose]
    [--no-source]

FLAGS
  --debounce=<value>     [default: 200] Milliseconds to wait after a save
  --instance=<value>     Use this instance's stored login, even in a project that belongs to another (a project uses its
                         own instance's login by default)
  --no-source            Don't store the source on ToolJet after each build (by default dev does when the ToolJet editor
                         owns it)
  --once                 Build, upload and link once, then exit
  --prebuilt=<value>     With --once: upload this already built dist folder (a build service made it from this project
                         with `tooljet library build --env development`) instead of building here; installs nothing on
                         this machine
  --[no-]scan            Scan each build and upload the result to the Security panel (never blocks the build)
  --source=<option>      Also store the source on ToolJet: "repository" keeps this repository the owner (the editor
                         shows it read-only), "platform" hands editing to the ToolJet editor
                         <options: repository|platform>
  --source-replace       Replace source that was edited in the ToolJet editor (otherwise the upload stops with a
                         conflict)
  --token=<value>        Personal access token (else TOOLJET_PAT, else the stored login)
  --trust-remote-config  Pull and build code from ToolJet even when it changes what a build runs on this machine: build
                         config, package.json, the lockfile, .npmrc, a stylesheet @config or @plugin and the files they
                         load, components while recordRender is on, or any changed file, of any type, while a build
                         config loads files by a computed name
  --url=<value>          ToolJet API origin (else TOOLJET_URL, else the stored login)
  --verbose              Also print the stored code's revision and owner

DESCRIPTION
  Build the app on every save and show it live in the ToolJet builder

EXAMPLES
  $ tooljet app dev

  $ tooljet app dev --once   # build, upload and link once, then exit (agents, CI)
```

_See code: [src/commands/app/dev.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/app/dev.ts)_

## `tooljet app init DIR`

Create an app project in Code mode: app.json and the React + TypeScript source in frontend/

```
USAGE
  $ tooljet app init DIR --name <value> [--create] [--install] [--url <value>] [--token <value>] [--instance
    <value>]

ARGUMENTS
  DIR  Folder for the project

FLAGS
  --create            Create the app in ToolJet now and record its id in app.json
  --[no-]install      Install dependencies (no install scripts run)
  --instance=<value>  Use this instance's stored login, even in a project that belongs to another (a project uses its
                      own instance's login by default)
  --name=<value>      (required) The app name
  --token=<value>     Personal access token (else TOOLJET_PAT, else the stored login)
  --url=<value>       ToolJet API origin (else TOOLJET_URL, else the stored login)

DESCRIPTION
  Create an app project in Code mode: app.json and the React + TypeScript source in frontend/

EXAMPLES
  $ tooljet app init orders --name "Orders"

  $ tooljet app init orders --name "Orders" --create   # also create the app in ToolJet
```

_See code: [src/commands/app/init.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/app/init.ts)_

## `tooljet app install`

Install the app's dependencies without running any package's install scripts (npm, pnpm or yarn, from the lockfile)

```
USAGE
  $ tooljet app install [--frozen]

FLAGS
  --frozen  Install exactly the lockfile and fail if package.json disagrees

DESCRIPTION
  Install the app's dependencies without running any package's install scripts (npm, pnpm or yarn, from the lockfile)

EXAMPLES
  $ tooljet app install

  $ tooljet app install --frozen   # exactly the lockfile, as publish does
```

_See code: [src/commands/app/install.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/app/install.ts)_

## `tooljet app publish`

Save the app's draft as a version (Save version in the editor): build the code, store it on ToolJet as the draft's code, check it, and save. ToolJet freezes that code with the version, so a released version always runs the code it was saved with. Release and promote it in ToolJet.

```
USAGE
  $ tooljet app publish [-n <value>] [-m <value>] [--allow-findings] [--url <value>] [--token <value>]
    [--instance <value>] [--source repository|platform] [--source-replace] [--verbose]

FLAGS
  -m, --message=<value>   A description for the version
  -n, --name=<value>      The version's name (default: the draft's name)
      --allow-findings    Save even when the security scan fails the gate; releasing still needs Release anyway with a
                          reason
      --instance=<value>  Use this instance's stored login, even in a project that belongs to another (a project uses
                          its own instance's login by default)
      --source=<option>   Also store the source on ToolJet: "repository" keeps this repository the owner (the editor
                          shows it read-only), "platform" hands editing to the ToolJet editor
                          <options: repository|platform>
      --source-replace    Replace source that was edited in the ToolJet editor (otherwise the upload stops with a
                          conflict)
      --token=<value>     Personal access token (else TOOLJET_PAT, else the stored login)
      --url=<value>       ToolJet API origin (else TOOLJET_URL, else the stored login)
      --verbose           Also print the stored code's revision and owner

DESCRIPTION
  Save the app's draft as a version (Save version in the editor): build the code, store it on ToolJet as the draft's
  code, check it, and save. ToolJet freezes that code with the version, so a released version always runs the code it
  was saved with. Release and promote it in ToolJet.

EXAMPLES
  $ tooljet app publish

  $ tooljet app publish --name v3
```

_See code: [src/commands/app/publish.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/app/publish.ts)_

## `tooljet app pull`

Read the app's queries, tables and pages from ToolJet (the checked-out version, else the editing version) and write typed hooks to frontend/src/tooljet.gen.ts

```
USAGE
  $ tooljet app pull [--url <value>] [--token <value>] [--instance <value>]

FLAGS
  --instance=<value>  Use this instance's stored login, even in a project that belongs to another (a project uses its
                      own instance's login by default)
  --token=<value>     Personal access token (else TOOLJET_PAT, else the stored login)
  --url=<value>       ToolJet API origin (else TOOLJET_URL, else the stored login)

DESCRIPTION
  Read the app's queries, tables and pages from ToolJet (the checked-out version, else the editing version) and write
  typed hooks to frontend/src/tooljet.gen.ts

EXAMPLES
  $ tooljet app pull
```

_See code: [src/commands/app/pull.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/app/pull.ts)_

## `tooljet app source-pull`

Bring the source stored on ToolJet (edits saved in the ToolJet editor) into this project when it is newer than the project's last upload or pull

```
USAGE
  $ tooljet app source-pull [--url <value>] [--token <value>] [--instance <value>] [--force] [--trust-remote-config]

FLAGS
  --force                Take ToolJet's code over files changed here, keeping a copy of them in .tooljet/before-pull
  --instance=<value>     Use this instance's stored login, even in a project that belongs to another (a project uses its
                         own instance's login by default)
  --token=<value>        Personal access token (else TOOLJET_PAT, else the stored login)
  --trust-remote-config  Pull even when the code on ToolJet changes what a build runs on this machine: build config,
                         package.json, the lockfile, .npmrc, or files a build config loads
  --url=<value>          ToolJet API origin (else TOOLJET_URL, else the stored login)

DESCRIPTION
  Bring the source stored on ToolJet (edits saved in the ToolJet editor) into this project when it is newer than the
  project's last upload or pull

EXAMPLES
  $ tooljet app source-pull

  $ tooljet app source-pull --force

  $ tooljet app source-pull --trust-remote-config
```

_See code: [src/commands/app/source-pull.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/app/source-pull.ts)_

## `tooljet app vet PACKAGES`

Check packages before adding them: malware and known vulnerabilities (OSV), versions published in the last 7 days, licence and the blocklist. Exits 1 when they fail the gate.

```
USAGE
  $ tooljet app vet PACKAGES... [--json] [--offline] [--policy <value>]

ARGUMENTS
  PACKAGES...  name, name@version or name@range, one or more

FLAGS
  --json            Print one JSON report
  --offline         Skip the network checks (they report "not run", never "passed")
  --policy=<value>  Scan policy JSON

DESCRIPTION
  Check packages before adding them: malware and known vulnerabilities (OSV), versions published in the last 7 days,
  licence and the blocklist. Exits 1 when they fail the gate.

EXAMPLES
  $ tooljet app vet date-fns@4.1.0 zod

  $ tooljet app vet left-pad --json
```

_See code: [src/commands/app/vet.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/app/vet.ts)_

## `tooljet auth login`

Sign in through the browser: approve the code this shows on your ToolJet instance. The token is stored in ~/.tooljet/credentials.json and never printed.

```
USAGE
  $ tooljet auth login --url <value> [--browser] [--default]

FLAGS
  --[no-]browser  Open the approve page in the browser
  --default       Make this the default login even when another instance is signed in (projects always use their own
                  instance)
  --url=<value>   (required) Your ToolJet instance (its API origin)

DESCRIPTION
  Sign in through the browser: approve the code this shows on your ToolJet instance. The token is stored in
  ~/.tooljet/credentials.json and never printed.

EXAMPLES
  $ tooljet auth login --url https://tooljet.example.com

  $ tooljet auth login --url https://tooljet.example.com --default   # also make it the default login
```

_See code: [src/commands/auth/login.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/auth/login.ts)_

## `tooljet info`

This command returns the information about where tooljet is being run

```
USAGE
  $ tooljet info

DESCRIPTION
  This command returns the information about where tooljet is being run
```

_See code: [src/commands/info.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/info.ts)_

## `tooljet library build`

Build the component library locally to dist/ (no upload, no auth required)

```
USAGE
  $ tooljet library build [--env production|development]

FLAGS
  --env=<option>  [default: production] Build for production (default) or development
                  <options: production|development>

DESCRIPTION
  Build the component library locally to dist/ (no upload, no auth required)

ALIASES
  $ tooljet lib build

EXAMPLES
  $ tooljet library build

  $ tooljet lib build
```

_See code: [src/commands/library/build.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/library/build.ts)_

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

_See code: [src/commands/library/dev.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/library/dev.ts)_

## `tooljet library init LIBRARY_DIRECTORY_NAME`

Initialize a new custom component library

```
USAGE
  $ tooljet library init LIBRARY_DIRECTORY_NAME [--template new|code-app] [--display-name <value>] [--local]

ARGUMENTS
  LIBRARY_DIRECTORY_NAME  Directory name for the new component library

FLAGS
  --display-name=<value>  Library display name (skips the prompt)
  --local                 Scaffold only: no login and no library registered on a workspace (publish or dev registers it
                          later)
  --template=<option>     [default: new] Project template: `new` (a plain React component library) or `code-app` (a
                          whole app on shadcn + Tailwind with react-router)
                          <options: new|code-app>

DESCRIPTION
  Initialize a new custom component library

ALIASES
  $ tooljet lib init

EXAMPLES
  $ tooljet library init <library_directory_name>

  $ tooljet library init my-app --template code-app

  $ tooljet library init my-app --template code-app --display-name "My app" --local

  $ tooljet lib init <library_directory_name>
```

_See code: [src/commands/library/init.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/library/init.ts)_

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

_See code: [src/commands/library/publish.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/library/publish.ts)_

## `tooljet library typecheck`

Type-check the component library and parse its stylesheets without building (fast, incremental; nothing is uploaded)

```
USAGE
  $ tooljet library typecheck [--json]

FLAGS
  --json  Print the problems as JSON

DESCRIPTION
  Type-check the component library and parse its stylesheets without building (fast, incremental; nothing is uploaded)

ALIASES
  $ tooljet lib typecheck

EXAMPLES
  $ tooljet library typecheck

  $ tooljet library typecheck --json
```

_See code: [src/commands/library/typecheck.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/library/typecheck.ts)_

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

_See code: [src/commands/login.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/login.ts)_

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

_See code: [src/commands/plugin/create.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/plugin/create.ts)_

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

_See code: [src/commands/plugin/delete.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/plugin/delete.ts)_

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

_See code: [src/commands/plugin/install.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/plugin/install.ts)_

## `tooljet skill install`

Write the instructions for building this app in Code mode for coding agents: CLAUDE.md (Claude Code), AGENTS.md (Codex, Windsurf) and .cursor/rules/tooljet.mdc (Cursor), from one source

```
USAGE
  $ tooljet skill install

DESCRIPTION
  Write the instructions for building this app in Code mode for coding agents: CLAUDE.md (Claude Code), AGENTS.md
  (Codex, Windsurf) and .cursor/rules/tooljet.mdc (Cursor), from one source

EXAMPLES
  $ tooljet skill install
```

_See code: [src/commands/skill/install.ts](https://github.com/tooljet/tooljet/blob/v1.0.0/cli/src/commands/skill/install.ts)_
<!-- commandsstop -->
