---
id: using-code
title: Using Custom Code
---

In ToolJet, code serves as a powerful means to enhance and customize your applications. From complex logic implementations using **Run JavaScript code** or **Run Python code** queries to simple dynamic expressions with `fx`, the versatility is immense. Below is a basic demonstration of how you can leverage code within ToolJet.

Let's take a look at different examples on how to use code. 

## Using fx to Dynamically Change Properties of a Component:
- Drag and drop a **Number Input** component and a **Button** component on the canvas.
- Click on the **Button** component, navigate to its Properties Panel on the right and click on the `fx` button next to the `Disable` condition.
- Enter the below code under the `Disable` condition:
```js
{{components.numberinput1.value ? false : true}}
//replace numberinput1 with the name of your check box component
```
Now if there is no value entered in the Number Input component, the button will be disabled.

You can apply the same principles to programmatically set a range of properties.

#### Examples:
1. To change the color of the Button component based on a Text Input field, enter the below code under the color property of the Button component:
```js
{{components.textinput1.value == "available" ? '#375FCF' : '#FF0000'}}
//replace textinput1 with the name of your check box component
```

2. To change the visibility of an Image component based on a Checkbox component, enter the below code under the Visibility condition of the Image component:

```js
{{components.checkbox1.value ? true : false}}
//replace checkbox1 with the name of your check box component
```

## Table Transformations to Change Cell Value
- Go to the Properties Panel of a Table component, under `Columns`, click on a column name. 
- Under `Transformations`, the default value will be `{{cellValue}}`. Add JavaScript code to update the cell value dynamically. 
- For instance, to round off a value, you can use the below code:
```js
{{cellValue > 4.5 ? 5 : 4}}
```

## Transforming Data Returned by a Query Using Run JavaScript code:
- Click on the **Add** button in the Query Panel and select **Run JavaScript code** 
- Use the below code to execute a query, access its data and transform it:

```js
await queries.restapi1.run();
// replace restapi1 with your query name

let value = queries.restapi1.getData();
// replace restapi1 with your query name

function filterProductsByBrandAndRating(value.products, brand, minRating) {
     return products.filter(product => product.brand === brand && product.rating >= minRating);}
        return filterProductsByBrandAndRating(value.products, "Apple", 4.5)
//use JavaScript code to refine the data        
```

## Use Moment.js to Add Current Date to the Datepicker Component
- Select the Datepicker component and go to its Properties Panel. Under `Default value`, enter the below code:
```js
{{moment().format('DD/MM/YYYY');}}
```
The above code will add today's date as the default in DD/MM/YYYY format.

## Show Data Based on the Logged-in User.

- Click on the **Inspector** in the left side-bar and expand the `Globals` accordion to check all the values available under global. These properties can be used to make your app more dynamic. 
- For instance, if there is a Button component used to update IT Ticket Requests, you can click on **fx** next to the component's `Visibility` property and enter the below code to make the button visible only when admins access it:
```js
{{globals.currentUser.groups.includes("admin") ? true : false }}
```

The examples provided are just a starting point for leveraging ToolJet's custom code capabilities. You have the flexibility to fully tailor your applications using our comprehensive custom coding features.