---
id: pages
title: Pages
---

Pages allows you to have multiple pages in a single application, making your ToolJet applications more robust and user-friendly.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/pages.gif" alt="Multi-page app" />

</div>

## Pages Panel

You can open the **Pages Panel** by clicking on the **Pages** icon on the left sidebar of the app-builder.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/pages-panel2.png" alt="Pages Panel"/>

</div>

## Panel Options

- **[Add Page](#add-page)**
- **[Settings](#settings)**
- **[Pin](#pin)**
- **[Search](#search)**

### Add Page

On the header of the Pages Manager, the **+** button that allows you to add more pages to your application

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/add2.png" alt="Pages Panel" width="400" />

</div>

On clicking the **+** button, a new page will be added, enter the name for the page and press enter.
<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/newpage2.png" alt="Pages Panel" width="400" />

</div>

### Settings

From **Settings**, you can hide the **page navigation sidebar** in viewer mode, by enabling the **Disable Menu** option.
<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/settings.png" alt="Pages Panel" width="400" />

</div>

### Pin

You can pin the pages panel from the **Pin** button and the panel won't close until you **unpin** it.
<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/pin2.png" alt="Pages Panel" width="400" />

</div>

### Search

If there are many pages on the panel then you can use the **Search bar** to look for specific page.
<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/search2.png" alt="Pages Panel" width="400" />

</div>

## Page options

There are several options available for a Page. To use these options, click on the kebab menu on the right of the page card.

- **[Page Handle](#page-handle)**
- **[Rename](#rename)**
- **[Mark Home](#mark-home)**
- **[Hide Page on app menu](#hide-page-on-app-menu)**
- **[Duplicate](#duplicate)**
- **[Event Handlers](#event-handlers)**
- **[Disable Page](#disable-page)**
- **[Delete Page](#delete-page)**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/options.png" alt="Pages Panel" width="300" />

</div>

### Page Handle

Page Handle is the slug that is added at the end of the application URL. Page Handle get its default value when the page name is entered on the creation of the page. You can change the Page Handle from this option.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/page-handle.png" alt="Pages Panel" width="300" />

</div>

### Rename

Rename option will allow you to rename the page.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/rename.png" alt="Pages Panel" width="300" />

</div>

### Mark Home

Mark home option can be used to make a page the default landing page of the application, so whenever the app will be loaded the page that is marked home will be loaded.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/mark-home.png" alt="Pages Panel" width="300" />

</div>

:::info
The page which is marked home will have a **Home** icon on the left of the Page Card.
<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/home-icon.png" alt="Pages Panel" width="300" />

</div>
:::

### Hide Page on app menu

Hide Page option can be used to hide a page from the **page navigation sidebar** in viewer mode.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/hide.png" alt="Pages Panel" width="300" />

</div>

:::info
If a page is hidden then you'll see an **eye** icon on the right of the card.
<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/hide-icon.png" alt="Pages Panel" width="300" />

</div>
:::

You can go to the options again and **unhide** the app from the **page navigation sidebar**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/unhide.png" alt="Pages Panel" width="300" />

</div>

:::info
After hiding a page, although the page may not appear in the pages navigation sidebar, it can still be accessed by utilizing either the **switch page action** or the **page URL**. 

<div style={{textAlign: 'center'}}>
<img className="screenshot-full" src="/img/v2-beta/pages/accesshidden.gif" alt="Pages Panel" />
</div>
:::

### Duplicate

The duplicate page option allows you to create and add a copy of the page in the pages list. The duplicated page will be an exact replica of the original page.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/duplinew.png" alt="Pages Panel" width="300" />

</div>

### Event Handlers

Just like other Event Handlers on ToolJet, you can add event handlers too pages too.

Currently, there is **On page load** event available. You can use all the available actions for this event along with the new actions added specifically for the pages:
- **[switch page](/docs/actions/switch-page)**
- **[set page variable](/docs/actions/set-page-variable)**
- **[unset page variable](/docs/actions/unset-page-variable)**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/event.png" alt="Pages Panel" width="300" />

</div>

### Disable Page

Disable page option can be used to disable a page. A disabled page won't be accessible in the viewer mode. 

**Note:** Page marked as **home** can't be disabled.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/disable.png" alt="Pages Panel" width="300" />

</div>

### Delete Page

You can **delete** a page from an application using this option.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/delete.png" alt="Pages Panel" width="300" />

</div>

:::info
If a page is **Marked Home** then you won't be able to delete and the delete page option will be disabled.
<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/pages/delete-disable.png" alt="Pages Panel" width="300" />

</div>
:::

## Exposed variables

| Variable    | Description |
| ----------- | ----------- | 
| `handle` | The `handle` represents the slug of the `page` within an app. In the URL `https://app.tooljet.com/applications/crm2/home`, `crm2` refers to the app name, and `home` corresponds to the handle. The handle is automatically set when a page is added, and you can also [rename](/docs/tutorial/pages#page-handle) the `handle` from the Page options. To access the value of the `handle` variable dynamically, use **`{{page.handle}}`**|
| `name` | The `name` indicates the name of the page set during its creation. To access the value of the `name` variable dynamically, use **`{{page.name}}`** |
| `id` | Each page in the ToolJet app receives a unique identifier upon creation. To access the value of the `id` dynamically, use **`{{page.id}}`** |
| `variables` | `variables` is an object that contains all the variables created for a specific page using the **[Set Page variable](/docs/actions/set-page-variable)** action. The value of a specific variable can be accessed dynamically using **`{{page.variables.<pagevariablename>}}`**, where `<pagevariablename>` refers to the variable created for that page using the Set Page variable action. |