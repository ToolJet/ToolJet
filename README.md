<p align="center">
  <img src="https://user-images.githubusercontent.com/7828962/120930301-4ec3fe80-c70a-11eb-91b7-4bdbc31fd928.png" width="200" />
  <br/>
  Build and deploy internal tools.
</p>

ToolJet is an **open-source no-code framework** to build and deploy internal tools quickly without much effort from the engineering teams. You can connect to your data sources such as databases ( like PostgreSQL, MongoDB, Elasticsearch, etc ), API endpoints ( ToolJet supports importing OpenAPI spec & OAuth2 authorization) and external services ( like Stripe, Slack, Google Sheets, Airtable ) and use our pre-built UI widgets to build internal tools.

[![GitHub issues](https://img.shields.io/github/issues/ToolJet/ToolJet)](https://github.com/ToolJet/ToolJet/issues)
[![GitHub stars](https://img.shields.io/github/stars/ToolJet/ToolJet)](https://github.com/ToolJet/ToolJet/stargazers)
[![GitHub license](https://img.shields.io/github/license/ToolJet/ToolJet)](https://github.com/ToolJet/ToolJet)


<p align="center">
  <kbd>
    <img src="https://user-images.githubusercontent.com/7828962/120830570-4211a000-c57c-11eb-97f5-a650b177a082.png" />
  </kbd>
</p>

<a href="https://www.producthunt.com/posts/tooljet?utm_source=badge-featured&utm_medium=badge&utm_souce=badge-tooljet" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=298959&theme=dark" alt="ToolJet - Open-source alternative for Retool | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>


## Features

- Visual app builder with widgets such as tables, charts, modals, buttons, dropdowns and more
- Mobile &desktop layouts
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
The easiest way to get started with ToolJet is by creating a [ToolJet Cloud](https://tooljet.io) account. ToolJet Cloud offers a hosted solution of ToolJet. If you want to self-host TooJet, please proceed to [deployment documentation](https://docs.tooljet.io/docs/deployment/architecture).

You can deploy ToolJet on Heroku for free using the one-click-deployment button below.
<p align="center">
<a href="https://heroku.com/deploy?template=https://github.com/tooljet/tooljet/tree/main"><img src="https://www.herokucdn.com/deploy/button.svg" /></a>
</P>



## Examples 

[Building a Github contributor leaderboard using ToolJet](https://blog.tooljet.io/building-a-github-contributor-leaderboard-using-tooljet/)<br>

## Documentation
The documentation is available at https://docs.tooljet.io 

[Getting Started](https://docs.tooljet.io)<br>
[Deploying](https://docs.tooljet.io)<br>
[Datasource Reference](https://docs.tooljet.io)<br>
[Widget Reference](https://docs.tooljet.io)

## Branching model
We use the git-flow branching model. The base branch is develop. If you are looking for a stable version, please use the main branch or tags labelled as v1.x.x.

## Contributing
Read our contributing guide (CONTRIBUTING.md) to learn about our development process, how to propose bugfixes and improvements, and how to build and test your changes to ToolJet. <br>
[Contributing Guide](https://docs.tooljet.io/docs/contributing-guide/deployment/docker)

## Licence
ToolJet © 2021, ToolJet Inc - Released under the GNU General Public License v3.0.
