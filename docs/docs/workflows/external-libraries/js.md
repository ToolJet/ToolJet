---
id: js
title: JavaScript
---

<br/>

ToolJet workflows let you import **npm packages** into your workflow so that every JavaScript node can use them. Once a package is added, it is bundled and available across all JavaScript nodes in that workflow version.

:::info
External library support for workflows is available on **Enterprise Edition** plans.
:::

## Adding Packages

1. Open your workflow in the editor.
2. Click the **Packages** icon in the left sidebar to open the package manager panel.
3. Type a package name (e.g., `lodash`) in the search field — results are fetched from the npm registry.
4. Select the package and version you want to install, then click **Add**.
5. The package is added to the workflow's dependency list and a bundle build starts automatically.

You can add multiple packages before the bundle finishes building. The bundle regenerates with all current dependencies.

## Using Packages in JavaScript Nodes

Once the bundle status is **Ready**, you can `import` the packages directly in any JavaScript node:

```js
import lodash from 'lodash';
import { v4 as uuidv4 } from 'uuid';

const grouped = lodash.groupBy(getOrders.data, 'status');

return {
    requestId: uuidv4(),
    summary: grouped
};
```

Packages are available to all JavaScript nodes in the workflow — you don't need to import them separately per node.

## Setup Script

A setup script is JavaScript code that runs before your nodes, for example to configure a package or define helper functions that several nodes share.

To add or edit a setup script:

1. In the left sidebar, click the **Settings** (gear) icon.
2. Under **Language**, click **Javascript configuration**.
3. In the **Setup script** dialog, enter your code and click **Save setup script**.

<img className="screenshot-full img-full" src="/img/workflows/external-libraries/setup-script-js.png" alt="Setup script dialog for JavaScript with a script that defines a formatCurrency helper and returns a settings object" />

After you add or remove a package, a banner appears with a **Setup script** button that opens the same dialog, so you can update the script for the changed packages.

### How the JavaScript Setup Script Runs

- It runs once at the start of each workflow run, after the packages load. It also runs when you preview a node.
- It runs in the same JavaScript context as your JavaScript nodes and the `{{ }}` expressions in data source queries. Variables and functions you declare at the top level of the script are available to them during that run.
- The value of the script's last expression is available to every node as `setupResult`.
- The script isn't wrapped in a function, so don't use `return` at the top level.
- The script doesn't have access to the workflow's parameters or to other nodes' results.
- If the script fails, the workflow still runs, but `setupResult` isn't set.

<!-- TODO verify: whether setup script log messages and failures appear in the workflow execution logs; the server logs them through a separate log buffer. -->

For example, this setup script defines a helper function and returns a settings object:

```js
const formatCurrency = (amount) => `$${Number(amount).toFixed(2)}`;

({ region: 'us-east', currency: 'USD' });
```

A JavaScript node can then use both:

```js
return {
  total: formatCurrency(getOrders.data[0].total),
  region: setupResult.region,
};
```

## Removing Packages

1. Open the package manager panel.
2. Click the **Remove** icon next to the package you want to remove.
3. The bundle regenerates automatically without the removed package.

<!-- 
## Limitations

- **Enterprise only** — package management is not available in the Community Edition.
- **npm packages only** — packages must be published to the npm registry.
- **Bundle per workflow version** — each workflow version maintains its own independent set of dependencies.
- **No native add-ons** — packages that require native C/C++ compilation during install are not supported. Pure JavaScript and pre-compiled packages work. -->

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
