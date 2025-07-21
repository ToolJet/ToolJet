---
id: gitsync-api
title: GitSync API
---

<div className="badge badge--primary heading-badge">   
  <img 
    src="/img/badge-icons/premium.svg" 
    alt="Icon" 
    width="16" 
    height="16" 
  />
 <span>Paid feature</span>
</div>

ToolJet’s git sync CI/CD APIs enable organizations to programmatically manage the complete lifecycle of their ToolJet applications within their existing CI/CD piplines. With these RESTful APIs, you can configure git sync, push and pull changes from Git repositories, and automate application deployments without manual intervention.

By integrating these APIs into your CI/CD pipelines (e.g., Jenkins, GitHub Actions, GitLab CI), you can:
- **Automate git sync operations** to eliminate manual syncing via the ToolJet UI.
- **Implement enterprise-grade deployment strategies** with standardized governance.
- **Streamline development cycles**, ensuring your internal apps follow the same release processes as your core applications.

The following APIs are available to manage git sync within your CI/CD pipeline.

### Add GitHub HTTPS Git Configuration

    - **Description:** Configure GitHub HTTPS settings for an organization by associating a GitHub App and repo.
    - **URL:** `/api/ext/organization/git`
    - **Method:** POST
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Body:** The body object can contain the following fields:
        - `organizationId` (string, required): UUID of the organization.
        - `gitUrl` (string, required): Full HTTPS Git URL.
        - `branchName` (string, required): Branch to sync with (e.g., "main").
        - `githubAppId` (string, required): GitHub App ID.
        - `githubAppInstallationId` (string, required): GitHub App installation ID.
        - `githubAppPrivateKey` (string, required): GitHub App private key (PEM format).

<details id="tj-dropdown">

<summary>Request Body Example</summary>

```json
{
  "organizationId": "45892c81-c1f0-48c6-8875-c2e4fca516f8",
  "gitUrl": "https://github.com/username/repository.git",
  "branchName": "main",
  "githubAppId": "123456",
  "githubAppInstallationId": "78910",
  "githubAppPrivateKey": "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
}
```

</details>

    - **Response:** `201 Created`

### Push an App Version to GitHub

    - **Description:** Push a specific app version to the configured GitHub repository.
    - **URL:** `/api/ext/apps/:appId/versions/:versionId/git-sync/push`
    - **Method:** POST
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
        - appId (string): The ID of the app.
        - versionId (string): The ID of the app version.
    - **Body:** The body object can contain the following fields:
        - `commitMessage` (string, required): Git commit message.

<details id="tj-dropdown">

<summary>Request Body Example</summary>

```json
{
  "commitMessage": "Updated app configuration and components"
}
```

</details>

    - **Response:** `200 OK`

### Create a New App from GitHub

    - **Description:** Creates a new ToolJet app from a GitHub repo.
    - **URL:** `/api/ext/apps?createMode=git`
    - **Method:** POST
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Body:** The body object can contain the following fields:
        - `gitAppId` (string, required): Git App ID.
        - `gitVersionId` (string, required): Git version ID (branch or tag).
        - `organizationId` (string, required): UUID of the organization.

<details id="tj-dropdown">

<summary>Request Body Example</summary>

```json
{
  "gitAppId": "app-123456",
  "gitVersionId": "main",
  "organizationId": "45892c81-c1f0-48c6-8875-c2e4fca516f8"
}
```

</details>

    - **Response:** `201 Created`

### Sync and Pull Changes to Existing App from Git

    - **Description:** Sync and pull the latest changes from GitHub for an existing ToolJet app.
    - **URL:** `/api/ext/apps/:appId?createMode=git`
    - **Method:** PUT
    - **Authorization:** `Basic <access_token>`
    - **Content-Type:** `application/json`
    - **Params:**
        - appId (string): The ID of the app.
    - **Body:** No body required.
    - **Response:** `200 OK`

### Auto Promote App

    - **Description:** Deploys an app by pulling the latest changes from Git and promoting the latest version to the production environment.
    - **URL:** `/api/ext/apps/:appId/promote`
    - **Method:** POST
    - **Authorization:** `Basic <access_token>`
    - **Params:**
        - appId (string): ID of the app to deploy.
    - **Body:** No body required.
    - **Response:** `200 OK`