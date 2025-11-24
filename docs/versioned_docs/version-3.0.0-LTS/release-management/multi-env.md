---
id: multi-environment
title: Multi-Environment
---

<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>

ToolJet's **multi-environment** helps in streamlining workflows, thereby minimizing the chances of errors, and enables effective application management. Using multi-environment ensures that your ToolJet application is rigorously tested before it is made available to users.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/multi-env/newmultienv-v2.png" alt="Multi-Environment" />

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Environments

ToolJet provides three default **environments** that serve different purposes in the application development lifecycle:

1. **Development**: The Development environment is where app development and testing take place. It is a dedicated space for spp builders to build and experiment with app changes, configure components, and test app functionality. In this environment, app builders can make frequent updates, iterate on features, and debug issues without impacting the live production environment.

2. **Staging**: The Staging environment serves as a pre-production environment where app changes are tested before they are deployed to the live production environment. It closely resembles the production environment and is used to validate the functionality, performance, and compatibility of the app in a realistic setting. Staging allows stakeholders, including testers and product managers, to review and provide feedback on the app before it is released to the public.

3. **Production**: The Production environment is the live and publicly accessible version of the app that is used by end-users. It represents the stable and finalized version of the application that has passed through the development and staging stages. The Production environment is intended for real-world usage and serves the application to users, providing them with the expected functionality and experience.

:::info
The default environments cannot be removed or renamed.
:::

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Configuring Connections for Environments

To configure connection settings for different environments, follow these steps:

1. Go to the **[Data Source](/docs/data-sources/overview)** page.
2. Click on each category of data sources to view the list of available data sources. As you hover over the desired data source, an **Add** button will appear.
3. On clicking the **Add** button, a connection modal will appear. In the connection modal, you'll find three tabs: **Production**, **Staging**, and **Development**.
4. Switch to each tab and enter the appropriate credentials for connecting to the respective database. Remember to **save** after entering credentials on each tab.

<div style={{textAlign: 'center'}}>

<img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/multi-env/multienvtabs-v2.png" alt="Multi-Environment" />

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Using Environments

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/multi-env/flow.png" alt="Multi-Environment" />

</div>

1. When you create a new app in ToolJet, the initial version is loaded in the **Development** environment. It is only possible to create new versions from the Development environment, not from the Staging or Production environments.

 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/v2-beta/multi-env/newapp-v2.png" alt="Multi-Environment" />

 </div>

2. Once the development of a particular app version is complete, it can be promoted to the **Staging** environment. To promote the app from development to staging, click the **Promote>>** button located at the top-right of the app builder.
 - When you click the Promote button, a confirmation modal will appear. Click **Promote>>** to move the app version to the Staging environment.

 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/v2-beta/multi-env/promotestaging.png" alt="Multi-Environment" />

 </div>

 - Please note that once versions are promoted from Development, they cannot be edited. To make changes to the promoted versions, you need to switch back to the Development environment and create a new version.
 
 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/v2-beta/multi-env/noeditstag.png" alt="Multi-Environment" />

 </div>

3. In the Staging environment, the selected app version can undergo testing and reviews.
 - If **changes are required** for the version in staging, switch to the **Development** environment using the dropdown on the top bar. Since the version has already been promoted to Staging, you cannot directly edit it. Instead, create a new version from the selected version and make the desired changes to the newly created version.

 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/v2-beta/multi-env/changes.gif" alt="Multi-Environment" />

 </div>

 - After making changes in the new version, the app builder will automatically save the changes and enable the **Promote** button. You can then promote the new version to the Staging environment for further testing and reviews.
 :::info
 Please note that Development, Staging, and Production environments can contain any number of versions.
 :::

4. Once the version in the Staging environment has been thoroughly tested and reviewed and **no further changes are required**, it can be promoted to the **Production** environment. Simply click the **Promote>>** button located at the top-right to move the app from the Staging environment to the Production environment.
 
 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/v2-beta/multi-env/promprod.png" alt="Multi-Environment" />

 </div>

5. In the **Production** environment, you can release the app by clicking the Release button on the top-right corner of the app builder. Once the app is released, you can share it with end users using the URL provided by the **Share** button on the top bar.

 <div style={{textAlign: 'center'}}>

 <img className="screenshot-full" src="/img/v2-beta/multi-env/releaseprod.gif" alt="Multi-Environment" />

 </div>

 :::info
 Please note that only one version of the app can be released at a time.
 :::

ToolJet's app builder remembers your last editing state. When you reopen an app, it resumes from where you left off, ensuring a seamless experience. For instance, if you edited an app in the staging environment, it will open in the staging environment when you return.


</div>