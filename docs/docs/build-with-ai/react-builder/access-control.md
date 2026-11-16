---
id: access-control
title: Control Access
---

Choose who can open each screen of a React Builder app and who can run each query, by group or by person. You set both in the **Access** panel, and ToolJet's server checks the query limits on every run.

<!-- TODO screenshot: /img/build-with-ai/react-builder/access-control/access-panel.png | img-m | alt: The Access panel listing the app's five screens, two of them restricted, and its eight queries, four of them restricted | shows: state A (Northwind Dispatch v3 draft): Access panel open from the left sidebar; the screens list reads "5, 2 restricted" with Carriers restricted to Operations and Billing to Finance; the queries list reads "8, 4 restricted" -->

## Two Kinds of Access

<SectionSubtitle text="Who can open the app at all is set in workspace settings. Inside the app, you control two things." />

<CardGrid columns={2}>
  <FeatureCard
    icon="🖥️"
    title="Who can open each screen"
    description="A restricted screen leaves the app's navigation for everyone outside its groups, and a link to it says they don't have access."
  />
  <FeatureCard
    icon="🗄️"
    title="Who can run each query"
    description="ToolJet's server refuses to run a restricted query for anyone outside its groups, whatever the screen shows. This is what protects the app's data."
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

The group list shows your workspace's custom groups. A group that can't open the app yet is grayed out. Click the option beside it, for example **Give Operations access to this app**, to let that group open the released app, then select it.

To change a restriction later, click **Change** on its row. To remove it, select **All users with access to the app**, then click **Save changes**.

## What Users See

Someone outside a screen's groups doesn't find the screen in the app's navigation. If they follow a link to it, the app keeps its layout and shows "You don't have access to this screen" in place of the content. Someone who can't open any screen sees only that message.

<!-- TODO screenshot: /img/build-with-ai/react-builder/access-control/no-access-screen.png | img-full | alt: The released app for a Finance user who followed a link to Carriers: the app keeps its sidebar and shows "You don't have access to this screen" where the content would be | shows: state E (v2 released, signed in as Daniel Okafor from the Finance group): the released Northwind Dispatch opened at the Carriers route; the navigation lists Overview, Shipments and Billing, not Carriers -->

A restricted query fails for them instead of returning data, and your code gets the failure as the query's `error`. See [Runtime API](./runtime-api.md#errors).

## Good to Know

- People who can edit the app, workspace admins included, open every screen and run every query. Everyone else is held to the limits everywhere, Preview included.
- On a public app's link, restricted screens and queries are closed to everyone, signed-in members included. Queries without a restriction run for anyone who has the link.
- Access is saved with the version, and a saved version can't change. Switch to a draft to edit its restrictions.
- Screen and query restrictions depend on your plan. If the panel asks you to upgrade, your plan doesn't include them.
- Every change is recorded in [App history](./versions-and-history.md), for example "Access changed: Only Operations can open Carriers".

## Where to Go Next

<CardGrid columns={3}>
  <NextStepCard title="App Security" description="See what protects the app, and fix the access issues it reports." href="/docs/build-with-ai/react-builder/security" />
  <NextStepCard title="Runtime API" description="Read the signed-in user, list users and handle a failed query in code." href="/docs/build-with-ai/react-builder/runtime-api" />
  <NextStepCard title="Workspace Permissions" description="Groups, roles and who can open each app." href="/docs/user-management/role-based-access/access-control" />
</CardGrid>
