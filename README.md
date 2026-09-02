ToolJet is an open-source platform for building internal tools: admin panels, dashboards, and operational apps that run on your existing databases, APIs, and SaaS systems.

Build them by prompting. ToolJet AI turns a description into pages, queries, and components, and the coding agent you already use can do the same through ToolJet's MCP server. Agents build against ToolJet's real component and data contracts rather than emitting free-form code, so what you get is an actual ToolJet app: one your team keeps editing in the visual builder, under the same permissions, environments, and version history as everything else.

Self-host it, or use ToolJet Cloud.

 :star: If you find ToolJet useful, please consider giving us a star on GitHub! Your support helps us continue to innovate and deliver exciting features.

![Docker Cloud Build Status](https://img.shields.io/docker/automated/tooljet/tooljet-ce)
![Number of GitHub contributors](https://img.shields.io/github/contributors/tooljet/tooljet)
[![Number of GitHub issues that are open](https://img.shields.io/github/issues/ToolJet/ToolJet)](https://github.com/ToolJet/ToolJet/issues)
[![Number of GitHub stars](https://img.shields.io/github/stars/ToolJet/ToolJet)](https://github.com/ToolJet/ToolJet/stargazers)
![Number of GitHub closed issues](https://img.shields.io/github/issues-closed/tooljet/tooljet)
![Number of GitHub pull requests that are open](https://img.shields.io/github/issues-pr-raw/tooljet/tooljet)
![GitHub release; latest by date](https://img.shields.io/github/v/release/tooljet/tooljet)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/tooljet/tooljet)
[![GitHub license which is AGPL license](https://img.shields.io/github/license/ToolJet/ToolJet)](https://github.com/ToolJet/ToolJet)
[![Follow us on X, formerly Twitter](https://img.shields.io/twitter/follow/ToolJet?style=social)](https://twitter.com/ToolJet)

<p align="center">
    <img width="2608" height="1578" alt="Screenshot 2026-09-01 at 6 56 04 PM" src="https://github.com/user-attachments/assets/a6451f99-4533-49f3-93c9-58191fe33447" />
</p>


## Build with your coding agent

ToolJet ships a [Model Context Protocol](https://modelcontextprotocol.io/introduction) server, so the coding agent you already use can build ToolJet apps directly: generating pages, queries, and components from a prompt, and modifying existing apps in place.

Works with **Claude Code**, **Codex**, and **Grok Build** as plugins that bundle ToolJet's app-builder skill, and with **Cursor** or any other MCP-compatible client over the MCP server alone. Agents build against ToolJet's governed first-party contracts, so they work from the platform's real schemas instead of guessing at them, and operations run on your own model subscription rather than drawing down ToolJet AI credits.

ToolJet MCP is currently in beta. See the [ToolJet MCP guide](https://docs.tooljet.com/docs/build-with-ai/mcp/overview) to set it up.

<hr>

## Quickstart
The easiest way to get started with ToolJet is by creating a [ToolJet Cloud](https://tooljet.com) account. ToolJet Cloud offers a hosted solution of ToolJet. If you want to self-host ToolJet, kindly proceed to [deployment documentation](https://docs.tooljet.com/docs/setup/).

### Try using Docker
Want to give ToolJet a quick spin on your local machine? You can run the following command from your terminal to have ToolJet up and running right away.


```bash
docker run \
  --name tooljet \
  --restart unless-stopped \
  -p 80:80 \
  --platform linux/amd64 \
  -v tooljet_data:/var/lib/postgresql/13/main \
  tooljet/try:ee-lts-latest
```

*For users upgrading their ToolJet version, we recommend choosing the LTS version over the latest version. The LTS version ensures stability with production bug fixes, security patches, and performance enhancements.*

## Features  

### Community Edition (CE)  
- **Visual App Builder:** 80+ responsive components (Tables, Charts, Forms, Lists, Progress Bars, and more).  
- **ToolJet Database:** Built-in no-code database.  
- **Multi-page Apps & Multiplayer Editing:** Build complex apps collaboratively.  
- **90+ Data Sources:** Connect to databases, APIs, cloud storage, and SaaS tools.  
- **Flexible Deployment:** Self-host with Docker, Kubernetes, AWS, GCP, Azure, and more.  
- **Collaboration Tools:** Inline comments, mentions, and granular access control.  
- **Extensibility:** Create plugins and connectors with the [ToolJet CLI](https://www.npmjs.com/package/@tooljet/cli).  
- **Code Anywhere:** Run JavaScript and Python inside your apps.  
- **Secure by Design:** AES-256-GCM encryption, proxy-only data flow, SSO support.  

### ToolJet AI (Enterprise)  
Everything in CE, plus:  
- **AI App Generation:** Create apps instantly from natural language prompts.  
- **AI Query Builder:** Generate and transform queries with AI assistance.  
- **AI Debugging:** Identify and fix issues with one click.  
- **Agent Builder:** Create intelligent agents to automate workflows and orchestrate processes.  
- **Workflows:** Automate multi-step processes with branching logic, on a schedule or triggered by webhook.  
- **Modules:** Build reusable units of UI and logic once, then use them across multiple apps.  
- **Enterprise-grade Security & Compliance:** SOC 2 and GDPR readiness, audit logs, and advanced access control.
- **User Management:** Role-based access (RBAC), custom groups, SCIM provisioning, and granular app/data permissions.  
- **Multi-environment Management:** Seamless dev/stage/prod environments.  
- **GitSync & CI/CD:** Integrate with GitHub/GitLab for version control, app version history, and streamlined deployments.  
- **Branding & Customization:** White-labeling, custom domains, and custom theming for organizational branding.  
- **Fine-Grained Access Control:** Secure data and actions at the row, component, page, and query levels.  
- **Embedded Apps:** Embed ToolJet apps securely within other applications or portals.  
- **Enterprise Support:** SLAs, priority bug fixes, and onboarding assistance.

<hr>

## Tutorials and examples

[Time Tracker Application](https://docs.tooljet.com/docs/#quickstart-guide)<br>
[Build your own CMS using low-code](https://blog.tooljet.com/build-cms-using-lowcode-and-mongodb/)<br>
[AWS S3 Browser](https://blog.tooljet.com/build-an-aws-s3-broswer-with-tooljet/)<br>

## Documentation
Documentation is available at https://docs.tooljet.com.

- [Getting Started](https://docs.tooljet.com)<br>
- [Data source Reference](https://docs.tooljet.com/docs/data-sources/airtable/)<br>
- [Component Reference](https://docs.tooljet.com/docs/widgets/button)

## Self-hosted
You can use ToolJet Cloud for a fully managed solution. If you want to self-host ToolJet, we have guides on deploying ToolJet on Kubernetes, AWS EC2, Docker, and more.

| Provider  | Documentation |
| :------------- | :------------- |
| Digital Ocean | [Link](https://docs.tooljet.com/docs/setup/digitalocean)  |
| Docker  | [Link](https://docs.tooljet.com/docs/setup/docker)   |
| AWS EC2 | [Link](https://docs.tooljet.com/docs/setup/ec2)  |
| AWS ECS | [Link](https://docs.tooljet.com/docs/setup/ecs)   |
| OpenShift | [Link](https://docs.tooljet.com/docs/setup/openshift)   |
| Helm | [Link](https://docs.tooljet.com/docs/setup/helm)   |
| AWS EKS (Kubernetes) | [Link](https://docs.tooljet.com/docs/setup/kubernetes)   |
| GCP GKE (Kubernetes) | [Link](https://docs.tooljet.com/docs/setup/kubernetes-gke)   |
| Azure AKS (Kubernetes) | [Link](https://docs.tooljet.com/docs/setup/kubernetes-aks)   |
| Azure Container | [Link](https://docs.tooljet.com/docs/setup/azure-container)   |
| Google Cloud Run  | [Link](https://docs.tooljet.com/docs/setup/google-cloud-run)   |
| Deploying ToolJet client  | [Link](https://docs.tooljet.com/docs/setup/client)   |
| Deploying ToolJet on a Subpath  | [Link](https://docs.tooljet.com/docs/setup/tooljet-subpath/)   |

## Marketplace 
ToolJet can now be found on both AWS and Azure Marketplaces, making it simpler than ever to access and deploy our app-building platform.

Find ToolJet on AWS Marketplace [here](https://aws.amazon.com/marketplace/pp/prodview-fxjto27jkpqfg?sr=0-1&ref_=beagle&applicationId=AWSMPContessa) and explore seamless integration on Azure Marketplace [here](https://azuremarketplace.microsoft.com/en-us/marketplace/apps/tooljetsolutioninc1679496832216.tooljet?tab=Overview).

## Community support
For general help using ToolJet, please refer to the official [documentation](https://docs.tooljet.com/docs/). For additional help, you can use one of these channels to ask a question:

- [Slack](https://tooljet.com/slack) - Discussions with the community and the team.
- [GitHub](https://github.com/ToolJet/ToolJet/issues) - For bug reports and feature requests.
- [𝕏 (Twitter)](https://twitter.com/ToolJet) - Get the product updates quickly.

## Roadmap
Check out our [roadmap](https://github.com/orgs/ToolJet/projects/15) to stay updated on recently released features and learn about what's coming next.

## Branching model
We use the git-flow branching model. The base branch is `develop`. If you are looking for a stable version, please use the main branch or tags labeled as v1.x.x.

## Contributing
Kindly read our [Contributing Guide](CONTRIBUTING.md) to familiarize yourself with ToolJet's development process, how to suggest bug fixes and improvements, and the steps for building and testing your changes. <br>

## Contributors
<a href="https://github.com/tooljet/tooljet/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tooljet/tooljet&max=400&columns=20" />
  <img src="https://us-central1-tooljet-hub.cloudfunctions.net/github" width="0" height="0" />
</a>

## License
ToolJet © 2023, ToolJet Solutions Inc - Released under the GNU Affero General Public License v3.0.
