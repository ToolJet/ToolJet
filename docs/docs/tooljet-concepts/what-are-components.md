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

Place a **[Modal](/docs/widgets/modal)** component onto the canvas. Initially, we'll see a button labeled **Launch Modal** on the screen, which is used to open the modal.

To modify the modal, click on the **Launch Modal** button. This will open the modal on the canvas. The modal will remain open for editing until we click the `X` (close) button located at its top-right corner

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/what-are-components/edit-modal.gif" alt="Edit Modal Component" />
</div>

To return to the components library while the modal is open, click on the **`←`**(back) button located at the top-left of the Modal component's configuration panel. We can now see the components library and drag and drop additional components onto the modal to create forms, summary views and more.

## Connecting Data To A Component

We can add queried data to the components. Let's create a query that fetches data using the REST API. 

Select **REST API** as the data source. Leave the Method as **GET** and paste the below link under URL:

```js
https://dummyjson.com/products
```

Rename the query to *getProducts* and click on the **Run** button in the query panel to fetch the data. 

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/what-are-components/query.png" alt="Get Products Query" />
</div>

Click and drag a **[Table](/docs/widgets/table)** component on the canvas. In the **Data** property of the Table component, paste the below code:

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

Let's continue using the Table component. Place a **[Text Input](/docs/widgets/text-input/)** component below it. 

Click on the Table component and navigate to its configuration panel on the right. Go to the **Styles** tab, we can see the **Visibility** toggle. To set the visibility of the component conditionally, click on the **fx** button next to the **Visibility** property. An input field will appear, pre-filled with `{{true}}`. We can write a custom JavaScript code that returns `true` or `false` to programmatically set the visibility.

Paste the below code in the **fx** input field:
```js
{{components.textinput1.value == 1 ? true : false}}
```
The above code checks if the **Text Input** component has **1** as the value. If the value is **1**, it returns `true` or else it returns `false`.

<div style={{textAlign: 'center'}}>
    <img style={{padding: '10px'}} className="screenshot-full" src="/img/tooljet-concepts/what-are-components/visibility-condition.png" alt="Visibility Condition Demo" />
</div>

The Table component will now appear only when the **Text Input** component contains an input value of **1**. The same logic can be applied to the **Disable** toggle. The Disable toggle is often useful for enabling or disabling buttons, depending on whether required input fields have been filled by the end-user.

In this guide, we've delved into the fundamentals of using components within ToolJet's App-Builder, providing you with the foundational knowledge needed to start building your applications. To further enhance your understanding and skills, we recommend the following guides:

**[Styling Components in App-Builder](styling-components)**: This guide will walk you through the various ways you can customize the appearance of your components, offering you greater control over the look and feel of your application.

**[Working With Queries](working-with-queries)**: Learn how to connect your components to data sources, execute queries, and manipulate data, all within the ToolJet environment.

