---
id: editor
title: Edit in the Browser
---

A React Builder application can be edited inside ToolJet. Files are edited in the Code panel, and the style inspector changes the styling of an element selected on the canvas. Each save rebuilds the application in the browser and updates the canvas.

<img className="screenshot-full img-full" src="/img/build-with-ai/react-builder/editor/editor-frame-v2.png" alt="The React Builder editor with the AI chat open on the left, the Northwind Dispatch app running on the canvas, and the canvas width control, Code button and Preview in the header" />

<CardGrid columns={2}>
  <FeatureCard
    icon="file-code"
    title="Code Panel"
    description="Opens any file in the application's project for editing. The canvas shows the new build after each save."
    href="#edit-code-in-the-code-panel"
  />
  <FeatureCard
    icon="palette"
    title="Style Inspector"
    description="Changes the spacing, color and type of an element selected on the canvas. ToolJet writes the change into the code."
    href="#restyle-with-the-style-inspector"
  />
  <FeatureCard
    icon="smartphone"
    title="Canvas Width"
    description="Previews the application at phone, tablet, laptop and desktop widths in the editor."
    href="#check-other-screen-sizes"
  />
  <FeatureCard
    icon="database"
    title="Queries"
    description="The application's queries are created and changed in the Queries panel. The code runs them by name."
    href="#work-with-queries"
  />
</CardGrid>

## Edit Code in the Code Panel

The Code panel shows the project's files and edits them in ToolJet, with highlighting for TypeScript, TSX and CSS.

1. Click **Code** in the header. The panel opens over the right side of the canvas. Drag its edge to resize it.
2. On the **Files** tab, open a file from the tree.
3. Edit the code, then click **Save** or press `Cmd/Ctrl+S`.

ToolJet stores the change, builds the app in the browser and updates the canvas. If the code doesn't build, the panel lists the errors and the app keeps showing its last working version. Click an error to jump to its line.

<img className="screenshot-full img-full" src="/img/build-with-ai/react-builder/editor/code-panel.png" alt="The Code panel with Overview.tsx open at the line that reads the listShipments query through useAppQuery" />

Unsaved edits are kept in the browser. If the editor is closed with unsaved changes, the panel offers to **Restore** or **Discard** them the next time it opens.

To work in a local code editor instead, open the panel's **Open locally** tab. See [Build Locally](./local-development.md).

## Restyle With the Style Inspector

A React Builder app has no component properties to set. Instead, the style inspector shows the size, spacing, color and type of the selected element, and writes the changes into the code.

1. Click **Style inspector** in the right sidebar, then click an element in the app.
2. Check the element's name at the top of the panel. The link next to it opens the element's file and line in the Code panel.
3. In the **Design** view, change the element's size, spacing, color, text or shape.
4. Under **Applies to**, choose where the change goes. Check the preview of the code change, then click **Apply**.

<img className="screenshot-full img-full" src="/img/build-with-ai/react-builder/editor/style-inspector.png" alt="A KPI card picked on the canvas, with the style inspector beside it showing the card's size, spacing, color, text and shape settings" />

**Undo** reverts the last edit. To change a piece of text, double-click it on the canvas. Right-click an element for more, such as **Open code** and **Ask AI about this**.

## Check Other Screen Sizes

A React Builder app never switches to a separate mobile layout. Its own code decides how each screen adapts, so check the widths the app's users have.

1. Click the canvas width control in the header. It shows the current width, for example Laptop · 1280.
2. Pick **Phone** (375 px), **Tablet** (768 px), **Laptop** (1280 px), **Desktop** (1440 px) or **Fit**, or type a width.

The grips at the edges of the canvas can also be dragged, and double-click a grip to fit the canvas again. **Preview** opens the app the way its users see it, with the same width control.

## Work With Queries

The app reads its data through queries, and the code calls them by name. Queries are created and changed in the **Queries** panel, which works as it does in a visual app. A change there reaches every screen that uses the query.

A few things to know:

- The panel starts collapsed. Expand it to create, edit or run a query.
- RunJS and RunPy queries, and transformations, don't run in a React Builder app. Put that logic in the app's code. See [What App Code Can't Do](./runtime-api.md#what-app-code-cant-do).
- When a query is previewed with its parameters empty, a note under the result says so. The app passes its own values when it runs the query.
- The **Access** panel sets who can run each query. See [Control Access](./access-control.md).

When the app is also developed locally, run `tooljet app pull` after a query changes, so the typed hooks in the local project match.

<details id="tj-dropdown">
<summary>**Shortcuts, Read-Only Code and Editing at the Same Time**</summary>

#### Shortcuts

| <div style={{ width:"200px"}}> Shortcut </div> | <div style={{ width:"400px"}}> Action </div> |
|:---------- | :---------- |
| `Alt+Shift+E` | Show or hide the Code panel. |
| `Cmd/Ctrl+S` | Save the open file. |
| `Cmd/Ctrl+P` | Go to a file. |
| `Cmd/Ctrl+F` | Find in the open file. |
| `Cmd/Ctrl+Shift+F` | Search in all files, with **Match case** and **Whole word**. |
| `Alt+Shift+C` | Open the style inspector and pick an element. |
| `Up`, `Down` | With an element picked, move to the previous or next element. |
| `Left`, `Right` | Move to the element around it, or to the first one inside it. |
| `Enter` | Edit the picked element's text. |
| `Escape` | Stop picking. |
| `Shift`+right-click | Show the browser's menu instead of the element's menu. |

#### When the Code Is Read-Only

The Code panel and the style inspector change only a draft whose code is stored on ToolJet. In every other case, the panel says why the code is read-only.

| <div style={{ width:"280px"}}> Case </div> | <div style={{ width:"370px"}}> What to Do </div> |
|:---------- | :---------- |
| The version is saved. | Saved versions can't change. Create a draft version and edit that. The style inspector has a **Create draft version** button. |
| The code lives in a Git repository. | Edit it there. The style inspector offers **Copy the change**, so a style change can be applied in the repository. |
| The code is synced with Git and the default branch is checked out. | Create a feature branch to make changes. |
| The user can view the app but not edit it. | Ask for edit access to the app. |
| The AI is changing the app's code. | Wait for the build. Editing is possible again when it's done. |
| The code isn't stored on ToolJet, for example because it was built on a developer's computer. | Click **Set up from your computer**, then run the command it shows in the app's folder: `tooljet app dev --once --source platform`. In the style inspector, **Turn on style editing** opens the same steps. |

#### When Two People Edit at Once

The AI, a teammate or someone's `tooljet app dev` session can change files while they are open.

- If someone changed the files since they were opened, choose **Keep my changes**, **Use their changes** or **Decide later**.
- If the AI changed files that were being edited, choose **Keep my edits** or **Use the AI's version**.
- While the AI works on the app, the Code panel is paused.

When `tooljet app dev` is running, the header can also show a note about the local copy. See [Status Notes in the Editor](./cli-reference.md#status-notes-in-the-editor).

</details>

## Where to Go Next

<CardGrid min={190}>
  <NextStepCard title="Build Locally" description="Work in a local code editor, or hand the app to a coding agent." href="/docs/app-builder/react-builder/local-development" />
  <NextStepCard title="Control Access" description="Who can open each screen and run each query." href="/docs/app-builder/react-builder/access-control" />
  <NextStepCard title="Versions and History" description="Save a version, see what changed, or go back." href="/docs/app-builder/react-builder/versions-and-history" />
  <NextStepCard title="Runtime API" description="The hooks that screens use for queries, users and navigation." href="/docs/app-builder/react-builder/runtime-api" />
</CardGrid>
