---
id: create-app
title: Create a Code Mode App
sidebar_label: Create an App
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

You choose an app's build mode when you create it. An app keeps the mode it is created in: you can't switch a visual app to Code mode later, or a Code mode app back to visual. This page covers the ways to create a Code mode app and what happens on its first build.

## Create a Blank App

1. On the dashboard, click **Create an app**.
2. Enter the **App name**.
3. Under **Build mode**, select **Code mode** ("A React app you edit with the AI or in code"). **Visual** builds the app with drag and drop instead.
4. Click **+ Create app**.

<img className="screenshot-full img-s" src="/img/app-builder/code-mode/create-app/create-app-dialog.png" alt="Create app dialog with the App name field and the Build mode choice, Code mode selected" />

The dialog remembers the mode you picked last and selects it the next time. The first time, it selects **Visual**.

The editor opens with the AI chat. The app has no code yet: build it with the AI, or set it up from your computer. See [Build the First Version](#build-the-first-version).

:::info
The **Build mode** choice appears only for apps, not for modules or workflows, and only on an edition that includes Code mode.
:::

## Create an App From a Prompt

You can also start from the prompt box on the dashboard.

1. Describe the app in **Start with a prompt** and send it.
2. The first time, ToolJet asks **How should we build this app?**
   - **Visual**: drag and drop on a canvas. Best for most internal tools.
   - **Code mode**: the AI writes a React app you can edit in ToolJet, VS Code or Cursor.

   Click a card, or press `1` or `2`, to start the build. Select **Don't ask again** to skip this question next time.
3. After the first pick, the prompt box shows a build mode picker (**Visual** or **Code mode**). Change it any time. Your choice is **Remembered for your next app**.

<!-- TODO screenshot: "How should we build this app?" dialog with the Visual and Code mode cards. Pending: the dialog opens only after sending a dashboard prompt, which starts a real AI build. -->

A Code mode build names the app from your prompt, for example "Returns queue".

## Build the First Version

A new Code mode app has no screens until its first build. There are two ways in, and you can use both:

- **Build with AI.** Describe what you need in the AI chat. ToolJet plans it, writes the React code, builds it on the canvas and checks that it works.
- **Build from your coding agent or editor.** Claude Code, Codex, Cursor and other agents build the app through ToolJet's MCP server, or you clone the app with the ToolJet CLI and work on it yourself. With the AI chat closed, the empty canvas offers **Connect your agent**. You can also use **Open locally** in the **Code** panel. See [Work Locally](/docs/app-builder/code-mode/local-development).

### While the AI Builds

During an AI build:

- The canvas shows the build's progress and phases, and the lock **Editing paused**. Click **Stop** to stop the build.
- Your screens appear on the canvas once their code is built, near the end of the build. The **Code** panel shows files as the AI stores them.
- Canvas width, the style inspector, the version menu and the **Access** panel wait until the build finishes.

After each AI turn, the chat shows **See what changed** under the turn, with a summary of the changed files and screens and an option to undo the edit. See [See What Changed](/docs/app-builder/code-mode/versions-and-history#see-what-changed).

The chat also offers theme suggestions. Pick **Change colour theme** to apply one of the workspace's themes to the app.

## Data for a New App

The code reads data only through the app's queries. When you ask the AI for sample data, it puts the data in ToolJet Database and creates queries for it. The code calls the queries by name, so a change to a query in the **Queries** panel reaches every screen that uses it.

## Clone and Import

Clone and import keep an app's build mode.

- **Clone app** copies a Code mode app with its code. The copy gets its own component library and starts a fresh code history at its first revision. The **Clone app** dialog notes that the copy uses the same ToolJet Database tables as the original, so changes to data appear in both.
- **Export** includes the app's code and the builds its versions run. **Import** creates the app in Code mode with its code, editable in the ToolJet editor. The first **Save version** after an import rebuilds the code from source.

An export made before exports carried code imports without it. ToolJet then shows: "This file doesn't include the app's code: it was exported before exports carried it. Export the app again from the original and import the new file."

See [Export, Import and Clone](/docs/app-builder/code-mode/versions-and-history#export-import-and-clone) for details.

## Troubleshooting

| <div style={{ width:"300px"}}> Message </div> | <div style={{ width:"350px"}}> What to Do </div> |
|:---------- | :---------- |
| This server created the app in Visual mode. Ask an admin to update ToolJet to use Code mode. | The ToolJet server doesn't support Code mode. Ask an admin to upgrade ToolJet. |
| This server did not create the app in Code mode, so the build was not started. | Same as above, for an app started from a prompt. |
| Code mode is not enabled on this workspace. | The server's edition doesn't include Code mode. |
