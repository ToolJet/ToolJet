---
id: versions-and-history
title: Versions, History and Git in Code Mode
sidebar_label: Versions, History and Git
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

A Code mode app uses ToolJet's usual [draft and saved versions](/docs/development-lifecycle/release/version-control), environments and releases. On top of that, ToolJet keeps the app's code with each version, records every change to it, and can sync it with git. This page explains how.

## Drafts and Saved Versions

- **A draft** runs the code stored on ToolJet. The AI, the **Code** panel, the style inspector and `tooljet app dev` all write to the draft's code.
- **Save version** freezes the draft's built code with the version. A saved version, and any release of it, always runs exactly the code it was saved with.
- **A new draft** created from a saved version starts from that version's code.

Only a draft's code can change. In a saved version, the **Code** panel, the style inspector and the **Access** panel are read-only.

### Save a Version

1. Click the version menu in the header and choose **Save version**.
2. When the dialog opens, ToolJet checks that the latest code builds. While it builds, the button shows **Building the latest code...**.
3. Enter the version's name and description, and save.

If the code doesn't build, the dialog shows the error with **Open in the Code panel**, and **Save** stays disabled until you fix it.

You can also save a version from your computer with `tooljet app publish`. It builds the code, stores it on ToolJet, runs the security check and saves the draft as a version. See [CLI Reference](/docs/app-builder/code-mode/cli-reference).

After a save, ToolJet checks the frozen code in the background. The check never blocks the save, but its result decides whether the version can be released. See [App Security](/docs/app-builder/code-mode/security).

| <div style={{ width:"300px"}}> Message </div> | <div style={{ width:"350px"}}> What to Do </div> |
|:---------- | :---------- |
| The latest code doesn't build. | Fix the error shown, then save again. |
| The app's latest code has not been built yet, so it cannot be saved as a version. | From the CLI: run `tooljet app dev` (or `tooljet app publish`) in the app project, then save the version again. The editor builds and retries for you. |
| This app's stored code names no component library to build into, so it cannot be saved as a version. | Run `tooljet app publish` in the app project, which uploads the code with its library. |
| This app's code is over the 10 MB limit for a saved version. | Remove large files or assets from the code. |

### Release and Promote

Release and promote a Code mode version the same way as any app. In addition:

- The release and promote dialogs show how the code changed since the released version, for example "Since v1: 4 files changed (+120 −18)", with **See what changed**.
- Release and promotion wait until the version passes its security check. See [Release Gate](/docs/app-builder/code-mode/security#release-gate).
- A version that still runs a developer's local build can't be released. Save the version first.
- If the app reads ToolJet Database tables, the release dialog reminds you that **Production has its own data**: rows added in Development or Staging aren't copied.
- If the workspace requires version reviews, the version also needs an approved review. See [Compare and Review Versions](/docs/development-lifecycle/release/version-reviews).

## App History

**App history** in the left sidebar lists every change to the app's code and access, newest first, grouped by day. It works on every plan.

<img className="screenshot-full img-s" src="/img/app-builder/code-mode/versions-and-history/app-history.png" alt="App history panel with two code uploads from a computer, Started from saved version v1, and Saved version v1" />

| <div style={{ width:"200px"}}> Entry </div> | <div style={{ width:"400px"}}> Example </div> |
|:---------- | :---------- |
| AI edit | AI: Add a delayed shipments callout |
| Code panel save | Changed Overview.tsx and added Kpi.tsx |
| Style inspector edit | A one-line summary of the style change |
| Upload from the CLI | Edited on a computer: Overview.tsx · Code uploaded from a computer (first upload) |
| Git pull | Pulled from git: Overview.tsx |
| Restore | Restored an earlier point |
| New draft from a saved version | Started from saved version v1 |
| Saved version | Saved version v2 |
| Access change | Access changed: Only Operations can open Carriers |
| Security fix from the AI | Fix security finding: … |

The history refreshes every 15 seconds. Re-uploads of identical code aren't listed.

### See What Changed

Click an entry to open **See what changed**. It also opens from:

- **See what changed** under each AI chat turn.
- The release, promote and **Compare versions** dialogs.

The view has three tabs:

- **Screens**: the app before and after, **Side by side** or with a **Slider**. Pick a screen, and a width such as **Phone 375**, **Tablet 768**, **Laptop 1280** or **Desktop 1440**. A dot marks the screens and widths that look different.
- **Code**: the file changes, **Inline** or **Side by side**.
- **Access**: who can open each screen and run each query, before and after.

<img className="screenshot-full img-full" src="/img/app-builder/code-mode/versions-and-history/see-what-changed.png" alt="What changed view on the Code tab, listing two changed files and an inline diff of src/App/index.tsx" />

<img className="screenshot-full img-full" src="/img/app-builder/code-mode/versions-and-history/compare-screens.png" alt="What changed from v2 to v3 on the Screens tab: the Overview screen of both versions side by side, with screen tabs and width options" />

**See query changes** opens ToolJet's version comparison for the queries and settings. It needs the Pro plan or above.

While you compare, queries that change data are blocked, so a screen in the comparison can't write anything.

### Undo and Restore

- **Undo this edit** in **See what changed** puts the code back to before an edit, then the canvas rebuilds. The edit stays in the history, so **Redo** brings it back. If the code changed after that edit, undo is refused: make the change in the **Code** panel instead.
- **Restore** on an App history entry puts the code back to how it was at that point. ToolJet confirms first: "This puts the app back to how it was on \{date\}. You can undo it."

A restore never rewrites history. It writes the old files as a new revision, so you can undo a restore by restoring the entry before it. Restore changes the code only. It doesn't change queries or access, and it works only on a draft whose code is edited in ToolJet.

## Who Edits the Code

A Code mode app's code has one owner at a time:

| <div style={{ width:"150px"}}> Owner </div> | <div style={{ width:"450px"}}> What It Means </div> |
|:---------- | :---------- |
| **ToolJet** | The default. The **Code** panel, style inspector and AI edit the code, and `tooljet app dev --source platform` stores each local save on ToolJet. |
| **Your repository** | The code is edited in a git repository and uploaded with `tooljet app dev --source repository` or `tooljet app publish --source repository`. In ToolJet, the code is read-only: the **Code** panel shows "This code lives in your Git repository", and the style inspector and **Fix with AI** are off. |

Each upload from the CLI sets the owner. Uploading with `--source platform` hands editing to ToolJet. If ToolJet holds editor or AI changes that your upload would overwrite, the upload is refused until you run `tooljet app source-pull`, or pass `--source-replace` to replace them.

## Git Sync

With [GitSync](/docs/development-lifecycle/gitsync/overview) set up, a Code mode app's code is committed with the app.

- **Commit.** ToolJet writes the draft's code to `apps/<app>/code/`, beside the app definition: `app.json`, `frontend/` and the lockfile. The first commit adds a `code/.gitignore` for `node_modules/`, `.tooljet/`, `frontend/dist/` and `frontend/src/tooljet.gen.ts`. Generated `tooljet.gen.ts` is never committed.
- **Owner.** If ToolJet owns the code, each commit makes `code/` match it exactly. If your repository owns it, ToolJet leaves `code/` as the repository has it. Your team's other files in the folder are never touched.
- **Pull.** A pull stores what's in `code/` as a new revision of the app's code. It appears in App history as "Pulled from git", so code it replaced can be restored.
- **Save version.** If the saved code is ahead of the last commit, ToolJet commits it before tagging the version.
- **Another workspace.** On the first pull into another workspace, a `code/` folder that ToolJet committed turns the app into a Code mode app with its code.
- A project file in git that ToolJet can't store, such as a file over the size limit, refuses the whole pull, so the next commit can't delete it from git.

### Branches

In multi-branch mode, each git branch has its own draft of the app. The code on the default branch is read-only in ToolJet: "This code is synced with git on the default branch. Create a feature branch to make changes."

With the CLI, the git branch your project folder is on picks that branch's draft. `tooljet app checkout` overrides it. See [Work Locally](/docs/app-builder/code-mode/local-development).

All branches of an app share the app's one component library.

## Export, Import and Clone

| <div style={{ width:"120px"}}> Action </div> | <div style={{ width:"480px"}}> What Happens to the Code </div> |
|:---------- | :---------- |
| **Export** | The file includes each version's current code and the builds the versions run. The code's history isn't exported. Builds over 40 MB in total can't be exported: export one version at a time. |
| **Import** | The app is created in Code mode with its own new component library. Each version's code starts a new history, editable in ToolJet. Builds from a file aren't trusted, so the first **Save version** rebuilds the code from source. |
| **Clone** | Same as import, and the clone's builds are used as they are. App history starts with "Copied with the app". |

An export made before exports carried code imports without it. Export the app again from the original and import the new file.

## The App's Component Library

ToolJet builds a Code mode app into a component library of its own, named after the app. The app keeps the same library across all its versions and git branches, and no other app uses it. If the name is already taken in the workspace, ToolJet adds a short suffix, such as `Northwind Shipments (3f2a9c1d)`.

## Retention

ToolJet prunes old code revisions and builds. A self-hosted admin can change these limits with environment variables:

| <div style={{ width:"300px"}}> Variable </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"250px"}}> What It Keeps </div> |
|:---------- | :---------- | :---------- |
| `TOOLJET_CODE_SOURCE_REVISIONS_KEEP` | `500` | The newest code revisions of each version. Older ones leave App history and can't be restored. |
| `TOOLJET_CODE_BUILDS_KEEP` | `50` | The newest saved builds of each app's library, plus every build a version uses. |

`0` keeps everything. See [Environment Variables](/docs/setup/configuration/env-vars#code-mode).
