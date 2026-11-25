---
id: app
title: Trigger from ToolJet Application
---

An application runs a workflow through a **Run Workflow** query. The query behaves like any other query in the application: it can run from the **Run** button in the query panel or from an event handler, such as a button's **On click** event, and its result is available to components.

This makes it possible to keep shared logic, such as approval steps or calls to several datasources, in one workflow and run it from any application that needs it.

## Step 1: Create the Query

1. In the application's query panel, click **+** and select **Run Workflow**.
2. In **Workflow**, select the workflow to run.
3. In **Version**, select the version to run.

The **Inputs** section lists the inputs of the selected version, so select a version to set input values. If no version is selected, the query runs the released version and the **Inputs** section isn't shown. The selected version must be available in the application's current environment.

## Step 2: Pass Values to the Workflow

When the selected version declares workflow inputs, they're listed under **Inputs**, each with its type. Inputs marked **required** must have a value. Inputs left empty use their default value, which is shown as the placeholder.

Values accept expressions, so they can come from components, other queries or variables. For example, to send the values of two components:

| Input | Value |
| ----- | ----- |
| `name` | `{{components.textinput1.value}}` |
| `emp_id` | `{{components.numberinput1.value}}` |

<img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/triggers/app/app-query.png" alt="Run Workflow query with the workflow, version and input values set" />

:::note
The **Params** list is marked **Legacy**. It passes key-value pairs to workflows that don't use workflow inputs. A key that matches a workflow input must be set under **Inputs** instead.
:::

## Step 3: Choose How the Query Waits

The **Run workflows synchronously** toggle controls how the query waits for the workflow. It's on by default.

- **On**: The query sends one request and waits on it until the workflow finishes. This suits workflows that finish in a few seconds.
- **Off**: The workflow is queued and runs in the background. The query keeps listening for updates and completes when the workflow finishes. This avoids request timeouts for workflows that take longer.

In both modes, the query completes only when the workflow finishes, and the result has the same shape.

## Step 4: Run the Query and Use the Result

Click **Run** to test the query, or add it to an event handler. For example, to run the workflow when a button is clicked:

1. Select the button and add an **On click** event handler.
2. Set **Action** to **Run query** and select the **Run Workflow** query in **Query**.

<img className="screenshot-full img-full" style={{ marginTop: '15px' }} src="/img/workflows/triggers/app/app-event.png" alt="On click event handler that runs the Run Workflow query" />

When the workflow finishes, `queries.<query_name>.data` holds the data returned by its [Response node](/docs/workflows/nodes/response). For example, if the Response node returns `{ "message": "Employee added" }`, a Text component can show the message with:

```js
{{queries.runWorkflow1.data.message}}
```

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
