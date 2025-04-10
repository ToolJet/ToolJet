---
id: versioning-and-release
title: Versioning and Release
---

# Versioning and Release

Versioning and Release lets you version control your apps and release app changes to the users. 

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Versioning

Versioning is really useful if multiple developers are working on an app, it allows them to save their own version of the app. This also prevents developers from overwriting the other developer's work. 

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Creating a Version

You can create new versions from **App Version Manager** on the top-right corner. It displays the version of the app that you're currently working and can be used to switch between the different version of the app. To create a new version:

- Go to the **App Version Manager** from the toolbar and click on the dropdown. It will display all the versions of the app that have been created. The released version name will be in green color.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/tutorial/versioning-and-release/releasev25.png" alt="app version"/>

  </div>

- Click on **Create new version** button present at the bottom of the dropdown and a modal will pop-up. Enter a **Version Name** and click on **Create version from** dropdown that will include all the versions of the app, choose a version from the dropdown that you want to use for your new version or ToolJet will automatically select the last created version, and then click on `Create new Version` button to add a new version.
  <div style={{textAlign: 'center'}}>

  <img style={{ width:'100%', border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/tutorial/versioning-and-release/newpopup.png" alt="modal"/>

  </div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Renaming a Version

If you want to change the name of an app version, navigate to the **version manager** and select the version you wish to rename. From there, you can click on the rename button located beside the version name. This will open a modal where you can modify the version name to your desired choice.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tutorial/versioning-and-release/editv.png" alt="version dropdown" />

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Deleting a Version

If you want to remove an app version, go to the **version manager** and locate the version you wish to delete from the dropdown menu. Next to the version, you will find a delete icon. Click on it to initiate the deletion process.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tutorial/versioning-and-release/deletev.png" alt="version dropdown" />

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Release

Making a release let's you publish the app and push the changes to production.

### Releasing a Version

To release a version:

- Go to the **App Version Manager** and select the `version` from the dropdown that you want to release.
  <div style={{textAlign: 'center'}}>

  <img  className="screenshot-full" src="/img/tutorial/versioning-and-release/versiondropdownv2.png" alt="version dropdown" width="300" />

  </div>

- Click on the `Release` button on the top-right corner.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/tutorial/versioning-and-release/releasev2.png" alt="release" width="700"/>

  </div>

- A confirmation dialog will popup that prompts you to decide whether to release the current version of the app. Clicking on the **Release** button will release the current version of the app.
  <div style={{textAlign: 'center'}}>

  <img className="screenshot-full" src="/img/tutorial/versioning-and-release/confirm.png" alt="release" width="300"/>

  </div>


:::caution
- When an app is made **Public** without being released, it functions similarly to previewing the application. This means that the version that is loaded when accessing the app through its Public app URL will be the same version of the app currently loaded in the app builder.

- To prevent the unintended publishing of an unfinished app, ToolJet will prompt you to create a new version for making any edits to the `Released version` of an app. Editing of the `Released version` will be blocked until a new version is created.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/tutorial/versioning-and-release/releasepopup.gif" alt="release" />

</div>
:::

</div>