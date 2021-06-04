<p align="center">
  <img src="https://app.tooljet.io/assets/images/logo-text.svg" width="300" />
  <br/>
  Built and deploy internal tools.
</p>


ToolJet is an **open-source low-code framework** to build and deploy internal tools quickly without much effort from the engineering teams. You can connect to your data sources such as databases ( like PostgreSQL, MongoDB, Elasticsearch, etc ), API endpoints ( ToolJet supports importing OpenAPI spec & OAuth2 authorization) and external services ( like Stripe, Slack, Google Sheets ) and use our pre-built UI widgets to build internal tools.

<p align="center">
  <img src="https://user-images.githubusercontent.com/7828962/119378233-aa8a9280-bcdb-11eb-9a71-e01dcf1595e9.gif" width="500"/>
</p>

<p align="center">
Quickstart: Deploy ToolJet server to Heroku and client to Netilify.  <br>
<a href="https://heroku.com/deploy?template=https://github.com/tooljet/tooljet/tree/main"><img src="https://www.herokucdn.com/deploy/button.svg" /></a>
  <a href="https://app.netlify.com/start/deploy?repository=https://github.com/tooljet/tooljet/tree/main"><img src="https://www.netlify.com/img/deploy/button.svg" /></a>
</P>

<hr>


## Features

- Visual app builder with widgets such as tables, charts, modals, buttons, dropdowns and more
- Connect to databases, APIs and external services
- Deploy on-premise ( supports docker, kubernetes, heroku and more )
- Granular access control on organization level and app level
- Write JS code almost anywhere in the builder
- Query editors for all supported data sources
- Transform query results using JS code 
- Import endpoints from OpenAPI specs 
- All the credentials are securely encrypted using `aes-256-gcm`.
- ToolJet acts only as a proxy and doesn't store any data.
- Support for OAuth

<hr>

## Quickstart 
The easiest way to get started with ToolJet is by creating a [ToolJet Cloud](https://tooljet.io) account. ToolJet Cloud offers a hosted solution of ToolJet. If you want to self-host TooJet, please proceed to [deployment documentation](https://docs.tooljet.io/docs/setup/architecture).

## Examples
[Building a Github contributor leaderboard using ToolJet](https://blog.tooljet.io/building-a-github-contributor-leaderboard-using-tooljet/)<br>

## Documentation
The documentation is available at https://docs.tooljet.io 

[Getting Started](https://docs.tooljet.io)<br>
[Deploying](https://docs.tooljet.io)<br>
[Datasource Reference](https://docs.tooljet.io)<br>
[Widget Reference](https://docs.tooljet.io)

## Branching model
We use the git-flow branching model. The base branch is develop. If you are looking for a stable version, please use the master or tags labelled as v1.x.x.

## Contributing
Read our contributing guide (CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to ToolJet. <br>
[Contributing Guide](https://docs.tooljet.io/docs/contributing-guide/setup/docker)

## Licence
ToolJet © 2021, ToolJet Inc - Released under the GNU General Public License v3.0.
