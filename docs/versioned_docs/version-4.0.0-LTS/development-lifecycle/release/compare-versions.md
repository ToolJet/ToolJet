---
id: compare-versions
title: Compare and Review Versions
hide_title: true
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<DocHero
  title="Compare and Review Versions"
  description="Compare versions shows the differences between two versions of an application, including its screens side by side. A version review records a reviewer's approval of a version before it is released."
/>

<PlanBadge type="pro" />

<img className="screenshot-full img-full" src="/img/development-lifecycle/release/compare-versions/compare-side-by-side.png" alt="Compare versions showing one screen in two versions side by side: the bar chart has become a stacked area chart, and a list of shipments that need attention has replaced the table" />

## Overview

Compare versions and version reviews work the same way for visual applications and React Builder applications.

<CardGrid columns={3}>
  <FeatureCard
    icon="git-compare"
    title="Compare Two Versions"
    description="Shows the changes between two versions: screens before and after, queries and settings, and in React Builder applications, code and access."
    href="#compare-two-versions"
  />
  <FeatureCard
    icon="send"
    title="Request a Review"
    description="Sends a version to one or more reviewers. Reviewers see the same comparison as the author."
    href="#request-a-review"
  />
  <FeatureCard
    icon="check-circle"
    title="Approve or Request Changes"
    description="Reviewers comment on the changes, then approve the version or request changes. An open review holds the release."
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
4. Choose how the pages are shown. Pick a **Screen size**, and use **Layout** to switch from side by side to a slider dragged across the page. Under **Render**, choose **Live data** to run each version's queries, or **Layout only, runs no queries**.

After an AI edit, **See what changed** under the chat turn opens this same view, with the app as it was before the edit on the left.

</TabItem>
<TabItem value="react-builder" label="React Builder app">

1. In the editor's header, click **Compare versions**, then pick the versions under **From** and **To**.
2. Read the summary on the left: the changed files, queries and settings, and any change to who can open a screen or run a query. Then click **See screens and code**.
3. Switch between the two views:
   - **Screens** shows each screen before and after, side by side or with a slider, at the selected width. A dot marks the screens and widths that look different.
   - **Code** lists the changed files and shows what changed in each one.

<img className="screenshot-full img-full" src="/img/development-lifecycle/release/compare-versions/code-diff.png" alt="The Code view of a comparison: the changed files with their added and removed lines on the left, and the changes to Overview.tsx between v2 and v3" />

The same view opens from **See what changed** under an AI chat turn, on an App history entry, and in the release and promote dialogs. Queries that write data are blocked during a comparison, so comparing never changes data.

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

The author of a review can't approve it.

<img className="screenshot-full img-m" src="/img/development-lifecycle/release/compare-versions/review-panel.png" alt="The review panel beside a comparison: the request to release v3 in place of v2, the reviewer's approval with the next step, and the comments" />

## Reviews and Release

A review also decides whether the version can go out.

- A version with an open review that isn't approved can't be released, promoted or moved to another environment. This holds whether or not the instance requires reviews.
- The release dialog shows where the review stands, with a button to open the review or request one.
- A version released from an approved review can be released again later, for example to roll back, as long as its content still matches what was approved.
- In a React Builder app, the [security check](../../app-builder/react-builder/security.md) runs first, then the review check.

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
  <NextStepCard title="App Security" description="The checks a React Builder version passes before release." href="/docs/app-builder/react-builder/security" />
</CardGrid>

:::info
Compare versions and version reviews cover apps, not workflows or modules.
:::
