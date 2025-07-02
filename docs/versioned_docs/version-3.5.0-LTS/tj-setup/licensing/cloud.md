---
id: cloud
title: ToolJet Cloud
---

This guide explains the different types of subscriptions present and provides instructions on upgrading your subscription for ToolJet Cloud. For assistance in selecting an appropriate plan, visit the **[ToolJet Pricing](https://www.tooljet.ai/pricing)** page or **[contact the ToolJet team](mailto:hello@tooljet.com)**.

## Types of Subscriptions

ToolJet provides three types of subscriptions - **Basic**, **Trial**, and **Paid**. These can be further categorized in different plans based on the services and features. Visit **[ToolJet Pricing](https://www.tooljet.ai/pricing)** page for more details on different plans.

### Basic Subscription

This is a free subscription where a user can access basic offerings such as creating apps, limited access to the ToolJet Database, community support, etc. This is ideal for individuals or small teams who just need the essentials.

### Trial Subscription

ToolJet offers a trial subscription which is valid for 14 days, where users can access all premium features and evaluate ToolJet according to their needs. Once the trial period is over premium features, such as OpenID SSO login and Audit logs, will no longer be accessible. You can upgrade to a paid subscription by simply clicking on the upgrade button.

### Paid Subscription

ToolJet offers various plans for paid subscription. Visit the **[ToolJet Pricing](https://www.tooljet.ai/pricing)** page for more details on different plans. Once you have decided a suitable plan for your needs then you can upgrade to a paid subscription by simply clicking on the upgrade button.

## AI Credit System

Starting from **`v3.5.0-cloud-lts`** ToolJet supports **Build with AI** allowing you to build applications effortlessly using natural language. Refer to **[Build with AI](/docs/build-with-ai/overview)** guide for more information.

The AI credits are consumed on every AI operation performed in ToolJet. Credits are allocated at the workspace level, varying based on the pricing plan and replenishing every month. Unused credits do not carry over to the next month, they expire at the end of each billing cycle. AI-powered operations consume credits depending on their complexity. Visit **[ToolJet Pricing](https://www.tooljet.ai/pricing)** page for more details.

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
- Receiving guidance from documentation

**Advanced Builds**

The entire app UI generation consumes **10 credits**.

### Credit Calculation

AI credits are calculated based on the pricing plan and are assigned per builder in a workspace. These credits are then available for use by all users in the workspace.

## Upgrading Your Subscription

### Start Trial Subscription

If you are not currently on a paid plan and have not yet used your free trial, you will see a **Start Trial** banner within the ToolJet dashboard. Click on the **Start free trial** button inside this banner to initiate your free trial.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/licensing/cloud-license.png" alt="TJ Dashboard: Start free trial" />

### Upgrading to Paid Subscription

When you've identified the ideal paid plan to meet your needs, the next step is to complete the purchase process, ensuring seamless access to premium features. Follow these steps to upgrade your subscription:

Role Required: **Admin**

1. Click the gear icon (⚙️) at the bottom of the left sidebar and select **Settings** from the dropdown.

2. In the Settings page, choose the **Subscription** tab. <br/>
   (Example URL - `https://app.corp.com/nexus/settings/subscription`)

3. The subscription tab displays a subscription overview card summarizing your current plan. Locate the **Upgrade** button in the lower left corner and click on it.

4. A modal window will appear. Enter the desired number of builder and end-user seats, then click the **Upgrade** button within the modal.

5. You'll be directed to a payment gateway. Complete the payment process.

6. Upon successful payment, you'll return to the ToolJet subscription tab. A success message will display, and your subscription overview card will update shortly to reflect your new plan.
   <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/licensing/cloud-license-price.png" alt="Dashboard"/>

If you've decided to move forward with Pro or customized Enterprise plan, please schedule a call with **[ToolJet team](mailto:hello@tooljet.com)** and expect a response from the team within 24-48 hours for onboarding.

## Updated Limits in New Pricing Plan

Starting from version `v3.5.34-cloud-lts`, which was released on May 27th, 2025, the new pricing plan will have the following limitations and the old users will be impacted in the following ways:

| Resource     | Allowed Limit | Impact on Existing Users                                                                                                                                      |
| ------------ | :-----------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Builder      |       2       | All builders will be automatically archived, except for two random builders (including 1 Admin).                                                              |
| End User     |      50       | All users beyond 50 will be archived automatically.                                                                                                           |
| Applications |       2       | All the previously created apps will be accessible, but the users will not be able to create new apps if they already have two or more than two apps created. |

### Unarchiving Desired Users Affected Due to New Pricing Plan

If a user is automatically archived due to the new pricing plan, the Admin can [archive](/docs/user-management/onboard-users/archive-user#instance-level) an active Builder or End User to free up a slot and then [unarchive](/docs/user-management/onboard-users/archive-user#instance-level-1) the desired user.

If you have any questions, feel free to join our [Slack Community](/docs/slack) or send us an email at [hello@tooljet.com](mailto:hello@tooljet.com).

## FAQs

<details id="tj-dropdown">
    <summary>
     **Q. What happens if my subscription expires?**
    </summary>

If your paid or trial license key expires, your instance will revert to the Basic plan. You will lose access to premium features such as OpenID SSO login and Audit logs, but no data will be lost. You can renew anytime to regain access to premium features.

</details>
