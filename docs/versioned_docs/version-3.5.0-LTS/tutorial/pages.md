---
id: pages
title: Pages
---

Pages allow you to have multiple pages in a single application, making your ToolJet applications easier to navigate and more user-friendly.

<img className="screenshot-full" src="/img/v2-beta/pages/v3/pages-v3.png" alt="Multi-page app" />

<div style={{paddingTop:'24px'}}>

## Pages Panel

You can open the **Pages Panel** by clicking on the **Pages** icon on the left sidebar of the app-builder.

<img className="screenshot-full" src="/img/v2-beta/pages/v3/pages-panel-v4.png" alt="Pages Panel"/>

</div>

<div style={{paddingTop:'24px'}}>

## Panel Options

### Add Page

- On the header of the Pages Panel, you'll find a **+** button to add more pages to your application.
- Click the **+** button to add a new page.
- Enter the name for the new page and press enter.

<img className="screenshot-full" src="/img/v2-beta/pages/v3/page-add.png" alt="Pages Panel" style={{marginBottom:'15px'}}/>

### Settings

- You can use the settings option to customize the page navigation sidebar for your app.
- Click on the settings button and a new panel will open on the right.

#### Properties Tab
- **Collapsable**: This option allows you to make the page navigation sidebar collapsible.
- **Style**: Choose whether you want to display Text only, Text + icon, or Icon only on the page navigation sidebar.
- **Hide page menu in viewer mode**: This option lets you hide the page navigation sidebar in viewer mode.

<img className="screenshot-full" src="/img/v2-beta/pages/v3/page-settings.png" alt="Pages Panel" style={{marginBottom:'15px'}} />

#### Style Tab
- You can use the style tab to customize the page navigation sidebar.

<img className="screenshot-full" src="/img/v2-beta/pages/v3/page-style.png" alt="Pages Panel" style={{marginBottom:'15px'}} />

### Pin

- By default, the panel will close when you click outside the panel. You can pin the **Pages panel** from the **Pin** button and the panel won't close until you **unpin** it.

<img className="screenshot-full" src="/img/v2-beta/pages/v3/page-pin.png" alt="Pages Panel"/>

</div>

<div style={{paddingTop:'24px'}}>

## Page Options

There are several options available for a Page. To use these options, click on the kebab menu on the right of the page card.

<img className="screenshot-full" src="/img/v2-beta/pages/v3/page-option.png" alt="Pages Panel" style={{marginBottom:'15px'}} />

### Page Handle

Page Handle is the slug that is added at the end of the application URL. By default, the page handle is the name of the page in lowercase and with spaces replaced by hyphens. You can change the page handle by clicking on the **Edit** symbol next to the page handle.

### Rename

Rename option will allow you to rename the page. Renaming a page will not change the slug/page handle.

### Mark Home

Mark home option can be used to make a page the default landing page of the application. When you open the application, the page marked as home will be the first page that you see.

### Hide Page on app menu

Hide Page option can be used to hide a page from the **page navigation sidebar** in viewer mode. You can go to the options again and **unhide** the app from the **page navigation sidebar**. Page marked as **home** cannot be hidden.<br/>
**Note:** After hiding a page, although the page may not appear in the pages navigation sidebar, it can still be accessed by utilizing either the **switch page Action** or the **page URL**.

<img className="screenshot-full" src="/img/v2-beta/pages/v3/page-hidden.png" alt="Pages Panel" style={{marginBottom:'15px'}} />

### Duplicate

The duplicate page option allows you to create and add a copy of the page in the pages list. The duplicated page will be an exact replica of the original page.

### Event Handlers

Like other ToolJet components, pages can also be attached to event handlers. For pages, the **On page load** event is available. You can use all the available actions for this event, along with the new actions added specifically for Pages.

- **[Switch Page](/docs/actions/switch-page)**
- **[Set Page Variable](/docs/actions/set-page-variable)**
- **[Unset Page Variable](/docs/actions/unset-page-variable)**

### Disable Page

Disable Page Option can be used to disable a page. A disabled page won't be accessible in the viewer mode. <br/>
**Note:** Page marked as **home** can't be disabled.

### Delete Page

You can **delete** a page from an application using this option. <br/>
**Note:** Page marked as **home** cannot be deleted.

</div>

<div style={{paddingTop:'24px'}}>

## Exposed variables

| Variable    | Description |
| ----------- | ----------- | 
| handle | The handle represents the slug of the page within an app. In the URL `https://app.tooljet.com/applications/crm2/home`, **crm2** refers to the app name, and **home** corresponds to the handle. The handle is automatically set when a page is added, and you can also [rename](#rename) the handle from the Page options. To access the value of the handle variable dynamically, use `{{page.handle}}`|
| name | The name indicates the name of the page set during its creation. To access the value of the name variable dynamically, use `{{page.name}}` |
| id | Each page in the ToolJet app receives a unique identifier upon creation. To access the value of the id dynamically, use `{{page.id}}` |
| variables | Variables is an object that contains all the variables created for a specific page using the [Set Page Variable](/docs/actions/set-page-variable) action. The value of a specific variable can be accessed dynamically using `{{page.variables.<pageVariableName>}}`, where `<pageVariableName>` refers to the variable created for that page using the Set Page variable action. |

</div>
