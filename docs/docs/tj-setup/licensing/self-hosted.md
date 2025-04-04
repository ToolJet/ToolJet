---
id: self-hosted
title: Self-Hosted
---

This guide explains the different types of licenses present and provides instructions on upgrading your license for Self-Hosted ToolJet. Self-Hosted ToolJet works on a license model and you can reach out to the **[ToolJet Team](mailto:hello@tooljet.com)** to generate the key. For assistance in selecting an appropriate plan visit the **[ToolJet Pricing](https://www.tooljet.ai/pricing)** page or contact the **[ToolJet team](mailto:hello@tooljet.com)**.

<div style={{paddingTop:'24px'}}>

## Types of Licenses

ToolJet provides three types of licenses - **Basic**, **Trial**, and **Paid**. These can be further categorized into different subscription plans. Visit **[ToolJet Pricing](https://www.tooljet.ai/pricing)** page for more details on different subscription plans.

### Basic License

This is a free license where a user can access basic offerings such as creating apps, pre-defined user groups, community support, etc. This is ideal for individuals or small teams who just need the essentials. No license key is required for this option.

### Trial License

ToolJet offers a trial license which is valid for 14 days, where users can access all premium features and evaluate ToolJet according to their needs. You can contact  **[ToolJet Team](mailto:hello@tooljet.com)** to generate a trial license key.

### Paid License

ToolJet offers various subscription plans for paid licenses. Visit the **[ToolJet Pricing](https://www.tooljet.ai/pricing)** page for more details on different subscription plans. Once you have decided on a suitable plan for your needs you can then contact the **[ToolJet Team](mailto:hello@tooljet.com)** to complete the onboarding process.

</div>

## AI Credit System 

Starting from **`v3.5.0-ee-lts`** ToolJet supports **Build with AI** allowing you to build applications effortlessly using natural language. Refer to **[Build with AI](/docs/build-with-ai/overview)** guide for more information. 

The AI credits are consumed on every AI operation performed in ToolJet. Credits operate at an instance level and are allocated based on the pricing plan and are replenished monthly. Unused credits do not carry over to the next month, they expire at the end of each billing cycle. AI-powered operations consume credits depending on their complexity. Visit **[ToolJet Pricing](https://www.tooljet.ai/pricing)** page for more details.

### Credit Usage

**Standard Operations**

AI-powered assistance for the following actions consumes **3 credits**:

- Generating or editing single UI components
- Generating or modifying queries
- Incorporating business logic
- Debugging assistance
- Generating database tables
- Bulk modifying component styles
- Generating or modifying multi-component layouts
- Guidance from documentation

**Advanced Builds**

The entire app UI generation consumes **10 credits**.


### Credit Calculation

AI credits are calculated based on the pricing plan and are assigned per builder in an instance. These credits are then available for use by all users in the instance across all workspaces.

## Updating License Key

Once you have received the license key from the ToolJet Team, you can update the license key by following the steps:

Role Required: **Super Admin**

1. Go to the Settings page. <br/> 
    (Example URL - `https://app.corp.com/instance-settings/license`)

2. In the license key tab, update the provided license key.
    <img className="screenshot-full" src="/img/licensing/self-hosted-license.png" alt="Licensing" />

3. Within the license tab of the Settings page, you can access the limit tab, which provides details about available total users, builders, and end users. You can also see the expiry date of your license key.
    <img className="screenshot-full" src="/img/licensing/selfhosted-limits.png" alt="Licensing" />

## Migrating to New Pricing Plan

Starting from the version **`v3.5.20-ee-lts`**, the basic license will have the following limitations and users on a previous version, will be impacted in the following ways:

| Resource | Allowed Limit | Impact on Existing Users |
|----------|:-------------:|--------------------------|
| Super Admin | 1 | No Impact |
| Builder | 2 | All builders will be automatically archived, except for two random builders (including 1 Super Admin). |
| End User | 50 | All users beyond 50 will be archived automatically. |
| Applications | 2 | All the previously created apps will be accessible, but the users will not be able to create new apps if they already have two or more than two apps created. |
| Workflows | 2 | Users can create upto two workflows. |
| Workspaces | 1 | All the previously created workspaces will be accessible, but the users will not be able to create any new workspace. |

### Retrieving Desired Users Affected Due to New Pricing Plan

If an user is archived automatically due to the new pricing plan then to retrieve the desired Builder or End User, the Super Admin can [archive](/docs/user-management/onboard-users/archive-user#instance-level) the current active builder/end-user and [unarchive](/docs/user-management/onboard-users/archive-user#instance-level-1) the desired users.

If you have any questions feel free to join our [Slack Community](https://tooljet.com/slack) or send us an email at hello@tooljet.com.

## FAQs

<details id="tj-dropdown">
    <summary>
     **What happens if my subscription expires?**
    </summary>

If your paid or trial license key expires, your instance will revert to the Basic plan. You will lose access to premium features such as OpenID SSO login and Audit logs, but no data will be lost. You can renew anytime to regain access to premium features.

</details>

:::caution
**Please keep in mind that your license key is private and strictly prohibited from being shared with any third parties.**
:::