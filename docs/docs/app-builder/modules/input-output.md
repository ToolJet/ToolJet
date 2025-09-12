---
title: "Configuring Inputs and Outputs"
id: "input-output"
---

Modules have their own inputs and outputs which enable them to interact with the parent application. You can configure inputs and outputs of a module from the properties panel. 

## Inputs
Inputs allow the parent application to send data or trigger actions inside the module. You can access inputs in the module using the **input** object.

### Input Types
- **Data**: Use this to pass values like string, number, boolean, array, or object.
- **Query**: Use this to trigger queries inside the module from the parent app.

<img className="screenshot-full img-m" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/input-type.png" alt="Input Types" />

### How to Define Inputs
In the properties panel, go to the **Inputs** section and click **Add new**. Then, provide the following:

#### Data Input

For **Data** inputs, define the following parameters:

- **Name**: A unique name for the input
- **Type**: Select **Data**
- **Default Value** (optional)

For example, to pass a form title from the parent application, create an input with the name **formTitle** and type **Data**. You can also set a default value.

<img className="screenshot-full img-m" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/module-input.png" alt="Module Input" /> 

To use this input in the module, use the following syntax:

```js
{{input.<input_name>}}
```

For our case, we’ll use `{{input.formTitle}}` to access the form title in the component.
```js
{{input.formTitle}}
```
<!-- 
<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/consume-input.png" alt="Input Consumption" /> -->

When you import this module into an application, you’ll see the input field in the module settings. If you set the **formTitle** value to **User Details**, the form will display that as the title.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/module-input-in-app.png" alt="Input Settings" /> 

#### Query Input

For **Query** inputs, define the following parameters:
- **Name**: A unique name for the input
- **Type**: Select Query

For example, if you want to trigger a query named **submitForm** from the parent application, create an input named **submit** and select **Query** as the type.

<img className="screenshot-full img-m" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/add-query-input.png" alt="Query Input" /> 

To handle this input in the module, add an event handler to a component that should trigger the query. Set the action to **Run Query** and select the query as the input (e.g., submit) from the dropdown.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/event-handler-in-module.png" alt="Event Handler" /> 

When you import the module into an applications, you’ll see the query input in the module settings. You can then select any available query in the parent application to be triggered.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/query-from-app.png" alt="Query Input Settings" /> 

## Testing Inputs 

You can test how a module behaves before importing it into an application in the **Test Input** section in the properties panel of the module builder. To do this, open the module's properties panel and scroll to the **Test Input** section. Enter sample values for each input.

For example, if the module has an input named **formTitle**, you can enter a sample value like **User Details** to see how it's rendered in the module.

You can also test query inputs by creating a query inside the module builder and triggering it using the defined query input.

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/test-input.png" alt="Test Input" /> 

## Outputs

Outputs allow the module to send data back to the parent app. You can access outputs from the module in the parent application using the components object.

For example, if you want to send submitted form data back to the parent application, create an output named **formData** and pass the form data **From** the component.

<img className="screenshot-full img-m" style={{ marginBottom:'15px' }}  src="/img/app-builder/modules/module-output.png" alt="Module Output" /> 

To access this output in the parent application, use the following syntax:

```js
{{components.<module_name>.<output_name>}}
```

In this case, use the following reference to access the form data.

```js
{{components.formModule.formData}}
```

<img className="screenshot-full img-full" style={{ marginBottom:'15px' }} src="/img/app-builder/modules/output-in-app.png" alt="Output Consumption" />

To explore more on how data flows between modules and apps, check out [Data Flow](/docs/beta/app-builder/modules/data-flow) guide.

