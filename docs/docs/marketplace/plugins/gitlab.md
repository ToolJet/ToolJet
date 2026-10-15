---
id: marketplace-plugin-gitlab
title: GitLab
---

# GitLab

Connect to GitLab.com or a self-managed GitLab instance to query projects, issues, merge requests, branches, repository files, pipelines, and users.

## Install and connect

1. Open **Marketplace**, find **GitLab**, and install the plugin.
2. Add a GitLab data source from **Data Sources** or your app's query panel.
3. Set **Base URL** to your GitLab instance, such as `https://gitlab.com` (the default) or `https://gitlab.example.com/gitlab`. Include the installation subpath when applicable; omit `/api/v4`.
4. Choose an authentication method below.

### Personal / Project access token

Select **Personal / Project access token** and paste the token into **Access token**. Use a token with the `api` scope for write operations, or `read_api` for read-only queries. A project token is limited to its project's permissions; operations outside that scope may return permission errors.

Click **Test connection**, then save the data source. The connection test retrieves the authenticated user from GitLab.

### OAuth 2.0

1. Register an application on the GitLab instance under **User settings > Applications** with the `api` scope.
2. Copy the **Redirect URI** shown in ToolJet into the GitLab application's redirect URI setting. It includes your ToolJet installation subpath when configured.
3. Select **OAuth 2.0** and enter the application's **Client ID** and **Client secret**.
4. Click **Connect to GitLab**, approve access in GitLab, and save the data source after authorization completes.

The plugin derives authorization and token endpoints from **Base URL**. Expired access tokens are refreshed using GitLab's refresh token. Enable **Authentication required for all users** to require each signed-in user to authorize their own account. Authorize a shared connection before using it in a public app.

Tokens and client secrets are stored encrypted. See [GitLab authentication](https://docs.gitlab.com/api/rest/authentication/) and [OAuth documentation](https://docs.gitlab.com/api/oauth2/) for permissions and application setup.

## Operations

Create a query using your GitLab data source and choose an operation. Inputs support ToolJet expressions such as `{{components.projectInput.value}}`.

| Operation | Required inputs |
| --- | --- |
| List projects | None |
| Get project | Project ID or path |
| List issues | Project ID or path |
| Create issue | Project ID or path, title |
| Update issue | Project ID or path, issue IID, fields to update |
| List merge requests | Project ID or path |
| Create merge request | Project ID or path, source branch, target branch, title |
| Merge a merge request | Project ID or path, merge request IID |
| List branches | Project ID or path |
| Get file from repository | Project ID or path, file path, branch or tag |
| List pipelines | Project ID or path |
| Trigger pipeline | Project ID or path, branch or tag |
| List users | None |

Enter project paths (`group/project`) and file paths (`src/index.ts`) without URL encoding. Issue and merge request **IIDs** are their project-local numbers, not GitLab's global IDs.

**Parameters (JSON)** accepts optional GitLab query parameters, including pagination and filters. For example, `{"page": 2, "per_page": 20}` selects a page of results; `{"state": "opened"}` filters issues or merge requests. List operations return one page per query; use `page` and `per_page` to retrieve additional pages.

Write operations accept **Body (JSON)** for additional GitLab attributes. Examples:

- Create issue: enter a title, and optionally `{"labels": "bug", "assignee_ids": [123]}` in Body.
- Update issue: enter its IID and `{"state_event": "close"}` in Body. Use `{"description": ""}` to clear a description.
- Merge a merge request: use `{"squash": true, "sha": "expected-head-sha"}` in Body when needed. GitLab enforces approvals, branch permissions, and mergeability.
- Trigger pipeline: enter a branch or tag and optionally `{"variables": [{"key": "DEPLOY", "value": "true"}]}` in Body. This creates a pipeline using the authenticated account via `POST /projects/:id/pipeline`; a pipeline trigger token is not required.

Nonempty named inputs take precedence over the corresponding Body or Parameters keys. See the [GitLab REST API](https://docs.gitlab.com/api/rest/) for supported attributes and permissions.

## Results and errors

Queries return GitLab's JSON response as `data`: lists are arrays, while individual resources are objects. Repository file responses preserve GitLab's `content` and `encoding` fields; file content is Base64 encoded.

API errors include the HTTP status and GitLab's error message. For `401`, check or reauthorize credentials; for `403`, check token scopes and project permissions; for `404`, check the project path and project-local IID; for `429`, wait before retrying. Invalid JSON inputs fail before sending a request. Requests time out after 30 seconds and write requests are not automatically retried.
