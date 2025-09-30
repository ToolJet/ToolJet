---
id: wf
title: Workflow Node
---

<br/>

The Workflow node allows you to trigger another workflow from within your current workflow. This makes it possible to break complex processes into smaller, reusable workflows, improving modularity and maintainability.

With the Workflow node, you can:
- Trigger child workflows based on conditions or events
- Pass data from the current workflow to the triggered workflow
- Reuse common automation logic across multiple workflows
- Build hierarchical workflows for complex business processes

The Workflow node is ideal for enterprise automation where processes need to be standardized, reusable, and easy to manage. For example, you could trigger an invoice processing workflow from an order management workflow, or call a notification workflow after a task is completed.
You can also send parameters to the other workflow, allowing dynamic control over the triggered workflow’s execution.

A workflow can call itself recursively. It’s recommended to define an exit condition to avoid creating an infinite loop.

The timeout for each workflow can be configured using the WORKFLOW_TIMEOUT_SECONDS environment variable. For more information checkout [Customizing Workflow Configuration](/docs/setup/env-vars#customizing-workflow-configuration).

<img className="screenshot-full img-full" src="/img/workflows/nodes/wf/example.png" alt="IF Else Node Example" />
