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
2. Click the **Packages** icon in the left sidebar to open the package manager panel, then switch to the **Python** tab.
3. Enter the packages you need in `requirements.txt` format — one package per line with a version specifier.

```
pydash==8.0.3
requests==2.31.0
numpy>=1.24.0
```

4. Click **Install**. ToolJet installs the packages and generates a bundle in the background.

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

Once the bundle status is **Ready**, you can `import` the packages directly in any Python node:

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

## Updating or Removing Packages

1. Open the package manager panel and switch to the **Python** tab.
2. Edit the requirements list — update versions or remove lines as needed.
3. Click **Install**. The bundle regenerates automatically with the updated dependency list.
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

### Self-Hosted Deployments

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
