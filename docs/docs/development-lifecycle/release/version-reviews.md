---
id: version-reviews
title: Compare and Review Versions
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
Compare versions and version reviews are in beta and not recommended for production use.
:::

**Compare versions** shows what changed between two versions of an app: its screens side by side, its queries, settings and, for Code mode apps, its code and access. A **version review** asks a teammate to approve a saved version before it's released. Use reviews when a second pair of eyes should sign off on every change that reaches your users.

Both work for visual and Code mode apps. They aren't available for workflows or modules.

## Availability

Compare versions and version reviews are available on the Pro plan and above, and during a trial. On a lower plan, the **Compare versions** button explains that it's available on Pro and above.

## Compare Two Versions

1. In the App Builder header, click **Compare versions**.
2. Pick the versions to compare under **From** and **To**. Use the swap button to switch sides.
3. Review the changes:
   - The change list on the left groups changes into screens or pages, **Queries**, **Access** and **Settings**.
   - The preview shows both versions **Side by side**, at the **Screen size** you pick. Under **Render**, choose **Live data** to run the versions' queries, or **Layout only, runs no queries**.
   - For a Code mode app, the view summarizes the changed files, and **See screens and code** opens the screens side by side and the code file by file. See [See What Changed](/docs/app-builder/code-mode/versions-and-history#see-what-changed).

<img className="screenshot-full img-full" src="/img/development-lifecycle/release/version-reviews/compare-versions.png" alt="Compare versions view for a Code mode app, from v2 to the v3 draft, with See screens and code and Request review" />

## Request a Review

You can request a review of a saved version. A draft can't be reviewed, because what's reviewed must not change: save the version first.

1. Open **Compare versions** on the saved version.
2. Click **Request review**.
3. Enter a **Title** (by default, "Release \{version\}") and describe what changed and why. Type `@` to mention a teammate.
4. Under **Reviewers**, click **Ask someone** and choose who should review. Reviewers must be able to approve.
5. Submit the request.

The reviewers are notified, and the review appears in their dashboard notifications, for example "2 reviews waiting on you".

A version has at most one open review at a time.

## Review a Version

Reviewers open the review from the notification or from **Compare versions**. The review conversation sits beside the comparison.

- **Comment** on the whole version, or on a specific change.
- **Approve** the version. The approval covers exactly what the comparison showed. If the version changes after you open it, ToolJet asks you to reload the changes and review them again.
- **Request changes** to block the release until the author updates the version and asks for a re-review.

The author can't approve their own review.

### Review States

| <div style={{ width:"200px"}}> State </div> | <div style={{ width:"400px"}}> Meaning </div> |
|:---------- | :---------- |
| **Waiting for review** | The review is open and needs approvals. |
| **Changes requested** | A reviewer asked for changes. |
| **Approved** | The version has the approvals it needs. If the version changed after approval, the approval no longer counts and the version needs a fresh one. |
| **Released** | The approved version was released. |
| **Closed** | The review was closed without a release. |

## Reviews and Release

A version with an open review that isn't approved can't be released, promoted, or moved to another environment until it's approved, the review is closed, or an admin releases it without approval. This applies whether or not your instance requires reviews.

The release dialog shows the review's state: **Needs an approved review**, with **Open the review** or **Request a review**, or **Approved in review**: "This exact version was approved, so it can be released."

A version that was released from an approved review can be released again later, for example to roll back, as long as its content still matches what was approved.

For Code mode apps, the [security check](/docs/app-builder/code-mode/security#release-gate) runs first, then the review gate.

### Release Without Approval

Workspace admins can release a version without an approved review:

1. In the review, click **Release without approval**.
2. Give a reason of at least 10 characters. It stays on the review's record.
3. Confirm with **Allow release without approval**.

The author and the reviewers are emailed.

## Require Reviews

On a self-hosted instance, an admin can require an approved review before every release or promotion with environment variables:

| <div style={{ width:"300px"}}> Variable </div> | <div style={{ width:"100px"}}> Default </div> | <div style={{ width:"250px"}}> What It Does </div> |
|:---------- | :---------- | :---------- |
| `TOOLJET_VERSION_REVIEW_REQUIRED` | `off` | `release` requires an approved review to release. `promote` requires one to promote into production. `release,promote` or `all` requires both. |
| `TOOLJET_VERSION_REVIEW_APPROVALS` | `1` | How many approvals a review needs. |

With reviews required, a version without an approved review shows **Release stays locked until this is approved**.

## Who Can Do What

| <div style={{ width:"300px"}}> Action </div> | <div style={{ width:"300px"}}> Who </div> |
|:---------- | :---------- |
| Compare versions, request a review, comment, ask for a re-review, close or reopen a review | Anyone who can edit the app |
| Approve or request changes | Workspace admins, or users with promote permission on an app they can edit. Not the review's author. |
| Release without approval | Workspace admins |

A personal access token can read and comment on reviews, but it can never approve a review or release without one.

Approvals, change requests and releases without approval are recorded in the audit log as app updates.
