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



<p align="center">
  <kbd>
    <img src="https://user-images.githubusercontent.com/7828962/144586771-c6d6cba5-8f79-4e0c-80b4-aa1a38657229.png"/>
  </kbd>
</p>


## Features

- Visual app builder with widgets, such as tables, charts, modals, buttons, dropdowns, and more.
- All widgets are responsive
- Mobile 📱 & desktop layouts 🖥
- Dark mode
- Connect to databases, cloud storages and APIs.
- Deploy on-premise (supports Docker, Kubernetes, Heroku, AWS EC2, Google Cloud Run, and more).
- Granular access control on organization-level and app-level.
- Write JS code almost anywhere in the builder.
- Query editors for all supported data sources.
- Transform query results using JS code. 
- All the credentials are securely encrypted using `aes-256-gcm`.
- ToolJet acts only as a proxy and doesn't store any data.
- Support for OAuth.

<hr>

## Quickstart 
The easiest way to get started with ToolJet is by creating a [ToolJet Cloud](https://tooljet.com) account. ToolJet Cloud offers a hosted solution of ToolJet. If you want to self-host ToolJet, kindly proceed to [deployment documentation](https://docs.tooljet.com/docs/deployment/architecture).

You can deploy ToolJet on Heroku for free using the one-click-deployment button below.
<p align="center">
<a href="https://heroku.com/deploy?template=https://github.com/tooljet/tooljet/tree/main"><img src="https://www.herokucdn.com/deploy/button.svg" /></a>
</P>

## Examples 

[GitHub contributor leaderboard using ToolJet](https://blog.tooljet.io/building-a-github-contributor-leaderboard-using-tooljet/)<br>
[Cryptocurrency dashboard using ToolJet](https://blog.tooljet.com/how-to-build-a-cryptocurrency-dashboard-in-10-minutes/)<br>
[WhatsApp CRM using ToolJet](https://blog.tooljet.com/build-a-whatsapp-crm-using-tooljet-within-10-mins/)<br>
[AWS S3 file explorer](https://blog.tooljet.com/building-an-app-to-view-and-upload-files-in-aws-s3-bucket/)<br>

## Documentation
Documentation is available at https://docs.tooljet.com.

- [Getting Started](https://docs.tooljet.com)<br>
- [Deploying](https://docs.tooljet.com/docs/deployment/architecture)<br>
- [Datasource Reference](https://docs.tooljet.com/docs/data-sources/airtable/)<br>
- [Widget Reference](https://docs.tooljet.com/docs/widgets/button)

## Branching model
We use the git-flow branching model. The base branch is `develop`. If you are looking for a stable version, please use the main branch or tags labeled as v1.x.x.

## Contributing
Kindly read our [Contributing Guide](CONTRIBUTING.md) to learn and understand about our development process, how to propose bug fixes and improvements, and how to build and test your changes to ToolJet. <br>

## Contributors
<a href="https://github.com/tooljet/tooljet/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=tooljet/tooljet" />
</a>

## Licence
ToolJet © 2021, ToolJet Solutions Inc - Released under the GNU Affero General Public License v3.0.
