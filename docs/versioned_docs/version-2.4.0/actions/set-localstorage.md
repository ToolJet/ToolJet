---
id: set-localstorage
title: Set localStorage
---

# Set localStorage

This action allows you to specify a `key` and its corresponding `value` to be stored in localStorage.

## Example: App that stores a name in localStorage and displays it on reload

1. Add an input field, button and a text as shown

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference -Set local storage sample app](/img/actions/localstorage/1.png)

</div>

2. Select the button and add a `Set localStorage` action with `key` set to `name` and value pointing at the value of the text field

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference -Set local storage sample app](/img/actions/localstorage/2.png)

</div>

3. Select the text label we've added and set its value to the name item from localStorage. 

:::info
Debounce field is empty by default, you can enter a numerical value to specify the time in milliseconds after which the action will be performed. ex: `300`
:::

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference -Set local storage sample app](/img/actions/localstorage/debounce.png)

</div>


4. Now save the application, this is important as we're about to reload the page.

5. Type in anything you wish on the input box and click on the button

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference -Set local storage sample app](/img/actions/localstorage/5.png)

</div>


6. Reload the page, you'll see that the value stored in local storage is persisted and it is displayed on screen!

<div style={{textAlign: 'center'}}>

![ToolJet - Action reference -Set local storage sample app](/img/actions/localstorage/6.png)

</div>

