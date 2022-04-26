<p align="center">
  <img src="https://user-images.githubusercontent.com/7828962/143565889-f4c51c89-fc7e-471c-90b6-42ae697bca6b.png" width="200" />
  <br/>
</p>

ToolJet is an **open-source low-code framework** to build and deploy internal tools quickly without much effort from the engineering teams. You can connect to your data sources, such as databases (like PostgreSQL, MongoDB, Elasticsearch, etc), API endpoints (ToolJet supports importing OpenAPI spec & OAuth2 authorization), and external services (like Stripe, Slack, Google Sheets, Airtable) and use our pre-built UI widgets to build internal tools.

![Docker Cloud Build Status](https://img.shields.io/docker/cloud/build/tooljet/tooljet-ce)
![GitHub contributors](https://img.shields.io/github/contributors/tooljet/tooljet)
[![GitHub issues](https://img.shields.io/github/issues/ToolJet/ToolJet)](https://github.com/ToolJet/ToolJet/issues)
[![GitHub stars](https://img.shields.io/github/stars/ToolJet/ToolJet)](https://github.com/ToolJet/ToolJet/stargazers)
![GitHub closed issues](https://img.shields.io/github/issues-closed/tooljet/tooljet)
![GitHub pull requests](https://img.shields.io/github/issues-pr-raw/tooljet/tooljet)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/tooljet/tooljet)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/tooljet/tooljet)
[![GitHub license](https://img.shields.io/github/license/ToolJet/ToolJet)](https://github.com/ToolJet/ToolJet)
[![Twitter Follow](https://img.shields.io/twitter/follow/ToolJet?style=social)](https://twitter.com/ToolJet)


<p align="center">
  <kbd>
    <img src="https://user-images.githubusercontent.com/7828962/149466475-1d1f0b3e-8e25-49e8-a5c9-73e068f78de9.png"/>
  </kbd>
</p>


---

### Visual application builder 
<p align="center">
  <kbd>
    <img src="https://user-images.githubusercontent.com/7828962/152667206-aaa0ae52-1260-48ce-9d0d-0f2e478f9fd1.png"/>
  </kbd>
</p>


![2_alt](https://user-images.githubusercontent.com/7828962/152912302-625f7f3e-3659-46cc-9be6-b52c4a3c370c.png)



![3](https://user-images.githubusercontent.com/7828962/152912291-f5019ed6-e319-4b00-910f-ee7bdb1c05d7.png)
![Final_comment_final](https://user-images.githubusercontent.com/7828962/152912265-a9d4a25f-0853-43af-b92a-322af6b0a4eb.gif)
![5](https://user-images.githubusercontent.com/7828962/152912276-e85c16a4-438f-4b88-9072-18e60017f74b.png)
![6](https://user-images.githubusercontent.com/7828962/152912278-422458b9-eec0-477c-9554-672091734901.png)



## All features

- *Visual app builder:* 35+ built-in responsive widgets such as Tables, Charts, Lists, Forms, Progressbars, and more.
- *20+ data sources:* connect to databases, cloud storages and APIs.
- *Desktop & mobile*: ;layout widths can be customised to support different screens. 
- *Self-host:* (supports Docker, Kubernetes, Heroku, AWS EC2, Google Cloud Run, and more).
- *Collaborate:* add comments anywhere on the canvas and tag your team members.
- *Extend with plugins:*: use our [commandline tool](https://www.npmjs.com/package/tooljet) to easily boostrap new connectors.
- *Version control:* every application have different versions with proper release cycle.
- *Run JS code:* ability custom JavaScript snippets
- *Granular access control* on organization-level and app-level.
- *low-code:* write JS code almost anywhere in the builder. For example, the color property of text can be set to `status === 'success' ? 'green' : 'red'`
- *no-code query editors* for all supported data sources.
- *Join and transform data:* transform query results using just JavaScript code. 
- *Secure:* All the credentials are securely encrypted using `aes-256-gcm`.
- *Doesn't store data:* ToolJet acts only as a proxy and doesn't store any data.
- *SSO:* Supports multiple SSO providers

<hr>

## Quickstart 
The easiest way to get started with ToolJet is by creating a [ToolJet Cloud](https://tooljet.com) account. ToolJet Cloud offers a hosted solution of ToolJet. If you want to self-host ToolJet, kindly proceed to [deployment documentation](https://docs.tooljet.com/docs/deployment/architecture).

You can deploy ToolJet on Heroku for free using the one-click-deployment button below.
<p align="center">
<a href="https://heroku.com/deploy?template=https://github.com/tooljet/tooljet/tree/main"><img src="https://www.herokucdn.com/deploy/button.svg" /></a>
</P>

## Tutorials and examples 

[GitHub contributor leaderboard using ToolJet](https://blog.tooljet.io/building-a-github-contributor-leaderboard-using-tooljet/)<br>
[Cryptocurrency dashboard using ToolJet](https://blog.tooljet.com/how-to-build-a-cryptocurrency-dashboard-in-10-minutes/)<br>
[WhatsApp CRM using ToolJet](https://blog.tooljet.com/build-a-whatsapp-crm-using-tooljet-within-10-mins/)<br>
[AWS S3 file explorer](https://blog.tooljet.com/building-an-app-to-view-and-upload-files-in-aws-s3-bucket/)<br>

## Documentation
Documentation is available at https://docs.tooljet.com.

- [Getting Started](https://docs.tooljet.com)<br>
- [Datasource Reference](https://docs.tooljet.com/docs/data-sources/airtable/)<br>
- [Widget Reference](https://docs.tooljet.com/docs/widgets/button)

## Self-hosted
You can use ToolJet cloud for a fully managed solution. If you want to self-host ToolJet, we have guides on deploying ToolJet on Kubernetes, AWS EC2, Docker, Heroku and more.

| Provider  | Documentation |
| ------------- | ------------- |
| AWS EC2 | [Link](https://docs.tooljet.com/docs/deployment/ec2)  |
| AWS EKS (Kubernetes) | [Link](https://docs.tooljet.com/docs/deployment/kubernetes)   |
| GCP GKE (Kubernetes) | [Link](https://docs.tooljet.com/docs/deployment/kubernetes-gke)   |
| Azure AKS (Kubernetes) | [Link](https://docs.tooljet.com/docs/deployment/kubernetes-aks)   |
| Heroku  | [Link](https://docs.tooljet.com/docs/deployment/heroku)  |
| Docker  | [Link](https://docs.tooljet.com/docs/deployment/docker)   |
| Google Cloud Run  | [Link](https://docs.tooljet.com/docs/deployment/google-cloud-run)   |

## Community support
For general help using ToolJet, please refer to the official [documentation](https://docs.tooljet.com/docs/intro/). For additional help, you can use one of these channels to ask a question:

- [Slack](https://join.slack.com/t/tooljet/shared_invite/zt-r2neyfcw-KD1COL6t2kgVTlTtAV5rtg) - Discussions with the community and the team.
- [GitHub](https://github.com/ToolJet/ToolJet/issues) - For bug reports and feature requests.
- [Twitter](https://twitter.com/ToolJet) - Get the product updates easily.

## Roadmap
Check out our [roadmap](https://github.com/ToolJet/ToolJet/projects/2) to get informed of the latest features released and the upcoming ones.

## Branching model
We use the git-flow branching model. The base branch is `develop`. If you are looking for a stable version, please use the main branch or tags labeled as v1.x.x.

## Contributing
Kindly read our [Contributing Guide](CONTRIBUTING.md) to learn and understand about our development process, how to propose bug fixes and improvements, and how to build and test your changes to ToolJet. <br>

## Contributors
<a href="https://github.com/tooljet/tooljet/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tooljet/tooljet" />
</a>

## License
ToolJet © 2022, ToolJet Solutions Inc - Released under the GNU Affero General Public License v3.0.
