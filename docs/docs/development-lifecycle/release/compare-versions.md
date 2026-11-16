---
id: compare-versions
title: Compare and Review Versions
hide_title: true
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<DocHero
  title="Compare and Review Versions"
  description="See exactly what changed between two versions of an app, with the screens side by side. Then ask a teammate to approve the version before it reaches your users."
  chips={['Visual and React Builder apps', 'Side-by-side screens', 'Code and query changes', 'Approval before release']}
/>

<PlanBadge type="pro" />

<img className="screenshot-full img-full" src="/img/development-lifecycle/release/compare-versions/compare-side-by-side.png" alt="Compare versions showing one screen in two versions side by side: the bar chart has become a stacked area chart, and a list of shipments that need attention has replaced the table" />

## What You Can Do

<SectionSubtitle text="It works the same way for visual apps and React Builder apps." />

<CardGrid columns={3}>
  <FeatureCard
    icon="🔍"
    title="Compare two versions"
    description="Pick any two versions and see every change: screens before and after, queries, settings and, in React Builder apps, code and access."
    href="#compare-two-versions"
  />
  <FeatureCard
    icon="📨"
    title="Request a review"
    description="Ask teammates to check a saved version before it goes live. They see the same comparison you do."
    href="#request-a-review"
  />
  <FeatureCard
    icon="✅"
    title="Approve or request changes"
    description="Reviewers comment beside the changes, then approve the version or send it back. An open review holds the release."
    href="#approve-or-request-changes"
  />
</CardGrid>

## Compare Two Versions

The steps depend on how the app is built.

<Tabs>
<TabItem value="visual" label="Visual app" default>

1. In the App Builder header, click **Compare versions**.
2. Pick the two versions under **From** and **To**. The swap button between them switches sides.
3. Go through the change list on the left. It groups what changed by page, then queries and settings.
4. Choose how the pages are shown. Pick a **Screen size**, and use **Layout** to switch from side by side to a slider you drag across the page. Under **Render**, choose **Live data** to run each version's queries, or **Layout only, runs no queries**.

After an AI edit, **See what changed** under the chat turn opens this same view, with the app as it was before the edit on the left.

</TabItem>
<TabItem value="react-builder" label="React Builder app">

1. In the editor's header, click **Compare versions**, then pick the versions under **From** and **To**.
2. Read the summary on the left: the changed files, queries and settings, and any change to who can open a screen or run a query. Then click **See screens and code**.
3. Switch between the two views:
   - **Screens** shows each screen before and after, side by side or with a slider, at the width you choose. A dot marks the screens and widths that look different.
   - **Code** lists the changed files and shows what changed in each one.

<img className="screenshot-full img-full" src="/img/development-lifecycle/release/compare-versions/code-diff.png" alt="The Code view of a comparison: the changed files with their added and removed lines on the left, and the changes to Overview.tsx between v2 and v3" />

The same view opens from **See what changed** under an AI chat turn, on an App history entry, and in the release and promote dialogs. Queries that write data are blocked while you compare, so comparing never changes your data.

</TabItem>
</Tabs>

## Request a Review

A review asks teammates to approve a saved version. Save the version first: a draft can't be reviewed, because what's reviewed must not change.

1. Open **Compare versions** on the saved version. By default, a review compares it with the released version.
2. Click **Request review**.
3. Enter a **Title**, then describe what changed and what to check. Type `@` to mention a teammate.
4. Under **Reviewers**, click **Ask someone** and choose people who can approve.
5. Submit the request.

Each reviewer sees the request in their dashboard notifications. A version has one open review at a time.

## Approve or Request Changes

Reviewers open the review from the notification or from **Compare versions**. The conversation sits beside the comparison.

- **Comment** on the whole version, or on one change.
- **Approve** the version. An approval covers exactly what the comparison showed. If the version changes afterwards, it needs a fresh approval.
- **Request changes** to block the release. The author addresses them, then clicks **Ask for re-review**.

You can't approve a review you opened yourself.

<img className="screenshot-full img-m" src="/img/development-lifecycle/release/compare-versions/review-panel.png" alt="The review panel beside a comparison: the request to release v3 in place of v2, the reviewer's approval with the next step, and the comments" />

## Reviews and Release

A review also decides whether the version can go out.

- A version with an open review that isn't approved can't be released, promoted or moved to another environment. This holds whether or not your instance requires reviews.
- The release dialog shows where the review stands, with a button to open the review or request one.
- A version released from an approved review can be released again later, for example to roll back, as long as its content still matches what was approved.
- In a React Builder app, the [security check](../../build-with-ai/react-builder/security.md) runs first, then the review check.

<details id="tj-dropdown">
<summary>**Required Reviews, Permissions and Releasing Without Approval**</summary>

#### Require Reviews

On a self-hosted instance, an admin can require an approved review before every release, every promotion to production, or both, and set how many approvals a review needs. See [Version Reviews](../../setup/configuration/env-vars.md#version-reviews) in the environment variables reference. Until a required review is approved, the release stays locked.

#### Who Can Do What

| <div style={{ width:"300px"}}> Action </div> | <div style={{ width:"300px"}}> Who </div> |
|:---------- | :---------- |
| Compare versions, request a review, comment, ask for a re-review, close or reopen a review | Anyone who can edit the app |
| Approve or request changes | Workspace admins, and users with promote permission on an app they can edit. Never the review's author. |
| Release without approval | Workspace admins |

A personal access token can read and comment on reviews, but it can never approve one or release without one. Approvals, change requests and releases without approval are recorded in the [audit log](../../security/audit-logs/audit-logs.md).

#### Release Without Approval

A workspace admin can release a version whose review isn't approved:

1. In the review, click **Release without approval**.
2. Give a reason of at least 10 characters. It stays on the review's record.
3. Confirm with **Allow release without approval**.

The author and the reviewers are emailed.

</details>

## Where to Go Next

<CardGrid min={190}>
  <NextStepCard title="Version Control" description="Create, save and manage an app's versions." href="/docs/development-lifecycle/release/version-control" />
  <NextStepCard title="Release and Rollback" description="Release a version, or go back to an earlier one." href="/docs/development-lifecycle/release/release-rollback" />
  <NextStepCard title="App History" description="Every change to an app, and how to restore one." href="/docs/app-builder/app-history" />
  <NextStepCard title="App Security" description="The checks a React Builder version passes before release." href="/docs/build-with-ai/react-builder/security" />
</CardGrid>

:::info Availability
Compare versions and version reviews are available on the Pro plan and above and during a trial, and the **Compare versions** button is labelled Beta in the product. They cover apps, not workflows or modules.
:::
