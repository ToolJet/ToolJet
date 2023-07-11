---
id: multi-environment
title: Multi-Environment
---

<div className='badge badge--primary heading-badge'>Available on: Enterprise Edition</div>

ToolJet's **multi-environment** helps in streamlining workflows, thereby minimizing the chances of errors, and enables effective application management. Using multi-environment ensures that your ToolJet application is rigorously tested before it is made available to users.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/multi-env/multienv.png" alt="Multi-Environment" />

</div>

## Using Multi-environments

ToolJet comes with three default **environments**:
- **Production**
- **Development**
- **Staging**

### Switching environments

For switching the environment, click on the **Environment Manager** on the navbar of app-builder to open the dropdown and select a environment.

The **datasource credentials** are required to be entered specifically for every environment.

:::tip Best Practice
Make your default environment the **Production** environment - the environment in which the users use the final versions of your developed applications. This will help ensure that the production environment has access to all of the data sources.
:::

