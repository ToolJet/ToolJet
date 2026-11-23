---
id: ai-credits-usage
title: AI Credits Usage
---

The **AI credits usage** page shows how ToolJet AI credits are consumed in an instance or workspace during the current billing cycle, broken down by builder. Admins use it to track spend against the monthly and add-on credit pools and to set **per-builder credit limits**, which cap how many credits each builder can use in a cycle.

Per-builder limits keep a shared credit pool predictable: one builder can't use up credits that the rest of the team depends on, and admins decide how the pool is divided.

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/usage/usage-overview.png" alt="AI credits usage page with credit pool cards and usage by builder" />

## Prerequisites

- ToolJet AI runs on **ToolJet AI credits**, either through the ToolJet AI credit plan or the ToolJet Managed AI Server. See [Setup ToolJet AI](/docs/setup/tooljet-ai/overview) for the available setups. The page doesn't appear when AI runs on [Bring Your Own Key (BYOK)](/docs/setup/tooljet-ai/bring-your-own-key) or a self-hosted LLM key, since that usage isn't metered in credits.
- Role required:

| Deployment | Who can open the page | Scope of the data |
|:-----------|:----------------------|:------------------|
| Self-hosted | **Super Admin** | The whole instance: every workspace shares one credit pool. |
| ToolJet Cloud | Workspace **Admin** | The current workspace. |

## How Credit Pools and Limits Work

Credits come from two pools:

- **Monthly recurring**: credits included with the licence. They're used first and reset at the start of every billing cycle.
- **Add-on**: credits bought separately. They're used only after the monthly pool runs out, carry over from month to month and expire on the date shown on the card.

See [Understanding AI Credits](/docs/build-with-ai/ai-credits) for how credits are consumed and how to buy add-on credits.

Without per-builder limits, every builder draws from the same pool until it's empty. With limits on, each builder gets a **limit** made up of a monthly part and an add-on part:

- A builder's spend counts against the monthly part first. Spend beyond it counts against the add-on part.
- When both parts are used up, the builder is **at their limit** and can't start new AI actions until the next billing cycle or until an admin raises the limit.
- Every builder without a custom limit gets the **default**. By default the default is an **Equal share**: the pool left after custom limits, divided equally among the builders who don't have one.
- The total of all limits never exceeds the pool. When builders are added, defaults shrink to fit; when builders leave, they grow back.

Limits are set per billing cycle. Usage resets with the monthly pool at the start of each cycle; the limits themselves stay in place.

## Open the AI Credits Usage Page

1. Go to **Settings > AI credits usage**.
2. The header shows the current billing cycle dates. Dates are calendar days in UTC.

When one or more builders have reached their limit, the header instead shows how many builders are blocked, with a link to get more credits.

## Credit Pool Cards

The cards at the top summarise the pools for the current billing cycle.

| Card | Shows |
|:-----|:------|
| **Monthly recurring** | Credits remaining out of the cycle's monthly pool, percentage used and the renewal date. |
| **Add-on** | Credits remaining out of the add-on pool, percentage used and the expiry date. |
| **Default credits** | The default monthly and add-on limit per builder, and how many builders have a custom limit. Shown with an **Edit limits** button when per-builder limits are on. |

A pool card is labelled **Nearing limit** at 80% used and **At limit** at 100%. AI actions that are already running when a pool reaches zero finish, so a pool can go slightly below zero; the card then shows how many credits it's over.

The **Default credits** card can also show a note next to a default:

| Note | Meaning |
|:-----|:--------|
| **Reduced from X to fit N builders** | The custom default is higher than the pool allows for the current number of builders, so the lower value applies. The saved value applies again when there's room. |
| **N% unallocated** | Part of the pool isn't assigned to any builder's limit. |
| **Not enough credits for every builder** | The pool is too small to give every builder at least one credit. |
| **No credits in this pool** / **No builders yet** | The pool is empty, or there are no builders to divide it between. |

## Usage by Builder

The **Usage by builder** table lists credit consumption for the current billing cycle.

| Column | Description |
|:-------|:------------|
| **Builder** | Name and email. On self-hosted deployments, also the number of workspaces the builder belongs to. |
| **Monthly credits** | Monthly credits used. With limits on, shown as used / limit with a progress bar. |
| **Add-on credits** | Add-on credits used. With limits on, shown as used / limit with a progress bar. |
| **% of limit** / **% of pool** | With limits on: the share of the builder's own limit used. With limits off: the builder's share of both pools combined. |

Progress bars turn orange at 80% of a limit, and a warning icon appears next to builders who have reached it. Builders with a custom limit carry a **Custom limit** tag.

Every Admin and Builder appears in the table, including invited users who haven't accepted yet. Other rows appear only when they consumed credits in the current cycle, and are listed below the builders:

| Row | Meaning |
|:----|:--------|
| **User archived** | A builder who was archived after using credits this cycle. |
| **Not a builder** | A user who used credits while they were a builder and has since become an end user. |
| **Unknown user** | Credits linked to a user who no longer exists in this instance or workspace. |
| **Unattributed** | Credits that couldn't be linked to a specific builder. |

### Search, Filter and Sort

- **Search by name or email** to find a builder.
- Use the **Builder type** filter to show **All builders**, builders on the **Default limit**, builders with a **Custom limit**, or **Unattributed** spend. Each option shows its count.
- Use the **Sort** menu to order builders by **Closest to limit** (available while limits are on), **Most used** or **Name**.
- Click **Clear all filters** to reset the view.

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/usage/filters.png" alt="Builder type filter on the AI credits usage page" />

### Workspace Breakdown

<PlanBadge type="self-hosted" />

On self-hosted deployments, credits are pooled across all workspaces. Two tools show where credits are spent:

- Click the arrow next to a builder to expand a **Workspace wise breakdown** of their monthly and add-on usage in each workspace.
- Pick a workspace from the **Workspace** filter to list only the builders in that workspace. With limits off, the table then shows usage in that workspace only.

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/usage/workspace-breakdown.png" alt="Workspace wise breakdown of a builder's AI credits usage" />

The workspace filter changes the table only. Credit pools and per-builder limits are instance-wide, so a builder's limit covers their usage in every workspace. For that reason, while limits are on, the filtered table keeps each builder's instance-wide totals; expand a row to see the split by workspace.

## Per-Builder Credit Limits

<PlanBadge type="enterprise" />

### Turn Limits On or Off

1. Open **Settings > AI credits usage**.
2. Toggle **Per-builder limit** in the top-right corner.

On a new instance or workspace, per-builder limits are on with an Equal share default.

If some builders have already used more than their limit when limits are turned on, a confirmation shows how many builders will be blocked until the cycle resets. Click **Turn on limits** to continue.

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/usage/turn-on-limits-confirm.png" alt="Confirmation dialog for turning on per-builder limits" />

Turning limits off keeps the defaults and custom limits, so they apply again when limits are turned back on. With limits off, builders can use credits until the pool is empty, and the table shows each builder's share of the pool instead of their limit.

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/usage/usage-limits-off.png" alt="AI credits usage page with per-builder limits turned off" />

### Set the Default Limit

The default applies to every builder without a custom limit. On self-hosted deployments it applies across all workspaces.

1. On the **Default credits** card, click **Edit limits**.
2. For **Monthly credits per builder** and **Add-on credits per builder**, choose one:
   - **Equal share**: the pool left after custom limits, divided equally among builders without a custom limit. The value adjusts automatically as builders are added or removed.
   - **Custom value**: a fixed number of credits per builder. It can't be higher than the Equal share.
3. Check the line at the bottom of each column, which shows how much of the pool stays unallocated with the chosen value.
4. Click **Save changes**.

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/usage/edit-default-credits.png" alt="Edit default credits dialog" />

A custom default that's too high for the current number of builders is reduced to fit, and the **Default credits** card shows the reduction. The saved value applies again once there's room in the pool.

### Set a Custom Limit for a Builder

Give a builder a higher or lower limit than the default, for example a builder working on an AI-heavy project.

1. In the **Usage by builder** table, hover over the builder's row and click **Edit limits**.
2. For **Monthly credits** and **Add-on credits**, choose **Use default** or **Custom limit** and enter the number of credits. Each column shows what the builder has used this cycle and their current limit.
3. Review the preview before saving:
   - Under an Equal share default, other builders' defaults adjust automatically. The dialog shows the change, such as "Monthly default for builders without a custom limit changes from 1,000 to 950."
   - If the change would block other builders, or if this builder has already used more than the new limit, the dialog says so.
4. Click **Save limit**.

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/usage/edit-builder-limit.png" alt="Edit limit dialog for a single builder" />

A custom limit can't exceed what's left of the pool after the other custom limits, while every other builder keeps their default (or at least one credit under Equal share). Larger values show the error "Cannot allocate more than X per builder".

To move a builder back to the default, open **Edit limits** for that builder, click **Reset to default**, then **Save limit**.

When a builder is archived or becomes an end user, their custom limit is removed and their share returns to the pool. On self-hosted deployments, the custom limit is kept while the user is still a builder in another workspace.

### What Builders See

Each builder sees their own credits, not the whole pool, while limits are on:

- The credits shown in the AI chat model picker are the builder's own remaining limit, split into monthly and add-on.
- At 80% of their limit, a warning below the AI chat prompt shows the remaining monthly and add-on balance. The builder can dismiss it.

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/usage/builder-chat-near-limit.png" alt="AI chat warning when a builder has used 80% of their credit limit" />

- At their limit, the AI prompt is disabled with the message "You've reached your AI credit limit for this billing cycle. Ask your admin to raise it."

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/usage/builder-chat-at-limit.png" alt="AI chat prompt disabled for a builder who has reached their credit limit" />

When the pool itself is empty, every builder is blocked whether limits are on or off, with a message that the instance (self-hosted) or workspace (Cloud) is out of AI credits. Super Admins on self-hosted deployments and workspace Admins on Cloud also see a button to get more credits.

### How Limits Are Enforced

ToolJet checks credits before every AI action that consumes ToolJet AI credits, including AI chat in the App Builder, Fix with AI, Copilot and the AI docs assistant:

1. If the pool is empty, the action is refused.
2. If limits are on and the builder is at their limit, the action is refused and an `AI_CREDIT_LIMIT_REACHED` entry is written to the audit logs.
3. If ToolJet can't confirm the credit balance or the builder's usage within a few seconds, the action is refused rather than run without a check. The builder can retry.

An AI action that has already started always finishes. Its cost can take a builder slightly past their limit; the excess shows in the table and the builder's next action is refused.

### Parallel AI Actions

While limits are on, ToolJet also limits how many AI actions one builder can run at the same time, so parallel actions can't overshoot a limit by much:

- A builder can run up to **3** AI actions at once.
- When less than **20%** of their limit is left, a builder can run only one AI action at a time and sees "You're close to your limit. Finish your running AI action first."

On self-hosted deployments, both values can be changed with environment variables:

| Variable | Description | Default |
|:---------|:------------|:--------|
| `AI_CREDIT_MAX_PARALLEL_RUNS` | Maximum AI actions one builder can run at the same time. Whole number, 1 or more. | `3` |
| `AI_CREDIT_PARALLEL_HEADROOM_PERCENT` | Percentage of a builder's limit that must remain to start an additional AI action while one is running. 0 to 100. | `20` |

Invalid values fall back to the defaults.

### Automatic Adjustment After a Plan Change

When the monthly pool shrinks after a plan or seat change, or the add-on pool shrinks because add-on credits expired, ToolJet adjusts limits so that they still fit the pool:

- Defaults are recalculated for the new pool size.
- If custom limits no longer fit, the largest custom limits are reset to the default, one at a time, until the rest fit.

A notice at the top of the AI credits usage page describes what changed, for example "Add-on credits expired on 1 Nov 2026. AI credit limits were adjusted: the default is now 150 (was 300)." Each admin can dismiss the notice. The adjustment is also recorded in the audit logs.

## Audit Logs

Changes to credit limits and refused AI actions are recorded in the [audit logs](/docs/security/audit-logs/audit-logs). To list them, filter by the **AI Credits** resource. The **Actions** filter uses the names in the first column; log entries show the event type.

| Action | Event Type | Recorded when |
|:-------|:-----------|:--------------|
| **Limits enabled** | `AI_CREDIT_LIMIT_ENABLED` | Per-builder limits are turned on. Includes how many builders were already over their limit. |
| **Limits disabled** | `AI_CREDIT_LIMIT_DISABLED` | Per-builder limits are turned off. |
| **Limit updated** | `AI_CREDIT_LIMIT_UPDATED` | The default limits are changed. Includes the values before and after. |
| **Builder limit updated** | `AI_CREDIT_BUILDER_LIMIT_UPDATED` | A builder's custom limit is set, changed or reset. One entry per pool, with the values before and after. |
| **Limits adjusted** | `AI_CREDIT_LIMITS_ADJUSTED` | Limits were adjusted automatically after a plan change or add-on expiry. Includes the old and new pool sizes and every builder whose custom limit was reset. |
| **Limit reached** | `AI_CREDIT_LIMIT_REACHED` | A builder's AI action was refused because they were at their limit. Includes the builder's usage and limit. |

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/usage/audit-logs.png" alt="Audit logs filtered to AI credits events" />

On self-hosted deployments, these entries are instance-level events.

## Limitations

- The page counts ToolJet AI credits only. Usage through BYOK, a self-hosted LLM key or ToolJet's MCP server isn't included and isn't limited by per-builder limits.
- The page covers the current billing cycle. Usage from earlier cycles isn't shown.

## Related

- [Understanding AI Credits](/docs/build-with-ai/ai-credits)
- [Selecting an AI Model](/docs/build-with-ai/model-selection)
- [Audit Logs](/docs/security/audit-logs/audit-logs)

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
