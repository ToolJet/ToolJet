---
id: how-to-access-values
title: How to Access Values
---

<div style={{marginLeft:"10%", marginRight:"10%"}}>

In ToolJet, double curly braces `{{}}` can be used to retreive data returned by queries, access values related to components and pass custom code. 

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Accessing Values 

The **queries** keyword can be used to access data returned by queries. For example:`{{queries.getSalesData.data}}`

Similarly, the **components** keyword can be used to access data in the components and other component-related variables. For example: `{{components.table1.selectedRow.id}}`.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/writing-custom-code/inspector.png" alt="Check Available Values Using Inspector" />
</div>

You can see the list of all accessible values in the **Inspector** tab in the left sidebar. 

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Writing Custom Code

You can write custom JavaScript code to set colors, enable or disable toggles and more by passing in JavaScript code inside double courly braces. 

For example, to change Background Color of a button based on the the light or dark theme using **fx** (next to properties in configuration panel), you can use the following code that returns a string value of hex code: <br/>
`{{globals.theme.name = "light" ? "#375FCF" : "#FFFFFF"}}`

Similary, to enable or disable a button based on user input using **fx**, you can write a JavaScript code that returns true or false. <br/>

For example, `{{components.form1.data.textinput1 = null ? true : false}}`.

</div>

</div>
