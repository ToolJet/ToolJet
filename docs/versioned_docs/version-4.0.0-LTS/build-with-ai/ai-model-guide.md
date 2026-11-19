---
id: ai-model-performance
title: AI Model Performance and Credit Usage
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import SortableTable from '@site/src/components/SortableTable/SortableTable';
import { ModelName } from '@site/src/components/ProviderIcons';

# AI Model Performance and Credit Usage

AI models differ in how much of an app they finish, how the app looks, how long the build takes and how many credits it uses. To make the differences easy to see, we gave every model the **same prompt**: a six-page procurement app for a fictional manufacturer, with approval rules, budgets, vendor compliance, contract renewals and an audit log. Then we compared the apps page by page.

> **Same-prompt test, 7 October 2026.** One build per model, with no retries and no manual fixes. Builds vary from run to run, so treat the results as a guide rather than a guarantee.

## Results at a glance

<SortableTable
  defaultSort="features"
  columns={[
    { key: 'model', label: 'Model' },
    { key: 'features', label: 'Features (of 22)', defaultDir: 'desc' },
    { key: 'actions', label: 'Actions (of 6)', defaultDir: 'desc' },
    { key: 'design', label: 'Design (of 10)', defaultDir: 'desc' },
    { key: 'credits', label: 'Credits', format: (v) => v.toLocaleString('en-US') },
    { key: 'minutes', label: 'Build time', format: (v) => `${v.toFixed(1)} min` },
  ]}
  rows={[
    { model: 'Claude Opus 5.5', provider: 'anthropic', features: 22, actions: 6, design: 8, credits: 445, minutes: 18.9 },
    { model: 'Claude Sonnet 5.5', provider: 'anthropic', features: 21.5, actions: 6, design: 7, credits: 343, minutes: 19.6 },
    { model: 'Claude Fable 5.1', provider: 'anthropic', features: 21.5, actions: 6, design: 7, credits: 1320, minutes: 26.1 },
    { model: 'GPT-6.1 Sol', provider: 'openai', features: 20.5, actions: 5, actionsDisplay: '5*', design: 6, credits: 87, minutes: 12.0 },
    { model: 'GPT-6 Astra', provider: 'openai', features: 20.5, actions: 4.5, actionsDisplay: '4.5*', design: 7, credits: 442, minutes: 13.3 },
    { model: 'GPT-6 Luna', provider: 'openai', features: 20, actions: 6, design: 7, credits: 21, minutes: 25.9 },
    { model: 'Claude Haiku 5.5', provider: 'anthropic', features: 20, actions: 6, design: 6, credits: 85, minutes: 14.1 },
    { model: 'DeepSeek Flash', provider: 'deepseek', features: 20, actions: 5.5, design: 7, credits: 37, minutes: 52.0 },
    { model: 'Gemini 3.8 Flash', provider: 'gemini', features: 17.5, actions: 5, design: 6, credits: 111, minutes: 20.1 },
    { model: 'Grok 4.7', provider: 'grok', features: null, design: null, credits: null, minutes: null, missingText: 'Did not finish', actions: null },
  ]}
  note="Select a column heading to sort by it; select it again to reverse the order."
/>

**Features** counts the 22 things the prompt asked for that were present and working on screen. **Actions** counts six things we did in each finished app and then checked in its database: raising a request, approval routing, approving and rejecting with a comment, recording a renewal decision, and the request filter and vendor detail. **Design** is a score out of 10 for layout, consistency and formatting. **Credits** is what the build used; 1 credit is 1/100 of a US dollar at provider list price.

\*GPT-6.1 Sol and GPT-6 Astra built real access control: approvals only work for members of workspace groups the apps expect, such as Finance Approvers and VP Approvers, and renewal decisions only for each contract's owner. Out of the box, with no such groups, their approve, reject and renewal actions stayed disabled and both scored 2.5. The scores shown are after creating the groups the apps expect and adding the user to them, the setup a team would do before using either app. ToolJet's builder did not create these groups or tell the user to.

Grok 4.7 did not finish the app in two attempts: both builds stopped before creating any pages.

## Recommended models

| What you're building | Recommended model | What we saw |
|:---|:---|:---|
| **A polished, branded app where the look matters** | <ModelName provider="anthropic">Claude Opus 5.5</ModelName> | The only model whose one-page design test answered a luxury brief convincingly, for 105 credits in under 4 minutes |
| **A one-page tool or dashboard** | <ModelName provider="openai">GPT-6 Luna</ModelName> or <ModelName provider="openai">GPT-6.1 Sol</ModelName> | A one-page booking desk took 4.8 min and 3 credits with Luna, and 3.8 min and 23 credits with Sol |
| **A multi-page business app where completeness matters** | <ModelName provider="anthropic">Claude Opus 5.5</ModelName> | The only model to deliver all 22 features of the six-page app, with all 6 actions working and the most polished pages |
| **A multi-page app for less** | <ModelName provider="anthropic">Claude Sonnet 5.5</ModelName> | 21.5 of 22 features for about three quarters of Opus's credits |
| **A multi-page app, fast** | <ModelName provider="openai">GPT-6.1 Sol</ModelName> | 20.5 of 22 features in 12 minutes for 87 credits, the fastest six-page build. Set up the workspace groups the app expects before using its approvals |
| **A large app on a tight credit budget** | <ModelName provider="openai">GPT-6 Luna</ModelName> | 20 of 22 features and all 6 actions working for 21 credits, if you can wait about 25 minutes |
| **A quick, low-cost first version** | <ModelName provider="anthropic">Claude Haiku 5.5</ModelName> | 20 of 22 features in 14 minutes for 85 credits |
| **An app on live external data, such as ServiceNow** | <ModelName provider="openai">GPT-6 Luna</ModelName> | In a separate four-page ServiceNow test, Luna got every headline number right for 14 credits |

## Compare the screens

Pick a page, then switch between models to see how each one built it. The tabs stay on the same model as you move down the page.

### Overview

<Tabs groupId="model" lazy className="model-tabs">
  <TabItem value="opus" label={<ModelName provider="anthropic" bold={false}>Claude Opus 5.5</ModelName>} default>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/opus/page-1.jpg" alt="Overview page built by Claude Opus 5.5" />
  </TabItem>
  <TabItem value="sonnet" label={<ModelName provider="anthropic" bold={false}>Claude Sonnet 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/sonnet/page-1.jpg" alt="Overview page built by Claude Sonnet 5.5" />
  </TabItem>
  <TabItem value="fable" label={<ModelName provider="anthropic" bold={false}>Claude Fable 5.1</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/fable/page-1.jpg" alt="Overview page built by Claude Fable 5.1" />
  </TabItem>
  <TabItem value="sol" label={<ModelName provider="openai" bold={false}>GPT-6.1 Sol</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/sol/page-1.jpg" alt="Overview page built by GPT-6.1 Sol" />
  </TabItem>
  <TabItem value="astra" label={<ModelName provider="openai" bold={false}>GPT-6 Astra</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/astra/page-1.jpg" alt="Overview page built by GPT-6 Astra" />
  </TabItem>
  <TabItem value="luna" label={<ModelName provider="openai" bold={false}>GPT-6 Luna</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/luna/page-1.jpg" alt="Overview page built by GPT-6 Luna" />
  </TabItem>
  <TabItem value="haiku" label={<ModelName provider="anthropic" bold={false}>Claude Haiku 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/haiku/page-1.jpg" alt="Overview page built by Claude Haiku 5.5" />
  </TabItem>
  <TabItem value="gemini" label={<ModelName provider="gemini" bold={false}>Gemini 3.8 Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/gemini/page-1.jpg" alt="Overview page built by Gemini 3.8 Flash" />
  </TabItem>
  <TabItem value="deepseek" label={<ModelName provider="deepseek" bold={false}>DeepSeek Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/deepseek/page-1.jpg" alt="Overview page built by DeepSeek Flash" />
  </TabItem>
</Tabs>

### Requests

<Tabs groupId="model" lazy className="model-tabs">
  <TabItem value="opus" label={<ModelName provider="anthropic" bold={false}>Claude Opus 5.5</ModelName>} default>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/opus/page-2.jpg" alt="Requests page built by Claude Opus 5.5" />
  </TabItem>
  <TabItem value="sonnet" label={<ModelName provider="anthropic" bold={false}>Claude Sonnet 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/sonnet/page-2.jpg" alt="Requests page built by Claude Sonnet 5.5" />
  </TabItem>
  <TabItem value="fable" label={<ModelName provider="anthropic" bold={false}>Claude Fable 5.1</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/fable/page-2.jpg" alt="Requests page built by Claude Fable 5.1" />
  </TabItem>
  <TabItem value="sol" label={<ModelName provider="openai" bold={false}>GPT-6.1 Sol</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/sol/page-2.jpg" alt="Requests page built by GPT-6.1 Sol" />
  </TabItem>
  <TabItem value="astra" label={<ModelName provider="openai" bold={false}>GPT-6 Astra</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/astra/page-2.jpg" alt="Requests page built by GPT-6 Astra" />
  </TabItem>
  <TabItem value="luna" label={<ModelName provider="openai" bold={false}>GPT-6 Luna</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/luna/page-2.jpg" alt="Requests page built by GPT-6 Luna" />
  </TabItem>
  <TabItem value="haiku" label={<ModelName provider="anthropic" bold={false}>Claude Haiku 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/haiku/page-2.jpg" alt="Requests page built by Claude Haiku 5.5" />
  </TabItem>
  <TabItem value="gemini" label={<ModelName provider="gemini" bold={false}>Gemini 3.8 Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/gemini/page-2.jpg" alt="Requests page built by Gemini 3.8 Flash" />
  </TabItem>
  <TabItem value="deepseek" label={<ModelName provider="deepseek" bold={false}>DeepSeek Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/deepseek/page-2.jpg" alt="Requests page built by DeepSeek Flash" />
  </TabItem>
</Tabs>

### Approvals

<Tabs groupId="model" lazy className="model-tabs">
  <TabItem value="opus" label={<ModelName provider="anthropic" bold={false}>Claude Opus 5.5</ModelName>} default>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/opus/page-3.jpg" alt="Approvals page built by Claude Opus 5.5" />
  </TabItem>
  <TabItem value="sonnet" label={<ModelName provider="anthropic" bold={false}>Claude Sonnet 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/sonnet/page-3.jpg" alt="Approvals page built by Claude Sonnet 5.5" />
  </TabItem>
  <TabItem value="fable" label={<ModelName provider="anthropic" bold={false}>Claude Fable 5.1</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/fable/page-3.jpg" alt="Approvals page built by Claude Fable 5.1" />
  </TabItem>
  <TabItem value="sol" label={<ModelName provider="openai" bold={false}>GPT-6.1 Sol</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/sol/page-3.jpg" alt="Approvals page built by GPT-6.1 Sol" />
  </TabItem>
  <TabItem value="astra" label={<ModelName provider="openai" bold={false}>GPT-6 Astra</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/astra/page-3.jpg" alt="Approvals page built by GPT-6 Astra" />
  </TabItem>
  <TabItem value="luna" label={<ModelName provider="openai" bold={false}>GPT-6 Luna</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/luna/page-3.jpg" alt="Approvals page built by GPT-6 Luna" />
  </TabItem>
  <TabItem value="haiku" label={<ModelName provider="anthropic" bold={false}>Claude Haiku 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/haiku/page-3.jpg" alt="Approvals page built by Claude Haiku 5.5" />
  </TabItem>
  <TabItem value="gemini" label={<ModelName provider="gemini" bold={false}>Gemini 3.8 Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/gemini/page-3.jpg" alt="Approvals page built by Gemini 3.8 Flash" />
  </TabItem>
  <TabItem value="deepseek" label={<ModelName provider="deepseek" bold={false}>DeepSeek Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/deepseek/page-3.jpg" alt="Approvals page built by DeepSeek Flash" />
  </TabItem>
</Tabs>

### Vendors

<Tabs groupId="model" lazy className="model-tabs">
  <TabItem value="opus" label={<ModelName provider="anthropic" bold={false}>Claude Opus 5.5</ModelName>} default>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/opus/page-4.jpg" alt="Vendors page built by Claude Opus 5.5" />
  </TabItem>
  <TabItem value="sonnet" label={<ModelName provider="anthropic" bold={false}>Claude Sonnet 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/sonnet/page-4.jpg" alt="Vendors page built by Claude Sonnet 5.5" />
  </TabItem>
  <TabItem value="fable" label={<ModelName provider="anthropic" bold={false}>Claude Fable 5.1</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/fable/page-4.jpg" alt="Vendors page built by Claude Fable 5.1" />
  </TabItem>
  <TabItem value="sol" label={<ModelName provider="openai" bold={false}>GPT-6.1 Sol</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/sol/page-4.jpg" alt="Vendors page built by GPT-6.1 Sol" />
  </TabItem>
  <TabItem value="astra" label={<ModelName provider="openai" bold={false}>GPT-6 Astra</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/astra/page-4.jpg" alt="Vendors page built by GPT-6 Astra" />
  </TabItem>
  <TabItem value="luna" label={<ModelName provider="openai" bold={false}>GPT-6 Luna</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/luna/page-4.jpg" alt="Vendors page built by GPT-6 Luna" />
  </TabItem>
  <TabItem value="haiku" label={<ModelName provider="anthropic" bold={false}>Claude Haiku 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/haiku/page-4.jpg" alt="Vendors page built by Claude Haiku 5.5" />
  </TabItem>
  <TabItem value="gemini" label={<ModelName provider="gemini" bold={false}>Gemini 3.8 Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/gemini/page-4.jpg" alt="Vendors page built by Gemini 3.8 Flash" />
  </TabItem>
  <TabItem value="deepseek" label={<ModelName provider="deepseek" bold={false}>DeepSeek Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/deepseek/page-4.jpg" alt="Vendors page built by DeepSeek Flash" />
  </TabItem>
</Tabs>

### Contracts

<Tabs groupId="model" lazy className="model-tabs">
  <TabItem value="opus" label={<ModelName provider="anthropic" bold={false}>Claude Opus 5.5</ModelName>} default>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/opus/page-5.jpg" alt="Contracts page built by Claude Opus 5.5" />
  </TabItem>
  <TabItem value="sonnet" label={<ModelName provider="anthropic" bold={false}>Claude Sonnet 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/sonnet/page-5.jpg" alt="Contracts page built by Claude Sonnet 5.5" />
  </TabItem>
  <TabItem value="fable" label={<ModelName provider="anthropic" bold={false}>Claude Fable 5.1</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/fable/page-5.jpg" alt="Contracts page built by Claude Fable 5.1" />
  </TabItem>
  <TabItem value="sol" label={<ModelName provider="openai" bold={false}>GPT-6.1 Sol</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/sol/page-5.jpg" alt="Contracts page built by GPT-6.1 Sol" />
  </TabItem>
  <TabItem value="astra" label={<ModelName provider="openai" bold={false}>GPT-6 Astra</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/astra/page-5.jpg" alt="Contracts page built by GPT-6 Astra" />
  </TabItem>
  <TabItem value="luna" label={<ModelName provider="openai" bold={false}>GPT-6 Luna</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/luna/page-5.jpg" alt="Contracts page built by GPT-6 Luna" />
  </TabItem>
  <TabItem value="haiku" label={<ModelName provider="anthropic" bold={false}>Claude Haiku 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/haiku/page-5.jpg" alt="Contracts page built by Claude Haiku 5.5" />
  </TabItem>
  <TabItem value="gemini" label={<ModelName provider="gemini" bold={false}>Gemini 3.8 Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/gemini/page-5.jpg" alt="Contracts page built by Gemini 3.8 Flash" />
  </TabItem>
  <TabItem value="deepseek" label={<ModelName provider="deepseek" bold={false}>DeepSeek Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/deepseek/page-5.jpg" alt="Contracts page built by DeepSeek Flash" />
  </TabItem>
</Tabs>

### Budgets and audit

<Tabs groupId="model" lazy className="model-tabs">
  <TabItem value="opus" label={<ModelName provider="anthropic" bold={false}>Claude Opus 5.5</ModelName>} default>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/opus/page-6.jpg" alt="Budgets and audit page built by Claude Opus 5.5" />
  </TabItem>
  <TabItem value="sonnet" label={<ModelName provider="anthropic" bold={false}>Claude Sonnet 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/sonnet/page-6.jpg" alt="Budgets and audit page built by Claude Sonnet 5.5" />
  </TabItem>
  <TabItem value="fable" label={<ModelName provider="anthropic" bold={false}>Claude Fable 5.1</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/fable/page-6.jpg" alt="Budgets and audit page built by Claude Fable 5.1" />
  </TabItem>
  <TabItem value="sol" label={<ModelName provider="openai" bold={false}>GPT-6.1 Sol</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/sol/page-6.jpg" alt="Budgets and audit page built by GPT-6.1 Sol" />
  </TabItem>
  <TabItem value="astra" label={<ModelName provider="openai" bold={false}>GPT-6 Astra</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/astra/page-6.jpg" alt="Budgets and audit page built by GPT-6 Astra" />
  </TabItem>
  <TabItem value="luna" label={<ModelName provider="openai" bold={false}>GPT-6 Luna</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/luna/page-6.jpg" alt="Budgets and audit page built by GPT-6 Luna" />
  </TabItem>
  <TabItem value="haiku" label={<ModelName provider="anthropic" bold={false}>Claude Haiku 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/haiku/page-6.jpg" alt="Budgets and audit page built by Claude Haiku 5.5" />
  </TabItem>
  <TabItem value="gemini" label={<ModelName provider="gemini" bold={false}>Gemini 3.8 Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/gemini/page-6.jpg" alt="Budgets and audit page built by Gemini 3.8 Flash" />
  </TabItem>
  <TabItem value="deepseek" label={<ModelName provider="deepseek" bold={false}>DeepSeek Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/deepseek/page-6.jpg" alt="Budgets and audit page built by DeepSeek Flash" />
  </TabItem>
</Tabs>

## What each model did well, and where it fell short

### Claude Opus 5.5

In the end-to-end checks, every action worked: the $62,000 request showed its manager, Finance and VP path, and approvals, rejections and renewal decisions were saved with the user and time. Opus delivered every requested feature, and its numbers agreed with each other across pages. It had the most consistent design: a navy theme on every page, a stacked spend chart with a legend, a designed approval panel and a colour-coded renewal timeline on the Contracts page. Weak points: dates without years ("20 Oct"), short tables with space left under them, and a clipped row on the Requests page.

### Claude Sonnet 5.5

All six actions worked end to end, with approvals advancing step by step from manager to Finance. The request detail panel only filled in for the first row. Sonnet built every page and missed only one detail: the Requests table had no requester column (the requester shows in the detail panel). Its Overview was among the best in the test. Weak points: short tables with empty space below, and a contracts list that starts with contracts that already ended.

### Claude Fable 5.1

All six actions worked end to end, with routing enforced step by step. Fable matched Sonnet on features, with a well-designed Overview, a consistent navy theme and neatly formatted money, dates and status badges. It was also the most expensive build by a wide margin, at about three times Opus's credits, and one of the slowest. Its first attempt stopped during setup before writing any pages; the result shown is its second attempt. Weak points: some tables fill only part of their card or clip their last row, and the contracts table has no start date column.

### GPT-6.1 Sol

Sol built approval controls for workspace groups the app expects (department managers, Finance approvers and VP approvers) and limited renewal decisions to each contract's owner. Out of the box those groups did not exist, so approve, reject and renewal stayed disabled. After creating the groups, rejecting worked, and a Finance approver could assign a contract to themselves and record the renewal decision; approvals were recorded, but a request never reached Approved because each step jumped straight to Complete. Sol was the fastest build and one of the best values. All six pages worked, with a consistent indigo theme and charts with legends. Weak points: no request detail panel on the Requests page, contract dates without years, and committed spend showing $0 for most departments.

### GPT-6 Astra

Like Sol, Astra tied approvals to workspace groups and renewals to contract owners. Out of the box those actions stayed disabled. After creating the groups, approvals moved correctly from manager to Finance to VP, each recorded in the audit log, and rejecting worked; renewal decisions still need the named contract owner to sign in, since the app offers no way to reassign an owner. Astra built all six pages in 13 minutes, with a strong Overview: five KPIs, each compared with last quarter, and three charts with legends. Weak points: the Requests and Approvals pages show no detail panel or approve and reject controls until a row is selected, several tables stop at five rows with empty space below, two vendor flag chips are cut off, and the monthly spend chart shows spend for only two departments.

### GPT-6 Luna

All six actions worked end to end, and approval routing was enforced step by step. Each decision wrote its audit entry twice. Luna built a complete, well-themed app for a fraction of the credits of any other model, but took about 26 minutes, longer than every model except DeepSeek. Weak points: "average days to approve" showed 0.0, most vendors showed no spend, and the contracts table left out start dates and owners.

### Claude Haiku 5.5

All six actions worked end to end, with approvals moving from manager to Finance to VP. Haiku built all six pages quickly. Weak points: the spend KPI on the Overview read $0, dates appeared in raw ISO format (2026-10-06T13:00:00-07:00), the app's theme was not applied (default blue buttons), and the Vendors page placed its detail panels above the vendor list.

### DeepSeek Flash

Five of six actions worked end to end; a single approval closed the whole three-step route, and the vendor detail window opened empty. DeepSeek built a complete app with a consistent teal theme for very few credits, and its Contracts page, with renewals grouped by month, was one of the best in the test. It was by far the slowest build, at 52 minutes, because it writes very long responses. Weak points: the spend card showed a $0 budget, actual spend read $0 for every department, and the approval queue offered a single Decide button with no visible comment field.

### Gemini 3.8 Flash

Five of six actions worked end to end, but a single approval skipped the Finance and VP steps, decisions wrote no audit entries, and vendor contracts and invoices stayed empty after selecting a vendor. Gemini's Overview and Contracts pages were strong, and its approval queue showed exactly which approvers each request needed. Weak points: the Requests page had no filters, several tables showed only three to five rows before a pager, the monthly spend chart had no legend, and the sample data used real company names as vendors.

## Design-focused test: a one-page app

The six-page app tests completeness. To see how much design sense each model brings when it is given freedom, we also gave every model a short, loosely worded prompt for a single page, with a brief that asks for a luxurious look rather than spelling out the layout.

> Build a one-page booking desk for Azure Charters, a yacht charter company on the French Riviera with a fleet of eight yachts. The charter team keeps it open all day: it should show which yachts are available, the upcoming charters with guests, dates and destinations, the crew on each yacht, and this season's bookings and revenue at a glance. Fill it with realistic sample data. The design should feel ultra-luxurious and modern: crisp, nautical and elegant, the kind of screen a superyacht company would be proud to show its clients.

<SortableTable
  defaultSort="design"
  columns={[
    { key: 'model', label: 'Model' },
    { key: 'design', label: 'Design (of 10)', defaultDir: 'desc' },
    { key: 'credits', label: 'Credits', format: (v) => v.toLocaleString('en-US') },
    { key: 'minutes', label: 'Build time', format: (v) => `${v.toFixed(1)} min` },
  ]}
  rows={[
    { model: 'Claude Opus 5.5', provider: 'anthropic', design: 7.5, credits: 105, minutes: 3.6 },
    { model: 'GPT-6 Astra', provider: 'openai', design: 7.0, credits: 181, minutes: 5.4 },
    { model: 'Claude Fable 5.1', provider: 'anthropic', design: 6.5, credits: 391, minutes: 7.5 },
    { model: 'Claude Haiku 5.5', provider: 'anthropic', design: 5.5, credits: 4, minutes: 2.2 },
    { model: 'DeepSeek Flash', provider: 'deepseek', design: 5.5, credits: 14, minutes: 43.1 },
    { model: 'GPT-6.1 Sol', provider: 'openai', design: 5.0, credits: 23, minutes: 3.8 },
    { model: 'Claude Sonnet 5.5', provider: 'anthropic', design: 5.0, credits: 59, minutes: 2.5 },
    { model: 'GPT-6 Luna', provider: 'openai', design: 4.5, credits: 3, minutes: 4.8 },
    { model: 'Gemini 3.8 Flash', provider: 'gemini', design: 3.5, credits: 43, minutes: 6.8 },
    { model: 'Grok 4.7', provider: 'grok', design: null, credits: null, minutes: null, missingText: 'Did not finish' },
  ]}
  note="Select a column heading to sort by it; select it again to reverse the order."
/>

Only three models clearly answered the brief. **Claude Opus 5.5** produced the one page that reads as luxury: an ivory canvas, serif display type, gold hairlines and a revenue chart. **GPT-6 Astra** replaced the usual dark header with a refined wordmark and a grid of yacht cards, and **Claude Fable 5.1** used gold-edged cards and an elegant banner. The other models built tidy but generic dashboards: a dark header band above white tables. If the look of an app matters, choose the model for it.

The design scores come from a reviewer who graded the nine screens without knowing which model built which.

<Tabs groupId="yacht" lazy className="model-tabs">
  <TabItem value="opus" label={<ModelName provider="anthropic" bold={false}>Claude Opus 5.5</ModelName>} default>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/yacht/opus.jpg" alt="Booking desk built by Claude Opus 5.5" />
  </TabItem>
  <TabItem value="astra" label={<ModelName provider="openai" bold={false}>GPT-6 Astra</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/yacht/astra.jpg" alt="Booking desk built by GPT-6 Astra" />
  </TabItem>
  <TabItem value="fable" label={<ModelName provider="anthropic" bold={false}>Claude Fable 5.1</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/yacht/fable.jpg" alt="Booking desk built by Claude Fable 5.1" />
  </TabItem>
  <TabItem value="haiku" label={<ModelName provider="anthropic" bold={false}>Claude Haiku 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/yacht/haiku.jpg" alt="Booking desk built by Claude Haiku 5.5" />
  </TabItem>
  <TabItem value="deepseek" label={<ModelName provider="deepseek" bold={false}>DeepSeek Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/yacht/deepseek.jpg" alt="Booking desk built by DeepSeek Flash" />
  </TabItem>
  <TabItem value="sol" label={<ModelName provider="openai" bold={false}>GPT-6.1 Sol</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/yacht/sol.jpg" alt="Booking desk built by GPT-6.1 Sol" />
  </TabItem>
  <TabItem value="sonnet" label={<ModelName provider="anthropic" bold={false}>Claude Sonnet 5.5</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/yacht/sonnet.jpg" alt="Booking desk built by Claude Sonnet 5.5" />
  </TabItem>
  <TabItem value="luna" label={<ModelName provider="openai" bold={false}>GPT-6 Luna</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/yacht/luna.jpg" alt="Booking desk built by GPT-6 Luna" />
  </TabItem>
  <TabItem value="gemini" label={<ModelName provider="gemini" bold={false}>Gemini 3.8 Flash</ModelName>}>
    <img className="screenshot-full img-full" src="/img/tooljet-ai/model-guide/yacht/gemini.jpg" alt="Booking desk built by Gemini 3.8 Flash" />
  </TabItem>
</Tabs>

## Models not included in this test

ToolJet's model picker offers more models than this page compares. We tested the latest model from each family. The Claude 5.5 and GPT-6 models build better apps than the Claude 5 and GPT-5.6 models they replace, and cost less, so the older models are not included.

## How we tested

Every model received the prompt below, unchanged, through the ToolJet AI app builder. Each build ran once, from the prompt to the builder's final message, with no follow-up prompts.

We then opened every page of each app and checked it against a 22-item list taken from the prompt: five KPIs with comparisons and three charts on the Overview; the request table, filters, form and detail panel; the approval queue, approval rules, approve and reject with a comment, and recorded decisions; the vendor list, compliance flags and vendor detail; the contract list, renewal timeline and renewal decision; and the budget comparison and audit log. Each item scored 1 if it was present, populated and plausible, 0.5 if it was present but partly broken, and 0 if it was missing. Design was scored separately, out of 10.

We then used each finished app the way a procurement team would, through its own screens, and checked the result in the app's database: we raised a $62,000 request and checked its approval route, approved one request and rejected another with a comment, recorded a contract renewal decision, and used the request filter and vendor detail. Each of these six actions scored 1 if it worked and was saved correctly, 0.5 if it partly worked, and 0 if it failed. The tester was signed in as a workspace admin. Two apps, built by GPT-6.1 Sol and GPT-6 Astra, limited approvals to workspace groups that did not exist; for those two we also created the groups each app expected, added the tester to them and repeated the approval, rejection and renewal checks. The table shows those results, marked with an asterisk.

The **design-focused test** used the one-page yacht charter prompt shown in that section, built once by every model on 7 October 2026 and graded blind for design. The ServiceNow row in **Recommended models** draws on a separate same-prompt test: a four-page IT operations app on live ServiceNow data, built on 6 October 2026.

| Measure | What it represents |
|:---|:---|
| **Features** | Requested features that were present and working on screen, out of 22 |
| **Design** | Layout, consistency, formatting and readability, out of 10 |
| **Actions** | Actions that worked when used in the app and checked in its database, out of 6 |
| **Credits** | AI usage at provider list price; 1 credit = 1/100 of a US dollar |
| **Build time** | Wall-clock time from sending the prompt to the builder's final message |

<details id="tj-dropdown">
<summary>The prompt</summary>

```text
Build a procurement app for Kestrel Dynamics, a manufacturing company with 3,000 employees across four sites and six departments (Engineering, Operations, IT, Sales, Finance and HR). Store everything in a database the whole team shares and fill it with realistic sample data: the six departments with quarterly budgets, 40 vendors, about 150 purchase requests from the last six months, 30 contracts and about 200 invoices.
Six pages with a left sidebar:
1. Overview: KPI cards for spend this quarter against budget, requests waiting for approval, average days to approve, contracts renewing in the next 90 days and invoices on hold, each compared with last quarter. Charts for monthly spend by department over the last six months, requests by status, and the top 10 vendors by spend.
2. Requests: a searchable table of purchase requests with department, vendor, amount, status and requester, filterable by department, status and date. A form to raise a new request: item, vendor, amount, cost centre and justification. Selecting a request shows its details and approval history.
3. Approvals: the queue of requests waiting for a decision. The approval rules: under $5,000 needs the department manager; $5,000 to $50,000 also needs Finance; over $50,000 also needs a VP. Approvers can approve or reject with a comment, and each decision is recorded with the signed-in user's name and the time.
4. Vendors: a list with risk tier, insurance expiry, security review status, spend this year and open orders. Vendors with an expired or soon-to-expire document are flagged. Selecting a vendor shows their contracts and invoices.
5. Contracts: contracts with vendor, value, start and end dates, auto-renew and owner, with the next 90 days of renewals shown as a timeline. The owner can record a renewal decision: renew, renegotiate or end.
6. Budgets and audit: each department's budget against committed and actual spend this quarter, and an audit log of every approval, rejection and change, showing who did it and when.
Design: a clean, professional look suited to a finance and operations team, easy to read on a laptop.
```

</details>
