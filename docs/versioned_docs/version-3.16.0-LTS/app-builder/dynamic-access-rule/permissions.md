---
id: overview
title: Dynamic Access Rules
sidebar_label: Overview
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
</div>

In ToolJet you can configure dynamic access rules to build secure, role-based applications. You can configure permissions at the page level, query level, component level, and row level to ensure users only access the features and data they're authorized to use.

## When To Use

1. **Multi-role applications**: When your app serves different user types (leadership, managers, executives, etc.) who need access to different features, data, or functionality based on their role.
2. **Sensitive data protection**: When your application handles confidential information like financial data, personal records, or business-critical operations that should only be accessible to authorized personnel.
3. **Compliance and security requirements**: When your organization has regulatory requirements, audit trails, or security policies that mandate controlled access to specific features, data, or administrative functions.


## Permission Types

| <div style={{ width:"150px"}}> Permission Level </div> | <div style={{ width:"200px"}}> Description </div> | <div style={{ width:"200px"}}> Use When </div> |
|:----------------|:------------|:---------|
| [Page Level](page-level-permissions) | Control which users can access specific pages in your application | Entire page should be hidden from certain roles |
| [Query Level](query-level-permissions) | Restrict which users can execute particular queries or API calls | Sensitive data operations need protection |
| [Component Level](component-level-permissions) | Hide or show specific UI components based on access permission | Users can view a page but shouldn't interact with all elements |
| [Row Level Security](row-level-security) | Control which records a user can see or interact with in database queries | Different users need access to different subsets of data from the same table |

<br/>
---

## Need Help?

- Reach out via our [Slack Community](https://join.slack.com/t/tooljet/shared_invite/zt-2rk4w42t0-ZV_KJcWU9VL1BBEjnSHLCA)
- Or email us at [support@tooljet.com](mailto:support@tooljet.com)
- Found a bug? Please report it via [GitHub Issues](https://github.com/ToolJet/ToolJet/issues)
