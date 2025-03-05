---
id: instances
title: Instances 
---

Instances in ToolJet refer to self-hosted deployments of the ToolJet platform. Each instance operates independently and can have its own configurations, data, and user base. You can create multiple [workspaces](/docs/tj-setup/workspaces) inside of an instance. Workspaces are collaborative environments that enable teams to build, customize, and deploy applications, as well as manage data, workflows, and permissions.

When it comes to roles, ToolJet offers a [Super Admin](/docs/user-management/role-based-access/super-admin#admin-vs-super-admin) role, who can manage the instances and has full access to all the Workspaces, Users, and Groups of an instance. Within each workspace, users can be assigned one of the predefined roles (Admin, Builder, or End User) or we can add the user to a create custom group with custom permissions . For more details on managing users and roles within workspaces, refer to the [Workspace Users and Groups](/docs/user-management/role-based-access/user-roles) documentation.



<img style={{ marginBottom:'15px'}} className="screenshot-full img-l" src="/img/tooljet-setup/instance/overview.png" alt="Marketplace Plugin: Amazon Redshift" />




## Why Use Instances?

Instances help with:

-   **Data Isolation**: Keeping data separate for teams, departments, or clients.
-   **Compliance**: Hosting data to meet your org regulations.
-   **Data Privacy**: Ensures that your data remains private. ToolJet does not have access to your data.

Check out the [setup guide](https://docs.tooljet.com/docs/setup/) to explore the different options available for deploying ToolJet on your infrastructure.

## Choosing your Instance Setup

-   **Single Instance:** Ideal for teams looking for quick setup with data compliance, privacy and minimal overhead.
-   **Multiple Instances:** Suitable If your organization wants to:
    -   Manage applications across different departments with isolated setups.
    -   Host data in multiple regions to meet the compliance requirements.
    -   Set-up separate environments (e.g., development, staging, production) for stricter SDLC workflows.

The diagram below illustrates the multi-instance setup.


<img style={{ marginBottom:'15px' }} className="screenshot-full img-l" src="/img/tooljet-setup/instance/multi-instance.png" alt="Marketplace Plugin: Amazon Redshift" />

If you’d like to discuss your use case or need assistance, reach out via [support](mailto:hello@tooljet.com).