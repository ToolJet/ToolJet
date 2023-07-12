---
id: setup
title: Setup
---

<div className='badge badge--primary heading-badge'>Available on: Enterprise Edition</div>

# Configure OpenId Connect Single Sign-on


- Go to the **Workspace Settings** (⚙️) from the left sidebar in the ToolJet dashboard
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/general/workside2.png" alt="General Settings: SSO" width="500"/>

  </div>

- Select `SSO` from workspace options
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/okta/sso2.png" alt="Okta: SSO" width="500"/> 

  </div>

- Select `OpenId Connect`.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/sso/openid/openid.png" alt="Okta: SSO" /> 

  </div>

- Find and set **Name**, **Client Id**, **Client Secret**, and **Well Known URL** from your Open Id provider.

### Exposed User Info

If OpenID is configured on ToolJet version **`v2.6.2-ee2.1.0`** or above, the ToolJet apps will expose the `ssoUserInfo` property under the `currentUser` variables. Check the **[Inspector](/docs/app-builder/left-sidebar#inspector)** doc to learn more.

The exposed user info can be dynamically accessed throughout the apps using JS **`{{globals.currentUser.ssoUserInfo.<key>}}`**

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/sso/openid/ssouserinfo.png" alt="ssouserinfo" /> 

</div>