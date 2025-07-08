---
id: pages
title: Multi-Page Applications
---

ToolJet allows the creation of multi-page applications, helping your teams to organize, navigate, and control access across different sections of an application. Instead of building everything on a single screen, you can create separate pages to organize different functionalities or enable navigation within your application.

You can structure your apps using pages, and each page can contain different views, components, and logic. The Pages and Navigation panel lets you:
- Create and manage multiple pages within an app.
- Organize pages into navigation menus and groups.
- Configure visibility and access settings for each page.
- Customize how users interact with navigation headers and sidebars.

This provides a modular way to scale and control the user experience in your application.

This guide discusses how pages work, how to create new pages or page groups, and how to manage them.

## Why use pages
- Improves app structure: Organizing content into logical pages improves maintainability and user flow.
- Enables multi-role access: With page-level permissions, you can tailor content visibility for different user groups.
- Responsive design: You can choose which devices (desktop or mobile) each page appears on.
- Customizable navigation: Create nested navigation, external links, or app links with ease.

## How to use it

### Creating Pages

Let's say you are building an Employee Directory App and you want to add a new page. Follow these steps:

1. Go to the **Pages and Navigation** panel by clicking on the page icon on right side bar.
<img className="screenshot-full img-s" src="/img/app-builder/multi-page/page-properties.png" alt="Pages and navigation panel"/>

2. Click on **+ New page**.
3. Fill in the **Page name** and **Handle** (Slug).

4. Optionally:
- Add an icon.
- Mark as home.
- Hide on navigation.
- Disable page.
- Add page-level event handlers (such as on page load).

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/add-page-modal.png" alt="add page"/>

### Managing Pages
Each page entry in the list provides quick actions:

- Edit page details: Change name, handle, event-handler, icon, etc.
- Mark as home: Set the default landing page.
- Duplicate: Clone existing pages.
- Delete: Remove pages.
- Set page permissions: Control access based on users and user groups. Click [here](/docs/app-builder/building-ui/pages#controlling-page-access-with-permissions) to learn more.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/manage-pages.png" alt="add page"/>

### Organizing Navigation

You can organize your page navigation by creating navigation groups, internal app links, and external URLs. 

To add items:

- Click the **three-dot menu** beside + New page.
<img className="screenshot-full img-s" src="/img/app-builder/multi-page/nav-menu.png" alt="nav menu"/>

#### Add external links
- To add a link to an external website, choose **Add nav item with URL.**
<img className="screenshot-full img-s" src="/img/app-builder/multi-page/nav-url.png" alt="Add nav item with URL"/>

#### Link to another ToolJet app
- To link to a different ToolJet application, select **Add nav item ToolJet app**.
<img className="screenshot-full img-s" src="/img/app-builder/multi-page/nav-tooljet-app.png" alt="New nav item with app"/>

:::note
Only published (released) apps can be linked in the navigation.
:::

#### Create nested navigation
- To create a collapsible or grouped navigation structure, select **Add nav group**.
<img className="screenshot-full img-s" src="/img/app-builder/multi-page/nav-group.png" alt="New nav group"/>

- After creating a group, you can drag and drop individual nav items into the group to nest them. For example, for an employee directory app, you can create nested navigation as follows.
<img className="screenshot-full img-s" src="/img/app-builder/multi-page/nav-group-example.png" alt="New nav group example"/>

### Controlling Page Access with Permissions
You can configure page-level permissions in your ToolJet apps, giving you fine-grained control over who can access specific pages within your app. This ensures that each user or user group only sees what's relevant to them.

This feature is especially useful when:

- You want to restrict access to internal or admin-only pages.
- You're building role-based apps (e.g., different views for Managers and Employees).
- You're maintaining a single app for multiple teams with varying access levels.

For example, In an employee directory app, you might want only Admins or HR teams to access the “Manage Employees” page. Regular employees shouldn’t see or access this page. Using page permissions, you can easily assign access to specific user groups and keep it hidden from others.

To set permissions:

- Click on the **three-dot menu** beside the page name and select **Page permission**.
<img className="screenshot-full img-s" src="/img/app-builder/multi-page/select-page-permission.png" alt="Navigation menu on the side"/>
- A modal will appear with the option to restrict access.
- You can choose to:
    - Allow access to all users with application access
    - Restrict access to selected users
    - Restrict access to selected [user groups](/docs/user-management/role-based-access/user-roles)
<img className="screenshot-full img-s" src="/img/app-builder/multi-page/page-permission.png" alt="Navigation menu on the side"/>

:::note
If a user doesn’t have permission, the page will not be visible in their navigation or accessible via direct link.
:::

### Customizing Header and Navigation

You can personalize the layout and behavior of your header and navigation menu to match your app’s design and user experience needs. This customization is useful when designing apps for different devices or screen sizes—such as keeping the top bar for mobile-friendly apps and sidebar for dashboard-style interfaces.

Under Header, you can:
- Toggle app header and logo visibility.
- Set a custom title (e.g., “Employee Directory”).

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/custom-header.png" alt="New nav group example"/>

Under Navigation, you can:
- Set the menu position: Choose whether the navigation menu appears at the top or on the side of the app.
- Show or hide the entire navigation menu.
- Choose the nav item display style: Show icons only, text only, or both icon and text.
- If the menu is positioned on the side, you can enable or disable collapsibility.

<img className="screenshot-full img-s" src="/img/app-builder/multi-page/custom-nav.png" alt="New nav group example"/>

#### Navigation at the top:
<img className="screenshot-full img-full" src="/img/app-builder/multi-page/nav-top.png" alt="Navigation menu at top"/>
#### Navigation on the side:
<img className="screenshot-full img-full" src="/img/app-builder/multi-page/nav-side.png" alt="Navigation menu on the side"/>

## Event Handlers

The Page Event Handler lets you trigger actions automatically when a page loads. Use it to prepare data, set default values, or run any required logic.

For example, it can run a query to fetch the latest data from the database and populate it in a table component. This ensures the page is ready with up-to-date information whenever it is loaded.

<img className="screenshot-full img-l" src="/img/app-builder/multi-page/page-event.png" alt="App Builder: Canvas"/>

## Exposed Variables

Exposed variables are values from a page that can be accessed throughout the application. These include default page-level values like page name, page ID, and page handle. In addition to the default ones, custom page variables can also be defined and accessed as exposed variables.

| Variable  | Description | How To Access |
| ----------- | ----------- | ------------- |
| handle | Represents the slug of the page within the app. It is automatically set when a page is created, but can be [renamed](#handle) from the page options. | `{{page.handle}}`|
| name | Indicates the name of the page. | `{{page.name}}` |
| id | Each page in the ToolJet application receives a unique identifier upon creation. | `{{page.id}}` |
| variables | Variables object contains all the variables created for a specific page using the [Set Page Variable](/docs/actions/set-page-variable) action.  | `{{page.variables.<pageVariableName>}}`, where `<pageVariableName>` refers to the variable name. |

