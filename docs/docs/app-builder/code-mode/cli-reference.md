---
id: cli-reference
title: Code Mode CLI Reference
sidebar_label: CLI Reference
---

<div className="badge badge--primary heading-badge">
  <img
    src="/img/badge-icons/premium.svg"
    alt="Icon"
    width="16"
    height="16"
  />
 <span>Paid feature</span>
</div>

:::caution BETA
Code mode is in beta and not recommended for production use.
:::

This page lists the ToolJet CLI commands, flags, environment variables and files for Code mode apps. For a walkthrough, see [Work Locally](/docs/app-builder/code-mode/local-development).

## Install

Install the CLI from your ToolJet instance:

```bash
npm i -g https://tooljet.example.com/api/code-mode/cli/tooljet-cli.tgz
```

If your instance doesn't serve the CLI, install `@tooljet/cli@beta` from npm. The CLI needs Node.js 18 or later.

## Commands

| <div style={{ width:"280px"}}> Command </div> | <div style={{ width:"130px"}}> Run From </div> | <div style={{ width:"300px"}}> What It Does </div> |
|:---------- | :---------- | :------------ |
| `tooljet auth login --url <url>` | Anywhere | Signs in through the browser. |
| `tooljet login` | Anywhere | Signs in with a pasted personal access token. |
| `tooljet app init <dir>` | Anywhere | Creates a new Code mode project. |
| `tooljet app clone <appId> [dir]` | Anywhere | Creates a project linked to an existing app. |
| `tooljet app install` | Project folder | Installs dependencies without install scripts. |
| `tooljet app pull` | Project folder | Reads the app's queries, tables and pages, and writes `tooljet.gen.ts`. |
| `tooljet app check` | Project folder | Checks the code against the app, and runs the security scan. |
| `tooljet app dev` | Project folder | Builds on every save and shows the app live in the editor. |
| `tooljet app publish` | Project folder | Saves the draft as a version. |
| `tooljet app checkout [version]` | Project folder | Picks the version the project works on. |
| `tooljet app source-pull` | Project folder | Brings code changed in the editor or by AI into the project. |
| `tooljet app vet <packages...>` | Anywhere | Checks npm packages before you add them. |
| `tooljet skill install` | Project folder | Writes instructions for coding agents. |
| `tooljet library init <dir> --template code-app` | Anywhere | Creates a Code mode project as a component library. |
| `tooljet library build` | Library folder | Builds the library to `dist/`. |
| `tooljet library typecheck` | Library folder | Type-checks without building. |

A project folder is any folder at or below the one that holds `app.json`. Outside one, project commands fail with `No app.json here or above: run this inside an app project (tooljet app init / clone).`

`lib` is an alias for `library`.

## Choose the Instance and Token

These flags work on `app init`, `app clone`, `app pull`, `app check`, `app dev`, `app publish`, `app checkout` and `app source-pull`:

| <div style={{ width:"150px"}}> Flag </div> | <div style={{ width:"500px"}}> Description </div> |
|:---------- | :---------- |
| `--url` | ToolJet API origin. Use with `--token`. |
| `--token` | Personal access token. Use with `--url`. |
| `--instance` | Use the stored login for this instance, even in a project that belongs to another one. |

The CLI picks the instance and token in this order:

1. `--url` and `--token`, else the `TOOLJET_URL` and `TOOLJET_PAT` environment variables. Give both a URL and a token.
2. The stored login for `--instance`.
3. The stored login for the project's instance, recorded in `.tooljet/instance.json` when you clone the app.
4. The default stored login.

If `--url` or `TOOLJET_URL` names another instance than the project's, the command stops. Add `--instance <url>` to run it against that instance anyway.

## `tooljet auth login`

Signs in through the browser. The CLI shows a code, you approve it on your instance's **Sign in the ToolJet CLI** page, and the CLI stores a personal access token. The token is never printed. See [Sign In](/docs/app-builder/code-mode/local-development#sign-in).

| <div style={{ width:"200px"}}> Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `--url` | Required | Your ToolJet instance (its API origin). Must use `https://`, except for `localhost` and `127.0.0.1`. |
| `--browser`, `--no-browser` | `--browser` | Open the approval page in your browser. |
| `--default` | `false` | Make this the default login even when another instance is signed in. |

- The code works for 10 minutes.
- The token is valid for 30 days by default. The server's `TOOLJET_CLI_TOKEN_DAYS` sets this, from 1 to 90 days.
- The CLI keeps one login per instance. A new login replaces the earlier one for the same instance.

```bash
tooljet auth login --url https://tooljet.example.com
```

## `tooljet login`

Asks for your ToolJet origin URL and a personal access token, checks them and stores them. It has no flags. Use it when your instance doesn't support browser sign-in, or when you already have a token.

```bash
tooljet login
```

## `tooljet app init`

Creates a Code mode project: `app.json` and the React and TypeScript source in `frontend/`.

| <div style={{ width:"200px"}}> Argument or Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `<dir>` | Required | Folder for the project. Must not exist or be empty. |
| `--name` | Required | The app name. |
| `--create` | `false` | Create the app in ToolJet now and record its ID in `app.json`. |
| `--install`, `--no-install` | `--install` | Install dependencies. No install scripts run. |

Without `--create`, `app.json` has no app ID, so commands that talk to ToolJet fail until you create the app or clone one.

```bash
tooljet app init orders-desk --name "Orders Desk" --create
```

## `tooljet app clone`

Creates a project linked to an existing app. It writes the app's routes into `app.json`, writes the code stored on ToolJet into `frontend/`, reads the app's queries, and links the folder to your instance. With git sync, it reads the draft of the git branch the folder is on.

| <div style={{ width:"200px"}}> Argument </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `<appId>` | Required | The ToolJet app ID. |
| `[dir]` | The app slug | Folder for the project. |

`clone` doesn't install dependencies. Run `tooljet app install` next.

```bash
tooljet app clone 55414690-beaa-4fa6-b41b-b8102bd7d1d8 orders-desk
```

## `tooljet app install`

Installs the project's dependencies without running any package's install scripts. It picks npm, pnpm or yarn from the lockfile in `frontend/`, and uses npm when there is none. It also installs the custom component SDK types that match your instance.

| <div style={{ width:"200px"}}> Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `--frozen` | `false` | Install exactly the lockfile, and fail if `package.json` disagrees. |

`app install` doesn't take `--url`, `--token` or `--instance`.

```bash
tooljet app install
```

## `tooljet app pull`

Reads the app's queries, ToolJet Database tables and pages, and writes typed hooks to `frontend/src/tooljet.gen.ts`. It reads the checked-out version, else the draft of your git branch, else the editing version. Run it after a query changes in ToolJet.

```bash
tooljet app pull
```

## `tooljet app check`

Fails when the code names a query, route, link or page the app doesn't have, or when the security scan fails the gate. It also lists accessibility warnings, which never fail the check.

| <div style={{ width:"200px"}}> Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `--offline` | `false` | Check against the last `tooljet app pull` instead of reading the app now. The scan skips its network checks and reports them as "not run". |
| `--scan`, `--no-scan` | `--scan` | Run the security scan. |
| `--sarif <file>` | | Write the security scan as SARIF 2.1.0 to this file. |
| `--policy <file>` | | Scan policy JSON. The workspace policy decides when you publish. |
| `--json` | `false` | Print one JSON report instead of text. |

It checks that:

- Every `useQuery('<name>')` and `useAppQuery('<name>')` names a query the app has.
- Every `routePath('<id>')` names a route in `app.json`.
- Every `navigate('/<path>')`, `<Link to>` and `<NavLink to>` path matches a route in `app.json`.
- Every `<Route path>` equals a path in `app.json`.
- Every `goToPage('<handle>')` names a page the app has.
- No code casts `useAppQuery`, its `run`, or the values passed to `run`.

It exits with `1` when there is a problem or the scan fails the gate.

```bash
tooljet app check --sarif scan.sarif --json
```

## `tooljet app dev`

Builds the app on every save in `frontend/src` and shows it live in the ToolJet editor. The first build links the app: it creates the code page and one hidden page per screen. It needs a draft version. See [Start the Live Preview](/docs/app-builder/code-mode/local-development#3-start-the-live-preview).

| <div style={{ width:"230px"}}> Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"330px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `--debounce <ms>` | `200` | Milliseconds to wait after a save. |
| `--once` | `false` | Build, upload and link once, then exit. For agents and CI. |
| `--scan`, `--no-scan` | `--scan` | Scan each build and send the result to the editor's Security panel. Never blocks the build. |
| `--no-source` | `false` | Don't store the code on ToolJet after each build. By default, `dev` stores it when the code is edited on ToolJet. |
| `--source <owner>` | | Also store the code on ToolJet: `platform` hands editing to the ToolJet editor, `repository` keeps your repository the owner and the editor read-only. |
| `--source-replace` | `false` | Replace code that was edited in the ToolJet editor. Otherwise the upload stops with a conflict. |
| `--trust-remote-config` | `false` | Pull and build code from ToolJet even when it changes what a build runs on your computer, such as build config, `package.json`, the lockfile or `.npmrc`. |
| `--verbose` | `false` | Also print the stored code's revision and owner. |

While it runs, `dev` checks ToolJet for newer code every 5 seconds. See [Keep in Sync With Editor and AI Edits](/docs/app-builder/code-mode/local-development#keep-in-sync-with-editor-and-ai-edits).

```bash
tooljet app dev
tooljet app dev --once --source platform
```

## `tooljet app publish`

Saves the app's draft as a version, as **Save version** does in the editor. It installs exactly the lockfile, runs the `app check` rules, builds for production, stores the code on ToolJet, runs the security scan with the workspace policy, and saves the version. ToolJet freezes the code with the version. `publish` doesn't release or promote the version.

| <div style={{ width:"200px"}}> Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `-n`, `--name` | The draft's name | The version's name. |
| `-m`, `--message` | | A description for the version. |
| `--allow-findings` | `false` | Save even when the security scan fails the gate. Releasing then needs **Release anyway** with a reason. |
| `--source <owner>` | The current owner, else `platform` | Who edits the code after this: `platform` or `repository`. |
| `--source-replace` | `false` | Replace code that was edited in the ToolJet editor. |
| `--verbose` | `false` | Also print the stored code's revision and owner. |

`publish` needs:

- An app ID in `app.json`.
- A lockfile in `frontend/`. Run `tooljet app install` and commit the lockfile.
- A draft version.
- No `app check` problems and no TypeScript errors.

```bash
tooljet app publish --name v3 --message "Adds the returns screen"
```

## `tooljet app checkout`

Picks the ToolJet version the project works on, by name or ID. `pull`, `check`, `dev` and `publish` then use it. It overrides the version picked by the folder's git branch. The choice is stored in `app.json` as `version` and stays on your computer.

| <div style={{ width:"200px"}}> Argument or Flag </div> | <div style={{ width:"450px"}}> Description </div> |
|:---------- | :---------- |
| `[version]` | Version name or ID. |
| `--list` | List the app's versions. The checked-out version is marked `*`. Also the result with no argument. |
| `--editing` | Follow the app's editing version again. |

`pull` and `check` work on any version. `dev` and `publish` need a draft.

```bash
tooljet app checkout --list
tooljet app checkout v3
tooljet app checkout --editing
```

## `tooljet app source-pull`

Brings the code stored on ToolJet into the project when it is newer than the project's last upload or pull, for example after an edit in the Code panel or by AI. It removes files under `frontend/src` and `frontend/styles` that ToolJet's copy doesn't have.

If a pull would overwrite files you changed, it refuses and lists them.

| <div style={{ width:"200px"}}> Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `--force` | `false` | Take ToolJet's code over files changed here. A copy of your changed files goes to `.tooljet/before-pull/`. |

```bash
tooljet app source-pull --force
```

## `tooljet app vet`

Checks npm packages before you add them: malware and known vulnerabilities, versions published in the last 7 days, licence and the blocklist. Inside a project, it uses the project's npm registry settings. It exits with `1` when the packages fail the gate.

| <div style={{ width:"200px"}}> Argument or Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `<packages...>` | Required | One or more `name`, `name@version` or `name@range`. |
| `--offline` | `false` | Skip the network checks. They report "not run", never "passed". |
| `--policy <file>` | | Scan policy JSON. |
| `--json` | `false` | Print one JSON report. |

`vet` needs the security scanner. See [Security Scanner](#security-scanner).

```bash
tooljet app vet date-fns@4.1.0 zod
```

## `tooljet skill install`

Writes instructions for building the app in Code mode for coding agents, from one source:

- `CLAUDE.md` for Claude Code
- `AGENTS.md` for Codex and Windsurf
- `.cursor/rules/tooljet.mdc` for Cursor

In `CLAUDE.md` and `AGENTS.md`, only the block between the `tooljet:begin` and `tooljet:end` markers is replaced. The rest of the file stays. It has no flags.

```bash
tooljet skill install
```

## `tooljet library init`

Creates a custom component library project. With `--template code-app`, the project is a whole app on shadcn/ui, Tailwind and React Router, with its source kept for Code mode. See also [Custom Component Libraries](/docs/app-builder/custom-component-library/overview).

| <div style={{ width:"200px"}}> Argument or Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `<dir>` | Required | Folder for the project. Starts with a letter. Letters, numbers, hyphens and underscores only. |
| `--template` | `new` | `new` for a plain React component library, or `code-app` for a whole app. |
| `--display-name` | | The library display name. Skips the prompt. Starts with a letter. Letters, numbers, spaces, hyphens and underscores. Up to 100 characters. |
| `--local` | `false` | Create the files only: no sign-in, and no library registered in a workspace. `dev` or `publish` registers it later. |

To create a Code mode app project, use `tooljet app init` instead. It adds `app.json` and the app files.

```bash
tooljet library init orders-ui --template code-app --display-name "Orders UI" --local
```

## `tooljet library build`

Builds the library to `dist/`. It needs no sign-in and uploads nothing.

| <div style={{ width:"200px"}}> Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `--env` | `production` | `production`, or `development` for the kind of build `tooljet app dev` uploads, with source locations the editor's inspector reads. |

```bash
tooljet library build --env development
```

## `tooljet library typecheck`

Type-checks the library and parses its stylesheets without building. It is fast and incremental, and uploads nothing. It exits with `1` when there are problems. Run it in the folder that holds the library's `package.json`. <!-- TODO verify: for a Code mode app project, confirm typecheck is meant to run in frontend/ -->

| <div style={{ width:"200px"}}> Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `--json` | `false` | Print the problems as JSON. |

```bash
tooljet library typecheck --json
```

## Security Scanner

The security scanner isn't part of the CLI.

- `app check` and `app dev` skip the local scan when the scanner isn't on your computer, and print `The security scanner isn't on this computer, so this code wasn't scanned here. ToolJet scans it when you publish.` They don't fail because of it.
- `app vet` needs the scanner and fails without it.
- `app publish` doesn't need it: ToolJet scans the code on the server with the workspace policy.

To scan locally, install `@tooljet/app-scanner` or set `TOOLJET_APP_SCANNER_BIN` to the scanner's `tj-app-scan.js`. <!-- TODO verify: where users get @tooljet/app-scanner; the CLI says it ships with ToolJet's enterprise server -->

## Environment Variables

| <div style={{ width:"230px"}}> Variable </div> | <div style={{ width:"420px"}}> Description </div> |
|:---------- | :---------- |
| `TOOLJET_URL` | ToolJet API origin for `app` commands. Overrides the stored login. Set it with `TOOLJET_PAT`. |
| `TOOLJET_PAT` | Personal access token for `app` commands. `TOOLJET_TOKEN` also works. |
| `TOOLJET_APP_URL` | The editor's origin, when it differs from the API origin. `app dev` uses it in the link it prints. |
| `TOOLJET_SDK_SPEC` | An npm spec for the custom component SDK to install, instead of the one your instance serves. |
| `TOOLJET_APP_SCANNER_BIN` | Path to the security scanner's `tj-app-scan.js`. |

npm commands that the CLI runs, such as installs and `app vet`, use your normal npm configuration, including `npm_config_registry` and `.npmrc`. Which registries a stored lockfile may use is a server setting: `TOOLJET_CODE_NPM_REGISTRIES` on the ToolJet server. See [Dependencies](/docs/app-builder/code-mode/project-structure#dependencies).

## Files the CLI Writes

| <div style={{ width:"250px"}}> File </div> | <div style={{ width:"400px"}}> What It Holds </div> |
|:---------- | :---------- |
| `~/.tooljet/credentials.json` | Your logins, one per instance, and the default. Readable only by you (mode `0600`). |
| `.tooljet/instance.json` | The instance this project folder belongs to. Written by `clone` and `init --create`. Git-ignored. |
| `.tooljet/snapshot.json` | The app's queries, tables and pages from the last pull. Used by `check --offline`. Git-ignored. |
| `.tooljet/source.json` | The revision of the code stored on ToolJet that the project last synced with. |
| `.tooljet/before-pull/` | Copies of your changed files, kept by `source-pull --force`. |
| `frontend/src/tooljet.gen.ts` | Typed hooks, written by `pull` and `dev`. Don't edit. |
