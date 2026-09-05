---
id: module-version-control
title: Module Version Control
---

:::warning BETA
Module Version Control is currently in beta and not recommended for production use.
:::

Modules in ToolJet are reusable UI components — think of them as mini-apps like a shared navigation bar, a form, or a data table — that you can plug into multiple applications across your workspace.

Module Version Control lets you manage changes to a module in a controlled way. Instead of edits to a module instantly affecting every app that uses it, you decide when a new version is stable and which apps should adopt it. This protects your production apps from untested changes while letting you iterate freely on the module itself.

## Understanding Module Versions

Every module has a version history. At any point in time, a module version is in one of three states:

- **Draft**: The active, editable state. This is where you make changes. Only one draft can exist at a time. A draft cannot be used directly in an app (except when working on a feature branch — covered in the [Branching](#module-version-control-with-branching) section).
- **Saved**: A locked snapshot of the module created from a draft. Saved versions cannot be edited. Once a version is saved, it becomes available for apps to use.
- **Released**: A saved version that has been promoted through all environments (staging, production) and marked as the final stable state. Releasing a module does not automatically update apps — each app must manually switch to the released version.

## Creating and Managing Versions

Module versions are managed from the **Version** tab inside the module builder.

### Create a New Draft

A draft is your working copy. You can only have one draft at a time.

1. Open the module in the module builder.
2. Click the version dropdown in the toolbar.
3. Select **Create Draft Version**.
4. Choose a saved version to start from.
5. Click **Create**.

You can now make changes on this draft without affecting any apps currently using older versions of the module.

### Save a Version

When your changes are tested and ready, save the draft as a named version:

1. In the module builder toolbar, click **Save Version**.
2. Enter a version name (e.g., *v2*, *v2.1*).
3. Click **Save**.

The version is now locked — no further edits are allowed on it. It becomes available for apps to pin and can be promoted to environments.

### Release a Version

Releasing marks a saved version as the stable, finished state of the module after it has been fully tested across environments.

To release a version:
1. Promote the saved version to staging, then to production.
2. Click **Release**.

:::info
Releasing a module only marks it as complete. It does not update any apps automatically. Apps that use this module continue running on their currently pinned version until you manually update the pin.
:::

## Pinning a Module Version to an App

When you add a module to an app, you must choose which version of that module the app should use. This is called **pinning**. The app stays on that version until you explicitly change it — even if newer versions of the module are saved or released later.

To pin a version:

1. Open the app in the app builder.
2. Find the module component on the canvas.
3. Click the version selector on the module.
4. Choose a saved version from the dropdown.

To update to a newer version, come back to the same selector and choose the new version. The app will then reflect the changes from that version.

:::note
Draft versions cannot be pinned in apps. Only saved versions are available in the version selector. (Exception: when branching is enabled, a **Current Branch** option also appears — see [Branching](#module-version-control-with-branching) below.)
:::

## Dependency Chain: Modules and App Promotion

Because a module is a dependency of the app that uses it, both must be at the same stage before you can advance the app. ToolJet enforces this at every step:

| To do this with the app | The pinned module version must already be... |
|---|---|
| Save the app version | Saved |
| Promote the app to staging | Promoted to staging |
| Promote the app to production | Promoted to production |
| Release the app | Released |

If the module is not at the required stage, ToolJet blocks the action and shows an error. You need to advance the module version first, then come back and continue with the app.

**Example**: Your app uses a module pinned to *v2*. You want to promote the app to staging. If *v2* of the module is only saved but not yet promoted to staging, the app promotion will fail. Promote *v2* of the module to staging first, then try promoting the app again.

## Environment Inheritance

Modules do not have their own active environment when running inside an app. Instead, **a module always uses the environment of the app that contains it**.

This affects how module queries connect to data sources:

- If the app is in the **staging** environment, all queries inside the module run against staging data source credentials.
- If the app is in **production**, module queries use production credentials.

This works the same way as data sources in apps — the module adapts to whichever environment the app is currently in.

## Module Version Control with Branching

When branching is enabled on your workspace, the module version selector inside the app builder shows an additional option: **Current Branch**.

Selecting **Current Branch** links the app to the live, in-progress state of the module on the same branch. This is useful when you are making changes to both the app and its module on the same feature branch and want to see them working together as you build.

Once you are done and ready to merge, save the module as a named version. You then pin that saved version to the app before merging the branch.

:::info
Without branching enabled, only **Draft** and **Saved** versions appear in the version selector. **Current Branch** is only visible when branching is active on your workspace.
:::

## Limitations

- Releasing a module has no automated effect on apps. Apps must manually update their pinned version.
- You cannot save an app version unless the module it uses has at least one saved version pinned.
- You cannot promote an app to an environment unless the pinned module version has already been promoted to that same environment.
- Draft versions cannot be pinned in apps outside of a feature branch.
- Rebase across branches is not supported. Importing a module from a different branch will override the current state rather than merge changes.
