---
id: local-development
title: Build Locally
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

A React Builder application can be developed on a local computer, in a code editor or with a coding agent. This guide sets up a local copy of the application's React project. Each local save is then shown on the canvas in ToolJet.

<img className="screenshot-full img-m" src="/img/build-with-ai/react-builder/local-development/open-locally.png" alt="The Open locally view in the Code panel, with buttons to open the app in VS Code, Cursor or Windsurf and the terminal steps below them" />

## How It Works

Only the application's code is copied to the local computer. Queries, datasources, permissions and environments remain in ToolJet.

<CardGrid columns={3}>
  <FlowStep number="1" title="Clone" description="The ToolJet CLI copies the app's React project into a folder and links it to the app." />
  <FlowStep number="2" title="Edit" description="When a file is saved in the editor, the CLI rebuilds the application and the canvas in ToolJet shows the result." />
  <FlowStep number="3" title="Publish" description="One command checks the code, builds it and saves the draft as a version." />
</CardGrid>

## Prerequisites

- Node.js 18 or later, with npm.
- Edit access to the app in ToolJet.
- Permission to create personal access tokens in the workspace. The CLI signs in with one.

## Set Up

<Tabs>
<TabItem value="editor" label="From the editor" default>

The editor shows the commands with the instance's address and the app's ID filled in.

1. Open the app in the editor and click **Code** in the header.
2. In the Code panel, click **Open locally**.
3. Expand **Use the terminal instead**, then copy each command and run it in a terminal.

With the ToolJet extension installed in the editor, **Open in VS Code**, **Open in Cursor** or **Open in Windsurf** clones the app, signs in and starts the live preview.

</TabItem>
<TabItem value="terminal" label="From the terminal">

1. Install the CLI from the ToolJet instance. Replace `https://tooljet.example.com` with the instance's address.

   ```bash
   npm i -g https://tooljet.example.com/api/code-mode/cli/tooljet-cli.tgz
   ```

2. Sign in through the browser.

   ```bash
   tooljet auth login --url https://tooljet.example.com
   ```

3. Clone the app, install its packages and start the live preview. The app's ID is the long ID after `/apps/` in the editor's address.

   ```bash
   tooljet app clone <app-id> northwind-dispatch
   cd northwind-dispatch
   tooljet app install
   tooljet app dev
   ```

</TabItem>
</Tabs>

At sign-in, the CLI prints a code and opens the **Sign in the ToolJet CLI** page in the browser. Type the code, click **Continue**, then click **Approve**. The CLI finishes signing in by itself.

<img className="screenshot-full img-m" src="/img/build-with-ai/react-builder/local-development/cli-approval.png" alt="The Sign in the ToolJet CLI page asking to approve the ToolJet CLI for the Northwind Logistics workspace, with Approve and Cancel" />

Go back to the app in the ToolJet editor: the canvas now shows the build from the local computer. Leave `tooljet app dev` running, and it rebuilds on every save in `frontend/src`. If a save has TypeScript errors, nothing is uploaded and the canvas keeps the last good build.

## Common Commands

Run these in the project folder.

| <div style={{ width:"190px"}}> Command </div> | <div style={{ width:"460px"}}> When to Run It </div> |
|:---------- | :---------- |
| `tooljet app dev` | During development. It rebuilds on every save and shows the app live in the editor. |
| `tooljet app pull` | After a query changes in ToolJet. It rewrites the typed hooks in `frontend/src/tooljet.gen.ts`. |
| `tooljet app check` | Before publishing. It fails when the code names a query, screen or link the app doesn't have, and runs the security scan. |
| `tooljet app publish` | When the work is ready. It saves the draft as a version, the same as clicking **Save version** in the editor. |

Queries are created and edited in ToolJet's query editor, not in code. `publish` doesn't release the version: releases are made in ToolJet. See [Versions and History](./versions-and-history.md).

Install packages with `tooljet app install`, not `npm install`: it never runs a package's install scripts. Every flag is in the [CLI reference](./cli-reference.md).

## Build With a Coding Agent

A coding agent can edit the application in the same project folder. First give it ToolJet's rules for React Builder apps:

```bash
tooljet skill install
```

The command writes one instruction file per agent, and each agent reads its own file without any setup.

| <div style={{ width:"230px"}}> Agent </div> | <div style={{ width:"420px"}}> File It Reads </div> |
|:---------- | :---------- |
| Claude Code | `CLAUDE.md` |
| Codex and Windsurf | `AGENTS.md` |
| Cursor | `.cursor/rules/tooljet.mdc` |

Start the agent in the project folder, then describe the change, for example:

```text
Add a Carriers screen that lists the rows from the listCarriers query,
sorted by on-time rate. Link it from the sidebar.
```

The instructions tell the agent to read data only through ToolJet queries, to build with `tooljet app dev --once`, and to finish with `tooljet app check` passing. Keep `tooljet app dev` running while the agent works, and its changes show on the canvas as it saves them.

The agent writes the screens. To let it also create tables and queries in the app, connect it to the [ToolJet MCP server](../../build-with-ai/mcp/overview.md): the **A coding agent** tab in **Open locally** lists the setup commands.

## Syncing Changes

Teammates and ToolJet AI can change the app during local development. For an app created in ToolJet, each local build also saves the code to the app's draft, so the Code panel and the AI work on the latest local code. For the other cases, see [Who Sees Local Saves](./cli-reference.md#who-sees-local-saves).

While it runs, `tooljet app dev` also checks ToolJet for newer code every few seconds:

- If no local files changed since the last sync, it pulls the newer code and rebuilds.
- If there are local changes, it keeps them and stops uploading until the newer code is pulled in.

```bash
tooljet app source-pull
```

`source-pull` refuses to overwrite locally changed files, and lists them. To take ToolJet's code anyway, add `--force`: the CLI keeps a copy of the changed files in `.tooljet/before-pull/`.

<details id="tj-dropdown">
<summary>**Other Sign-In Methods, Git Branches and Common Problems**</summary>

#### Other Ways to Sign In

The CLI can also sign in with a pasted personal access token through `tooljet login`, stay signed in to several instances at once, or sign in from CI without a browser. See [Sign In](./cli-reference.md#sign-in) in the CLI reference.

#### Git Branches

If the workspace uses GitSync, ToolJet commits the app's code to a `code/` folder inside the app's folder in the repository. Open that folder and run `tooljet app dev` there.

The Git branch of the folder decides which draft is used. After `git checkout feature-x`, `tooljet app dev` works on the `feature-x` branch's draft, and the CLI prints the branch it uses. `tooljet app checkout <version>` overrides the branch. If the branch has no draft of the app yet, open the app on that branch in ToolJet first.

#### Common Problems

| <div style={{ width:"300px"}}> Message </div> | <div style={{ width:"350px"}}> What to Do </div> |
|:---------- | :---------- |
| `No app.json here or above` | Run the command inside the project folder. |
| `The ToolJet token was rejected by <instance>` | The sign-in expired or was revoked. Run `tooljet auth login` again. |
| `<n> TypeScript error(s); not uploaded` | Fix the errors listed. The canvas keeps the last good build. |
| `ToolJet has newer code (revision <n>...)` | Run `tooljet app source-pull`, then save again. |
| `Version <name> is <status>, which cannot change.` | `dev` and `publish` need a draft. Pick one with `tooljet app checkout`, or create one in ToolJet. |

For every message, see [Common Errors](./cli-reference.md#common-errors) in the CLI reference.

</details>

## Where to Go Next

<CardGrid min={190}>
  <NextStepCard title="CLI Reference" description="Every command, flag and error message." href="/docs/app-builder/react-builder/cli-reference" />
  <NextStepCard title="Project Structure" description="The files in the project and what each one does." href="/docs/app-builder/react-builder/project-structure" />
  <NextStepCard title="Runtime API" description="The hooks that screens use for queries, users and navigation." href="/docs/app-builder/react-builder/runtime-api" />
  <NextStepCard title="Versions and History" description="Save, release and undo changes." href="/docs/app-builder/react-builder/versions-and-history" />
</CardGrid>
