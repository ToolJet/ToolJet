---
id: cli-reference
title: React Builder CLI Reference
sidebar_label: CLI Reference
---

This page lists the ToolJet CLI commands, flags, environment variables and files for React Builder apps. For a walkthrough, see [Build Locally](./local-development.md).

## Install

Install the CLI from your ToolJet instance:

```bash
npm i -g https://tooljet.example.com/api/code-mode/cli/tooljet-cli.tgz
```

Replace `https://tooljet.example.com` with your instance's address. Your instance serves the CLI it was built with, so the CLI's React Builder commands always match your instance. The **Open locally** view in the editor shows this command with your instance filled in.

Run this even if you already have `tooljet` installed. It replaces any older `tooljet` you installed from npm. Older versions don't have the `auth`, `app` and `skill` commands.

If your instance doesn't serve the CLI, install `@tooljet/cli@beta` from npm. The CLI needs Node.js 18 or later.

## Sign In

The CLI signs in with a personal access token. Browser sign-in creates the token for you. You can also paste a token, or set one in the environment for CI.

### Sign In Through the Browser

```bash
tooljet auth login --url https://tooljet.example.com
```

1. The CLI prints an address and an eight-letter code, such as `BCDF-GHJK`, and opens the address in your browser. Add `--no-browser` to stop it from opening the browser.
2. On the **Sign in the ToolJet CLI** page, type the code from your terminal and click **Continue**. You must be signed in to ToolJet in that browser.
3. The page shows what is asking to act as you, and in which workspace. Approve only if you just ran `tooljet auth login` yourself. Click **Approve**.
4. Go back to your terminal. The CLI finishes signing in by itself and prints `✓ Signed in to <instance> as <email>`.

The code works for 10 minutes. If it expires, run `tooljet auth login` again.

The CLI gets a personal access token for the workspace you have open in the browser. It stores the token in `~/.tooljet/credentials.json`, readable only by you, and never prints it. The token doesn't refresh: when it expires, run `tooljet auth login` again. For how long it lasts, see [`tooljet auth login`](#tooljet-auth-login).

To revoke the token, go to **Profile settings** → **Personal access tokens** and click **Revoke** next to it. The token is named after your computer and the date you signed in, for example `tooljet CLI on my-laptop (2026-11-13)`.

### Sign In to More Than One Instance

The CLI keeps one login per instance. A project always uses the login for the instance it was cloned from, so you can sign in to several instances and work on projects from each.

The first login becomes the default, used outside a project. A login to another instance doesn't replace the default unless you add `--default`:

```bash
tooljet auth login --url https://staging.tooljet.example.com --default
```

To run a command with another instance's login, add `--instance <url>` to it. See [Choose the Instance and Token](#choose-the-instance-and-token).

### Sign In With a Personal Access Token

If your instance doesn't support browser sign-in, or you prefer to paste a token, use `tooljet login`. It asks for your ToolJet origin URL and a personal access token. To create a token, see [Create a Personal Access Token](../../app-builder/custom-component-library/setup.md#create-a-personal-access-token).

### Sign In From CI

In CI, set both environment variables instead of signing in:

```bash
export TOOLJET_URL=https://tooljet.example.com
export TOOLJET_PAT=<personal access token>
```

`TOOLJET_URL` and `TOOLJET_PAT` override any stored login. Set both, or neither. You can also pass `--url` and `--token` on a command.

## Commands

| <div style={{ width:"280px"}}> Command </div> | <div style={{ width:"130px"}}> Run From </div> | <div style={{ width:"300px"}}> What It Does </div> |
|:---------- | :---------- | :------------ |
| `tooljet auth login --url <url>` | Anywhere | Signs in through the browser. |
| `tooljet login` | Anywhere | Signs in with a pasted personal access token. |
| `tooljet app init <dir>` | Anywhere | Creates a new React Builder project. |
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

A project folder is any folder at or below the one that holds `app.json`. Outside one, project commands fail with `No app.json here or above: run this inside an app project (tooljet app init / clone).`

The `tooljet library` commands are for custom component libraries. See that section's [CLI Reference and Limits](../../app-builder/custom-component-library/cli-reference.md).

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

Signs in through the browser. The CLI shows a code, you approve it on your instance's **Sign in the ToolJet CLI** page, and the CLI stores a personal access token. The token is never printed. For the steps, see [Sign In Through the Browser](#sign-in-through-the-browser).

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

Creates a React Builder project: `app.json` and the React and TypeScript source in `frontend/`.

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

Creates a project linked to an existing app. It writes the app's routes into `app.json`, writes the code stored on ToolJet into `frontend/`, reads the app's queries, and links the folder to your instance. With GitSync, it reads the draft of the Git branch the folder is on. If ToolJet doesn't store the app's code, the folder holds a starter project, and the CLI tells you to copy the code from your repository.

| <div style={{ width:"200px"}}> Argument </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `<appId>` | Required | The ToolJet app ID. |
| `[dir]` | The app slug | Folder for the project. |

`clone` doesn't install dependencies. Run `tooljet app install` next.

```bash
tooljet app clone 55414690-beaa-4fa6-b41b-b8102bd7d1d8 orders-desk
```

## `tooljet app install`

Installs the project's dependencies without running any package's install scripts. It picks npm, pnpm or yarn from the lockfile in `frontend/`, and uses npm when there is none. It also installs the custom component SDK types that match your instance. Use it instead of `npm install`. To add a package, run `npm install --ignore-scripts <package>` in `frontend/`.

| <div style={{ width:"200px"}}> Flag </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"350px"}}> Description </div> |
|:---------- | :---------- | :------------ |
| `--frozen` | `false` | Install exactly the lockfile, and fail if `package.json` disagrees. |

`app install` doesn't take `--url`, `--token` or `--instance`.

```bash
tooljet app install
```

## `tooljet app pull`

Reads the app's queries, ToolJet Database tables and pages, and writes typed hooks to `frontend/src/tooljet.gen.ts`. It reads the checked-out version, else the draft of your Git branch, else the editing version. Run it after a query changes in ToolJet.

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

Builds the app on every save in `frontend/src` and shows it live in the ToolJet editor. The first build links the app: it creates the code page and one hidden page per screen. It needs a draft version. TypeScript errors stop a build from uploading, and the canvas keeps showing your last good build. For a walkthrough, see [Build Locally](./local-development.md#set-up).

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

```bash
tooljet app dev
tooljet app dev --once --source platform
```

### Who Sees Your Saves

Whether your saves reach other people depends on where the app's code is edited:

- **The code is stored on ToolJet and edited there** (the usual case, for apps made in the editor or with AI): each build also saves the code to ToolJet. The CLI prints `Each build also saves its code in ToolJet, where the editor and AI work on it`. The draft, the Code panel and the AI all see your changes.
- **The code isn't saved by `app dev`** (you passed `--no-source`, or the code is owned by a Git repository): only your canvas shows your local build. The editor header shows **On your computer** for you. Everyone else sees the code stored on ToolJet.

From the **On your computer** menu you can:

- **Show the ToolJet version**: See the code stored on ToolJet, as everyone else does. Your local copy stays as it is.
- **Save my copy to ToolJet**: Copies `tooljet app dev --source platform`. Run it in the app's folder instead of `tooljet app dev`, and every save then goes to ToolJet.

### Newer Code on ToolJet

When the app's code is edited on ToolJet, someone can change it in the Code panel, or the AI can change it, while you work locally. While it runs, `dev` checks ToolJet for newer code every 5 seconds:

- If you haven't changed any files since the last sync, it pulls the newer code and rebuilds. It prints `Pulled revision <n> (changed in the editor or by AI)`.
- If you have local changes, it doesn't overwrite them and stops uploading. It prints `ToolJet has newer code (revision <n>, changed in the editor or by AI). Run tooljet app source-pull, then save again.`

To bring the newer code in, run [`tooljet app source-pull`](#tooljet-app-source-pull).

### Status Notes in the Editor

Next to the version menu, the editor's header can show one of these notes about your local copy or its last build.

| <div style={{ width:"190px"}}> Note </div> | <div style={{ width:"250px"}}> What It Means </div> | <div style={{ width:"230px"}}> What to Do </div> |
|:---------- | :---------- | :------------ |
| **On your computer** | Your canvas shows the code on your computer, not the version stored on ToolJet. | See [Who Sees Your Saves](#who-sees-your-saves). |
| **Copy is behind** | The copy on your computer is older than the code on ToolJet, so the canvas shows the ToolJet version. | Run [`tooljet app source-pull`](#tooljet-app-source-pull) in the app's folder to bring the newer code in, then keep working there. Clicking the note copies `tooljet app pull`, which rewrites the typed hooks but doesn't bring the code in. |
| **Last save doesn't build** | Your last save doesn't build, so the app shows your last working version. | Click the note to open the error in the Code panel. |

### Changes That Run on Your Computer

Some files control what a build runs on your computer: build config files, `package.json`, the lockfile, `.npmrc`, and stylesheets that load Tailwind config or plugins. If someone else changes one of these on ToolJet, `dev` doesn't pull the change. It stops and prints which files changed.

Review the change in the editor first. If you trust it, run:

```bash
tooljet app dev --trust-remote-config
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

Picks the ToolJet version the project works on, by name or ID. `pull`, `check`, `dev` and `publish` then use it. It overrides the version picked by the folder's Git branch. The choice is stored in `app.json` as `version` and stays on your computer.

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

Checks npm packages before you add them: malware and known vulnerabilities, versions published in the last 7 days, license and the blocklist. Inside a project, it uses the project's npm registry settings. It exits with `1` when the packages fail the gate.

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

Writes instructions for building the app with React Builder for coding agents, from one source:

- `CLAUDE.md` for Claude Code
- `AGENTS.md` for Codex and Windsurf
- `.cursor/rules/tooljet.mdc` for Cursor

In `CLAUDE.md` and `AGENTS.md`, only the block between the `tooljet:begin` and `tooljet:end` markers is replaced. The rest of the file stays. `.cursor/rules/tooljet.mdc` is rewritten whole. It has no flags. Run it again after you update the CLI.

```bash
tooljet skill install
```

## Security Scanner

The security scanner isn't part of the CLI. It ships with ToolJet's enterprise server.

- `app check` and `app dev` skip the local scan when the scanner isn't on your computer, and print `The security scanner isn't on this computer, so this code wasn't scanned here. ToolJet scans it when you publish.` They don't fail because of it.
- `app vet` needs the scanner and fails without it.
- `app publish` doesn't need it: ToolJet scans the code on the server with the workspace policy.

To scan locally, the CLI looks for the `@tooljet/app-scanner` package, or for the path to the scanner's `tj-app-scan.js` in `TOOLJET_APP_SCANNER_BIN`.

## Environment Variables

| <div style={{ width:"230px"}}> Variable </div> | <div style={{ width:"420px"}}> Description </div> |
|:---------- | :---------- |
| `TOOLJET_URL` | ToolJet API origin for `app` commands. Overrides the stored login. Set it with `TOOLJET_PAT`. |
| `TOOLJET_PAT` | Personal access token for `app` commands. `TOOLJET_TOKEN` also works. |
| `TOOLJET_APP_URL` | The editor's origin, when it differs from the API origin. `app dev` uses it in the link it prints. |
| `TOOLJET_SDK_SPEC` | An npm spec for the custom component SDK to install, instead of the one your instance serves. |
| `TOOLJET_APP_SCANNER_BIN` | Path to the security scanner's `tj-app-scan.js`. |

npm commands that the CLI runs, such as installs and `app vet`, use your normal npm configuration, including `npm_config_registry` and `.npmrc`. Which registries a stored lockfile may use is a server setting: `TOOLJET_CODE_NPM_REGISTRIES` on the ToolJet server. See [Dependencies](./project-structure.md#dependencies).

## Files the CLI Writes

| <div style={{ width:"250px"}}> File </div> | <div style={{ width:"400px"}}> What It Holds </div> |
|:---------- | :---------- |
| `~/.tooljet/credentials.json` | Your logins, one per instance, and the default. Readable only by you (mode `0600`). |
| `.tooljet/instance.json` | The instance this project folder belongs to. Written by `clone` and `init --create`. Git-ignored. |
| `.tooljet/snapshot.json` | The app's queries, tables and pages from the last pull. Used by `check --offline`. Git-ignored. |
| `.tooljet/source.json` | The revision of the code stored on ToolJet that the project last synced with. |
| `.tooljet/before-pull/` | Copies of your changed files, kept by `source-pull --force`. |
| `frontend/src/tooljet.gen.ts` | Typed hooks, written by `pull` and `dev`. Don't edit. |

## Git Branches

If your workspace uses GitSync, ToolJet commits the app's code to a `code/` folder in the app's folder in the repository. You can open that folder and run `tooljet app dev` there.

The Git branch your project folder is on picks the draft you work on. For example, `git checkout feature-x` and then `tooljet app dev` works on the `feature-x` branch's draft. The CLI prints the branch it uses, for example `On git branch feature-x: working on its draft`.

- To work on a different workspace branch than the folder's Git branch, set `"branch"` in [`app.json`](./project-structure.md#appjson).
- `tooljet app checkout <version>` overrides the branch.
- If the branch has no draft of the app yet, open the app on that branch in ToolJet first.

## Common Errors

| <div style={{ width:"300px"}}> Message </div> | <div style={{ width:"350px"}}> What to Do </div> |
|:---------- | :---------- |
| `No app.json here or above` | Run the command inside the project folder, or clone the app first. |
| `This project belongs to <instance>, and the CLI is not signed in there.` | Run `tooljet auth login --url <instance>`. |
| `Not authenticated. Run: tooljet login` | Sign in with `tooljet auth login --url <instance>`. |
| `The ToolJet token was rejected by <instance>: it may have expired` | The token expired or was revoked. Run `tooljet auth login` again. If `TOOLJET_URL` is set in your environment, it overrides your login: unset it, or set a current `TOOLJET_PAT`. |
| `This ToolJet instance does not support browser sign-in yet` | Sign in with `tooljet login` and a personal access token. See [Sign In With a Personal Access Token](#sign-in-with-a-personal-access-token). |
| `The code expired before it was approved` | Run `tooljet auth login` again and approve within 10 minutes. |
| `That code is not valid or has expired.` (in the browser) | Check the code in your terminal, or run `tooljet auth login` again. |
| `app.json has no appId` | The project isn't linked to an app. Clone the app, or run `tooljet app init --create`. |
| `Version <name> is <status>, which cannot change.` | `dev` and `publish` need a draft. Run `tooljet app checkout` to pick a draft, or create one in ToolJet. |
| `<n> TypeScript error(s); not uploaded` | Fix the errors listed. The canvas keeps your last good build. |
| `ToolJet has newer code (revision <n>...)` | Run `tooljet app source-pull`, then save again. See [Newer Code on ToolJet](#newer-code-on-tooljet). |
| `Stopped: revision <n> on ToolJet changes <files>...` | Review the change in the editor, then run `tooljet app dev --trust-remote-config`. See [Changes That Run on Your Computer](#changes-that-run-on-your-computer). |
| `This app's source is owned by its repository` | The code is edited in Git. Push your change there, or move editing to ToolJet with `--source platform --source-replace`. See [`tooljet app dev`](#tooljet-app-dev). |
| `No lockfile in frontend/` | Run `tooljet app install` and commit the lockfile. `publish` needs one. |
| `The security scanner isn't on this computer` | `check` and `dev` skip the local scan. ToolJet scans the code when you publish. See [Security Scanner](#security-scanner). |
| `The security scan fails the gate` | Fix the findings listed, or publish with `--allow-findings`. Releasing then needs **Release anyway** with a reason. See [App Security](./security.md). |
| `<path>: ... React Builder installs packages from the npm registry only` | Replace Git, URL, `file:`, `link:`, alias or workspace dependencies with versions from the npm registry. See [Dependencies](./project-structure.md#dependencies). |
| `app.json: ...` | Fix the field named. See [`app.json`](./project-structure.md#appjson). |
| `This version is locked, so this code wasn't saved.` | The version was saved or released while `dev` ran. Restart `tooljet app dev` to follow the new draft. |
