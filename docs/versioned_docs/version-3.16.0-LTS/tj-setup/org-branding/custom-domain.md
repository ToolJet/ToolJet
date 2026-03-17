---
id: custom-domain
title: Custom Domain
---

A custom domain is a user-defined domain name that can be configured to access an application through a specific, recognizable URL.

### Why Use a Custom Domain?

Using a custom domain allows organizations to access ToolJet through their own branded URL instead of the default ToolJet URL. For example, instead of using a generic workspace URL, teams can access their apps through something like `tools.yourcompany.com`.

This helps organizations:

- Maintain consistent branding for internal tools and applications.
- Provide a more professional and trusted experience for end-users of the apps built on ToolJet.
- Integrate ToolJet more naturally into existing company infrastructure and internal portals.

For teams building internal tools used by non-technical users, accessing applications through a company domain makes the platform feel like a native part of the organization’s product ecosystem rather than a third-party tool.

## Self Hosted

In a self-hosted deployment of ToolJet, you can configure a custom domain by setting the `TOOLJET_HOST `environment variable.

### Prerequisites

- A running self-hosted instance of ToolJet.

- A registered domain name.

- A configured DNS record pointing your domain to the ToolJet server.


### Configuration Steps

#### 1. Set the TOOLJET_HOST Environment Variable

The TOOLJET_HOST variable defines the public URL where ToolJet will be accessible. You need to update this variable with your desired domain.

| variable     | description                                                      |
| ------------ | ---------------------------------------------------------------- |
| TOOLJET_HOST | the public URL of ToolJet client ( eg: `https://app.corp.ai`,`https://corp.ai`,`https://corp.ai/app` ) |


#### 2. Restart Services

After setting the environment variable and DNS configurations, restart your ToolJet deployment to apply the changes.


## ToolJet Cloud
<div style={{display:'flex',justifyContent:"start",alignItems:"center",gap:"8px"}}>
<div className="badge badge--primary heading-badge">   
  <img 
    src="/img/badge-icons/premium.svg" 
    alt="Icon" 
    width="16" 
    height="16" 
  />
 <span>Paid feature</span>
</div>

</div>

ToolJet Cloud allows you to map a custom domain or subdomain to your workspace, so your team can access ToolJet from a URL like `tools.yourcompany.com` instead of the default ToolJet Cloud URL.

### Workspace-level Domain Mapping

In ToolJet Cloud, custom domains are configured per workspace. This means the domain you configure will apply only to that specific workspace and all applications within it.

For example:
| Workspace            | Custom Domain               |
| -------------------- | --------------------------- |
| Finance Workspace    | `finance-tools.company.com` |
| Operations Workspace | `ops-tools.company.com`     |

Once configured, users will access the workspace and its applications using the custom domain instead of the default ToolJet Cloud URL.

### Prerequisites

- A registered domain name with access to its DNS settings.
- A ToolJet Cloud workspace on a supported plan (Trial, Teams, or Enterprise).

### Configuration Steps

#### 1. Create a DNS Record

Log in to your domain provider's DNS management console and create a **CNAME** record that points your desired subdomain to `app.tooljet.com`.

| Record Type | Host/Name | Value |
| ----------- | --------- | ----- |
| CNAME | `tools` (or your preferred subdomain) | `app.tooljet.com` |

For example, if your domain is `yourcompany.com` and you want to use `tools.yourcompany.com`, create a CNAME record with the host `tools` pointing to `app.tooljet.com`.

:::info
If you want to use a root domain (e.g., `yourcompany.com`) instead of a subdomain, the record type depends on your DNS provider. Some providers like Cloudflare support CNAME flattening at the root level, while others (like AWS Route 53) require an **ALIAS** record. Check your DNS provider's documentation for the supported record type at the root domain.
:::

#### 2. Add the Domain in ToolJet

1. Go to **Settings** > **Custom Domain** in your ToolJet Cloud workspace.
2. Enter the domain or subdomain you configured in the previous step (e.g., `tools.yourcompany.com`).
3. Click *Save changes*.

#### 3. Wait for DNS Propagation

DNS changes can take a few minutes to propagate, depending on your DNS provider and TTL settings.

#### 4. Test Connection

After some time, click **Test connection** on the Custom Domain settings page to verify that your domain is correctly mapped. Once the test passes, your ToolJet workspace will be accessible at your custom domain.

### Impact of Updating a Custom Domain
When a custom domain is configured or updated for a ToolJet Cloud workspace, the workspace will start resolving from the new domain once DNS propagation completes.

Because authentication flows depend on the application URL, you may need to update redirect URLs in your authentication providers. For example, if you are using SSO providers such as Okta, Azure AD, or Google OAuth, ensure that the redirect/callback URLs include the new custom domain.

If these URLs are not updated, users may encounter authentication errors during login.