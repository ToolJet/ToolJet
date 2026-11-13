---
id: access-control
title: Access Control in Code Mode
sidebar_label: Access Control
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

A Code mode app uses ToolJet's permissions, like any other app. Who can open the app is set in workspace settings. Inside the app, you control two things:

- **Who can open each screen.** A restricted screen is hidden from everyone outside its groups.
- **Who can run each query.** A restricted query is refused by ToolJet's server for everyone outside its groups.

:::warning Restricting a screen doesn't protect its data
Everyone who can open the app downloads the code of every screen, including its constants and the names of the queries it calls. Restricting a screen only hides it. To protect data, restrict the **queries** the screen uses. ToolJet's server checks query permissions on every run, whatever the screen shows.
:::

## How Screens Map to Pages

Each screen is a route in the project's `app.json`. When the app is built, ToolJet creates one hidden page per screen to carry that screen's permissions:

- **Handle:** `<code page handle>-<route id>`, for example `home-carriers`.
- **Name:** `<code page name>: <route title>`, for example `Home: Carriers`.

The hidden pages don't appear in the app's navigation. Opening a hidden page's URL takes the user to the code page at that screen. You don't need to manage these pages by hand: the **Access** panel lists the screens by title.

## The Access Panel

Open **Access** from the left sidebar of a Code mode app.

<img className="screenshot-full img-m" src="/img/app-builder/code-mode/access-control/access-panel.png" alt="Access panel listing four screens and four queries, with the Carriers screen and the updateShipmentStatus query restricted to Operations" />

The panel has two sections. Search them with **Search screens, routes and queries**, and filter with **All** or **Restricted**.

### Who Can Open Each Screen

Each screen shows **Everyone** or **Restricted to** its groups.

1. Click a screen to open its row, then click **Restrict** (or **Change** if it's already restricted).
2. Under **Type**, select **User groups** and choose the groups that may open the screen, or select **Users** and choose people. **All users with access to the app** removes the restriction.
3. Click **Create permission** (or **Save changes**).

A restricted screen is left out of the app's navigation for everyone outside its groups, and a link to it says they don't have access. Each restricted screen shows a reminder: "Hides this screen from people outside these groups. It doesn't protect the screen's data: restrict the queries it uses."

In an open screen row, click the link icon to copy the released app's link to it (`/applications/<app slug>?route=<path>`). Screens with route parameters, such as `/shipments/:id`, have no copyable link.

### Who Can Run Each Query

Each query shows **Everyone** or **Restricted to** its groups. Click a query to open its row, then click **Restrict** or **Change** to choose them.

ToolJet's server refuses to run a restricted query for anyone outside its users or groups. The app receives the run as a failed query, and the code's `error` shows it. See [Runtime API](/docs/app-builder/code-mode/runtime-api).

### Choosing Groups

The group picker lists the workspace's custom groups. A group that can't open the app yet is grayed out, with a **Give access to this app** option for that group. Click it to give the group view access to the released app, then select it. The default groups (Admin, Builder, End-user) are listed only when they already have access to the app.

More permission settings, such as groups, roles and who can open the app, are in **Workspace settings** → **Groups**.

### When You Can't Change Access

| <div style={{ width:"350px"}}> Message </div> | <div style={{ width:"300px"}}> Why </div> |
|:---------- | :---------- |
| This version is saved and can't change. Edit a draft version to restrict it. | Permissions are part of the version. Switch to a draft. |
| The AI is building this app. You can change who has access when it's done. | An AI build is running. |
| You don't have access to page permissions. Upgrade your plan to access this feature. | Your plan doesn't include page permissions. The same message appears for query permissions. |
| Configured but not enforced on this plan | Query limits are set, but your plan doesn't enforce them: everyone who can open the app can run the queries. |

## Who the Limits Apply To

In a Code mode app, limits depend on **who** the user is, not on how they open the app:

- **People who can edit the app** pass every screen and query limit everywhere: workspace admins, super admins, and users with edit access to the app directly or through a folder. This is why you see every screen in the editor.
- **Everyone else** is held to the limits everywhere, including when they open the app with `?mode=edit` or in Preview.

In a visual app, by contrast, screen and query limits apply in the released app (to admins too) and are skipped in the editor.

## What Users See

When a user opens a screen they may not open:

- **If they can open another screen**, the app keeps its layout and shows **You don't have access to this screen** over the content area: "This screen is restricted to certain groups. Ask the app's owner if you need access." The **Go to** button takes them to the app's first screen they may open.
- **If they may open no screen at all**, none of the app's code runs. They see the same message under a header with the app's name.

<!-- TODO screenshot: Released Northwind Shipments app as a Finance user opening Carriers: "You don't have access to this screen" over the content area. Pending: needs a sign-in as a non-builder user and a released version. -->

In the app's code, `ToolJet.useNavigation().routes` marks each screen with `allowed`, and the template's `useAllowedRoutes()` returns only the screens the user may open, so the template's navigation leaves restricted screens out. The current route is never one the user may not open. See [Runtime API](/docs/app-builder/code-mode/runtime-api).

## Public Apps

If the app is public, anyone with its link can open it. On a public link:

- Restricted screens are closed to **everyone**, signed-in workspace members included, because the public link doesn't identify the user. They see: "This app is public. On its public link, restricted screens are closed to everyone, signed in or not."
- Restricted queries are refused for everyone.
- Unrestricted queries run for anyone with the link.

The **Access** panel shows a warning on public apps.

## Showing and Hiding Parts of a Screen

`ToolJet.useGlobals()` gives the code the current user's name, email and groups, for example to hide a button from people outside Finance. This is for display only: the values come from the browser. Protect the action itself by restricting the query it runs.

Don't pass `{{globals.currentUser.…}}` to a query to decide what the user may see. The browser fills it in, so a user can change it. The **Security** panel reports this as "Who the queries think the user is". See [App Security](/docs/app-builder/code-mode/security#what-protects-this-app).

## Access Changes in App History

Every change to who can open a screen or run a query is recorded, whether it was made in the **Access** panel, the **Queries** panel or by the AI. **App history** shows it as an entry such as "Access changed: Only Operations can open Carriers". Changes by the same person within two minutes are grouped into one entry. Click the entry to see **Who can open and run what** before and after.

## Listing Users in the App

`ToolJet.useWorkspaceUsers()` lists the workspace's active users who can open the app, for fields such as an assignee or owner picker. It returns only the people with access to the app, and only to a user who can open it. See [Runtime API](/docs/app-builder/code-mode/runtime-api).
