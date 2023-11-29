---
id: overview
title: Overview
---

# Global Datasources : Overview

Global datasources pull in and push data to any source including databases, external APIs, or services. Once a global datasource is connected to a workspace, the connection can be shared with any app of that workspace.

:::caution
Global datasources are available only on **ToolJet version 2.3.0 and above**.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/datasource-reference/overview/overview.png" alt="Datasources: Overview" width="600"/>

</div>

## Connecting global datasources

1. From the ToolJet dashboard, go to the **global datasources page** from the left sidebar.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/global.png" alt="Datasources: Overview" />

  </div>

2. Click on the **Add new datasource** button, a modal will pop-up with all the available global datasources.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/popup.png" alt="Datasources: Overview" />

  </div>

3. Select the datasource, enter the **Credentials** and **Save** the datasource.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/connection.png" alt="Datasources: Overview" />

  </div>

4. Now, go back to the dashboard, create a new app, and the datasource will be available on the query panel under **Global Datasources**. Added datasources will be available on any of the **existing** or the **new applications**.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/globalquery.png" alt="Datasources: Overview" />

  </div>

5. You can now create queries of the connected global datasource. From the queries, you'll be able to switch to **different connections** of the same datasource if there are more than one connections created.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/switch.png" alt="Datasources: Overview" />

  </div>

## Changing scope of datasources of an app created on older versions of ToolJet

On ToolJet versions below 2.3.0, the datasource connection was made from within the individual apps. To make it backward compatible, we added an option to change the scope of the datasources and make it global datasource.

1. If you open an app created on previous versions of ToolJet, you'll find the datasource manager on the left sidebar of the App Builder.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/leftsidebar.png" alt="Datasources: Overview" />

  </div>

2. Click on the kebab menu next to the connected datasource, select the **change scope** option.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/changescope.png" alt="Datasources: Overview" />

  </div>

3. Once you change the scope of the datasource and make it global, you'll see that the **datasource manager** is removed from the left sidebar and now you'll find the datasource on the **query panel** under Global Datasources. You can now configure the datasource from the Global Datasource page on the **dashboard**.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/queryadd.png" alt="Datasources: Overview" />

  </div>


## Default datasources

By default, 4 datasources will be available on every app on ToolJet:
- **[ToolJet Database](/docs/tooljet-database/)**
- **[RestAPI](/docs/data-sources/restapi/)**
- **[Run JavaScript Query](/docs/data-sources/run-js/)**
- **[Run Python Query](/docs/data-sources/run-py/)**

  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/default.png" alt="Datasources: Overview" />

  </div>

## Permissions

Only **Admins** and **[Super Admins](/docs/Enterprise/superadmin)** of the workspace can change the **[Permissions](/docs/tutorial/manage-users-groups#group-properties)** for Global Datasource. 

From **Workspace Settings** -> **Groups Settings**, Admins and Super Admins can set the permission for a user group to:

- **Create** and **Delete** datasources onto that workspace. If only **Create** permission is set then the users of the group will only be able to add new datasources on the workspace, and if only **Delete** permission is set then the users of the group will only be able to delete the connected datasources on the workspace.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/create.png" alt="Datasources: Overview" />

  </div>

  - If any of the permission(Create or Delete) is not enabled for a user group then the users of the group will get an error toast when they try to Add or Delete the global datasource.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/datasource-reference/overview/error.png" alt="Datasources: Overview" />

    </div>

- **View** or **Edit** allowed global datasources from the **Datasources** tab. If only **View** permission is set then the users of the group will only be able to connect to the allowed datasource, and if only **Edit** permission is set then the users of the group will be able to update the credentials of the allowed datasources.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/datasource-reference/overview/view.png" alt="Datasources: Overview" />

  </div>

  - If any of the permission(View or Edit) is not enabled for a user group then the users of the group will get an error toast when they try to Add or Delete the global datasource.
    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/datasource-reference/overview/edit.png" alt="Datasources: Overview" />

    </div>


