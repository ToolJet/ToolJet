---
id: ai-credits
title: Understanding AI Credits
---

A credit is a standardized unit of AI processing power consumed on every AI operation performed in ToolJet. Each operation, from [generating complete applications](/docs/build-with-ai/generate-applications) to modifying layouts or writing custom code, consumes a variable number of credits based on the complexity of the task.

In this guide you will learn how credit consumption works, types of credits, credit usage, getting more credits, and more.

## How Credits Are Consumed

Credits are consumed based on the complexity of each operation and the context of your conversation. The AI uses the conversation history to stay aligned with your intent, the more focused and specific your session, the more efficiently it works.

Credit consumption is variable by design: a simple layout tweak costs far fewer credits than generating a full application with complex logic. This means you have a lot of control over how efficiently you build, focused sessions with clear, specific prompts get more done per credit.

To get the most out of each credit, keep sessions focused: start a fresh chat for an unrelated task, and write prompts that name the exact component, query, or data source you want changed, using [@mention in AI Chat](/docs/build-with-ai/referencing-app-resources) where possible.

## Credit Usage

Credit usage in ToolJet varies based on the complexity of the request. Monthly credits are always consumed first. Add-on credits are utilized only after the monthly credits are exhausted. 

## Types of Credits

### Monthly Credits

Monthly credits are recurring credits included with your purchased license. They renew every month on the billing cycle date and are valid for one month. Any unused credits will not carry forward to the next month. Even if you are on an annual plan, credits are still renewed on a monthly basis.

### Add-on Credits
<PlanBadge type="pro" />

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