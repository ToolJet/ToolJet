---
id: pages
title: Pages and Navigation
---

ToolJet allows the creation of multi-page applications, helping you break your application into different sections. Instead of building everything on a single screen, you can create separate pages to organize different functionalities or enable navigation within your application.

You can add the following items to the navigation menu in ToolJet:

1. **New Page**: Create new pages to support multi-page applications and organize functionalities more effectively.
2. **Web Pages**: Add external URLs to the navigation menu to redirect users to specific webpages.
3. **ToolJet Application**: Link to other ToolJet applications directly from the nav menu. Note: The application must be a released app within the same workspace.
4. **Nav Group**: Group related navigation items together to simplify navigation in complex applications. For example, all admin-related items can go under one group, and user-related items under another.

This guide discusses how pages and navigation menu work, how to create new navigation items manage them.

## Page Properties

Each page in ToolJet comes with properties that define its identity and behavior. These properties help in organizing, referencing, and securing pages within your application.

<img className="screenshot-full img-m" src="/img/app-builder/multi-page/dropdown.png" alt="App Builder: Canvas"/>

### Name

A display name for the page, shown in the application's navigation menu. It is also used to reference the page within the ToolJet application. You can optionally add an icon to make the page easier to identify in the menu. The page name and icon can be updated using the kebab menu (three dots) next to the page name and then going to edit page details.

<img className="screenshot-full img-m" src="/img/app-builder/multi-page/page-name.png" alt="App Builder: Canvas"/>

### Handle

The page handle is a unique identifier used to generate a shareable URL for the page. It is appended as a slug to the end of your application URL. By default, it's auto-generated from the page name. You can change it manually from edit page details option.

### Home Page

The home page is the default landing page when the app launches. Only one page can be designated as the home page in your application. It cannot be deleted, disabled, or hidden from the page menu. A page can be marked as the home page using the kebab menu (three dots) next to the page name or by going to edit page details option.

### Permissions

Page permissions control who can access a particular page. You can choose to:

- Allow access to all users with application access
- Restrict access to selected users
- Restrict access to selected [user groups](/docs/user-management/role-based-access/user-roles)

To configure page permissions, click the kebab menu (three dots) next to the page name, select Page permission, and select a permission option from the popup.

### Disable Page

**Disable Page** allows you to disable a page, making it inaccessible in the released application. A page marked as Home cannot be disabled.

### Hide Page on Navigation Menu

You can hide a page from the navigation menu in the released application. However, hidden pages can still be accessed using the Switch Page action or by navigating directly to the page URL. Pages set as Home cannot be hidden.

## Header and Navigation Menu

### App Header

The app header section allows you to control what is displayed in the application’s header.

<img className="screenshot-full img-m" src="/img/app-builder/multi-page/app-header.png" alt="App Builder: Canvas"/>

- **Show app header**: Toggle this on to display the app header.
- **Show logo**: Toggle this on to display the application logo. You can update the logo from the [white labeling](/docs/tj-setup/org-branding/white-labeling/) settings.
- **Title**: Set a title for the application. This will be displayed in the app header.

### Navigation Menu

The **Navigation Menu** lets users navigate between pages, external web pages and other ToolJet applications in your application. You can customize how it looks and works, or even hide certain pages from it.

#### Show Navigation Menu
Toggle this on to display the navigation menu. When disabled, no navigation menu will be displayed, but users will be still able to navigate using events and page urls.

#### Position
Choose whether to display the navigation menu at the top or on the side of the application.

**Top Navigation Menu** <br/>
<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/multi-page/top-nav.png" alt="App Builder: Canvas"/>

**Side Navigation Menu** <br/>
<img className="screenshot-full img-full" src="/img/app-builder/multi-page/side-nav.png" alt="App Builder: Canvas"/>

#### Style

**Top Navigation Menu** <br/>
Choose the display style for the top navigation menu: Text only or Text + Icon. The top navigation menu cannot be collapsed.

**Side Navigation Menu** <br/>
Choose display styles from: Text only, Icon only, or Text + Icon. The side navigation menu also supports a collapsible layout.

## Event Handlers

The Page Event Handler lets you trigger actions automatically when a page loads. Use it to prepare data, set default values, or run any required logic.

For example, it can run a query to fetch the latest data from the database and populate it in a table component. This ensures the page is ready with up-to-date information whenever it is loaded.

<img className="screenshot-full img-full" src="/img/app-builder/multi-page/page-event.png" alt="App Builder: Canvas"/>

## Exposed Variables

Exposed variables are values from a page that can be accessed throughout the application. These include default page-level values like page name, page ID, and page handle. In addition to the default ones, custom page variables can also be defined and accessed as exposed variables.

| Variable  | Description | How To Access |
| ----------- | ----------- | ------------- |
| handle | Represents the slug of the page within the app. It is automatically set when a page is created, but can be [renamed](#handle) from the page options. | `{{page.handle}}`|
| name | Indicates the name of the page. | `{{page.name}}` |
| id | Each page in the ToolJet application receives a unique identifier upon creation. | `{{page.id}}` |
| variables | Variables object contains all the variables created for a specific page using the [Set Page Variable](/docs/actions/set-page-variable) action.  | `{{page.variables.<pageVariableName>}}`, where `<pageVariableName>` refers to the variable name. |

## Manage Navigation Item

### New Page

You can add a new page to organize the application navigation or to separate different parts of your app. To add a new page, click on the **+ New page** button at the bottom of the Pages and menu panel. Enter the page name and press enter to create the page.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/new-page.png" alt="App Builder: Canvas"/>

### Web Page

To link an external web page to the navigation menu, click the kebab menu (three dots) next to the **+ New Page** button, then select **Add nav item with URL**.
Enter a name and provide the URL. You can also choose whether to open the web page in a new tab or in the same tab, and optionally select an icon for the navigation item.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/webpage.png" alt="App Builder: Canvas"/>

### ToolJet App

To add a ToolJet application to the navigation menu, click the kebab menu (three dots) next to the **+ New Page** button, then select **Add nav item ToolJet app**.
Enter a name and select the application from the dropdown. Only the release application from the same workspace will appear in the dropdown. You can also choose whether to open the application in a new tab or in the same tab, and optionally select an icon for the navigation item.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/tooljet-app.png" alt="App Builder: Canvas"/>

### Nav Group

Related navigation item can be grouped together using the nav group. To add a new nav group, click the kebab menu (three dots) next to the **+ New Page** button, then select **Add nav group**. Enter the group name and press enter to create the group. You can then drag items into the group folder. You can also add an icon to the group for better visual identification.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/new-group.png" alt="App Builder: Canvas"/>
