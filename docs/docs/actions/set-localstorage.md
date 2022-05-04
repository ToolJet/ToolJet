---
id: set-localstorage
title: Set localStorage
---

# Set localStorage

This action allows you to specify a `key` and its corresponding `value` to be stored in localStorage.

## Example: App that stores a name in localStorage and displays it on reload

1. Add an input field, button and a text as shown
<img src="/img/actions/localstorage/sample-app-1.png" alt="Set local storage sample app" height="350" />

2. Select the button and add a `Set localStorage` action with `key` set to `name` and value pointing at the value of the text field
<img src="/img/actions/localstorage/sample-app-2.png" alt="Set local storage sample app" height="350" />

3. Select the text label we've added and set its value to the name item from localStorage
<img src="/img/actions/localstorage/sample-app-3.png" alt="Set local storage sample app" height="150" />

4. Now save the application, this is important as we're about to reload the page.

5. Type in anything you wish on the input box and click on the button
<img src="/img/actions/localstorage/sample-app-4.png" alt="Set local storage sample app" height="150" />

6. Reload the page, you'll see that the value stored in local storage is persisted and it is displayed on screen!
<img src="/img/actions/localstorage/sample-app-5.png" alt="Set local storage sample app" height="350" />

