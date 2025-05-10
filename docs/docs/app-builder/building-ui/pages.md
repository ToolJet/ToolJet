---
id: pages
title: Pages
---

ToolJet allows creation of multi-page applications, helping you break your app into different sections. Instead of building everything on a single screen, you can create separate pages to organize different functionalities or enable navigation within your application.

ToolJet also supports [page groups](#), which let you group related pages together, simplifying organization of pages in a complex app. For example, all admin-related pages can go under one group, and user-related pages under another.

This guide discuss about how pages work, how to create new pages or page groups, and how to manage them.

## Page Properties

Each page in ToolJet comes with properties that define its identity and behavior. These properties help in organizing, referencing, and securing pages within your application.

### Name

A display name for the page, shown in the app's navigation menu. It is also used to reference the page within the ToolJet application. You can optionally add an icon to make the page easier to identify in the menu. The page name and icon can be updated using the kebab menu (three dots) next to the page name.
### Handle

The page handle is a unique identifier used to generate a shareable URL for the page. It is appended as a slug to the end of your application URL. By default, it's auto-generated from the page name — converted to lowercase and with spaces replaced by hyphens. You can change it manually by clicking the edit icon next to it.

### Home Page

The home page is the default landing page when the app launches. Only one page in an application can be set as the home page. It cannot be deleted, disabled, or hidden from the page menu. A page can be marked as the home page using the kebab menu (three dots) next to the page name.

### Permissions

Page permissions control who can access a particular page. You can choose to:

- Allow access to all users with app access
- Restrict access to selected users
- Restrict access to selected [user groups](#)

To configure page permissions, click the kebab menu (three dots) next to the page name, select Page permission, and choose an option from the modal that appears.

### Disable Page

**Disable Page** allows you to disable a page, making it inaccessible in the released application. A page marked as Home cannot be disabled.

## Page Menu

The **Page Menu** is the navigation panel that lets users switch between pages in your application. You can customize how it looks and works, or even hide certain pages from it.

### Customize Page Menu

To customize the page menu, click on the Settings button (⚙️) in the header of the Pages panel to open the page menu configuration.

- **Collapsable**: Allows users to collapse the menu in the released app.
- **Style**: Choose how pages appear—Text only, Text + Icon, or Icon only.
- **Hide page menu in viewer mode**:  Hides the menu in viewer mode.

***Add Screenshot***

The Style tab also lets you change colors for text, icons, background, and more.

***Add Screenshot***

### Hide Page on App Menu

A page can be hidden from the page menu in a released application. Even when hidden, a page can still be accessed using the Switch Page action or directly through the page URL. A page marked as Home cannot be hidden.

## Event Handlers

Page Event Handler is used to trigger actions automatically when a page loads. It helps set up the page before any user interaction happens. This can include preparing data, setting initial values, or triggering any needed action. <br/>
For example, it can run a query to fetch the latest data from the database and populate it in a table component. This ensures the page is ready with up-to-date information whenever it is loaded.

## Exposed Variables

Exposed variables are values from a page that can be accessed throughout the application. These include default page-level values like page name, page ID, and page handle. In addition to the default ones, custom page variables can also be defined and accessed as exposed variables.

| Variable  | Description | How To Access |
| ----------- | ----------- | ------------- |
| handle | Represents the slug of the page within the app. It is automatically set when a page is created, but can be [renamed](#page-handle) from the page options. | `{{page.handle}}`|
| name | Indicates the name of the page. | `{{page.name}}` |
| id | Each page in the ToolJet app receives a unique identifier upon creation. | `{{page.id}}` |
| variables | Variables is an object that contains all the variables created for a specific page using the [Set Page Variable](/docs/actions/set-page-variable) action.  | `{{page.variables.<pageVariableName>}}`, where `<pageVariableName>` refers to the variable name. |

## Manage Pages

### New Page

You can add a new page to organize the app navigation or to separate different parts of your app. To add a new page, click on the **+ Add** button at the top of the Pages panel and select **Page**. Enter the page name and press enter to create the page.

***Add Screenshot***

### Page Group

Releated pages can be grouped together using the page group. To add a new page group, click on the **+ Add** button at the top of the Pages panel and select **Group**. Enter the group name and press enter to create the group. You can then drag pages into the group folder. You can also add an icon to the group for better visual identification.

***Add Screenshot***

### Duplicate

The **Duplicate Page** allows you to create an exact copy of the selected page. The duplicated page will appear in the Pages list and retain all components, settings, and configurations from the original.

### Delete Page

You can delete a page from an application using the Delete Page option. Page marked as home cannot be deleted.
