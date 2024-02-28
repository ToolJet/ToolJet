---
id: using-fx
title: Using the FX Functionality
---

Clicking on the **fx** symbol in ToolJet opens up a code editor that allows you to write custom JavaScript expressions. You can find **fx** in the properties panel on the right, next to various properties and settings of a component.

With **fx**, you can perform calculations or set conditional logic to dynamically configure the components without leaving the ToolJet interface. It's an invaluable tool for adding complexity and interactivity to your applications.

## Toggle Button 

When using **fx** buttons associated with toggle buttons, the expected output of the code you enter should be a boolean value - `true` or `false`. For example, the below code will check whether the entered age entered in the number input field of the form is above 18, the button component will be enabled or disabled based on it. 

```js
{{components.form1.data.numberinput1.value>18? false : true}}
```

<div style={{marginBottom:'15px', height:'492px'}}>
    <iframe
        className="screenshot-full"
        src="https://www.floik.com/embed/e4f537b5-7b36-4760-9a52-caefc659a90b/4931d426-a33c-47c4-a30f-b34283b482ec-flo.html"
        style={{width: '100%', height: '100%'}}
        frameborder="0"
        allowfullscreen="allowfullscreen"
        webkitallowfullscreen
        mozallowfullscreen
        allowfullscreen>
    </iframe>
</div>

For other cases, the expected value is a string. For example, If you are setting `Text color`, `Background Color`, `Loader Color`, etc. You need to pass in a JavaScript code that returns a hex code as a string.  

## Access all Variables, Queries, and Components

The expressions you write in the code editor available after clicking on **fx** lets you access all the variables, queries, and components within your application. This allows you to create intricate relationships between different parts of your app, making it more responsive and user-friendly.







