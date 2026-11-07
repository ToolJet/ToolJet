---
id: py
title: Python
---

<br/>

ToolJet workflows let you install **Python packages** from [PyPI](https://pypi.org/) so that every Python node in the workflow can use them. Packages are installed once per workflow version and available across all Python nodes.

:::info
External library support for workflows is available on **Enterprise Edition** plans.
:::

## Adding Packages

1. Open your workflow in the editor.
2. In the left sidebar, click the libraries icon to open the **Libraries** panel.
3. In the **Python** section, click **Add python library**.
4. In the **Modify requirements.txt** dialog, enter the packages you need in `requirements.txt` format — one package per line with a version specifier.

```
pydash==8.0.3
requests==2.31.0
numpy>=1.24.0
```

5. Click **Modify requirements.txt**. ToolJet installs the packages and generates a bundle in the background. While it builds, the **Python** section shows a loading indicator.

<img className="screenshot-full img-full" src="/img/workflows/external-libraries/modify-requirements.png" alt="Modify requirements.txt dialog listing pydash, requests and numpy with version specifiers" />

:::warning
PyPI does not expose a public search API. You need to know the exact package name and version you want to install. You can look up packages at [pypi.org](https://pypi.org/).
:::
<!-- 
## Bundle Status

After installing or updating packages, ToolJet generates a bundle in the background. The package manager panel displays the current status:

| Status | Meaning |
|--------|---------|
| **None** | No packages have been added yet. |
| **Building** | The bundle is being generated. Python nodes will use the previous bundle (if any) until the new one is ready. |
| **Ready** | The bundle is built and available for all Python nodes in this workflow version. |
| **Failed** | Bundle generation encountered an error. Check the error message in the panel and try rebuilding. |

You can manually trigger a rebuild by clicking the **Rebuild** button in the package manager panel. -->

## Using Packages in Python Nodes

Once the packages are installed, you can `import` them directly in any Python node:

```python
import pydash

orders = getOrders["data"]
grouped = pydash.group_by(orders, "status")

result = {
    "pending": grouped.get("pending", []),
    "shipped": grouped.get("shipped", [])
}
```

Packages are available to all Python nodes in the workflow — you don't need to install them separately per node.

## Setup Script

A setup script is Python code that runs at the start of every Python node, for example to import packages or define helper functions that several nodes share.

To add or edit a setup script:

1. In the left sidebar, click the **Settings** (gear) icon.
2. Under **Language**, click **Python configuration**.
3. In the **Setup script** dialog, enter your code and click **Save setup script**.

<img className="screenshot-full img-full" src="/img/workflows/external-libraries/setup-script-py.png" alt="Setup script dialog for Python with a script that imports pydash and defines a to_cents helper" />

After you add or remove a package, a banner appears with a **Setup script** button that opens the same dialog, so you can update the script for the changed packages.

### How the Python Setup Script Runs

- Every time a Python node runs, the setup script is added before the node's own code, so imports and functions defined in the script are available in every Python node.
- A setup script that contains only whitespace is ignored.
- Because the script runs with each Python node, keep it to imports, constants and function definitions.

For example, this setup script imports a package and defines a helper function:

```python
import pydash

def to_cents(amount):
    return int(round(float(amount) * 100))
```

A Python node can then use both without importing them again:

```python
orders = getOrders["data"]
result = pydash.map_(orders, lambda order: to_cents(order["total"]))
```

## Updating or Removing Packages

1. Open the **Libraries** panel.
2. Next to **Python**, click the JSON icon (**Modify requirements.txt**), or click **Add python library**.
3. Edit the requirements list — update versions or remove lines as needed.
4. Click **Modify requirements.txt**. The bundle is rebuilt with the updated dependency list.

To remove a single package, you can also open the menu next to it and click **Delete library**.
<!-- 
## Sandbox and Security

Python nodes execute inside a secure sandbox powered by [NsJail](https://github.com/google/nsjail). The sandbox enforces the following restrictions at runtime:

| Restriction | Limit |
|-------------|-------|
| Execution timeout | 10 seconds |
| CPU time | 5 seconds |
| Memory (address space) | 512 MB |
| Network access | None — fully isolated |
| File creation size | 1 MB |
| Sub-processes | 5 |

The sandbox prevents user code from accessing environment variables, the host filesystem, or the network. Use datasource nodes to fetch external data before passing it to a Python node. -->

## Self-Hosted Deployments

Python nodes run inside an [NsJail](https://github.com/google/nsjail) sandbox when it's available. ToolJet decides how Python nodes run once, when the server starts:

1. If `TOOLJET_WORKFLOW_SANDBOX_BYPASS` is set to `true`, the sandbox is bypassed.
2. Otherwise, if the `nsjail` binary is on the server's `PATH`, Python nodes run inside the sandbox. The ToolJet Enterprise Docker image includes NsJail.
3. Otherwise, the sandbox is bypassed automatically.

:::warning
If NsJail isn't installed, Python nodes run **without isolation** even though you didn't set `TOOLJET_WORKFLOW_SANDBOX_BYPASS`. The code runs as a regular `python3` process with full access to the container, including the server's environment variables, the filesystem and the network. Only the 10-second execution timeout applies.
:::

To check which mode is active, look for one of these warnings in the server logs at startup:

- `Sandbox Mode: BYPASSED (nsjail not found)`
- `Sandbox Mode: BYPASSED (TOOLJET_WORKFLOW_SANDBOX_BYPASS=true)`

When the sandbox is active, the log shows `Sandbox Mode: ENABLED (nsjail available)`.

If NsJail is installed but can't run, ToolJet doesn't fall back to running without isolation. Python nodes fail with `Please make sure that you have properly setup support for Python node.` and a link to this section.

NsJail requires **privileged container** support (specifically the `SYS_ADMIN` Linux capability) to create the namespaces it uses for isolation. Most standard Docker and Kubernetes deployments support this out of the box.

However, some managed cloud platforms do not allow privileged containers:

- **AWS ECS Fargate** — does not support privileged mode
- **Google Cloud Run** — does not support privileged containers
- **Platforms with restrictive pod security policies** — may block the required capabilities

If your deployment environment does not support NsJail, you have two options:

**Option A: Bypass the sandbox**

Set the following environment variable on your ToolJet server:

```
TOOLJET_WORKFLOW_SANDBOX_BYPASS=true
```

This disables NsJail and executes Python code directly on the host. Use this only when you trust all users who can create workflows, as their code will run without isolation.

:::danger
Running without the sandbox removes all execution restrictions. User code can access environment variables, the filesystem, and the network. Only enable this in environments where all workflow authors are trusted.
:::

**Option B: Deploy a worker with privileged access**

Deploy ToolJet in **worker mode** on a platform that supports privileged containers (e.g., a standard Docker host or a Kubernetes cluster with appropriate security contexts), and route Python workflow execution to that worker. This lets you keep the main ToolJet deployment on a managed platform while still benefiting from sandboxed execution.
<!-- 
## Limitations

- **Enterprise only** — package management is not available in the Community Edition.
- **PyPI packages only** — packages must be published to the [Python Package Index](https://pypi.org/).
- **Bundle per workflow version** — each workflow version maintains its own independent set of dependencies.
- **Prebuilt wheels only** — packages that require C/C++ compilation during installation may not be supported. Pure Python packages and packages with prebuilt manylinux/musllinux wheels work.
- **No network at runtime** — installed packages that make network calls at import time or runtime will fail inside the sandbox. -->

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
