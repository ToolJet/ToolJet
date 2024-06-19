---
id: permissions
title: Permissions
---

Permissions in **ToolJet Workflows** provide a structured approach to access control, ensuring precise management of who can view, edit, or execute workflows. The below table gives a detailed summary of permissions in context of ToolJet Workflows. 

| User Group                          | Workflows Dashboard Access | Create/Edit Workflows | Execute Workflows | Using Workflows in Tooljet App Builder | Enable/Disable Workflows |
|:------------------------------------:|:-----------------:|:--------:|:----------:|:------------:|:-------------:|
| **Admins**                          | ✅               | ✅      | ✅       | ✅          | ✅          |
| **Groups with App Editing Permissions** | ❌           | ❌      | ✅       | ✅          | ❌          |
| **End Users**                          | ❌               | ❌      | ✅       | ❌          | ❌          |

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Admins
**Admins** can create, edit, and manage workflows, access the workflow dashboard and flow builder, and use them in ToolJet's **App Builder**. They also have the option to use the **Enable** toggle on the top-right to enable or disable the execution of workflows in ToolJet applications.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/workflows/permissions/enable-checkmark.png" alt="Workflows Disable" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Groups with App Editing Permissions
**Groups with App Editing Permissions** can use the existing workflows in ToolJet's **App Builder**. 

Example:
Imagine a company using ToolJet to build internal applications. The HR department wants to integrate a new workflow that triggers an automated email when an employee's leave request is approved. A member of the **Groups with App Editing Permissions** can:

- Add a button named *Approve Leave* in the app builder interface.
- Link this button to an existing workflow which sends an automated email.
- Design a chart that displays the number of leaves approved monthly using another workflow that provides the relevant data.

While they can harness existing workflows and integrate them into app functionalities, Groups with App Editing Permissions can't create or modify the workflows themselves like **Admins**.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## End Users

**End Users** can only execute workflows in the application. 

Example:
Taking the same company scenario, an employee(end user) from the Sales department logs into the ToolJet-based internal application to request annual leave. Here's their interaction:

- The employee fills in a *Leave Request* form.
- Upon submission, they click the *Request Leave* button (which is linked to a workflow that sends this request to the HR department).
- Once HR approves the leave using the *Approve Leave* button (created by the "Groups with App Editing Permissions"), the employee receives an automated email notification, which is triggered by another workflow.

</div>
