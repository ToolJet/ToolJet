---
id: release-rollback
title: Release and Rollback
---

The Release and Rollback features in ToolJet enables teams to seamlessly deploy new updates, while maintaining the ability to revert to a stable version if needed. This ensures a controlled rollout of features, bug fixes, and improvements without risking application stability. In case of unexpected issues, the rollback function allows users to instantly restore a previous version, minimizing downtime and disruptions. 

## Release 

Releasing an app in ToolJet makes the selected version available to end users, allowing them to access and use the application for their tasks. This ensures that users use the latest version of the app, which includes any updates, bug fixes, or new features added in the release.

To release an app follow these steps:

1. Promote the required version to the **[production environment](#)**.

2. Click on the Release button at the top-right corner.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/development-lifecycle/release/release/release-v3.png" alt="release"/>

3. A confirmation dialog will popup that prompts you to decide whether to release the current version of the app. Clicking on the **Release** button will release the current version of the app.

<img style={{ marginTop:'15px' }} className="screenshot-full" src="/img/development-lifecycle/release/release/confirm-v2.png" alt="release"/>

## Rollback

The Rollback feature in ToolJet allows you to quickly revert to a previously stable version of your app whenever needed. Whether fixing bugs, resolving errors, or addressing unexpected issues after a release, rollback ensures minimal disruption to end users. By instantly restoring a prior version, teams can maintain application stability while debugging the faulty version offline.

To rollback to a stable version:

1. Go to the **App Version Manager** from the toolbar and click on the dropdown. It will display all the available versions of the app. The released version name will be in green color.
<img className="screenshot-full" src="/img/development-lifecycle/release/version-control/version-menu.png" alt="app version"/>

2. Choose the desired stable version from the dropdown. 

3. Click on the Release button at the top-right corner.

<img style={{ marginBottom:'15px' }} className="screenshot-full" src="/img/development-lifecycle/release/release/release-v3.png" alt="release"/>

4. A confirmation dialog will popup that prompts you to decide whether to release the current version of the app. Clicking on the **Release** button will release the current version of the app.

<img style={{ marginTop:'15px' }} className="screenshot-full" src="/img/development-lifecycle/release/release/confirm-v2.png" alt="release"/>
