---
id: self-hosted
title: Self-Hosted
---

This guide explains the different types of licenses present and provides instructions on upgrading your license for Self-Hosted ToolJet. Self-Hosted ToolJet works on a license model and you can reach out to the **[ToolJet Team](mailto:hello@tooljet.com)** to generate the key. For assistance in selecting an appropriate plan visit the **[ToolJet Pricing](https://www.tooljet.ai/pricing)** page or contact the **[ToolJet team](mailto:hello@tooljet.com)**.

<div style={{paddingTop:'24px'}}>

## Types of Licenses

ToolJet provides three types of licenses - **Basic**, **Trial**, and **Paid**. Which can be further categorized into different subscription plans. Visit **[ToolJet Pricing](https://www.tooljet.ai/pricing)** page for more details on different subscription plans.

### Basic License

This is a free license where a user can access basic offerings such as creating apps, pre-defined user groups, community support, etc. This is ideal for individuals or small teams who just need the essentials. No license key is required for this option.

### Trial License

ToolJet offers a trial license which is valid for 14 days, where user can access all premium features and evaluate ToolJet according to their needs. You can contact  **[ToolJet Team](mailto:hello@tooljet.com)** to generate a trial license key.

### Paid License

ToolJet offers various subscription plans for paid licenses visit **[ToolJet Pricing](https://www.tooljet.ai/pricing)** page for more details on different subscription plans. Once you have decided on a suitable plan for your needs then you can contact **[ToolJet Team](mailto:hello@tooljet.com)** to complete the onboarding process.

</div>

## AI Credit System 

Starting from **`v3.5.0-ee-lts`** ToolJet supports **Build with AI** allowing you to build applications effortlessly using natural language. Refer to [Build with AI](/docs/build-with-ai/overview) guide for more information. 

The AI credits are consumed on every AI operation performed in ToolJet. Credits operates at an instance level and are allocated based on the pricing plan and are replenished monthly. Unused credits do not carry over to the next month. AI-powered operations consume credits depending on their complexity. Visit **[ToolJet Pricing](https://www.tooljet.ai/pricing)** page for more details.

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


### Credit calculation

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

## FAQs

<details>
    <summary>
     **Q. What happens if my subscription expires?**
    </summary>

If your paid or trial license key expires, your instance will revert to operating as a basic plan. Upon expiration, access to premium features like OpenID SSO login and Audit logs will be restricted, ensuring no data loss occurs. However, don't worry! You can still renew to any of the paid plans and enjoy the premium features again.

</details>

:::caution
**Please keep in mind that your license key is private and strictly prohibited from being shared with any third parties.**
:::