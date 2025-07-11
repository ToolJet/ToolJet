---
title: "Overview"
id: overview
---

Modules in ToolJet are reusable units of functionality—composed of components, queries, actions, and logic—that you can plug into multiple apps within the same workspace. Think of a module as a mini-app that encapsulates functionality and design, ready to be reused anywhere.

They help reduce duplication of UI and logic, maintain design and behavior consistency, and speed up development—especially when working with repeatable patterns like forms, dashboards, or table-driven views.

Let’s say your organization has multiple internal apps—one for sales teams, one for customer support, and another for analytics. 

Each of these apps needs to display a customer summary panel. Traditionally, you would have to recreate this panel from scratch in each app. That means duplicating UI components, queries, and logic—making it harder to maintain and prone to inconsistencies when updates are needed.

With ToolJet Modules, you can build it once as a module and reuse it across sales, support, and analytics dashboards.

## When to Use Modules

Use modules when:

- You want to reuse a feature like a user registration form or an analytics widget across multiple apps.
- You’re building template components for your team to standardize.
- You need to abstract complex logic behind a simple interface for other users.

Unlike copying/pasting UI blocks or duplicating pages, modules provide centralized, configurable, and reusable blocks that can adapt to context via inputs and outputs.

<img className="screenshot-full img-full" src="/img/app-builder/modules/module-builder.png" alt="Module Builder" />

To get started with modules, check out the [Create Module](/docs/beta/app-builder/modules/create-module) guide. Once your module is built, you can [use it inside any app](/docs/beta/app-builder/modules/use-module) in your workspace.