ToolJet is an **open-source low-code** platform for building and deploying internal tools with minimal engineering effort. With its drag-and-drop app-builder, you can create complex, responsive applications in minutes. ToolJet supports integration with a wide range of data sources, including databases like PostgreSQL, MongoDB, and Elasticsearch; API endpoints with OpenAPI spec and OAuth2 support; SaaS tools such as Stripe, Slack, Google Sheets, Airtable, and Notion; and object storage services like S3, Google Cloud Storage, and MinIO — enabling you to fetch, transform, and write data with ease.

ToolJet supports **AI integrations** with services like OpenAI, Hugging Face, Mistral, and more — allowing you to build secure AI-powered applications such as chat assistants, document analyzers, or content generators, all within the same low-code environment.

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
    <img src="docs/static/img/readme/banner.png" alt="Tooljet dashboard"/>
</p>

<p align="center">
    <img src="docs/static/img/readme/flowchart.png" alt="Platform overview"/>
</p>

## All features

- **Visual App Builder:** 60+ built-in responsive components, including Tables, Charts, Lists, Forms, and Progress Bars.
- **ToolJet Database:** Built-in no-code database.
- **Multi-Page:** Build an application with multiple pages.
- **Multiplayer editing:** Allows simultaneous app building by multiple developers.
- **65+ data sources:** Integrate with external databases, cloud storage, and APIs.
- **AI-powered applications:** Connect with OpenAI, Hugging Face, Mistral, and more to build intelligent apps powered by state-of-the-art language models.
- **Desktop & mobile:** Customize layout widths to fit various screen sizes.
- **Self-host:** Supports Docker, Kubernetes, AWS AMI, Google Cloud Run, and more.
- **Collaborate:** Add comments anywhere on the canvas and tag your team members.
- **Extend with plugins:** Use our [command-line tool](https://www.npmjs.com/package/@tooljet/cli) to easily bootstrap new connectors.
- **Version control:** Manage multiple application versions with a structured release cycle.
- **Run JS & Python code:** Execute custom JavaScript and Python snippets.
- **Granular access control:** Set permissions at both group and app levels.
- **No-code query editors:** Query Editors are available for all supported data sources.
- **Transform data:** Process and transform complex data using JavaScript or Python code.
- **Secure:** All the credentials are securely encrypted using `aes-256-gcm`.
- **Data Privacy:** ToolJet serves solely as a proxy and does not store data.
- **SSO:** Supports multiple Single Sign-On providers.

<hr>

## Quickstart

The easiest way to get started with ToolJet is by creating a [ToolJet Cloud](https://tooljet.ai) account. ToolJet Cloud offers a hosted solution of ToolJet. If you want to self-host ToolJet, kindly proceed to [deployment documentation](https://docs.tooljet.ai/docs/setup/).

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

_For users upgrading their ToolJet version, we recommend choosing the LTS version over the latest version. The LTS version ensures stability with production bug fixes, security patches, and performance enhancements._

## Tutorials and examples

[Build an Employee Directory](https://docs.tooljet.ai/docs/#quickstart-guide/)<br>
[Build your own Ed Tech CRM](https://blog.tooljet.ai/building-an-ed-tech-sales-crm-using-tooljet/)<br>
[Build an Employee Engagement Survey Dashboard](https://blog.tooljet.ai/build-an-employee-engagement-survey-dashboard-using-tooljet/)<br>

## Documentation

Documentation is available at https://docs.tooljet.ai.

- [Getting Started](https://docs.tooljet.ai)<br>
- [Data source Reference](https://docs.tooljet.ai/docs/data-sources/airtable/)<br>
- [Component Reference](https://docs.tooljet.ai/docs/widgets/button)

## Self-hosted

You can use ToolJet Cloud for a fully managed solution. If you want to self-host ToolJet, we have guides on deploying ToolJet on Kubernetes, AWS AMI, Docker, and more.

| Provider                       | Documentation                                               |
| :----------------------------- | :---------------------------------------------------------- |
| Digital Ocean                  | [Link](https://docs.tooljet.ai/docs/setup/digitalocean)     |
| Docker                         | [Link](https://docs.tooljet.ai/docs/setup/docker)           |
| AWS AMI                        | [Link](https://docs.tooljet.ai/docs/setup/ami)              |
| AWS ECS                        | [Link](https://docs.tooljet.ai/docs/setup/ecs)              |
| OpenShift                      | [Link](https://docs.tooljet.ai/docs/setup/openshift)        |
| Helm                           | [Link](https://docs.tooljet.ai/docs/setup/helm)             |
| AWS EKS (Kubernetes)           | [Link](https://docs.tooljet.ai/docs/setup/kubernetes)       |
| GCP GKE (Kubernetes)           | [Link](https://docs.tooljet.ai/docs/setup/kubernetes-gke)   |
| Azure AKS (Kubernetes)         | [Link](https://docs.tooljet.ai/docs/setup/kubernetes-aks)   |
| Azure Container                | [Link](https://docs.tooljet.ai/docs/setup/azure-container)  |
| Google Cloud Run               | [Link](https://docs.tooljet.ai/docs/setup/google-cloud-run) |
| Deploying ToolJet client       | [Link](https://docs.tooljet.ai/docs/setup/client)           |
| Deploying ToolJet on a Subpath | [Link](https://docs.tooljet.ai/docs/setup/tooljet-subpath/) |

## Marketplace

ToolJet can now be found on both AWS and Azure Marketplaces, making it simpler than ever to access and deploy our app-building platform.

Find ToolJet on AWS Marketplace [here](https://aws.amazon.com/marketplace/pp/prodview-fxjto27jkpqfg?sr=0-1&ref_=beagle&applicationId=AWSMPContessa) and explore seamless integration on Azure Marketplace [here](https://azuremarketplace.microsoft.com/en-us/marketplace/apps/tooljetsolutioninc1679496832216.tooljet?tab=Overview).

## Community support

For general help using ToolJet, please refer to the official [documentation](https://docs.tooljet.ai/docs/). For additional help, you can use one of these channels to ask a question:

- [Slack](https://tooljet.ai/slack) - Discussions with the community and the team.
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
