---
id: conditionally-display-components
title: Conditionally Display Components Using fx and Groups
---


In this guide, you'll see how you can utilize groups to conditionally display components. This can be handy when two or more groups have access to the same app and you want to conditionally display components based on the group.

Here's a basic application with some components. 

<div style={{textAlign: 'left'}}>
    <img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/how-to/conditionally-view-components/initial-ui.png" alt="Initial UI without any conditions" />
</div>

In this app, the `Approve Selected` button should only display if someone from the **Manager** group is accessing the application. 

- To implement this, select the button component and navigate to its `Visibility` property. 
- Click on the **fx** button next to `Visibility` and enter the below code in the input:

```js
{{globals.currentUser.groups.includes('Manager')}}
```
<div style={{textAlign: 'left'}}>
    <img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/how-to/conditionally-view-components/conditional-visibility-code.png" alt="Visibility Code on Button Component" />
</div>

- Now if you check the UI, you won't see the **Button** component unless you are a part of the `Managers` group.

- Here's what the users who are not in the `Managers` group can see:

<div style={{textAlign: 'left'}}>
    <img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/how-to/conditionally-view-components/non-manager-view.png" alt="Non Manager View" />
</div>

- Here's what the users in the `Managers` group can see:

<div style={{textAlign: 'left'}}>
    <img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/how-to/conditionally-view-components/manager-view.png" alt="Manager View" />
</div>

This was a basic implementation of how you can control the visibility of components using **fx** and **Groups** in ToolJet. 

Feel free to implement the same logic for more advanced use cases. For instance, for conditionally displaying a section or a group of components, you can place all the relevant components inside a **Container** component and apply the same logic.  

