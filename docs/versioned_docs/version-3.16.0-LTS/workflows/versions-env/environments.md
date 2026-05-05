---
id: environments
title: Multi-Environment
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

Environments for Workflows help manage different stages of workflow development, ensuring smooth transitions between development, testing, and production. They keep changes isolated so that testing and debugging can happen without affecting live workflow executions.

Workflows follow the same environment model as applications in ToolJet. If you are already familiar with multi-environment for apps, the same concepts apply here. Refer to the **[Multi-Environment](/docs/development-lifecycle/environment/self-hosted/multi-environment)** guide for a general overview.

## What are Environments?

An environment in ToolJet represents a separate configuration space where **workflows**, **data sources**, and **constants** can be defined and managed independently.

By default, ToolJet provides three environments:

- **Development**: Where workflow development and initial testing take place. Developers can build, configure, and modify workflow nodes and logic. Changes here do not affect live executions.
- **Staging**: Acts as a pre-production space where workflows undergo thorough testing before deployment. Teams such as QA and product managers use this environment to validate workflow behavior before releasing to end users.
- **Production**: The final, live environment where the workflow actively runs and responds to triggers. This environment is stable and optimized for performance after thorough testing in Development and Staging.

## Workflow Lifecycle Across Environments

The workflow lifecycle involves managing workflow versions across development, staging, and production. You build and test the workflow in the development environment, promote it to staging for validation, and then promote it to production for release.

Data sources and constants can be configured separately for each environment, and ToolJet will automatically use the appropriate ones based on the target environment.

- **Development** - Developers build and test the workflow in the workflow editor. Nodes, and logic can be freely modified.
- **Staging** - The testing or product team validates requirements and tests the workflow using staging data sources and constants. Workflow definitions cannot be edited in this environment.
- **Production** - After thorough testing in staging, the workflow is promoted to production. Once promoted, you can release the version to make it the active workflow that responds to all triggers.

## Promoting a Workflow Version

Promotion moves a saved workflow version from one environment to the next. Versions can only be promoted sequentially, you cannot skip environments.

```
Development → Staging → Production
```

To promote a workflow version:

1. Ensure the version is saved (not in draft state).
2. Click the **Promote** button in the workflow editor toolbar.
3. The version will be promoted to the next environment in the chain.

:::warning
Once a workflow version is promoted beyond development, its definition is locked and cannot be edited. To make further changes, create a new draft version from the promoted version.
:::

## Executing Workflows in Specific Environments

When triggering a workflow via webhooks, you can specify which environment to execute in using query parameters:

- **`environment`**: The target environment name (e.g., `staging`, `production`).
- **`version`**: The specific version to execute.

The system validates that the specified version has been promoted to the target environment before allowing execution. A version in development cannot be executed in a production context.

## Workflow Schedules and Environments

Workflow schedules are tied to specific environments. When creating a schedule, you specify which environment the scheduled execution should run in. This ensures that scheduled workflows use the correct datasources, constants, and workflow version for that environment.

## Impacted Behavior with Environment Permission

Each environment has a different impact on your workflow. Refer to the following table for details.

| Action              | Development | Staging | Production |
| ------------------- | ----------- | ------- | ---------- |
| Edit versions       | Yes         | No      | No         |
| Rename versions     | Yes         | No      | No         |
| Delete versions     | Yes         | No      | No         |
| Create new versions | Yes         | No      | No         |
| Promote             | Yes         | Yes     | -          |

## Promote Workflow Permission

Admins can configure the Promote permission from the [Permissions](/docs/user-management/role-based-access/user-roles#permissions-for-user-roles) page. This disables the **Promote** button for users who do not have the required permission, allowing only authorized roles to promote workflows from one environment to another.

:::info
Without a multi-environment license, all workflow versions remain in the development environment. The promotion and environment features become available with the appropriate license tier.
:::