---
id: prompting101
title: Prompting 101
---

Prompting is how you communicate with ToolJet's AI to build internal applications. Think of it as giving detailed instructions to a highly skilled developer who understands the platform but needs context about your specific business needs.

The AI then translates these requirements into a fully functional application using ToolJet's low code application builder.

## Why Good Prompting Matters

**The Challenge**: Generic prompts produce generic applications. Simply asking for "a CRM system" or "project management tool" results in basic, template-like apps that don't reflect your actual business processes. <br/>
**The Solution**: Contextual prompting that provides business background, user needs, and specific workflows produces applications that feel purpose-built for your organization.

### Real Impact Example

#### Generic Prompt 

**Prompt:** "Build a customer management system" <br/>
**Result**: Basic contact forms and lists that could work for anyone. <br/>

#### Contextual Prompt

**Prompt**: "Our design agency needs to track 50+ concurrent client projects, manage creative approval workflows, and prevent resource conflicts between our 12-person team..."  <br/>
**Result**: Specialized project management app with approval workflows, resource calendars, and client communication tools.

## What ToolJet Already Handles

Don't waste your prompt describing these - they're built into the platform:

### ToolJet Automatically Provides

<div style={{ display: 'flex' }} >

<div style = {{ width:'50%' }} >

- User authentication and login systems
- Role-based access control and permissions
- Database integration and data storage

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

- API integrations with external services
- Security features and data encryption

</div>

</div>

### Don't Include in Your Prompts

<div style={{ display: 'flex' }} >

<div style = {{ width:'50%' }} >

- "Build user login and authentication"
- "Add role-based permissions"

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

- "Create API integrations"
- "Include security features"

</div>

</div>

### Instead Focus On

<div style={{ display: 'flex' }} >

<div style = {{ width:'50%' }} >

- Business workflows and processes
- Manual data entry and forms
- Custom business logic

</div>

<div style = {{ width:'5%' }} > </div>

<div style = {{ width:'50%' }} >

- Specific reporting needs
- User interface requirements

</div>

</div>

## The 3-Section Formula

Structure your prompts with these three sections for best results:

### 1. Business Context

Explain why you need this tool and what problems it solves.
#### Good Example
"Our sales team currently tracks leads in spreadsheets across 5 different files, causing data inconsistencies and missed follow-ups. We need centralized lead management that prevents duplicate entries and gives visibility into our sales pipeline."

#### Avoid
"Build a CRM system."

### 2. User Personas

Define who will use the tool and what they need to accomplish.

#### Good Format

- Sales Reps - Need to log new leads, update contact information, and track deal progress
- Sales Managers - Require pipeline visibility, team performance metrics, and forecast reporting
- Marketing Team - Must see lead sources, conversion rates, and campaign effectiveness

### 3. User Flows & Features

Describe how users will interact with the tool through specific workflows.

#### Good Format

- Lead Capture Flow - Import leads from various sources, assign to sales reps, set follow-up reminders
- Pipeline Management Flow - Move deals through stages, update probabilities, log interactions
- Reporting Flow - Generate weekly pipeline reports, track conversion metrics, analyze lead sources

## Best Practices

### Do This
- **Be Specific** <br/>
    Instead of "customer management," say "client project tracking for our design agency"
- **Include Real Pain Points** <br/>
    Mention actual problems like "version control issues" or "missed deadlines"
- **Think Workflows** <br/>
    Describe the step-by-step process users will follow
- **Focus on Manual Processes** <br/>
    Describe forms, data entry, and user interactions

### Avoid This

- Generic descriptions lacking proper use cases and context
- Feature lists without context ("needs forms, tables, and reports")
- Technical jargon that doesn't match your business needs
- Overly complex requirements that try to solve everything at once
- UI layout details - let the AI handle design decisions

## How Long Should My Prompt Be?

### Short Prompts (2-3 sentences per section)
- Best for: Simple tools with straightforward workflows
- Risk: May lack necessary detail for complex business logic

### Medium Prompts (1 paragraph per section)
- Best for: Most internal tools
- Sweet spot: Provides enough context without overwhelming
- This length typically produces the most usable results

### Long Prompts (2-3 paragraphs per section)

- Best for: Complex workflows with multiple user types
- Risk: May create overly complicated interfaces

:::tip Pro Tip
Specific prompts use fewer AI credits. Vague prompts make the AI work harder, consuming more credits as it tries to fill in the gaps.
:::

## Scoping Your Application

### Start Small, Then Iterate

Begin with a simple version (3-4 pages) covering core workflows, then build additional features. This approach:
- Makes the application easier to test and refine
- Reduces complexity and potential errors
- Allows you to validate workflows before expanding

## Complete Example: Before & After

### Before (Generic)
"Build a project management system with tasks, deadlines, and team collaboration features."

### After (Contextual)

#### Business Context
Our marketing agency juggles 15+ client campaigns simultaneously, but project details are scattered across email threads, Google Docs, and Slack conversations, causing missed deliverables and confused team members about priorities.

#### User Personas
- Account Managers - Need to track campaign progress, client approvals, and deliverable status
- Creative Team - Require clear briefs, asset approval workflows, and deadline visibility
- Project Directors - Must see resource allocation, campaign profitability, and team workload

#### User Flows & Features

- Campaign Setup Flow - Create project briefs, set deliverable milestones, assign team members and deadlines
- Asset Review Flow - Upload creative assets, collect client feedback, manage revision cycles with approval tracking
- Resource Planning Flow - View team capacity, assign tasks based on availability, track time allocation across campaigns

## Real-World Examples

### Example 1: Vendor Management Portal

#### Business Context:
Our company maintains strategic partnerships with major technology vendors like AWS, IBM, Microsoft, and ServiceNow that are critical for our go-to-market strategy. Currently, we're managing partnership agreements, certification requirements, and co-sell opportunities across multiple spreadsheets and email threads, making it difficult to track revenue attribution or identify new collaboration opportunities.

#### User Personas:
- Partnership Managers - Need to manage vendor relationships, track co-sell opportunities, and ensure certification compliance
- Business Development Team - Requires visibility into partner-driven revenue and joint sales opportunities
- Sales Teams - Must access partner resources, submit deal registrations, and leverage vendor relationships
- Executive Leadership - Needs partnership performance metrics and ROI assessment

#### User Flows & Features:

- Partnership Onboarding Flow - Register new vendor partnerships with tier classification, upload contract terms, set certification requirements, assign partnership managers
- Opportunity Management Flow - Log co-sell opportunities and deal registrations, track joint sales activities and revenue attribution, update opportunity status through sales pipeline
- Certification Tracking Flow - Monitor team certification progress, track renewal dates, maintain compliance documentation, generate certification reports
- Performance Analysis Flow - Generate partnership ROI reports, analyze co-sell effectiveness, create executive scorecards, track milestone achievement

### Example 2: Accounts Payable System

#### Business Context:

Our financial services firm processes 800+ vendor invoices monthly across multiple business units, but we're managing approvals through email chains and tracking payments in disconnected spreadsheets. This creates compliance risks for audits, delayed vendor payments, and makes month-end close extremely difficult.

#### User Personas:

- Accounts Payable Clerks - Need to enter invoice details, match invoices to purchase orders, and schedule payments
- Department Managers - Must review and approve invoices within budget limits and ensure compliance with spending policies
- Finance Controllers - Require visibility into cash flow obligations, aging reports, and month-end accruals
- CFO/Finance Director - Needs high-level spend analytics, vendor relationship insights, and compliance oversight

#### User Flows & Features:

- Invoice Processing Flow - Record invoice details, match against purchase orders, flag discrepancies, assign expense coding
- Approval Workflow Management - Route invoices through approval chains based on thresholds, track approval status, escalate overdue approvals
- Payment Scheduling Flow - Schedule payments based on vendor terms, batch payments, track confirmations, maintain payment history
- Reporting & Analytics Flow - Generate aging reports, create spend analytics by department, produce audit trail reports, analyze vendor payment patterns

## Quick Start Checklist

Before submitting your prompt, verify you've included:

- [ ] Business context explaining the current problem
- [ ] Specific pain points you're experiencing
- [ ] All relevant user personas and their needs
- [ ] Clear user flows describing how people will use the app
- [ ] Industry-specific terminology your team uses
- [ ] Realistic scope (start with 3-4 core pages)

**Remember**: You don't need to format your prompt into rigid sections. The AI will understand your requirements regardless of structure - what matters most is the content and context you provide.
