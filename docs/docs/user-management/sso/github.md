---
id: github
title: GitHub
---

GitHub SSO in ToolJet allows seamless authentication by enabling users to log in with their GitHub credentials. This integration simplifies access management for teams, enhances security, and ensures a streamlined workflow for developers and collaborators.


## Configure GitHub SSO

To enable GitHub Single Sign-on (SSO) for your ToolJet, follow these steps:

Role Required: <br/>
&nbsp;&nbsp;&nbsp;&nbsp; For Instance Level: **Super Admin** <br/>
&nbsp;&nbsp;&nbsp;&nbsp; For Workspace Level: **Admin**

1. Click on the settings icon (⚙️) on the bottom left of your dashboard.

2. For Instance Level: <br/>
Go to **Settings > Instance login**. <br/> 
    (Example URL - `https://app.corp.com/instance-settings/instance-login`)

    For Workspace Level: <br/>
    Go to **Workspace Settings > Workspace login**. <br/> 
    (Example URL - `https://app.corp.com/nexus/workspace-settings/workspace-login`)

3. On the right, you'll see toggles to enable SSO via different clients. All the client toggles are disabled by default. Turn on the toggle in front of GitHub.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/github/sso-menu.png" alt="Add user button" />

4. After turning it on, a modal will appear with input fields for parameters such as Host name, Client ID, and Client secret. At the top left of the modal, there is a toggle to enable this modal. Turn it on, and then, without entering any parameters, click on the Save changes button. This will generate a Redirect URL that you will need to utilize in the GitHub Developer settings.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/github/github-modal.png" alt="Add user button" />

5. Go to **[GitHub Developer Settings](https://github.com/settings/developers)** and navigate to **OAuth Apps** and create a new OAuth App.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/github/oauth-app.png" alt="Add user button" />

6. Enter the **App Name**, **Homepage URL**, and **Authorization callback URL**. The Authorization callback URL should be the generated **Redirect URL** in the ToolJet GitHub manage SSO page. Click on the Register application button to create the OAuth App.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/github/oauth-config.png" alt="Add user button" />

7. The **Client ID** will be generated automatically. Generate the **Client Secret** by clicking the **Generate a new client secret** button.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/github/github-clientid.png" alt="Add user button" />

8. Open the ToolJet's GitHub SSO settings and enter the obtained **Client ID** and **Client Secret**.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/user-management/sso/github/config-github.png" alt="Add user button" />

9. If you are using GitHub Enterprise self-hosted, enter the Host Name. The host name should be a URL and should not end with `/`, for example, `https://github.tooljet.com`. If it is not self-hosted, you can skip this field.

10. Finally, click on the **Save changes** button and the GitHub sign-in button will now be available in your ToolJet login screen.

11. Obtain the Login URL from the Instance/Workspace login page.

## Setting Default SSO

To set GitHub as the default SSO for the instance, use the following environment variables:

|  <div style={{ width:"100px"}}> Variable   </div>                  |  <div style={{ width:"100px"}}> Description    </div>                                 |
| ---------------------------- | ----------------------------------------------- |
| SSO_GIT_OAUTH2_CLIENT_ID     | GitHub OAuth client ID                          |
| SSO_GIT_OAUTH2_CLIENT_SECRET | GitHub OAuth client secret                      |
| SSO_GIT_OAUTH2_HOST          | GitHub OAuth host name if GitHub is self-hosted |

**Redirect URL should be `<host>/sso/git`** (Example URL - `https://app.corp.com/sso/git`)


## Exposed ssoUserInfo

Once the GitHub SSO is configured (on ToolJet version 2.28.0-ee2.12.2 or above), ToolJet will expose the user info returned by the GitHub. The user info will be available under the **ssoUserInfo** property of the **currentUser** global variable. Check the **[Inspector](/docs/how-to/use-inspector)** documentation to learn more.

The exposed user info can be dynamically accessed throughout the apps using JS **`{{globals.currentUser.ssoUserInfo.<key>}}`**

The following is an example of the user info returned by GitHub:

| Key     | Description    |  Syntax to Access     |
| :---------------------- | :------------------------------------------------------------------- | :-------------------------------------------------------- |
| **login**               | GitHub username                                                      | `{{globals.currentUser.ssoUserInfo.login}}`               |
| **id**                  | GitHub user ID                                                       | `{{globals.currentUser.ssoUserInfo.id}}`                  |
| **node_id**             | GitHub user node ID                                                  | `{{globals.currentUser.ssoUserInfo.node_id}}`             |
| **avatar_url**          | GitHub user avatar URL                                               | `{{globals.currentUser.ssoUserInfo.avatar_url}}`          |
| **gravatar_id**         | GitHub user gravatar ID                                              | `{{globals.currentUser.ssoUserInfo.gravatar_id}}`         |
| **url**                 | GitHub user URL                                                      | `{{globals.currentUser.ssoUserInfo.url}}`                 |
| **html_url**            | GitHub user HTML URL                                                 | `{{globals.currentUser.ssoUserInfo.html_url}}`            |
| **followers_url**       | GitHub user followers URL                                            | `{{globals.currentUser.ssoUserInfo.followers_url}}`       |
| **following_url**       | GitHub user following URL                                            | `{{globals.currentUser.ssoUserInfo.following_url}}`       |
| **gists_url**           | GitHub user gists URL                                                | `{{globals.currentUser.ssoUserInfo.gists_url}}`           |
| **starred_url**         | GitHub user starred URL                                              | `{{globals.currentUser.ssoUserInfo.starred_url}}`         |
| **subscriptions_url**   | GitHub user subscriptions URL                                        | `{{globals.currentUser.ssoUserInfo.subscriptions_url}}`   |
| **organizations_url**   | GitHub user organizations URL                                        | `{{globals.currentUser.ssoUserInfo.organizations_url}}`   |
| **repos_url**           | GitHub user repos URL                                                | `{{globals.currentUser.ssoUserInfo.repos_url}}`           |
| **events_url**          | GitHub user events URL                                               | `{{globals.currentUser.ssoUserInfo.events_url}}`          |
| **received_events_url** | GitHub user received events URL                                      | `{{globals.currentUser.ssoUserInfo.received_events_url}}` |
| **type**                | GitHub user type                                                     | `{{globals.currentUser.ssoUserInfo.type}}`                |
| **site_admin**          | GitHub user site admin                                               | `{{globals.currentUser.ssoUserInfo.site_admin}}`          |
| **name**                | GitHub user name                                                     | `{{globals.currentUser.ssoUserInfo.name}}`                |
| **company**             | GitHub user company                                                  | `{{globals.currentUser.ssoUserInfo.company}}`             |
| **blog**                | GitHub user blog                                                     | `{{globals.currentUser.ssoUserInfo.blog}}`                |
| **location**            | GitHub user location                                                 | `{{globals.currentUser.ssoUserInfo.location}}`            |
| **email**               | GitHub user email                                                    | `{{globals.currentUser.ssoUserInfo.email}}`               |
| **hireable**            | GitHub user hireable                                                 | `{{globals.currentUser.ssoUserInfo.hireable}}`            |
| **bio**                 | GitHub user bio                                                      | `{{globals.currentUser.ssoUserInfo.bio}}`                 |
| **twitter_username**    | GitHub user twitter username                                         | `{{globals.currentUser.ssoUserInfo.twitter_username}}`    |
| **public_repos**        | GitHub user public repos                                             | `{{globals.currentUser.ssoUserInfo.public_repos}}`        |
| **public_gists**        | GitHub user public gists                                             | `{{globals.currentUser.ssoUserInfo.public_gists}}`        |
| **followers**           | GitHub user followers                                                | `{{globals.currentUser.ssoUserInfo.followers}}`           |
| **following**           | GitHub user following                                                | `{{globals.currentUser.ssoUserInfo.following}}`           |
| **created_at**          | GitHub user created at                                               | `{{globals.currentUser.ssoUserInfo.created_at}}`          |
| **updated_at**          | GitHub user updated at                                               | `{{globals.currentUser.ssoUserInfo.updated_at}}`          |
| **access_token**        | GitHub user access token. Sensitive information of a logged-in user. | `{{globals.currentUser.ssoUserInfo.access_token}}`        |

<img className="screenshot-full" src="/img/sso/git/ssogithub.png" alt="GitHub SSO" />

## Example: Getting User Information Using the access_token

Once a user is logged in to ToolJet using GitHub SSO, the access token of the user becomes available. This access token can be utilized within ToolJet apps to retrieve detailed user information from the GitHub API.

1. Log in to ToolJet using GitHub Single Sign-on.

2. Create a new ToolJet application and then create new REST API query. Set the method to **GET** and the URL to `https://api.github.com/user/followers`. This API call will return the list of followers for the logged-in GitHub user.

3. In the Headers section of the query, include the **key: Authorization** and set the **value** to `Bearer {{globals.currentUser.ssoUserInfo.access_token}}`. This will pass the user's GitHub access token as a Bearer token in the request header.

4. Execute the query to fetch the list of followers for the logged-in user. The response will contain the list of followers for the authenticated GitHub user.

<img className="screenshot-full" src="/img/sso/git/queryresults.png" alt="GitHub SSO" />