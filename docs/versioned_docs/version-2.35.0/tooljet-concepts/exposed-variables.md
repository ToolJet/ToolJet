---
id: exposed-variables
title: Exposed Variables
---

Exposed Variables help in accessing and manipulating data within components. These variables are automatically created and updated as users interact with the application. Whether it's capturing text from a text editor, checking the visibility of a component or retrieving selections from a dropdown menu, exposed variables are integral for dynamic data handling in ToolJet applications.

<div style={{textAlign: 'center'}}>
    <img style={{marginBottom:'15px'}} className="screenshot-full" src="/img/tooljet-concepts/exposed-variables/exposed-variables-preview.png" alt="Preview Of Exposed Variables" />
</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Accessing Exposed Variables
Each component in ToolJet has its own set of exposed variables, which hold specific data related to that component. For example, in the Text Input component, the `value` variable is used. This variable is updated every time a user enters something in the text editor. It can be dynamically accessed using JavaScript notation: `{{components.textinput1.value}}`. This feature allows developers to easily track and utilize the data entered by users in real-time.

</div>

For detailed information about the exposed variables of the components, please refer to their respective documentation.