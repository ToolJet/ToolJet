---
id: versioning-and-release
title: Versioning and Release
---

# Versioning and Release

Versioning and Release lets you version control your apps and release app changes to the users. 

## Versioning

Versioning is really useful if multiple developers are working on an app, it allows them to save their own version of the app. This also prevents developers from overwriting the other developer's work. 

### Creating a Version

You can create new versions from **App Version Manager** on the top-right corner. It displays the version of the app that you're currently working and can be used to switch between the different version of the app. To create a new version:

- Go to the **App Version Manager** from the toolbar and click on the dropdown. It will display all the versions of the app that have been created.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/tutorial/versioning-and-release/appversionv2.png" alt="app version" width="700"/>

  </div>

- Click on **Create Version** and a modal will pop-up. Enter a **Version Name** and click on **Create version from** dropdown that will include all the versions of the app, choose a version that you want to use for your new version and then click on `Create Version`.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/tutorial/versioning-and-release/modalv2.png" alt="modal" width="400"/>

  </div>

## Release

Making a release let's you publish the app and push the changes to production.

### Releasing a version

To release a version:

- Go to the **App Version Manager** and select the `version` from the dropdown that you want to release.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/tutorial/versioning-and-release/versiondropdownv2.png" alt="version dropdown" width="300" />

  </div>

- Click on the `Release` button on the top-right corner.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/tutorial/versioning-and-release/releasev2.png" alt="release" width="700"/>

  </div>


:::tip 
ToolJet will block editing of the `Released version` of an app and will display a prompt to create a new version to make the changes. This is to prevent accidentally pushing an unfinished app to the live version.
<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tutorial/versioning-and-release/promptv2.png" alt="release" width="400" />

</div>
:::





