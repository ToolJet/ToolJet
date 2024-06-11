---
id: github
title: GitHub
---

# GitHub Single Sign-on Configuration

To enable GitHub Single Sign-on (SSO) for your ToolJet instance, follow these steps:

1. From the ToolJet dashboard, go to **Settings** (⚙️) from the bottom of the left sidebar and select the **Workspace Settings**.

2. In the **Workspace Settings**, select **Workspace login** from the sidebar. On the right, you'll see toggles to enable SSO via different clients. All the client toggles are disabled by default. After turning it on, a modal will appear with input fields for parameters such as Host name, Client ID, and Client secret. At the top left of the modal, there is a toggle to enable this modal. Turn it on, and then, without entering any parameters, click on the **Save changes** button. This will generate a `Redirect URL` that you will need to utilize in the GitHub Developer settings.

   <img className="screenshot-full" src="/img/sso/git/generate-redirect-url.gif" alt="GitHub SSO" />

3. Now go to the **[GitHub Developer settings](https://github.com/settings/developers)** and navigate to `OAuth Apps` and create a new OAuth App.

- Enter the **App Name**, **Homepage URL**, and **Authorization callback URL**. The **Authorization callback URL** should be the generated `Redirect URL` in the ToolJet GitHub manage SSO page. Click on the **Register application** button to create the OAuth App.

  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/git/register-0auth.png" alt="GitHub SSO" />
  </div>

- The **Client ID** will be generated automatically.
- Generate the **Client Secret** by clicking the `Generate a new client secret` button.

    <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/git/client-id-secret.png" alt="GitHub SSO" />
  </div>

4. Open the ToolJet's GitHub SSO settings and enter the obtained **Client ID** and **Client Secret**.

  <div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/git/enter-creds.png" alt="GitHub SSO" />
  </div>

5. If you are using **GitHub Enterprise** self-hosted, enter the `Host Name`. The host name should be a URL and should not end with `/`, for example, `https://github.tooljet.com`. If it is not self-hosted, you can skip this field.

6. Finally, click on the **Save changes** button and the GitHub sign-in button will now be available in your ToolJet login screen.

7. Obtain the Login URL from the **[General Settings](/docs/user-authentication/general-settings#login-url)** of the SSO page.

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Setting Default SSO

To set GitHub as the default SSO for the instance, use the following environment variables:

|  <div style={{ width:"100px"}}> Variable   </div>                  |  <div style={{ width:"100px"}}> Description    </div>                                 |
| ---------------------------- | ----------------------------------------------- |
| SSO_GIT_OAUTH2_CLIENT_ID     | GitHub OAuth client ID                          |
| SSO_GIT_OAUTH2_CLIENT_SECRET | GitHub OAuth client secret                      |
| SSO_GIT_OAUTH2_HOST          | GitHub OAuth host name if GitHub is self-hosted |

**Redirect URL should be `<host>/sso/git`**

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Exposed ssoUserInfo

Once the GitHub SSO is configured (on ToolJet version **`2.28.0-ee2.12.2`** or above), ToolJet will expose the user info returned by the GitHub. The user info will be available under the `ssoUserInfo` property of the `currentUser` global variable. Check the **[Inspector](/docs/how-to/use-inspector)** doc to learn more.

The exposed user info can be dynamically accessed throughout the apps using JS **`{{globals.currentUser.ssoUserInfo.<key>}}`**

The following is an example of the user info returned by GitHub:

| <div style={{ width:"100px"}}> Key        </div>             | <div style={{ width:"100px"}}>Description    </div>                                                      | <div style={{ width:"135px"}}> Syntax to Access          </div>                                |
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

<div style={{textAlign: 'center'}}>
  <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/git/ssogithub.png" alt="GitHub SSO" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Example: Getting User Information Using the access_token

Once a user is logged in to ToolJet using GitHub SSO, the access token of the user becomes available. This access token can be utilized within ToolJet apps to retrieve detailed user information from the GitHub API.

1. Log in to ToolJet using GitHub Single Sign-on as outlined in the previous setup steps.

2. Create a new ToolJet application and then create new REST API query. Set the method to `GET` and the URL to `https://api.github.com/user/followers`. This API call will return the list of followers for the logged-in GitHub user.

3. In the Headers section of the query, include the **key** `Authorization` and set the **value** to `Bearer {{globals.currentUser.ssoUserInfo.access_token}}`. This will pass the user's GitHub access token as a Bearer token in the request header.

4. Execute the query to fetch the list of followers for the logged-in user. The response will contain the list of followers for the authenticated GitHub user.

<div style={{textAlign: 'center'}}>
  <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/sso/git/queryresults.png" alt="GitHub SSO" />
</div>

</div>