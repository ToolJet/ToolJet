---
id: access-currentuser
title: Enable/Disable a component using current user's property
---

# Enable/Disable a component using current user's property

Let's take look at the exposed variables of the current user property:

- **email** : The value can accessed using `{{globals.currentUser.email}}`
- **firstName** : The value can accessed using `{{globals.currentUser.firstName}}`
- **lastName** : The value can accessed using `{{globals.currentUser.lastName}}`
- **lastName** : The value can accessed using `{{globals.currentUser.lastName}}`
- **groups** : By default, the admin will be in the two groups `all_users` and `admin`, and any user who is not admin will always be in the `all_users` group by default. Since the **groups** is an array you’ll have to provide the index ([0], [1], and so on) to return the group name. The value can be accessed using `{{globals.currentUser.groups[1]}}`.

<div style={{textAlign: 'center'}}>

<img className="screenshot-full" src="/img/how-to/access-currentuser/props.png" alt="Properties of current user" />

</div>

### Example: Disable a button if a user is not admin

- Click on the **Button** handle to open its properties, on the **Styles** tab go to the **Disable** property. 

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/access-currentuser/button.png" alt="Properties of button" />

    </div>

- Set a condition on the Disable field so that if the user who is using the app does not have **admin** value in the first index of **groups** array return **true**. The condition can be:

    ```javascript
    {{globals.currentUser.groups[1] !== "admin" ? true : false}}
    ```

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/access-currentuser/disable.png" alt="Disable Property of button" />

    </div>

- Now, when you'll **release** the app, if the user is not is not admin the button will be disabled. 

    <div style={{textAlign: 'center'}}>

    <img className="screenshot-full" src="/img/how-to/access-currentuser/released.png" alt="Released button disabled when user is not admin" />

    </div>

:::info
In this how-to we have used the **Groups** property of the **Current User**. You can use any of the exposed variables mentioned above according to your use.
:::
