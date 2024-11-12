---
id: release-notes
title: Release Notes
---

# ToolJet 3.0 Release Notes

This document outlines the key improvements introduced in ToolJet 3.0, a major upgrade focused on performance, scalability, and developer experience.

## App Builder

1. Up to 10 times faster app loading speeds 
2. Smooth app development even with 1000s of components and 100s of queries
2. More intuitive experience in designing applications on the canvas with the new grid system
4. Highly configurable **[page management system](../tutorial/pages)**
5. Revamped **[components](../widgets/table/table-properties/)** with more styling and functionality customizations
6. Enhanced developer experience in managing queries with the **[new query manager UI](../app-builder/query-panel)**
7. Improved coding experience with better code suggestions, linting, and type-casting
8. Better debugging with easy-to-understand error messages
9. Theme settings: Light/dark/auto mode at the application level

## Platform Enhancements

1. **[Group Sync OIDC](../user-authentication/sso/oidc/)**: Easily manage user access to ToolJet applications from your Identity Provider (IDP) directly
2. **[Secrets constants](../org-management/workspaces/workspace_constants/#using-secrets)**: Ability to store encrypted credentials 
3. **[User metadata](../tutorial/manage-users-groups/#user-metadata)**: Store custom metadata with user details & access them while building applications
4. User roles: Revamped user groups with granular access control
5. **[User APIs](../tutorial/tooljet-api/#get-all-users)**: External API for creating and managing users
6. Security fixes: Various improvements to enhance platform security

## ToolJet Database (TJ DB)

1. **[Custom primary key](../tooljet-db/database-editor/#primary-key)** and **[foreign key support](../tooljet-db/database-editor/#foreign-key)**
2. Support for more data types for advanced use cases
3. **[SQL mode](../tooljet-db/querying-tooljet-db#sql-editor)** for complex querying 
4. Bulk upload using CSV 
5. GUI for **[complex SQL queries](../tooljet-db/querying-tooljet-db#gui-mode)** like joins, aggregates, and group by

## Integrations

1. 15+ new integrations, including:
    - AWS services (Textract, Lambda, Redshift)
    - OpenAI
    - Databricks
    - Salesforce
    - Jira
    - Sharepoint
    - Supabase
2. Client Credentials Grant Type

## AI Apps

Build AI apps using **[OpenAI](../marketplace/plugins/marketplace-plugin-openai)**, and **[Portkey](../marketplace/plugins/marketplace-plugin-portkey)** integrations

## Workflows

1. Introduction of **[loop node](../workflows/nodes#loop-node)** to implement iterative processes
2. Improved error handling and debugger: Improved troubleshooting
3. Support for multiple deployment environments
4. **[Webhook triggers](../workflows/workflow-triggers#webhooks)** to trigger workflows from external apps and services
5. **[Multiple result nodes](../workflows/results)** for greater flexibility in defining the output

## Migration Steps

Ready to upgrade to ToolJet 3.0? Follow our migration guides:
- **[For Self-Hosted Users](../setup/upgrade-to-v3)**
- **[For Cloud Users](../setup/cloud-v3-migration)**

This release significantly enhances ToolJet's capabilities across its platform, focusing on improved performance, expanded integrations, and smoother development experience for building complex applications. The addition of AI-powered features and the release of Workflows provide users with advanced tools for creating sophisticated, automated solutions.



