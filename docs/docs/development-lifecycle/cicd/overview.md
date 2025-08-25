---
id: overview
title: Overview
---
<div className="badge badge--primary heading-badge">   
  <img 
    src="/img/badge-icons/premium.svg" 
    alt="Icon" 
    width="16" 
    height="16" 
  />
 <span>Paid feature</span>
</div>

ToolJet’s git sync CI/CD feature enables organizations to integrate ToolJet applications into their existing CI/CD pipelines using industry-standard tools such as Jenkins, GitHub Actions, CircleCI, and GitLab CI. This feature brings the power of git sync to your automation workflows through a set of ToolJet APIs, allowing your development teams to automate Git operations without relying on manual UI interactions.

For example, teams managing internal reporting tools or approval workflows can automate deployment to staging and production environments, ensuring consistency without manual UI intervention.

## Why Git Sync CI/CD

Modern development teams rely on CI/CD pipelines to enforce consistency, streamline deployments, and enable faster iterations. Traditionally, ToolJet applications required manual interactions to perform Git operations like syncing, pushing, or pulling changes.

With git sync CI/CD, you can:
- Automate Git operations (sync, push, pull) directly from your pipelines.
- Programmatically manage ToolJet application deployments as part of your broader SDLC process.
- Integrate with your existing DevOps tools and processes, reducing context-switching and operational overhead.

## Key Benefits
- Enterprise-Grade Automation: Incorporate ToolJet applications into your organization’s enterprise CI/CD setup.
- Increased Developer Productivity: Developers can focus on building applications while CI/CD pipelines handle deployments and updates.
- Consistency and Governance: Maintain application lifecycle consistency across environments with Git-driven workflows.
- Easy Integration: Easily integrate with any DevOps tool using ToolJet's RESTful APIs.

## Next Steps
- Refer to [Using Git Sync CI/CD APIs](/docs/development-lifecycle/CICD/gitsync-api) for detailed API usage.
- Check out [Git Sync CI/CD with Jenkins Example](/docs/development-lifecycle/CICD/example) for a practical implementation guide.