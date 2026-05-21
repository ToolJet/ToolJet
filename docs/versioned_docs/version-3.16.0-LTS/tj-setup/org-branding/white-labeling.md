---
id: white-labeling
title: White Labeling
---

<PlanBadge type="team" />

The White Label feature in ToolJet lets you customize the look and feel of your ToolJet deployment to match your branding guidelines, including your logo, favicon, page title, and the Login Page making ToolJet appear like your own product. This guide will help you understand the configuration of White labelling for your organization. For **self-hosted** instances, the white labelling is set at the [instance level](/docs/user-management/authentication/self-hosted/instance-login) and for the **cloud**, it is applied at the [workspace level](/docs/user-management/authentication/self-hosted/workspace-login).

<img className="screenshot-full img-m" src="/img/tooljet-setup/whitelabelling/intro.png" alt="whitelable your brand" />

## Configuration

To access the White Labelling configuration, go to **Settings > White Labelling**. <br/><br/>
Example URL:
- Self Hosted - `https://app.corp.com/settings/white-labelling`
- Cloud - `https://app.tooljet.com/<workspace-slug>/settings/white-labelling`

In this section you can configure the following branding elements:

- **Application Logo**: This includes the logo displayed on the login screen, dashboard, and app-editor and deployed application. (Preferred dimensions: 130px x 26px)
- **Page Title**: This is the title associated with the webpage displayed in the browser tab. (Preferred title length: 50-60 characters)
- **Favicon**: It is an icon associated with the webpage displayed in the browser tab. (Preferred dimensions: 32px x 32px or 16px x 16px)
- **Login page image**: It is displayed on the right side of the login page and can be used to give users a hint about what they are logging into. (Preferred dimensions: 1024px x 1024px)

<img className="screenshot-full img-full" src="/img/tooljet-setup/whitelabelling/settings.png" alt="white labelling" />

## FAQ

<details id="tj-dropdown">
    <summary>
         **What happens to white labeling if the license or subscription expires?**
    </summary>
If your license or subscription expires, white labeling will automatically revert to ToolJet's default branding until the license is renewed.

</details>
