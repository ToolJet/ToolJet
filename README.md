ToolJet is an **open-source low-code framework** to build and deploy internal tools quickly with minimal engineering effort. ToolJet's drag and drop frontend builder allows you to build complicated responsive frontends within minutes. You can also connect to your data sources, such as databases ( PostgreSQL, MongoDB, Elasticsearch & more), API endpoints (ToolJet supports importing OpenAPI spec & OAuth2 authorization), SaaS tools (Stripe, Slack, Google Sheets, Airtable, Notion & more) and object storage services ( S3, GCS, Minio, etc ) to fetch and write data.

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
    <img src="https://user-images.githubusercontent.com/7828962/211444352-4d6d2e4a-13c9-4980-9e16-4aed4af9811b.png"/>

</p>


<p align="center">
  <kbd>
    <img src="https://user-images.githubusercontent.com/7828962/202402863-2851a072-9dca-4b8b-9473-0d044373928b.png"/>

  </kbd>
</p>

<p align="center">
  <kbd>
<img src="https://user-images.githubusercontent.com/7828962/211364385-10714e24-f1ac-4e72-a2a1-ec7dc2d412ab.png"/>
  </kbd>
</p>

<p align="center">
  <kbd>
<img src="https://user-images.githubusercontent.com/7828962/202402422-8f1df2a4-5c07-4125-9c2e-5450b90f464c.png"/>
  </kbd>
</p>

<p align="center">
  <kbd>
<img src="https://user-images.githubusercontent.com/7828962/202402574-7cd7c606-d751-4de1-ba56-abbedba54b13.png"/>
  </kbd>
</p>


## All features

- **Visual app builder:** 40+ built-in responsive widgets such as Tables, Charts, Lists, Forms, Progressbars, and more.
- **ToolJet Database:** In-built no-code database.
- **Multi-Page:** Build an application with as many pages as you want.
- **Multiplayer editing:** multiple users can use the app builder at the same time.
- **40+ data sources:** connect to external databases, cloud storages and APIs.
- **Desktop & mobile:** layout widths can be customised to support different screens.
- **Self-host:** (supports Docker, Kubernetes, Heroku, AWS EC2, Google Cloud Run, and more).
- **Collaborate:** add comments anywhere on the canvas and tag your team members.
- **Extend with plugins:** use our [commandline tool](https://www.npmjs.com/package/@tooljet/cli) to easily bootstrap new connectors.
- **Version control:** every application have different versions with proper release cycle.
- **Run JS & Python code:** ability custom JavaScript & Python snippets
- **Granular access control** on group-level and app-level.
- **Low-code:** write JS code almost anywhere in the builder. For example, the color property of text can be set to `status === 'success' ? 'green' : 'red'`
- **No-code query editors:** for all supported data sources.
- **Join and transform data:** transform query results using just JavaScript/Python code.
- **Secure:** All the credentials are securely encrypted using `aes-256-gcm`.
- **Doesn't store data:** ToolJet acts only as a proxy and doesn't store any data.
- **SSO:** Supports multiple SSO providers

<hr>

## Quickstart
The easiest way to get started with ToolJet is by creating a [ToolJet Cloud](https://tooljet.com) account. ToolJet Cloud offers a hosted solution of ToolJet. If you want to self-host ToolJet, kindly proceed to [deployment documentation](https://docs.tooljet.com/docs/setup/).

<p align="center">
  <a href="https://heroku.com/deploy?template=https://github.com/tooljet/tooljet/tree/main"><img src="https://www.herokucdn.com/deploy/button.svg" alt="Deploy to Heroku" height=32></a>
  <a href="https://cloud.digitalocean.com/apps/new?repo=https://github.com/ToolJet/ToolJet/tree/main"><img src="https://www.deploytodo.com/do-btn-blue.svg" alt="Deploy to DigitalOcean" height=32></a>
</p>

### Try using Docker
Want to give ToolJet a quick spin on your local machine? You can run the following command from your terminal to have ToolJet up and running right away.

```bash
docker run \
  --name tooljet \
  --restart unless-stopped \
  -p 80:80 \
  -v tooljet_data:/var/lib/postgresql/13/main \
  tooljet/try:latest
```

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
| AWS EC2 | [Link](https://docs.tooljet.com/docs/setup/ec2)  |
| AWS EKS (Kubernetes) | [Link](https://docs.tooljet.com/docs/setup/kubernetes)   |
| AWS ECS | [Link](https://docs.tooljet.com/docs/setup/ecs)   |
| GCP GKE (Kubernetes) | [Link](https://docs.tooljet.com/docs/setup/kubernetes-gke)   |
| Azure AKS (Kubernetes) | [Link](https://docs.tooljet.com/docs/setup/kubernetes-aks)   |
| Heroku  | [Link](https://docs.tooljet.com/docs/setup/heroku)  |
| Docker  | [Link](https://docs.tooljet.com/docs/setup/docker)   |
| Google Cloud Run  | [Link](https://docs.tooljet.com/docs/setup/google-cloud-run)   |


## Community support
For general help using ToolJet, please refer to the official [documentation](https://docs.tooljet.com/docs/). For additional help, you can use one of these channels to ask a question:

- [Slack](https://tooljet.com/slack) - Discussions with the community and the team.
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
  <img src="https://contrib.rocks/image?repo=tooljet/tooljet&max=400&columns=20" />
  <img src="https://us-central1-tooljet-hub.cloudfunctions.net/github" width="0" height="0" />
</a>

## License
ToolJet © 2022, ToolJet Solutions Inc - Released under the GNU Affero General Public License v3.0.
