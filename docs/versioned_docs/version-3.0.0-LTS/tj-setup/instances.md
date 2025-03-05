---
id: instances
title: Instances 
---

Instances in ToolJet refer to standalone installations or deployments of the ToolJet platform. Each instance operates independently and can have its own configurations, data, and user base. They serve as the foundational environment for running and managing applications built on ToolJet.

## Why Use Instances?
Instances help with:

- **Data Isolation**: Keeping data separate for teams, departments, or clients.
- **Customization**: Adapting to specific business needs.
- **Compliance**: Hosting data to meet regulations.

Check out the [setup guide](https://docs.tooljet.com/docs/setup/) to explore the different options available for deploying ToolJet on your machine.

## When to Use a Single Instance?

Opting for a single instance is often the best choice when your team is starting out or managing a straightforward set of requirements. For example, if you have a small team or if your application does not require strict separation of environments, a single instance can simplify management and reduce overhead.

ToolJet allows you to create multiple environments like development, staging, and production within a single instance. This ensures your team can build, test, and deploy applications securely and efficiently, delivering updates safely to users. Checkout the [Multi-Environment](/docs/development-lifecycle/environment/self-hosted/multi-environment) doc for more details.

## When to Use Multiple Instances? 

Deploying multiple ToolJet instances offers enhanced flexibility and control, allowing you to address specific security, compliance, or performance requirements. Each instance operates independently and can serve to specific security, compliance, or performance requirements.

Multiple instances are often used to align with different stages of application development or organizational needs. For example, developers might use separate instances for development and staging, while production is isolated for end-users.

ToolJet does not limit the number of instances you can deploy. Each instance can operate with its own database, ensuring data and configurations remain segregated.