---
id: overview
title: Troubleshooting
sidebar_label: Overview
---

<PlanBadge type="team" />

Two situations interrupt a push or a pull and ask you to act before ToolJet writes anything. Neither is part of the normal day-to-day flow, and both stop safely without changing your workspace.

| Situation | What it means | Where to go |
|:----------|:--------------|:------------|
| A commit or pull stops and opens a conflict dialog | Two resources are competing for the same name or slug, usually after two branches were merged | [Resolving Conflicts](/docs/beta/branching/troubleshooting/resolving-conflicts) |
| A resource has never reached Git | It was built before Git Sync or branching was turned on, so Git has never seen it | [Single-branch mode](/docs/beta/branching/single-branch/sync-resources) or [multi-branch mode](/docs/beta/branching/multi-branch/sync-resources) |

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
