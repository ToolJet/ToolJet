---
id: editor
title: The Code Mode Editor
sidebar_label: Editor
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

A Code mode app opens in the same App Builder as a visual app, with tools for working on code instead of components. This page walks through what's different: the header, the **Code** panel, the canvas, the style inspector and the sidebars.

## What Changes in Code Mode

The component-based tools are hidden, because the screens come from the project's code:

- The **Components** panel, page settings and the pages menu.
- **Code search**, **Dependencies** and **JS libraries** in the left sidebar.
- The desktop and mobile layout toggle, and the canvas page header and footer.
- The autosave indicator.

These tools are added:

| <div style={{ width:"180px"}}> Tool </div> | <div style={{ width:"300px"}}> Where </div> | <div style={{ width:"250px"}}> What It's For </div> |
|:---------- | :---------- | :---------- |
| **Code** panel | **Code** button in the header (`Alt+Shift+E`) | Read and edit the project's files, and set up local development. |
| Canvas width | Header | Preview the app at phone, tablet, laptop and desktop widths. |
| Style inspector | Right sidebar (`Alt+Shift+C`) | Pick an element on the canvas and change its spacing, color and type in the code. |
| **Security** | Left sidebar and the status chip in the header | The version's security check. See [App Security](/docs/app-builder/code-mode/security). |
| **Access** | Left sidebar | Who can open each screen and run each query. See [Access Control](/docs/app-builder/code-mode/access-control). |
| **App history** | Left sidebar | Every AI edit, save, upload and version, with restore. See [Versions, History and Git](/docs/app-builder/code-mode/versions-and-history). |

A Code mode app opens with the AI chat open and the **Queries** panel collapsed.

The editor is built for larger screens. On a screen narrower than 768 px, ToolJet shows **Best on a larger screen**, with **Preview app** and **Continue anyway**.

## Header

<img className="screenshot-full img-full" src="/img/app-builder/code-mode/editor/header.png" alt="Code mode editor header with the Code mode badge, canvas width control, Code button, Preview, version menu and the No issues security chip" />

- **Build mode badge.** **Code mode** next to the app name. The build mode is chosen when an app is created and can't be changed.
- **Canvas width.** Shows the current width, for example **Fit · 1156** or **Laptop · 1280**. Open it to pick **Phone** (375 px), **Tablet** (768 px), **Laptop** (1280 px), **Desktop** (1440 px) or **Fit**, or to type a width. You can also drag the grips at the canvas edges, and double-click a grip to fit.
- **Code** button. Shows or hides the [Code panel](#code-panel).
- **Preview** opens the app the way your users see it. In Preview, the canvas width control replaces the layout toggle.
- **Compare versions** compares two versions of the app. See [Compare and Review Versions](/docs/development-lifecycle/release/version-reviews).
- **Status notes** next to the version menu:
  - **On your computer**: you're running `tooljet app dev` without storing each save on ToolJet (with `--no-source`, or because the code is owned by a git repository). Your canvas shows the code on your computer; everyone else still sees the version stored on ToolJet. Use **Show the ToolJet version** to switch your canvas back, or **Save my copy to ToolJet** to copy the command that stores every local save on ToolJet.
  - **Copy is behind**: the copy on your computer is older than the code on ToolJet, so the canvas shows the ToolJet version. Click it to copy `tooljet app pull`.
  - **Last save doesn't build**: the app shows its last working version. Click it to open the error in the **Code** panel.
- **Security status chip.** The version's security state, such as **No issues**, **3 to review**, **Blocks release** or **Code changed**. Click it to open the **Security** panel.

## Code Panel

The **Code** panel shows the project's files and lets you edit them in ToolJet. Open it with the **Code** button in the header or `Alt+Shift+E`. It docks over the right side of the canvas; drag its edge to resize it.

<img className="screenshot-full img-m" src="/img/app-builder/code-mode/editor/code-panel.png" alt="Code panel with the Files and Open locally tabs, the project file tree, and src/App/index.tsx open in the editor" />

### Files

The **Files** tab has the file tree, open-file tabs and a code editor with TypeScript, TSX and CSS highlighting.

| <div style={{ width:"200px"}}> Shortcut </div> | <div style={{ width:"300px"}}> Action </div> |
|:---------- | :---------- |
| `Cmd/Ctrl+S` | Save the file |
| `Cmd/Ctrl+P` | Go to a file |
| `Cmd/Ctrl+F` | Find in the open file |
| `Cmd/Ctrl+Shift+F` | Search in all files, with **Match case** and **Whole word** |

When you save, ToolJet stores the change, builds the app in your browser and updates the canvas. The status line shows **Building…**, **Updating the app…** and then **Updated**. If the code doesn't build, it shows the number of errors and the app keeps showing its last working version. Click an error to jump to its line.

Unsaved edits are kept in your browser. If you leave with unsaved changes, the panel offers to **Restore** or **Discard** them the next time it opens.

### When Others Change the Code

The AI, a teammate or a developer's `tooljet app dev` session can change files while you have them open:

- **Someone changed these files since you opened them**: choose **Keep my changes**, **Use their changes** or **Decide later**.
- **The AI changed files you were editing**: choose **Keep my edits** or **Use the AI's version**.
- While the AI works on the app, the panel is paused and shows **Paused while the AI works**.

### When the Code Is Read-Only

| <div style={{ width:"300px"}}> Note in the Panel </div> | <div style={{ width:"350px"}}> Why </div> |
|:---------- | :---------- |
| This code lives in your Git repository. Edit it there; this is a read-only copy. | The code is owned by a git repository. See [Who Edits the Code](/docs/app-builder/code-mode/versions-and-history#who-edits-the-code). |
| You can view this source. Editing it needs edit access to the app. | You can view the app but not edit it. |
| This version is not a draft, so its source is read-only. Create a draft version to edit it. | Saved versions can't change. |
| This code is synced with git on the default branch. Create a feature branch to make changes. | Git sync with branching is on, and you're on the default branch. |
| The AI is changing this app's code. You can edit again when it's done. | An AI build is running. |

If the app's code isn't stored on ToolJet yet, for example because it was built on a developer's computer, the panel shows **This app's code isn't stored on ToolJet** with **Set up from your computer**. Run `tooljet app dev --once --source platform` in the app's folder to store it.

### Open Locally

The **Open locally** tab sets up the app on your computer:

- **Your editor**: **Open in VS Code**, **Open in Cursor** or **Open in Windsurf** clone the app into a folder, sign you in and start a live session. These need the ToolJet editor extension. **Use the terminal instead** lists the same steps as CLI commands.
- **A coding agent**: the steps to clone the app with agent instructions and connect Claude Code or Codex through the ToolJet MCP server.

See [Work Locally](/docs/app-builder/code-mode/local-development) for the full workflow.

## Canvas

The canvas runs the app in an isolated frame, exactly as Preview and the released app do. It has no grid, page header or footer, and the app fills the frame.

- **Loading your app...** shows while the frame loads, and **Rebuilding the app…** while a new build loads.
- If the code can't load, the canvas shows **This app's code couldn't load.** with **Retry** and the error details. Ask the AI chat to fix it, or check the **Debugger**.
- If a query runs in a loop, the canvas slows it to once a second and shows a notice with the query's name. Check the effect or handler that runs it. See [Runtime API](/docs/app-builder/code-mode/runtime-api).

Code pages never switch to ToolJet's mobile layout. The app uses its own responsive breakpoints at every width, so use the canvas width control to check phone and tablet layouts.

## Style Inspector

You don't set component properties in a Code mode app. Instead, the right sidebar is a **style inspector**: pick any element on the canvas, see its size, spacing, color and type, and change them. ToolJet writes the change into the code.

Open it from the right sidebar (**Style inspector**), with `Alt+Shift+C`, or by right-clicking an element on the canvas.

<!-- TODO screenshot: Style inspector with a KPI card selected: element name and file link, Design view showing Size, Spacing, Color, Text and Shape. Pending: picking an element inside the isolated app frame does not register from Playwright; capture by hand. -->

1. Click **Inspect**, then click an element in the app. Press `Escape` to stop.
2. The panel shows the element's name and its source file and line. Use the arrow keys to move to the previous, next, outer or inner element.
3. In the **Design** view, change any of these:
   - **Size**: Width, Height
   - **Spacing**: Padding, Margin, Gap
   - **Colour**: Text, Background, Border
   - **Text**: Size, Weight, Line height
   - **Shape**: Corner radius, Border width
4. Choose where the change goes under **Applies to**, check the preview of the code change, then click **Apply**. **Undo** reverts the last edit.

The **CSS** view lists every style rule on the element, **By origin** or **Computed**.

To edit text, double-click it on the canvas, or select the element and press `Enter`.

Right-click an element for its menu: **Edit styles**, **Open code**, **Ask AI about this**, **Copy location**, **Select parent**, and **Open in VS Code** or **Open in Cursor** when you have the app open locally. `Shift`+right-click shows the browser's menu instead.

The style inspector can't change:

- **A saved version.** It shows **This version is locked**. Click **Create draft version** to edit.
- **Code stored only on a computer.** It shows **Style editing is off for this app**. **Turn on style editing** opens the **Open locally** steps for storing the code on ToolJet.
- **Code owned by a git repository.** It offers **Copy the change** so you can apply it in the repository.

## Left Sidebar

In a Code mode app, the left sidebar has:

| <div style={{ width:"150px"}}> Item </div> | <div style={{ width:"400px"}}> What It Shows </div> |
|:---------- | :---------- |
| **AI chat** | Describe what to build or change, and ToolJet makes it. The chat ends with **Work on this app in your editor**, which opens the setup for your editor, coding agent or terminal. |
| **App state** | The app's queries, globals and variables, as in a visual app. The code page's root component is left out. |
| **Debugger** | Errors and logs, including query refusals and query loops. |
| **Security** | The version's security check. |
| **Access** | Who can open each screen and run each query. |
| **App history** | Every change to the app, with compare and restore. |
| **Global Settings** | App settings. The canvas settings are hidden, and the styles section is titled **Theme**. |

**Security**, **Access** and **App history** stay open when you click elsewhere. Close them with their own close button. If you open one of them over the AI chat, clicking its icon again returns to the chat.

## Queries

The **Queries** panel works as in any app. The code calls queries by name, so create or change queries here, then run `tooljet app pull` if you work locally.

- Only a run from the **Queries** panel saves the panel's copy of the query. Runs from the app itself don't, so an older copy in your editor never overwrites a query that the AI or the CLI changed.
- In the query **Preview**, a query that ran with empty parameters shows a note such as "Ran with an empty parameter (id). The app passes its own value when it runs this query."
- RunJS and RunPy queries and transformations don't run in an isolated Code mode app. See [What App Code Can't Do](/docs/app-builder/code-mode/runtime-api).
