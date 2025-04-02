---
id: marketplace-plugin-github
title: GitHub
---

ToolJet offers seamless integration with GitHub. This connection allows you to directly interact with GitHub repositories and data.

## Connection

To connect to GitHub, you need the following credential:
- **Personal Access Token**: You can generate this token through your **[GitHub Account Settings](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)**.

You'll need a Personal Access Token to access data from private repositories. Public repository data remains accessible without a Personal Access Token.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/github/connection-v2.png" alt="Marketplace: GitHub" />

## Supported Queries

- **[Get user info](#get-user-info)**
- **[Get repository](#get-repository)**
- **[Get repository issues](#get-repository-issues)**
- **[Get repository pull requests](#get-repository-pull-requests)**

### Get User Info

This operation fetches details for a specified user.

#### Required Parameter

- **Username**: Specify the GitHub username or organization to retrieve their details.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/github/getuserinfo-v3.png" alt="Marketplace: GitHub" />

### Get Repository

Fetches detailed information about a specific repository.

#### Required Parameters

- **Owner**: Name of the repository's owner, which can be either a GitHub user or an organization.
- **Repository**: The exact name of the repository.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/github/get-repo.png" alt="Marketplace: GitHub" />

### Get Repository Issues

Generates a list of issues associated with a repository, with options to filter them by their status.

#### Required Parameters

- **Owner**: The name of the repository's owner. The owner can either be a GitHub organization or a user.
- **Repository**: The repository name for which the issues are to be retrieved.
- **State**: Filter the issues by their status: All, Open, or Closed.

#### Optional Parameters

- **Page size**: Desired number of issues per page. Default is 30.
- **Page number**: Desired page number to fetch issues from. Default is 1.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/github/get-issue.png" alt="Marketplace: GitHub" />

### Get Repository Pull Requests

Generates a list of pull requests from a repository, with options to filter them by their status.

#### Required Parameters

- **Owner**: The name of the repository's owner. The owner can either be a GitHub organization or a user.
- **Repository**: The repository name for which the pull requests are to be retrieved.
- **State**: Filter the pull requests by their status: All, Open, or Closed.

#### Optional Parameters

- **Page size**: Desired number of issues per page. Default is 30.
- **Page number**: Desired page number to fetch pull requests from. Default is 1.

<img className="screenshot-full img-full" src="/img/marketplace/plugins/github/get-pull.png" alt="Marketplace: GitHub" />
