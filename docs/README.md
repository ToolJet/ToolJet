<p align="center">
  <img alt="ToolJet logo" src="static/img/logo.svg" width="100px" />
  <h1 align="center">ToolJet Documentation</h1>
</p>

This repository contains the ToolJet documentation website code and Markdown source files for [docs.tooljet.com](docs.tooljet.com)

## Index
- [Feedback](#feedback)
- [Documentation Issues](#documentation-issues)
- [Contributing](#contributing)
  - [Repository organization](#repository-organization)
  - [Workflow](#workflow)
  - [Conventions](#conventions)
- [Local setup](#local-setup)

## Feedback
If you want to give documentation feedback, please join our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-r2neyfcw-KD1COL6t2kgVTlTtAV5rtg) and drop us a message.

## Documentation Issues
To enter documentation bugs or submit any feature request for documentation, please create a new [GitHub issue](https://github.com/ToolJet/ToolJet/issues/new?assignees=&labels=documentation&template=03_documentation_report.yml&title=%5Bdocs%5D%3A+). Please check if there is an existing issue first.

If you think the issue is with the ToolJet product itself, please choose the relevant issue template [here](https://github.com/ToolJet/ToolJet/issues/new/choose).

## Contributing
To contribute to ToolJet documentation, you need to fork this repository and submit a pull request for the Markdown and/or image changes that you're proposing.

### Repository organization
The content in this directory follows the organization of documentation at https://docs.tooljet.com

This directory contains the following folders:

\docs <br>
|--\Enterprise <br>
|--\actions <br>
|--\contributing-guide <br>
|--\data-sources <br>
|--\how-to <br>
|--\password-login <br>
|--\setup <br>
|--\sso <br>
|--\tutorial <br>
|--\widgets <br>

Within these folders, you'll find the Markdown files used for the content. 

\src - contains the ToolJet documentation website code. The documentation website is built using [Docusaurus 2](https://docusaurus.io/).

\static\img - contains folders that references the images (such as screenshots) used in the \docs\topic.

### Workflow
The two suggested workflows are:

- For small changes, use the "Edit this page" button on each page to edit the Markdown file directly on GitHub.
- If you plan to make significant changes or preview the changes locally, clone the repo to your system to and follow the installation and local development steps in [Local setup](#local-setup).

### Conventions

- The front matter for every markdown file should include the `id` and a `title`. `id` will be used to reference the file in `sidebar.js`
  ```yaml
  ---
  id: building-internal-tool
  title: Building internal tool with ToolJet
  ---
  ```

- Use lowercase for file and folder names and dashes `-` as separators.
  For example:
  - `/docs/data-sources/sap-hana.md`
  - `/docs/how-to/bulk-update-multiple-rows.md`

- Images are important to bring the product to life and clarify the written content. For images you're adding to the repo, store them in the `img` subfolder inside `static` folder. For every topic there needs to be a folder inside `\static\img\` section, for example: `static\img\how-to\bulk-update\query1.png`.
  When you link to an image, the path and filename are case-sensitive. The convention is for image filenames to be all lowercase and use dashes `-` for separators.

  >Example code for adding an image in markdown file:
  ```
  <div style={{textAlign: 'center'}}>

  ![ToolJet - Data source - Airtable](/img/datasource-reference/airtable/airtable-connect.gif)

  </div>
  ```

## Local setup
### Installation
```console
yarn install
```

### Local Development
```console
yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build
```console
yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment
```console
GIT_USER=<Your GitHub username> USE_SSH=true yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.

## Thanks 💜

Thanks for all your contributions and efforts towards improving the ToolJet documentation. We thank you being part of our ✨ community ✨!