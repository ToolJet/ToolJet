---
id: overview
title: Overview
---

<div className='badge badge--primary heading-badge'>Available on: Paid plans</div>

The GitSync feature in ToolJet allows seamless synchronization of workspace applications with a Git repository, enhancing version control, environment migration, and backup management. It supports both cloud-based Git providers such as GitHub and GitLab, as well as self-hosted Git solutions like Gitea and BitBucket, offering flexibility in managing application development and deployment. 

## Key Use-Cases

### Environment Migration

GitSync can be used to facilitate the movement of application across different ToolJet instances such as from development to staging to production. Users can effortlessly transfer their applications across instances by pushing changes to a Git repository. This means that once an application is developed in one instance, it can be easily moved to another by simply syncing with the repository, ensuring a smooth transition without the need for manual configurations.

<img className="screenshot-full" src="/img/gitsync/envmigration.png" alt="GitSync" />

### Backup of Apps

GitSync provides a straightforward solution for creating backups of your applications. By pushing changes to a Git repository, users can ensure a secure and versioned history of their application. This serves as a reliable backup mechanism, safeguarding against accidental application/version deletion or corruption.
