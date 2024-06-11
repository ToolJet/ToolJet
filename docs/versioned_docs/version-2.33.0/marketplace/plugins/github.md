---
id: marketplace-plugin-github
title: GitHub
---

ToolJet can connect to GitHub account to read and write data. In order for ToolJet to access and manipulate data on GitHub, a **GitHub Personal Access Token** is necessary to authenticate and interact with the GitHub API.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/github/githubadd.gif" alt="Marketplace: GitHub" />

</div>

:::note
Before following this guide, it is assumed that you have already completed the process of **[Using Marketplace plugins](/docs/marketplace/marketplace-overview#using-marketplace-plugins)**.
:::

## Connection

For connecting to GitHub, following credentials are required:
- **Personal Access Token**: Generate a Personal Access Token from your **[GitHub Account Settings](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)**

:::caution
If a Personal Access Token is not provided, the data from the private repositories will not be retrieved via the GitHub Plugin. However, the public repositories data can still be retrieved.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/github/connection.png" alt="Marketplace: GitHub" />

</div>

## Supported queries

- **[Get user info](#get-user-info)**
- **[Get repository](#get-repository)**
- **[Get repository issues](#get-repository-issues)**
- **[Get repository pull requests](#get-repository-pull-requests)**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/github/list.png" alt="Marketplace: GitHub" />

</div>

### Get user info

All the details regarding the user is retrieved by running this query.

#### Required parameters: 

- **Username**: To obtain the details, the username of the user must be provided for this field. You can input the username of a GitHub organization or a user for this field.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/github/getuserinfo.png" alt="Marketplace: GitHub" />

</div>

### Get repository

All the details regarding the repository are retrieved by running this query.

#### Required parameters: 

- **Owner**: The owner's name of the repository is required for this field. The owner can either be a GitHub organization or a user.
- **Repository**: Provide the name of the repository of which you want to retrieve the details.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/github/getrepo.png" alt="Marketplace: GitHub" />

</div>

### Get repository issues

Running this query will retrieve a list of issues from a repository. You can select whether to obtain All, Open, or Closed issues.

#### Required parameters:

- **Owner**: The owner's name of the repository is required for this field. The owner can either be a GitHub organization or a user.
- **Repository**: Provide the name of the repository of which you want to retrieve the issues.
- **State**: Choose the state of the issues that you would like to retrieve: All, Open, or Closed.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/github/getissues.png" alt="Marketplace: GitHub" />

</div>

### Get repository pull requests

Running this query will retrieve a list of pull requests from a repository. You can select whether to obtain All, Open, or Closed issues.

#### Required parameters:

- **Owner**: The owner's name of the repository is required for this field. The owner can either be a GitHub organization or a user.
- **Repository**: Provide the name of the repository of which you want to retrieve the pull requests.
- **State**: Choose the state of the pull requests that you would like to retrieve: All, Open, or Closed.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/marketplace/plugins/github/getpr.png" alt="Marketplace: GitHub" />

</div>