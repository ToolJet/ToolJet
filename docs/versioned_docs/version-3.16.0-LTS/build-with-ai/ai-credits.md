---
id: ai-credits
title: Understanding AI Credits
---

A credit is a standardized unit of AI processing power consumed on every AI operation performed in ToolJet. Each operation, from [generating complete applications](/docs/build-with-ai/generate-applications) to modifying layouts or writing custom code, consumes a variable number of credits based on the complexity of the task.

In this guide you will learn how credit consumption works, types of credits, credit usage, getting more credits, and more.

## How Credits Are Consumed

Credits are consumed based on the complexity of each operation and the context of your conversation. The AI uses the conversation history to stay aligned with your intent, the more focused and specific your session, the more efficiently it works.

Credit consumption is variable by design: a simple layout tweak costs far fewer credits than generating a full application with complex logic. This means you have a lot of control over how efficiently you build, focused sessions with clear, specific prompts get more done per credit.

For tips on structuring your prompts and sessions for the best results, see [Prompting 101 - Best Practices](/docs/build-with-ai/prompting101#efficient-utilization-of-credits).

## Credit Usage

Credit usage in ToolJet varies based on the complexity of the request. Monthly credits are always consumed first. Add-on credits are utilized only after the monthly credits are exhausted. The cards below provide an average range of credits utilized for different operations to help you estimate usage.

<div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '16px 0'}}>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>[App Generation](/docs/build-with-ai/generate-applications)</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Average</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>100 credits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>New Feature in the App</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Average</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>100 credits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>Modifying Layout/UI</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Average</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>50 credits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>Modifying Queries/Database</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Average</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>30 credits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>[Debug Components Auto Fix](/docs/build-with-ai/debug-components)</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Average</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>10 credits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>[AI Docs Assistant](/docs/build-with-ai/ai-docs-assistant)</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Average</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>6 credits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>SQL Query Generation</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Average</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>5 credits</span>
    </span>
  </div>

  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--ifm-toc-border-color)', borderRadius: '8px', fontSize: '13px'}}>
    <span>Custom Code Generation</span>
    <span style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <span style={{color: 'var(--ifm-color-emphasis-600)', fontSize: '13px'}}>Average</span>
      <span style={{padding: '3px 10px', borderRadius: '20px', fontWeight: '500', background: 'var(--ifm-color-emphasis-200)', minWidth: '90px', textAlign: 'center'}}>2 credits</span>
    </span>
  </div>

</div>

:::warning
These values are only average estimates to help plan your operations. **Actual credit consumption will vary depending on the complexity of the operation.**
:::

## Types of Credits

### Monthly Credits

Monthly credits are recurring credits included with your purchased license. They renew every month on the billing cycle date and are valid for one month. Any unused credits will not carry forward to the next month. Even if you are on an annual plan, credits are still renewed on a monthly basis.

### Add-on Credits

Add-on credits can be purchased in addition to your monthly credits and are a one-time purchase that do not renew monthly. These credits can only be purchased in multiples of 100 and are valid for one year from the date of purchase. If you buy additional credits after an initial purchase, the validity of the entire pool of credits is extended based on the latest purchase date. Checkout the [pricing](https://www.tooljet.com/pricing) page for more information.

## Buy Add-on Credits

### Self-Hosted Deployment

Follow these steps to buy add-on credits on your self-hosted deployment of ToolJet:

1. Go to the Settings > License. <br/>
   (Example URL - https://app.nexuscorp.com/settings/license)
2. Click on the **Get AI credits** button in the top-right corner. <br/>
   <img className="screenshot-full img-full" style={{marginTop:"15px"}} src="/img/tooljet-ai/credits/sh-button.png" alt="AI Credits" />
3. A payment modal will open where you can enter details such as the number of credits you want to purchase and any promo codes. After filling out the details, click the **Get AI credits** button at the bottom. <br/>
   <img className="screenshot-full img-s" style={{marginTop:"15px"}} src="/img/tooljet-ai/credits/sh-modal.png" alt="AI Credits" />
4. You'll then be redirected to the payment gateway. On successful payment, the credits will be added to your instance.

### Cloud Deployment

Follow these steps to buy add-on credits on ToolJet Cloud:

1. Go to the Settings > Subscription. <br/>
   (Example URL - https://app.tooljet.com/nexuscorp/settings/subscription)
2. Click the **Get AI credits** button. <br/>
   <img className="screenshot-full img-full" style={{marginTop:"15px"}} src="/img/tooljet-ai/credits/cloud-button.jpg" alt="AI Credits" />
3. A payment modal will open where you can enter details such as the number of credits you want to purchase and any promo codes. After filling out the details, click the Get AI credits button at the bottom. <br/>
   <img className="screenshot-full img-full" style={{marginTop:"15px"}} src="/img/tooljet-ai/credits/cloud-modal.png" alt="AI Credits" />
4. You'll then be redirected to the payment gateway. On successful payment, the credits will be added to your workspace.

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