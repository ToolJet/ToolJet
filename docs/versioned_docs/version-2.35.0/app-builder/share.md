---
id: share
title: Share
---

ToolJet apps offer two sharing options: they can either be shared privately with workspace users or publicly by generating a shareable link. To obtain the shareable URL, you can easily do so by clicking on the Share button located on the top bar of the App builder.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/share/sharenew1.png" alt="Share modal" width='700'/>

</div>

### Making the app public

To share the app with external end users and make it accessible to anyone on the internet without requiring a ToolJet login, you can toggle on the Switch for "Make application public" in the Share modal.

:::info
Only released apps can be accessed using the Shareable app link.
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/share/publicnew1.png" alt="Share modal" width='700'/>

</div>

### Customizing the app URL

By default, ToolJet will generate a unique URL for your application. However, you also have the option to edit the slug of the URL to make it more customized and user-friendly.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/share/edit1.png" alt="Share modal" width='700'/>

</div>

### Embedding ToolJet Apps

ToolJet apps can be directly shared with end users and embedded into web apps using `iframes`. If you want to make your application public, you can use the Share modal to obtain the embeddable link.

:::info
For embedding private ToolJet apps, you'll need to set an environment variable in the `.env` file.

| Variable        | Description                           |
|:-------------- |:------------------------------------ |
| ENABLE_PRIVATE_APP_EMBED | `true` or `false` |

You can learn more [here](/docs/setup/env-vars#enabling-embedding-of-private-apps).
:::

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/v2-beta/app-builder/share/embeddtj.gif" alt="Share modal" />

</div>