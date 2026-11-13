---
id: local-development
title: Work on a Code Mode App Locally
sidebar_label: Work Locally
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

You can work on a Code mode app on your own computer, in your own editor or with a coding agent. The ToolJet CLI clones the app's React project into a folder, builds it on every save, and shows the result live on your canvas in the ToolJet editor. Queries, data sources, permissions and environments stay in ToolJet.

Work locally when you want your own editor, your own tools (linters, formatters, git), or a coding agent such as Claude Code, Codex, Cursor or Windsurf. For small changes, the [Code panel](/docs/app-builder/code-mode/editor) in the editor is quicker.

## Prerequisites

- Node.js 18 or later, and npm.
- Edit access to the app in ToolJet.
- A ToolJet account that can create personal access tokens. The CLI signs in with one.

## Install the CLI

Install the CLI from your ToolJet instance:

```bash
npm i -g https://tooljet.example.com/api/code-mode/cli/tooljet-cli.tgz
```

Replace `https://tooljet.example.com` with your instance's address. Your instance serves the CLI it was built with, so the CLI's Code mode commands always match your instance.

Run this even if you already have `tooljet` installed. It replaces any older `tooljet` you installed from npm. Older versions don't have the `auth`, `app` and `skill` commands.

If your instance doesn't serve the CLI, install the beta from npm instead:

```bash
npm i -g @tooljet/cli@beta
```

The **Open locally** view in the editor shows the right install command for your instance. See [Open the App Locally](#open-the-app-locally).

## Sign In

Sign in through your browser:

```bash
tooljet auth login --url https://tooljet.example.com
```

1. The CLI prints an address and an eight-letter code, such as `BCDF-GHJK`, and opens the address in your browser. Add `--no-browser` to stop it from opening the browser.
2. On the **Sign in the ToolJet CLI** page, type the code from your terminal and click **Continue**. You must be signed in to ToolJet in that browser.
3. The page shows what is asking to act as you, and in which workspace. Approve only if you just ran `tooljet auth login` yourself. Click **Approve**.
4. Go back to your terminal. The CLI finishes signing in by itself and prints `✓ Signed in to <instance> as <email>`.

<img className="screenshot-full img-m" src="/img/app-builder/code-mode/local-development/cli-activate.png" alt="Sign in the ToolJet CLI page asking to approve tooljet CLI on northwind-mbp for the workspace, with Approve and Cancel" />

<!-- TODO verify: the approval page says the token "lasts 90 days", but the server default is 30 days (TOOLJET_CLI_TOKEN_DAYS). Fix the page text or the screenshot before release. -->

The code works for 10 minutes. If it expires, run `tooljet auth login` again.

The CLI gets a personal access token for the workspace you have open in the browser. It stores the token in `~/.tooljet/credentials.json`, readable only by you, and never prints it. The token is valid for 30 days by default. A self-hosted admin can change this with the server's `TOOLJET_CLI_TOKEN_DAYS` environment variable (1 to 90 days). The token doesn't refresh: when it expires, run `tooljet auth login` again.

To revoke the token, go to **Profile settings** → **Personal access tokens** and click **Revoke** next to it. The token is named after your computer and the date you signed in, for example `tooljet CLI on my-laptop (2026-11-13)`.

### Sign In to More Than One Instance

The CLI keeps one login per instance. A project always uses the login for the instance it was cloned from, so you can sign in to several instances and work on projects from each.

The first login becomes the default, used outside a project. A login to another instance doesn't replace the default unless you add `--default`:

```bash
tooljet auth login --url https://staging.tooljet.example.com --default
```

To run a command with another instance's login, add `--instance <url>` to it.

### Sign In With a Personal Access Token

If your instance doesn't support browser sign-in, or you prefer to paste a token, use `tooljet login`. It asks for your ToolJet origin URL and a personal access token. To create a token, see [Create a Personal Access Token](/docs/app-builder/custom-component-library/setup#create-a-personal-access-token).

### Sign In From CI

In CI, set both environment variables instead of signing in:

```bash
export TOOLJET_URL=https://tooljet.example.com
export TOOLJET_PAT=<personal access token>
```

`TOOLJET_URL` and `TOOLJET_PAT` override any stored login. Set both, or neither. You can also pass `--url` and `--token` on a command.

## Open the App Locally

The editor shows the exact commands for each app, with its ID and your instance filled in.

1. Open the app in the editor.
2. Click the **Code** button in the header, or press **Alt+Shift+E**.
3. In the Code panel, click **Open locally**.

<img className="screenshot-full img-m" src="/img/app-builder/code-mode/local-development/open-locally.png" alt="Open locally view in the Code panel with the Your editor and A coding agent tabs, Open in VS Code, Cursor and Windsurf buttons, and Use the terminal instead" />

The view has two tabs:

- **Your editor**: Click **Open in VS Code**, **Open in Cursor** or **Open in Windsurf**. These buttons need the ToolJet extension, which clones the app, signs you in and starts the live preview. Click **Get the extension** to install it. <!-- TODO verify: the extension's download link is a placeholder in the product; confirm where the ToolJet extension is published before documenting it --> To use a terminal instead, expand **Use the terminal instead** and run the numbered steps.
- **A coding agent**: Steps to clone the app with instructions for a coding agent and connect the agent to ToolJet's MCP server. See [Work With a Coding Agent](#work-with-a-coding-agent).

## Develop Locally

### 1. Clone the App

```bash
tooljet app clone <app id> orders-desk
cd orders-desk
```

`clone` creates the project folder, links it to the app and your instance, and writes the app's code stored on ToolJet into it. It also reads the app's queries and writes typed hooks for them. If ToolJet doesn't store the app's code, the folder holds a starter project, and the CLI tells you to copy the code from your repository.

To start a new project instead, run `tooljet app init <folder> --name "<app name>" --create`. See the [CLI reference](/docs/app-builder/code-mode/cli-reference#tooljet-app-init).

For the files in the project, see [Project Structure](/docs/app-builder/code-mode/project-structure).

### 2. Install Dependencies

```bash
tooljet app install
```

`app install` installs the project's packages with npm, pnpm or yarn, depending on the lockfile. Install scripts never run. Use it instead of `npm install`. To add a package, run `npm install --ignore-scripts <package>` in `frontend/`.

### 3. Start the Live Preview

```bash
tooljet app dev
```

`app dev` builds the app, links it to ToolJet, and rebuilds on every save in `frontend/src`. The first run prints a link to open the app in the editor. Open it, and your canvas shows your local build.

TypeScript errors stop a build from uploading. The canvas keeps showing your last good build.

Whether your saves reach other people depends on where the app's code is edited:

- **The code is stored on ToolJet and edited there** (the usual case, for apps made in the editor or with AI): each build also saves the code to ToolJet. The CLI prints `Each build also saves its code in ToolJet, where the editor and AI work on it`. The draft, the Code panel and the AI all see your changes.
- **The code isn't saved by `app dev`** (you passed `--no-source`, or the code is owned by a git repository): only your canvas shows your local build. The editor header shows **On your computer** for you. Everyone else sees the code stored on ToolJet.

From the **On your computer** menu you can:

- **Show the ToolJet version**: See the code stored on ToolJet, as everyone else does. Your local copy stays as it is.
- **Save my copy to ToolJet**: Copies `tooljet app dev --source platform`. Run it in the app's folder instead of `tooljet app dev`, and every save then goes to ToolJet.

### 4. Pull After Queries Change

You create and edit queries in ToolJet's query editor, not in code. After you add, rename or change a query, run:

```bash
tooljet app pull
```

`pull` reads the app's queries, ToolJet Database tables and pages, and rewrites `frontend/src/tooljet.gen.ts` with typed hooks. `app dev` also does this when it starts.

### 5. Check the Code

```bash
tooljet app check
```

`check` fails when the code names a query, route, link or page the app doesn't have, and runs a security scan. It also lists accessibility warnings. Run it before you publish. See [`tooljet app check`](/docs/app-builder/code-mode/cli-reference#tooljet-app-check).

### 6. Save a Version

```bash
tooljet app publish --name v3
```

`publish` does what **Save version** does in the editor. It installs exactly the lockfile, checks the code, builds it for production, stores it on ToolJet, runs the security scan and saves the draft as a version. ToolJet freezes the code with the version, so a released version always runs the code it was saved with.

`publish` needs a lockfile in `frontend/`. It doesn't release or promote the version. Do that in ToolJet. See [Versions and History](/docs/app-builder/code-mode/versions-and-history) and [Security](/docs/app-builder/code-mode/security).

### 7. Work on Another Version

By default the project follows the app's editing version. To work on another version:

```bash
tooljet app checkout --list       # list the app's versions
tooljet app checkout v3           # work on v3
tooljet app checkout --editing    # follow the editing version again
```

`pull` and `check` work on any version. `dev` and `publish` need a draft version.

## Keep in Sync With Editor and AI Edits

When the app's code is edited on ToolJet, someone can change it in the Code panel or the AI can change it while you work locally.

While `app dev` runs, it checks ToolJet for newer code every 5 seconds:

- If you haven't changed any files since the last sync, it pulls the newer code and rebuilds. It prints `Pulled revision <n> (changed in the editor or by AI)`.
- If you have local changes, it doesn't overwrite them and stops uploading. It prints `ToolJet has newer code (revision <n>, changed in the editor or by AI). Run tooljet app source-pull, then save again.`

To bring the newer code in:

```bash
tooljet app source-pull
```

If files you changed would be overwritten, `source-pull` refuses and lists them. To take ToolJet's code anyway, run `tooljet app source-pull --force`. The CLI keeps a copy of your changed files in `.tooljet/before-pull/`.

### Changes That Run on Your Computer

Some files control what a build runs on your computer: build config files, `package.json`, the lockfile, `.npmrc`, and stylesheets that load Tailwind config or plugins. If someone else changes one of these on ToolJet, `app dev` doesn't pull the change. It stops and prints which files changed.

Review the change in the editor first. If you trust it, run:

```bash
tooljet app dev --trust-remote-config
```

## Work With a Coding Agent

To give a coding agent the rules for building a Code mode app, run this in the project folder:

```bash
tooljet skill install
```

It writes the same instructions to three files, one per agent:

| <div style={{ width:"250px"}}> File </div> | <div style={{ width:"300px"}}> Read By </div> |
|:---------- | :---------- |
| `CLAUDE.md` | Claude Code |
| `AGENTS.md` | Codex, Windsurf |
| `.cursor/rules/tooljet.mdc` | Cursor |

In `CLAUDE.md` and `AGENTS.md`, the CLI only replaces the block between its `<!-- tooljet:begin ... -->` and `<!-- tooljet:end -->` markers. Your own notes in those files stay. `.cursor/rules/tooljet.mdc` is rewritten whole. Run `tooljet skill install` again after you update the CLI.

The instructions tell the agent to get data only from ToolJet queries. To let the agent create tables and queries in the app, connect it to the [ToolJet MCP server](/docs/build-with-ai/mcp/overview). The **A coding agent** tab in **Open locally** shows the setup steps for Claude Code, Codex and Cursor. The MCP server uses your `tooljet auth login` for that instance, so no configuration holds a token. <!-- TODO verify: the A coding agent tab builds the MCP server from a pre-release GitHub branch; confirm the published install steps before release -->

## Work With Git Branches

If your workspace uses git sync, ToolJet commits the app's code to a `code/` folder in the app's folder in the repository. You can open that folder and run `tooljet app dev` there. See [Git Sync](/docs/app-builder/code-mode/versions-and-history#git-sync).

The git branch your project folder is on picks the draft you work on. For example, `git checkout feature-x` and then `tooljet app dev` works on the `feature-x` branch's draft. The CLI prints the branch it uses, for example `On git branch feature-x: working on its draft`.

- To work on a different workspace branch than the folder's git branch, set `"branch"` in `app.json`.
- `tooljet app checkout <version>` overrides the branch.
- If the branch has no draft of the app yet, open the app on that branch in ToolJet first.

## Troubleshooting

| <div style={{ width:"300px"}}> Message </div> | <div style={{ width:"350px"}}> What to Do </div> |
|:---------- | :---------- |
| `No app.json here or above` | Run the command inside the project folder, or clone the app first. |
| `This project belongs to <instance>, and the CLI is not signed in there.` | Run `tooljet auth login --url <instance>`. |
| `Not authenticated. Run: tooljet login` | Sign in with `tooljet auth login --url <instance>`. |
| `The ToolJet token was rejected by <instance>: it may have expired` | The token expired or was revoked. Run `tooljet auth login` again. If `TOOLJET_URL` is set in your environment, it overrides your login: unset it, or set a current `TOOLJET_PAT`. |
| `This ToolJet instance does not support browser sign-in yet` | Sign in with `tooljet login` and a personal access token. |
| `The code expired before it was approved` | Run `tooljet auth login` again and approve within 10 minutes. |
| `That code is not valid or has expired.` (in the browser) | Check the code in your terminal, or run `tooljet auth login` again. |
| `app.json has no appId` | The project isn't linked to an app. Clone the app, or run `tooljet app init --create`. |
| `Version <name> is <status>, which cannot change.` | `dev` and `publish` need a draft. Run `tooljet app checkout` to pick a draft, or create one in ToolJet. |
| `<n> TypeScript error(s); not uploaded` | Fix the errors listed. The canvas keeps your last good build. |
| `ToolJet has newer code (revision <n>...)` | Run `tooljet app source-pull`, then save again. |
| `Stopped: revision <n> on ToolJet changes <files>...` | Review the change in the editor, then run `tooljet app dev --trust-remote-config`. |
| `This app's source is owned by its repository` | The code is edited in git. Push your change there, or move editing to ToolJet with `--source platform --source-replace`. See [Who Edits the Code](/docs/app-builder/code-mode/versions-and-history#who-edits-the-code). |
| `No lockfile in frontend/` | Run `tooljet app install` and commit the lockfile. `publish` needs one. |
| `The security scanner isn't on this computer` | `check` and `dev` skip the local scan. ToolJet scans the code when you publish. |
| `The security scan fails the gate` | Fix the findings listed, or publish with `--allow-findings`. Releasing then needs **Release anyway** with a reason. See [Release Gate](/docs/app-builder/code-mode/security#release-gate). |
| `<path>: ... Code mode installs packages from the npm registry only` | Replace git, URL, `file:`, `link:`, alias or workspace dependencies with versions from the npm registry. See [Dependencies](/docs/app-builder/code-mode/project-structure#dependencies). |
| `app.json: ...` | Fix the field named. See [`app.json`](/docs/app-builder/code-mode/project-structure#appjson). |
| `This version is locked, so this code wasn't saved.` | The version was saved or released while `dev` ran. Restart `tooljet app dev` to follow the new draft. |
