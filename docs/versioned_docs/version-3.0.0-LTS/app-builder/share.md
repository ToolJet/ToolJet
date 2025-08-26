---
id: share
title: Share
---

ToolJet apps offer two sharing options: private sharing with workspace users or public sharing via a generated link. To obtain the shareable URL, click the **Share** icon on the top bar of the App Builder.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/share/share-app-v2.gif" alt="Share modal" />

</div>

### Making the app public

To share the app publicly and make it accessible to anyone on the internet without requiring a ToolJet login, toggle the **Make application public** switch in the Share modal.

:::info
Only released apps can be accessed using the Shareable app link.
:::

<div style={{textAlign: 'left'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/share/make-application-public-v2.png" alt="Make Application Public" width='700'/>

</div>

### Customizing the app URL

By default, ToolJet will generate a unique URL for your application. However, you also have the option to edit the slug of the URL to make it more customized and user-friendly.

<div style={{textAlign: 'left'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/share/edit-slug-v2.png" alt="Edit Slug/URL" width='700'/>

</div>

### Embedding ToolJet Apps

ToolJet apps can be directly shared with end users and embedded into web apps using `iframes`. If you want to make your application public, you can use the Share modal to obtain the embeddable link.

:::info
For embedding private ToolJet apps, you'll need to set an environment variable in the `.env` file.

| Variable        | Description                           |
|:-------------- |:------------------------------------ |
| ENABLE_PRIVATE_APP_EMBED | `true` or `false` |

You can learn more [here](/docs/setup/env-vars#embedding-private-apps).
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/share/embeddtj.gif" alt="Share modal" />

</div>