---
id: pages
title: Multi-Page Applications
---

ToolJet allows the creation of multi-page applications, helping you break your application into different sections. Instead of building everything on a single screen, you can create separate pages to organize different functionalities or enable navigation within your application.

ToolJet also supports page groups, which let you group related pages together, simplifying organization of pages in a complex application. For example, all admin-related pages can go under one group, and user-related pages under another.

This guide discusses how pages work, how to create new pages or page groups, and how to manage them.

## Page Properties

Each page in ToolJet comes with properties that define its identity and behavior. These properties help in organizing, referencing, and securing pages within your application.

<img className="screenshot-full img-m" src="/img/app-builder/multi-page/dropdown.png" alt="App Builder: Canvas"/>

### Name

A display name for the page, shown in the application's navigation menu. It is also used to reference the page within the ToolJet application. You can optionally add an icon to make the page easier to identify in the menu. The page name and icon can be updated using the kebab menu (three dots) next to the page name.

### Handle

The page handle is a unique identifier used to generate a shareable URL for the page. It is appended as a slug to the end of your application URL. By default, it's auto-generated from the page name. You can change it manually by clicking the edit icon next to it.

### Home Page

The home page is the default landing page when the app launches. Only one page can be designated as the home page in your application. It cannot be deleted, disabled, or hidden from the page menu. A page can be marked as the home page using the kebab menu (three dots) next to the page name.

### Permissions

Page permissions control who can access a particular page. You can choose to:

- Allow access to all users with application access
- Restrict access to selected users
- Restrict access to selected [user groups](/docs/user-management/role-based-access/user-roles)

To configure page permissions, click the kebab menu (three dots) next to the page name, select Page permission, and select a permission option from the popup.

### Disable Page

**Disable Page** allows you to disable a page, making it inaccessible in the released application. A page marked as Home cannot be disabled.

## Page Menu

The **Page Menu** is the navigation panel that lets users switch between pages in your application. You can customize how it looks and works, or even hide certain pages from it.

### Customize Page Menu

Click the Settings button (⚙️) in the Pages panel header to configure the page menu.

- **Collapsible**: Allows users to collapse the menu in the released app.
- **Style**: Choose how pages appear — Text only, Text + Icon, or Icon only.
- **Hide page menu in viewer mode**: Hides the menu in viewer mode.

<img className="screenshot-full img-full" src="/img/app-builder/multi-page/page-menu.png" alt="App Builder: Canvas"/>

The Styles tab also lets you change colors for text, icons, background, and more.

<img className="screenshot-full img-full" src="/img/app-builder/multi-page/menu-style.png" alt="App Builder: Canvas"/>

### Hide Page on App Menu

You can hide a page from the page menu in the released application. However, hidden pages can still be accessed using the Switch Page action or by navigating directly to the page URL. Pages set as Home cannot be hidden.

## Event Handlers

The Page Event Handler lets you trigger actions automatically when a page loads. Use it to prepare data, set default values, or run any required logic.

For example, it can run a query to fetch the latest data from the database and populate it in a table component. This ensures the page is ready with up-to-date information whenever it is loaded.

<img className="screenshot-full img-l" src="/img/app-builder/multi-page/page-event.png" alt="App Builder: Canvas"/>

## Exposed Variables

Exposed variables are values from a page that can be accessed throughout the application. These include default page-level values like page name, page ID, and page handle. In addition to the default ones, custom page variables can also be defined and accessed as exposed variables.

| Variable  | Description | How To Access |
| ----------- | ----------- | ------------- |
| handle | Represents the slug of the page within the app. It is automatically set when a page is created, but can be [renamed](#page-handle) from the page options. | `{{page.handle}}`|
| name | Indicates the name of the page. | `{{page.name}}` |
| id | Each page in the ToolJet application receives a unique identifier upon creation. | `{{page.id}}` |
| variables | Variables object contains all the variables created for a specific page using the [Set Page Variable](/docs/actions/set-page-variable) action.  | `{{page.variables.<pageVariableName>}}`, where `<pageVariableName>` refers to the variable name. |

## Manage Pages

### New Page

You can add a new page to organize the application navigation or to separate different parts of your app. To add a new page, click on the **+ Add** button at the top of the Pages panel and select **Page**. Enter the page name and press enter to create the page.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/new-page.png" alt="App Builder: Canvas"/>

### Page Group

Related pages can be grouped together using the page group. To add a new page group, click on the **+ Add** button at the top of the Pages panel and select **Group**. Enter the group name and press enter to create the group. You can then drag pages into the group folder. You can also add an icon to the group for better visual identification.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/new-group.png" alt="App Builder: Canvas"/>

### Duplicate

The **Duplicate Page** allows you to create an exact copy of the selected page. The duplicated page will appear in the Pages list and retain all components, settings, and configurations from the original.

### Delete Page

You can delete a page from an application using the Delete Page option. Page marked as home cannot be deleted.
