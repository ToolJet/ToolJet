---
id: what-are-components
title: What Are Components?
---


ToolJet App-Builder comes with an array of pre-built components to accelerate the application development process. Every component comes with customizable settings for both functionality and appearance.

## Adding a Component To The Canvas

The component library, located on the right side of the screen, showcases a list of built-in components that we can incorporate into our application. The library also features a search field, making it easy to locate specific components quickly.

To place a component onto the canvas, go to the component library on the right and simply drag the chosen component onto the canvas.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/what-are-components/drag-components.gif" alt="Add Components To The Canvas" />
</div>

## Resizing a Component

We can easily resize and reposition components on the canvas.

To resize a component, click on its borders and drag it until it reaches the desired size.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/what-are-components/resize-components.gif" alt="Component Resize" />
</div>

To reposition a component, click on its **Component Handle** on the top-left and drag it to the desired location.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/what-are-components/move-components.png" alt="Move Component" />
</div>

## Change Component Properties

Click on the component to open the configuration panel on the right. Under **Properties** tab, we can see all the configuration related to data and functional aspects of the component. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/what-are-components/properties-tab.png" alt="Properties Tab" />
</div>

The **Styles** tab allows us to customize the styling of the component. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/what-are-components/styles-tab.png" alt="Styles Tab" />
</div>

Each component will have a different set of configuration options based on its overall functionality. 

## Adding Components To The Modal

Place a **Modal** component onto the canvas. Initially, we'll see a button labeled **Launch Modal** on the screen, which is used to open the modal.

To modify the modal, click the **Launch Modal** button. This will open the modal on the canvas. The modal remains open for editing until we click the `X`/close button located at its top-right corner. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/what-are-components/edit-modal.gif" alt="Edit Modal Component" />
</div>

To return to the components library while the modal is open, click the `←`/back button located at the top-left of the Modal component's configuration panel. We can now see the components library and drag and drop additional components onto the modal.

## Connecting Data To A Component

We can add queried data to the components. Let's create a query that fetches data using the REST API. 

Select **REST API** as the data source. Leave the Method as **GET** and paste the below link under URL:

```js
https://dummyjson.com/docs/products
```

Rename the query to *getProducts* and click on the **Run** button in the query panel to fetch the data. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/what-are-components/query.png" alt="Get Products Query" />
</div>

Click and drag a **Table** component on the canvas. In the **Data** property of the Table component, paste the below code:

```js
{{queries.getProducts.data.products}}
```
<i>We need to use double curly braces to input custom JavaScript code or to access queries, component-related values and other variables in the App-Builder.</i>

<br/>
<br/>

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/what-are-components/load-data-in-table.png" alt="Load Data In Table" />
</div>

Now the table will display the data fetched from the query. 

## Conditionally Display A Component

Let's continue using the Table component. Place a **Text Input** component below it. 

Click on the Table component and navigate to its configuration panel on the right. Go to the **Styles** tab, we can see the **Visibility** toggle. To set the Visibility of the component conditionally, click on the **fx** button next to Visibility. An input field will come up which is set to `{{true}}`. We can write a custom JavaScript that returns `true` or `false` to programmatically set the visibility.

Paste the below code in the **fx** input field:
```js
{{components.textinput1.value == 1 ? true : false}}
```
The above code checks if the **Text Input** component has **1** as the value. If the value is **1**, it returns `true` or else it returns `false`.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/what-are-components/visibility-condition.png" alt="Visibility Condition Demo" />
</div>

Now the Table component will only be visible if the **Text Input** component has **1** as the input value. We can apply the same principles for the **Disable** toggle. A common use-case would be enabling or disabling Buttons based on whether the mandatory input fields have been filled with some data.

The Table component will now appear only when the **Text Input** component contains an input value of **1**. The same logic can be applied to the **Disable** toggle. The Disable toggle is often useful for enabling or disabling buttons, depending on whether required input fields have been filled by the end-user.

We've covered the fundamentals of using components in this guide. Here are a few other useful guides that might help in exploring some more fundamentals of ToolJet. 

**[Styling Components in App-Builder](styling-components)** <br/>
**[Working With Queries](working-with-queries)**