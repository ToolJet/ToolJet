---
id: multi-environment
title: Multi-Environment
---

<div className='badge badge--primary heading-badge'>Available on: Enterprise Edition</div>

ToolJet's **multi-environment** helps in streamlining workflows, thereby minimizing the chances of errors, and enables effective application management. Using multi-environment ensures that your ToolJet application is rigorously tested before it is made available to users.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/multi-env/multienv.png" alt="Multi-Environment" />

</div>

### Environments

ToolJet provides three default **environments**:
- **Production**
- **Development**
- **Staging**

:::info
The default environments cannot be removed or renamed.
:::

### Configuring connections for environments

To configure connection settings for different environments, follow these steps:

1. Go to the **[Global Datasource](/docs/data-sources/overview)** page.
2. Click on the **Add new datasource** button.
3. Choose a datasource. In the connection modal, you'll find three tabs: **Production**, **Staging**, and **Development**.
4. Switch to each tab and enter the appropriate credentials for connecting to the respective database. Remember to save after entering credentials on each tab.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/multi-env/envconnect.gif" alt="Multi-Environment" />

</div>

### Switching environments

To switch between environments, follow these steps:

1. Click on the **Environment Manager** located on the top bar of the app builder.
2. The dropdown menu will open, allowing you to select an environment.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/multi-env/switch.png" alt="Multi-Environment" />

</div>

ToolJet automatically saves your most recently selected environment in the app builder. The next time you open an app, it will use the same environment. For example, if you switch to the staging environment in an app, the next time you open it will automatically use the same staging environment.

:::info
The default environment for released apps is **Production**.
:::

