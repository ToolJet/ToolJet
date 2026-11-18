---
id: access-control
title: Control Access
---

<PlanBadge type="enterprise" />

Access control restricts who can open each screen of a React Builder application and who can run each query, by group or by user. Both are set in the **Access** panel, and the ToolJet server enforces query restrictions on every run.

<img className="screenshot-full img-m" src="/img/build-with-ai/react-builder/access-control/access-panel.png" alt="The Access panel listing the app's five screens, two of them restricted, and its eight queries, four of them restricted" />

## Screen and Query Restrictions

Access to the application as a whole is set in workspace settings. Inside the application, two kinds of restriction are available.

<CardGrid columns={2}>
  <FeatureCard
    icon="monitor"
    title="Screen Restrictions"
    description="A restricted screen is removed from the application's navigation for users outside its groups. A direct link to it shows a no-access message."
  />
  <FeatureCard
    icon="database"
    title="Query Restrictions"
    description="The ToolJet server refuses to run a restricted query for users outside its groups, regardless of the screen. Query restrictions are what protect the application's data."
  />
</CardGrid>

:::warning Restricting a screen doesn't protect its data
Restricting a screen only hides it. Everyone who can open the app still receives the screen's code and can still run its queries. To protect data, restrict the queries the screen uses.
:::

Northwind Dispatch does both: its Billing screen is restricted to the Finance group, and so are the `listInvoices` and `approveInvoice` queries behind it.

## Restrict a Screen or Query

1. Open the app's draft version in the editor and click **Access** in the left sidebar. The panel has one list of screens and one of queries.
2. Click a screen or a query to open its row, then click **Restrict**.
3. Select **User groups** and choose the groups. To pick people instead, select **Users**.
4. Click **Create permission**.

The group list shows the workspace's custom groups. A group that can't open the app yet is grayed out. Click the option beside it, for example **Give Operations access to this app**, to let that group open the released app, then select it.

To change a restriction later, click **Change** on its row. To remove it, select **All users with access to the app**, then click **Save changes**.

## What Users See

Someone outside a screen's groups doesn't find the screen in the app's navigation. A direct link to the screen shows "You don't have access to this screen" in place of the app, with a button back to the first screen they can open.

<img className="screenshot-full img-m" src="/img/build-with-ai/react-builder/access-control/no-access-screen.png" alt="The released app for a Finance user who followed a link to the Carriers screen: the message &quot;You don't have access to this screen&quot; and a Go to Overview button" />

A restricted query fails for them instead of returning data, and the app's code gets the failure as the query's `error`. See [Runtime API](./runtime-api.md#errors).

## Notes

- People who can edit the app, workspace admins included, open every screen and run every query. Everyone else is held to the limits everywhere, Preview included.
- On a public app's link, restricted screens and queries are closed to everyone, signed-in members included. Queries without a restriction run for anyone who has the link.
- Access is saved with the version, and a saved version can't change. Switch to a draft to edit its restrictions.
- Every change is recorded in [App history](./versions-and-history.md), for example "Access changed: Only Operations can open Carriers".

## Where to Go Next

<CardGrid columns={3}>
  <NextStepCard title="App Security" description="See what protects the app, and fix the access issues it reports." href="/docs/app-builder/react-builder/security" />
  <NextStepCard title="Runtime API" description="Read the signed-in user, list users and handle a failed query in code." href="/docs/app-builder/react-builder/runtime-api" />
  <NextStepCard title="Workspace Permissions" description="Groups, roles and who can open each app." href="/docs/user-management/role-based-access/access-control" />
</CardGrid>
