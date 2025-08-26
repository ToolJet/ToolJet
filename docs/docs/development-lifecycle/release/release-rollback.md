---
id: release-rollback
title: Release and Rollback
---

ToolJet allows you to **[release and share](#release)** your application and **[rollback](#rollback)** to a stable version whenever needed. 

## Release

Releasing an app in ToolJet makes the selected version available to end users, allowing them to access and use the application for their tasks. This ensures a controlled rollout of features and bug fixes while ensuring that users have access to the latest version of the app. After an application is released it can be accessed in multiple ways, refer to **[Share an Application](/docs/development-lifecycle/release/share-app)** guide for more information.

### Steps to Release an App

1. Promote the required version to the **[production environment](/docs/development-lifecycle/environment/self-hosted/multi-environment)**.

2. Click on the Release button at the top-right corner.
    <img className="screenshot-full" src="/img/development-lifecycle/release/release/release.png" alt="release"/>

3. A confirmation dialog will popup that prompts you to decide whether to release the current version of the app. Clicking on the **Release** button will release the current version of the app.
    <img className="screenshot-full img-s" src="/img/development-lifecycle/release/release/confirm.png" alt="release"/>

## Rollback

The Rollback feature in ToolJet allows you to revert to a previously stable version of your app whenever needed. Whether fixing bugs, resolving errors, or addressing unexpected issues after a release, rollback ensures minimal disruption to end users. It instantly restores a prior version while keeping the application's URL the same, allowing the team to maintain application stability while debugging the faulty version offline.

For example, after releasing a new version v1.2.0, users report failures of the form component. Using ToolJet’s version rollback, the team can quickly rollback to the stable version v1.1.0, restoring functionality within minutes. This minimizes downtime, and allows developers to debug the faulty version offline.

### Steps to Rollback

1. Go to the **App Version Manager** from the toolbar and click on the dropdown. It will display all the available versions of the app. The released version name will be in green color.
    <img className="screenshot-full" src="/img/development-lifecycle/release/version-control/version-menu.png" alt="app version"/>

2. Choose the desired stable version from the dropdown. 

3. Click on the Release button at the top-right corner.
    <img className="screenshot-full" src="/img/development-lifecycle/release/release/release.png" alt="release"/>

4. A confirmation dialog will popup that prompts you to decide whether to release the current version of the app. Clicking on the **Release** button will release the current version of the app.
    <img className="screenshot-full img-s" src="/img/development-lifecycle/release/release/confirm.png" alt="release"/>
