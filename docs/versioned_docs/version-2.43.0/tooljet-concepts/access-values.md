---
id: how-to-access-values
title: Access Values
---


In ToolJet, double curly braces `{{}}` can be used to retrieve data returned by queries, access values related to components and pass custom code. You can see the list of all accessible values in the **[Inspector](/docs/how-to/use-inspector/)** tab in the left sidebar. 


<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Accessing Values

The **queries** keyword can be used to access data returned by queries. For example:`{{queries.getSalesData.data}}`

Similarly, the **components** keyword can be used to access data in the components and other component-related variables. For example: `{{components.table1.selectedRow.id}}`.

<div style={{textAlign: 'center'}}>
    <img className="screenshot-full" src="/img/tooljet-concepts/writing-custom-code/inspector.png" alt="Check Available Values Using Inspector" />
</div>


</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Writing Custom Code 

You can write custom JavaScript code to set colors, enable or disable toggles and more by passing in JavaScript code inside double curly braces. To change Background Color of a button based on the light or dark theme using **fx** (next to properties in properties panel), you can use a code that returns a string value of hex code. <br/>

For example, `{{globals.theme.name == "light" ? "#375FCF" : "#FFFFFF"}}`

Similary, to enable or disable a button based on user input using **fx**, you can write a JavaScript code that returns true or false. <br/>

For example, `{{components.form1.data.textinput1 == "" ? true : false}}`.

</div>
