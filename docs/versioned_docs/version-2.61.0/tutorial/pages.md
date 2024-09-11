---
id: pages
title: Pages
---

Pages allow you to have multiple pages in a single application, making your ToolJet applications easier to navigate and more user-friendly.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/pages-v2.gif" alt="Multi-page app" />

</div>

## Pages Panel

You can open the **Pages Panel** by clicking on the **Pages** icon on the left sidebar of the app-builder.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/pages-panel-v3.png" alt="Pages Panel"/>

</div>

## Panel Options

### Add Page

- On the header of the Pages Panel, you'll find a **+** button to add more pages to your application.
- Click the **+** button to add a new page.
- Enter the name for the new page and press enter.

### Search

- You can search for a specific page using the **Search bar** on the top of the Pages Panel.

### Pin

- By default, the panel will close when you click outside the panel. You can pin the **Pages panel** from the **Pin** button and the panel won't close until you **unpin** it.

### Settings

- You can hide the **page navigation sidebar** in viewer mode by enabling the **Hide Page Navigation** option within **Settings**. With this toggle enabled, the page navigation sidebar will not be visible in the viewer mode.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/disable-menu.gif" alt="Page Settings" />

</div>


## Page Options

There are several options available for a Page. To use these options, click on the kebab menu on the right of the page card.

<div style={{textAlign: 'left'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/options-v2.png" alt="Pages Panel" width="300" />

</div>

### Page Handle

Page Handle is the slug that is added at the end of the application URL. By default, the page handle is the name of the page in lowercase and with spaces replaced by hyphens. You can change the page handle by clicking on the **Edit** symbol next to the page handle.

### Rename

Rename option will allow you to rename the page. Renaming a page will not change the slug/page handle.

### Mark Home

Mark home option can be used to make a page the default landing page of the application. When you open the application, the page marked as home will be the first page that you see.


:::info
The page which is marked home will have a **Home** icon on the left of the Page Card.
<div style={{textAlign: 'left'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/home-icon-v2.png" alt="Pages Panel" width="300" />

</div>
:::

### Hide Page on app menu

Hide Page option can be used to hide a page from the **page navigation sidebar** in viewer mode. You can go to the options again and **unhide** the app from the **page navigation sidebar**. Page marked as **home** cannot be hidden.<br/>
After hiding a page, although the page may not appear in the pages navigation sidebar, it can still be accessed by utilizing either the **switch page Action** or the **page URL**.

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/v2-beta/pages/accesshidden-v2.gif" alt="Pages Panel" />
</div>


### Duplicate

The duplicate page option allows you to create and add a copy of the page in the pages list. The duplicated page will be an exact replica of the original page.

### Event Handlers

Like other ToolJet components, pages can also be attached to event handlers. For pages, the **On page load** event is available. You can use all the available actions for this event, along with the new actions added specifically for Pages.

- **[Switch Page](/docs/actions/switch-page)**
- **[Set Page Variable](/docs/actions/set-page-variable)**
- **[Unset Page Variable](/docs/actions/unset-page-variable)**

### Disable Page

Disable Page Option can be used to disable a page. A disabled page won't be accessible in the viewer mode. 

**Note:** Page marked as **home** can't be disabled.

### Delete Page

You can **delete** a page from an application using this option.

**Note:** Page marked as **home** cannot be deleted and the delete page option will be disabled.

## Exposed variables

| Variable    | Description |
| ----------- | ----------- | 
| `handle` | The `handle` represents the slug of the `page` within an app. In the URL `https://app.tooljet.com/applications/crm2/home`, `crm2` refers to the app name, and `home` corresponds to the handle. The handle is automatically set when a page is added, and you can also [rename](/docs/tutorial/pages#rename) the `handle` from the Page options. To access the value of the `handle` variable dynamically, use `{{page.handle}}`|
| `name` | The `name` indicates the name of the page set during its creation. To access the value of the `name` variable dynamically, use `{{page.name}}` |
| `id` | Each page in the ToolJet app receives a unique identifier upon creation. To access the value of the `id` dynamically, use `{{page.id}}` |
| `variables` | `variables` is an object that contains all the variables created for a specific page using the **[Set Page Variable](/docs/actions/set-page-variable)** action. The value of a specific variable can be accessed dynamically using `{{page.variables.<pageVariableName>}}`, where `<pageVariableName>` refers to the variable created for that page using the Set Page variable action. |