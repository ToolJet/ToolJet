---
id: manage-libraries
title: Manage Libraries in Your Workspace
sidebar_label: Manage Libraries
---

<div className="badge badge--primary heading-badge">
  <img
    src="/img/badge-icons/premium.svg"
    alt="Icon"
    width="16"
    height="16"
  />
 <span>Paid feature</span>
</div>

:::caution BETA
Custom Component Libraries are currently in beta and not recommended for production use.
:::

Workspace admins can see and delete every library published to the workspace from **Workspace settings** → **Custom component libraries**. Only admins can see this page, and only on a plan that includes custom component libraries.

## View Libraries

The page shows the number of libraries at the top (for example, "3 libraries") and a table with two columns:

| <div style={{ width:"150px"}}> Column </div> | <div style={{ width:"400px"}}> What It Shows </div> |
|:---------- | :---------- |
| **Name** | The library's display name, set when the library was created with `tooljet library init`. |
| **Latest version** | The newest published version. Shows `dev` if the library has only dev uploads and no published version, and `—` if it has neither. |

You can't create a library from this page. You create a custom component library with the [ToolJet CLI](./setup.md#create-a-library). If the workspace has no libraries, the page shows "No custom component library yet — publish one to this workspace with the ToolJet CLI."

The list also includes the library that each React Builder app keeps for its own code. Those libraries belong to their apps and aren't offered in the App Builder's library picker.

## Delete a Library

1. Open the **⋮** menu at the end of the library's row.
2. Select **Delete library**.
3. Confirm the deletion.

:::warning
Deleting a library permanently removes all of its published versions and all dev uploads.
:::

**You can't delete a library that is in use.** If any app in the workspace has a component from the library on its canvas, the deletion fails with "Cannot delete — in use by:" followed by the names of those apps. Remove the library's components from those apps first, then delete the library.
