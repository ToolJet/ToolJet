---
id: ai-credits
title: Understanding AI Credits
---

:::warning
AI credits will be available starting September 22, 2025.
:::

A credit is a standardized unit of AI processing power consumed on every AI operation performed in ToolJet. Each operation, from [generating complete applications](/docs/build-with-ai/generate-applications) to creating custom code or modifying layouts, consumes a varied amount of credits based on the complexity and type of task. This approach provides transparent cost visibility while enabling you to scale your AI usage on-demand. 

In this guide you will learn about types of credits, credit usage, getting more credits, and more.

## Credit Usage

Credit usage in ToolJet varies based on the complexity of the request. Monthly credits are always consumed first. Add-on credits are utilized only after the monthly credits are exhausted. The table below provides an average range of credits utilized for different operations to help you estimate usage.

| Operation | Avg. Credits Utilised |
|:----------|:---------------------:|
| [App Generation](/docs/build-with-ai/generate-applications) | 100 |
| Adding New Feature in the Application | 100 |
| Modifying Layout/UI | 50 |
| Modifying Queries/Database | 30 |
| [Debug Components Auto Fix](/docs/build-with-ai/debug-components) | 10 |
| [AI Docs Assistant](/docs/build-with-ai/ai-docs-assistant) | 6 |
| SQL Query Generation | 5 |
| Custom Code Generation | 2 |

:::warning
These values are only average estimates to help plan your operations. **Actual credit consumption will vary depending on the complexity of the operation**.
:::

## Types of Credits

### Monthly Credits

Monthly credits are recurring credits included with your purchased license. They renew every month on the billing cycle date and are valid for one month. Any unused credits will not carry forward to the next month. Even if you are on an annual plan, credits are still renewed on a monthly basis.

### Add-on Credits

Add-on credits can be purchased in addition to your monthly credits and are a one-time purchase that do not renew monthly. These credits can only be purchased in multiples of 100 and are valid for one year from the date of purchase. If you buy additional credits after an initial purchase, the validity of the entire pool of credits is extended based on the latest purchase date. Checkout the [pricing](https://www.tooljet.ai/pricing) page for more information.

## Credit Allocation

ToolJet AI credits are allocated on a per builder per month basis according to the purchased license. The total credits from all builders, along with any add-on credits purchased, are pooled together and made available collectively.
- At **Instance Level** for [Self-Hosted](/docs/tj-setup/tj-deployment#self-hosted-tooljet) deployments.
- At **Workspace Level** for [Cloud](/docs/tj-setup/tj-deployment#tooljet-cloud) deployments.

## Check Available Credits

### Inside App Builder

1. Click the credit icon at the top-right of the AI chat interface.
2. View your total available credits (monthly + add-on combined).

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/app-builder.png" alt="tooljet available credits" />

### Inside Settings

1. Navigate to Settings > Subscription.
2. View detailed breakdown of monthly and add-on credits.
3. Check validity periods and renewal dates.

You will also find an option to purchase additional add-on credits.

<img className="screenshot-full img-full" src="/img/tooljet-ai/credits/settings.png" alt="tooljet available credits" />

## Impact on Existing Users

Starting September 22, 2025, we’re updating the AI credits system to introduce add-on credits and pay-as-you-go flexibility.

### What's Changing

|   | Before | After |
|---|--------|-------|
| Denomination | Minimum credit = 0.1 | Minimum credit = 1 |
| Credit Usage | Fixed credits per operation. <br/> Eg. Every app generation would cost 10 credits. | Variable credits based on complexity of operation. <br/> Eg. A small app could take 70 credits, and a large app could take 120 credits. |
| Credit Types | Monthly recurring credits included in your plan. | - Monthly recurring credits included in your plan. <br/> - Optional purchase of additional credits which are valid for 1 year. |

### Updated Credit Allocation

All existing users will receive a fresh set of credits according to the new limits when the above upgrade is applied.

<table>
  <thead>
    <tr>
      <th>Plan</th>
      <th>Before</th>
      <th>After</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Free plan</td>
      <td>30</td>
      <td>100 (no Add-on option)</td>
    </tr>
    <tr>
      <td>Pro plan</td>
      <td>200/builder</td>
      <td>800/builder + Add-on option</td>
    </tr>
    <tr>
      <td>Team plan</td>
      <td>500/builder</td>
      <td>2000/builder + Add-on option</td>
    </tr>
    <tr>
      <td>Enterprise</td>
      <td colspan="2">Custom allocation - no changes</td>
    </tr>
  </tbody>
</table>
