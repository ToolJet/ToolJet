---
id: overview
title: Branching Overview
sidebar_label: Overview
---

<PlanBadge type="team" />

{/* TODO: verify plan tier. Multi-branch Git Sync is gated by a separate license term
    (gitSyncMultiBranch) with no tier hardcoded in the codebase, so this badge mirrors the
    Git Sync badge. Confirm with the licensing owner before publishing. */}

Branching lets several builders work on the same applications at the same time without overwriting each other. Each builder works on their own branch, where changes stay separate from what is live until they are reviewed and merged through a pull request in your Git provider. This protects production quality through mandatory review, and gives you a complete, traceable change history in Git.

Branching is useful when:

- Multiple builders work on the same applications at the same time.
- You need formal review and approval before changes reach production.
- Change tracking and auditability are organizational requirements.

## What a Branch Contains

A branch in ToolJet is not tied to a single application. Each branch holds its own copy of every application, module, datasource, and folder, so switching branches changes what you see across all of them at once.

All branches live inside the same workspace. You do not need a separate workspace for each branch, for each builder, or for each feature. Everyone works in one workspace and switches between branches in it.

Workflows are the exception. They are not branch-scoped and behave the same on every branch.

There are two kinds of branches:

- **Default branch**: The branch configured in your Git Sync connection, typically `main` or `master`. It holds the live version of your applications. When branching is enabled, this branch is read-only and changes can only enter it through a merged pull request.
- **Feature branches**: Independent copies created from the default branch, where you make changes freely. Each feature branch is isolated until its changes are merged back.

## Single-Branch and Multi-Branch Mode

Git Sync starts in single-branch mode. Branching is something you opt into. See [Enable Branching](/docs/beta/branching/enable-branching) for how to turn it on.

| Behavior | Single-branch mode | Multi-branch mode |
|:---------|:-------------------|:------------------|
| Creating applications, modules, and datasources on the default branch | Allowed | Blocked |
| Feature branches | Not available | Created from the default branch |
| Default branch | Editable | Read-only |
| Changes reach the default branch by | Committing directly | Merging a pull request |

When branching is enabled and you are on the default branch, ToolJet blocks these actions:

- Creating or editing applications and modules
- Creating or deleting datasources
- Creating and modifying folders
- Creating applications from templates
- Using any AI features

## Versions and Tags

Versions live only on the default branch and mark stable points in your application's history. Branching builds on ToolJet's usual [version control](/docs/development-lifecycle/release/version-control) model.

- **Draft version**: The current working state. Only one draft is allowed per application per branch, and creating a second is rejected.
- **Saved version**: A finalized, locked milestone. Saving a version creates a corresponding tag in your Git repository.
- **Released version**: A saved version promoted through environments and released to production.

Feature branches do not have versions. They are working copies that always hold a draft.

Git tags are named `<application-correlation-id>/<version-name>`, for example `9f1c2e4a-.../v1`. ToolJet uses the correlation ID rather than the application name so that the tag stays valid if the application is later renamed.

## Where Branch Controls Appear

The branch dropdown and the **Pull** and **Commit** buttons appear in the header on the **Applications**, **Data sources**, and **Modules** pages, and inside the App Builder.

## Using Git Sync Across Multiple Instances

If you run separate ToolJet instances for different environments, you can connect them to the same Git repository. Git acts as the bridge between instances.

- **Development instance**: Builders create branches, make changes, commit, and merge pull requests. Saved versions are tagged in Git.
- **Staging or production instance**: Pull saved versions from Git to deploy and release them. No manual export or import is needed.

This enforces environment separation at the infrastructure level while keeping all instances in sync through a single repository.

:::info
To decide whether a single or multi-instance setup suits your organization, see [Choosing Your Instance Setup](/docs/tj-setup/instances#choosing-your-instance-setup).
:::

## Limitations

- Branching works only over Git HTTPS with GitHub or GitLab. SSH is not supported.
- Branches can only be created from the default branch, not from another feature branch.
- Pull requests must be created and merged in your Git provider. ToolJet cannot merge branches.
- Branches can only be renamed in your Git provider.
- Merge conflicts must be resolved in Git before merging.
- Workflows are not branch-scoped.
- Only one draft version is allowed per application per branch.

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
