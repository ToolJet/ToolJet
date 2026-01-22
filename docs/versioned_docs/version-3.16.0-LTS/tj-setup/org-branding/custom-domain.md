---
id: custom-domain
title: Custom Domain
---

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

<div className="badge badge--self-hosted heading-badge" >   
 <span>Self Hosted</span>
</div>

</div>

In a self-hosted deployment of ToolJet, you can configure a custom domain by setting the `TOOLJET_HOST `environment variable.

## Prerequisites

- A running self-hosted instance of ToolJet.

- A registered domain name.

- A configured DNS record pointing your domain to the ToolJet server.


## Configuration Steps

### 1. Set the TOOLJET_HOST Environment Variable

The TOOLJET_HOST variable defines the public URL where ToolJet will be accessible. You need to update this variable with your desired domain.

| variable     | description                                                      |
| ------------ | ---------------------------------------------------------------- |
| TOOLJET_HOST | the public URL of ToolJet client ( eg: `https://app.corp.ai`,`https://corp.ai`,`https://corp.ai/app` ) |


### 2. Restart Services

After setting the environment variable and DNS configurations, restart your ToolJet deployment to apply the changes.


:::info
Custom domains will soon be supported in ToolJet Cloud.
:::