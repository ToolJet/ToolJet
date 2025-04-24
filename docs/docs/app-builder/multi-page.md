---
id: multi-page
title: Pages
---

ToolJet allows the creation of multi-page applications. This feature helps in organizing different functionalities within a single application. Using multiple pages improves navigation and makes the application more structured and user-friendly.

## Pages Panel

The Pages panel on the left sidebar of the App Builder is used to [create](#add-page), manage, and navigate between different pages of the application.

<img className="screenshot-full img-full" src="/img/app-builder/multi-page/page-panel.png" alt="App Builder: Properties Panel"/>

## Panel Options

### Add Page

To add a new page, click the **+** button in the header of the Pages panel. Enter the page name and press enter to create the page.

<img className="screenshot-full img-m" src="/img/app-builder/multi-page/add-page.png" alt="App Builder: Properties Panel"/>

### Settings

Page navigation sidebar settings can be customized through the Settings button (⚙️) in the Pages panel. Clicking the button opens a configuration panel on the right.

- **Collapsable**: Enables the sidebar to be collapsible in released applications.
- **Style**: Allows selection between Text only, Text + icon, or Icon only for the sidebar display.
- **Hide page menu in viewer mode**:  Hides the sidebar in viewer mode.

<img style={{ marginBottom:'15px' }} className="screenshot-full img-full" src="/img/app-builder/multi-page/settings.png" alt="App Builder: Properties Panel"/>

The Style tab can be used to customize the appearance of the page navigation bar, such as text color, icon color, and etc.

<img className="screenshot-full img-full" src="/img/app-builder/multi-page/style.png" alt="App Builder: Properties Panel"/>

### Pin

By default, the Pages panel closes when clicking outside of it. To keep it open, click the Pin button — this will keep the panel visible until it is unpinned.

<img className="screenshot-full img-m" src="/img/app-builder/multi-page/pin.png" alt="App Builder: Properties Panel"/>

## Page Options

Several setting options are available for each page. To access them, click the kebab menu (three dots) on the right side of the page card.

<img className="screenshot-full img-l" src="/img/app-builder/multi-page/page-option.png" alt="App Builder: Properties Panel"/>

### Page Handle

**Page Handle** is the slug appended to the end of the application URL. By default, it is generated from the page name — converted to lowercase and with spaces replaced by hyphens. To change the page handle, click the edit icon next to it.

### Rename

The **Rename** option allows you to change the name of the page. Renaming a page does not affect the slug or page handle.

### Mark Home

The **Mark Home** option sets a page as the default landing page of the application. When the application is opened, this page will be the first one displayed.

### Hide Page on App Menu

The **Hide page on app menu** option allows you to hide a page from the page navigation sidebar in Viewer Mode. A page marked as Home cannot be hidden.<br/>
**Note**: Even when hidden, a page can still be accessed using the Switch Page action or directly through the page URL.

### Duplicate

The **Duplicate Page** option allows you to create an exact copy of the selected page. The duplicated page will appear in the Pages list and retain all components, settings, and configurations from the original.

### Event Handlers

**Event handlers** can be used to perform specific actions when certain events occur. The **On page load** event can be added to  trigger actions automatically when the page loads.

### Disable Page

**Disable Page** option allows you to disable a page, making it inaccessible in viewer mode. A page marked as Home cannot be disabled.

### Delete Page

You can delete a page from an application using the Delete Page option. Page marked as home cannot be deleted.

## Exposed Variables

| Variable  | Description | How To Access |
| ----------- | ----------- | ------------- |
| handle | Represents the slug of the page within the app. It is automatically set when a page is created, but can be [renamed](#page-handle) from the page options. | `{{page.handle}}`|
| name | Indicates the name of the page. | `{{page.name}}` |
| id | Each page in the ToolJet app receives a unique identifier upon creation. | `{{page.id}}` |
| variables | Variables is an object that contains all the variables created for a specific page using the [Set Page Variable](/docs/actions/set-page-variable) action.  | `{{page.variables.<pageVariableName>}}`, where `<pageVariableName>` refers to the variable name. |
