---
id: access-currentuser
title: Enable/Disable a Component Using Current User's Property
---
<div style={{paddingBottom:'24px'}}>

Let's take a look at the exposed variables of the currentUser property by clicking on the **[inspector](/docs/app-builder/left-sidebar/#inspector)** icon on the left sidebar:

- **email** : The value can accessed using `{{globals.currentUser.email}}`
- **firstName** : The value can accessed using `{{globals.currentUser.firstName}}`
- **lastName** : The value can accessed using `{{globals.currentUser.lastName}}`
- **groups**: The `groups` attribute is an array representing the groups a user belongs to. By default, every user, including admins, is part of the `all_users` group. Additionally, admins are also part of the `admin` group. To access a specific group name, you need to specify the array index, such as `[0]` for the first group, `[1]` for the second, and so on. For example, you can retrieve the name of the second group a user belongs to with `{{globals.currentUser.groups[1]}}`.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Example: Disable a Button if a User is Not Admin

- Click on the **Button** handle to open its properties. On the **Styles** tab, go to the **Disable** property. 

<div style={{textAlign: 'left', width: '100%', marginTop:'15px', marginBottom:'15px'}}>
    <img className="screenshot-full" src="/img/how-to/access-currentuser/button.png" alt="Properties of button" />
</div>

- Configure the Disable field with a condition that checks the user's group membership. If the user is not an admin, as determined by the absence of the admin value in the first position (index [1]) of the groups array, the field should be disabled. Use the following JavaScript condition for this purpose:

```javascript
{{globals.currentUser.groups[1] !== "admin" ? true : false}}
```

<div style={{textAlign: 'left', width: '100%', marginTop:'15px', marginBottom:'15px'}}>
    <img className="screenshot-full" width="100%" src="/img/how-to/access-currentuser/disable.png" alt="Disable Property of button" />
</div>

- Now, when you **release** the app, if the user is not a part of the **admin** group, the button will be disabled. 

<div style={{textAlign: 'left', width: '100%', marginTop:'15px', marginBottom:'15px'}}>
    <img className="screenshot-full" width="100%" src="/img/how-to/access-currentuser/released.png" alt="Released button disabled when user is not admin" />
</div>

</div>