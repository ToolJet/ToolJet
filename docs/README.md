<p align="center">
  <img alt="ToolJet logo" src="static/img/logo.svg" width="100px" />
  <h1 align="center">ToolJet Documentation</h1>
</p>

The directory "ToolJet/docs/" holds the code and markdown source files for the ToolJet documentation website, which is accessible at [docs.tooljet.com](docs.tooljet.com)

## Index
- [Feedback](#feedback)
- [Documentation Issues](#documentation-issues)
- [Contributing](#contributing)
  - [Repository organization](#repository-organization)
  - [Workflow](#workflow)
  - [Conventions](#conventions)
- [Local setup](#local-setup)

## Feedback
We welcome your valuable feedback on the documentation! Please feel free to join our [Community on Slack](https://tooljet.com/slack) and send us a message. We would be delighted to hear from you and assist you with any queries or concerns you may have. 

## Documentation Issues
If you come across any issues with the documentation or have a feature request related explicitly to it, we encourage you to create a new [GitHub issue](https://github.com/ToolJet/ToolJet/issues/new?assignees=&labels=documentation&template=03_documentation_report.yml&title=%5Bdocs%5D%3A+) following the template. Before creating a new issue, we kindly request that you check for existing issues to avoid duplication. 

In case you encounter any issues with the ToolJet product, please select the relevant issue template from [here](https://github.com/ToolJet/ToolJet/issues/new/choose).

## Contributing
To contribute to ToolJet documentation, you need to fork this repository and submit a pull request for the Markdown and/or image changes that you're proposing.

### Repository organization
The content in this directory follows the organization of documentation at https://docs.tooljet.com

This directory contains the following folders:

```
/tooljet/docs
├── sidebars.json        # sidebar for the next(upcoming) docs version
├── docs                 # docs directory for the next(upcoming) docs version
│   ├── Enterprise
│   │   └── multi-environment.md
│   └── tooljet-database.md
├── versions.json        # file to indicate what versions are available
├── versioned_docs
│   ├── version-x.x.x    # Current/latest version (set it on docusauras.config.js)
│   │   ├── Enterprise
│   │   │   └── multi-environment.md   # https://docs.tooljet.com/docs/Enterprise/multi-environment
│   │   └── tooljet-database.md.       # https://docs.tooljet.com/docs/tooljet-database
│   └── version-2.0.0
│   │   ├── Enterprise
│   │   │   └── multi-environment.md   # https://docs.tooljet.com/docs/2.0.0/Enterprise/multi-environment
│   │   └── tooljet-database.md
│   └── version-1.0.0
│       ├── Enterprise
│       │   └── multi-environment.md   # https://docs.tooljet.com/docs/1.0.0/Enterprise/multi-environment
│       └── tooljet-database.md
├── versioned_sidebars                 # includes sidebar for the specific versions
│   ├── version-x.x.x-sidebars.json    
│   └── version-1.0.0-sidebars.json
└── src
│   └── img                           # contains folders that references the images (such as screenshots) used in the \docs\topic
├── docusaurus.config.js
└── package.json
```

`\src` - contains the ToolJet documentation website code. The documentation website is built using [Docusaurus 2](https://docusaurus.io/).

`tooljet\docs\docs\` - This directory serves as the base directory for the documentation. Any modifications made within this directory will be reflected in the next version of the documentation. Each folder inside this directory corresponds to specific content and contains markdown files related to that content.

### Workflow
The two suggested workflows are:

- For small changes, use the "Edit this page" button on each page to edit the Markdown file directly on GitHub.
- If you plan to make significant changes or preview the changes locally, clone the repo to your system to and follow the installation and local development steps in [Local setup](#local-setup).

### Conventions

- The front matter for every markdown file should include the `id` and a `title`. `id` will be used to reference the file in `sidebar.js` or `version-x.x.x-sidebars.json` for a specific version.
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

  > Example code for adding an image in markdown file:
  ```
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/button-group.png" alt="Button group" />

  </div>
  ```

## Local setup

### Requirements

- **Node version 16.14**

### Installation
```console
yarn install
```

**Note:** Please note that if you make any changes that will be reflected in the upcoming version of the ToolJet documentation, you should set the **includeCurrentVersion** value to `true` in the docusaurus.config.js file. After making the necessary changes, be sure to set the value back to `false` and then commit the changes. Setting the value to `true` will load the `docs/docs/` base directory as the `next` version for local development, allowing you to preview the changes.

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
