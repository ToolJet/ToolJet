---
id: setup
title: OpenID Setup
---

<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>

# Configure OpenId Connect Single Sign-on


- Go to the **Workspace Settings** (⚙️) from the left sidebar in the ToolJet dashboard
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/general/workside2-new.png" alt="General Settings: SSO" width="500"/>

  </div>

- Select `SSO` from workspace options
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/okta/sso2-new.png" alt="Okta: SSO" width="500"/> 

  </div>

- Select `OpenId Connect`.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/openid/openid.png" alt="Okta: SSO" /> 

  </div>

- Find and set **Name**, **Client Id**, **Client Secret**, and **Well Known URL** from your Open Id provider.

### Exposed ssoUserInfo

Once the OpenID is configured (on ToolJet version **`v2.6.2-ee2.1.0`** or above), ToolJet will expose the user info returned by the OpenID provider. The user info will be available under the `ssoUserInfo` property of the `currentUser` variable. Check the **[Inspector](/docs/how-to/use-inspector)** doc to learn more.

The exposed user info can be dynamically accessed throughout the apps using JS **`{{globals.currentUser.ssoUserInfo.<key>}}`**

The following is an example of the user info returned by Google OpenID provider:

| Key | Description | Syntax to access |
|:--- |:----------- |:------- |
| **sub** | Subject - Identifier for the End-User at the Issuer. | `{{globals.currentUser.ssoUserInfo.sub}}` |
| **name** | End-User's full name in displayable form including all name parts, possibly including titles and suffixes, ordered according to the End-User's locale and preferences. | `{{globals.currentUser.ssoUserInfo.name}}` |
| **given_name** | Given name(s) or first name(s) of the End-User. | `{{globals.currentUser.ssoUserInfo.given_name}}` |
| **family_name** | Surname(s) or last name(s) of the End-User. | `{{globals.currentUser.ssoUserInfo.family_name}}` |
| **picture** | URL of the End-User's profile picture. This URL MUST refer to an image file (for example, a PNG, JPEG, or GIF image file), rather than to a Web page containing an image. | `{{globals.currentUser.ssoUserInfo.picture}}` |
| **email** | End-User's preferred e-mail address. Its value MUST conform to the RFC 5322 [RFC5322] addr-spec syntax. | `{{globals.currentUser.ssoUserInfo.email}}` |
| **email_verified** | True if the End-User's e-mail address has been verified; otherwise false. | `{{globals.currentUser.ssoUserInfo.email_verified}}` |
| **locale** | End-User's locale, represented as a BCP47 [RFC5646] language tag. This is typically an ISO 639-1 Alpha-2 [ISO639‑1] language code in lowercase and an ISO 3166-1 Alpha-2 [ISO3166‑1] country code in uppercase, separated by a dash. For example, en-US or fr-CA. As a compatibility note, some implementations have used an underscore as the separator rather than a dash, for example, en_US; Relying Parties MAY choose to accept this locale syntax as well. | `{{globals.currentUser.ssoUserInfo.locale}}` |
| **hd** | End-User's hosted domain, if any. | `{{globals.currentUser.ssoUserInfo.hd}}` |
| **access_token** | Access token returned by the OpenID provider. | `{{globals.currentUser.ssoUserInfo.access_token}}` |
| **id_token** | ID token returned by the OpenID provider. | `{{globals.currentUser.ssoUserInfo.id_token}}` |
| **id_token_encrpted** | It is the JSON value of encrypted `id_token` | `{{globals.currentUser.ssoUserInfo.id_token_encrpted}}` |

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/sso/openid/ssouserinfon.png" alt="ssouserinfo" /> 

</div>