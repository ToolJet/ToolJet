---
id: multiselect
title: Multiselect
---

The Multiselect component enables users to select multiple options from a predefined list, making it ideal for gathering multiple inputs.

## Data

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"250px"}}> Description </div>      | <div style={{width: "200px"}}> Expected Value </div> |
| :--------------------------------------------- | :----------------------------------------------------- | :--------------------------------------------------- |
| Label                                          | Text to display as the label for the component.        | String (e.g., `Select an option`).                   |
| Placeholder                                    | Text to display when none of the options are selected. | String (e.g., `Select the loan type`).               |

## Options

Allows you to add options to the multiselect component field. You can click on `Add new option` and add options manually or enable `Dynamic options` and enter the options using code.

### Example Code for Dynamic Options

1. Passing an array of objects and specifying each value:

```js
{{
  [
    {
      label: "option1",
      value: 1,
      disable: false,
      visible: true,
      default: true,
    },
    { label: "option2", value: 2, disable: false, visible: true },
    { label: "option3", value: 3, disable: false, visible: true },
  ];
}}
```

2. Passing an array of objects with a default value from a **Table** component's selected row:

```js
{{
  queries.getEmployees.data.map((option) => ({
    label: option.firstname,
    value: option.firstname,
    disable: false,
    visible: true,
    default: option.firstname === components.table1.selectedRow.firstname,
  }));
}}
```

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                       | <div style={{ width:"250px"}}> Configuration Options </div>                                                                  |
| :------------------------------------------- | :---------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Options Loading State                        | Allows you to add a loading state to the dynamically generated options. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Enable select all option                     | Adds "Select all" option in the list to select all the option at once.  | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show "All items are selected"                | Shows "All items are selected" when all the options are selected.       | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Sort options                                 | Sort all the options in the selected pattern.                           | Choose from **None**, **a-z** or **z-a**.                                                                                    |

## Search

Turn on **Show search in options** to add a search box to the options menu. Search is **Client side** by default: the component filters the options it already holds, in the browser, and highlights the matching text in option labels and captions.

Use **Search type** to switch between the two modes:

| <div style={{ width:"120px"}}> Mode </div> | <div style={{ width:"400px"}}> Behaviour </div> |
| :------------------------------------------ | :----------------------------------------------- |
| Client side (default)                      | The component filters the options it already holds and highlights the matching text. |
| Server side                                | The component renders every option it is given, without filtering or highlighting, so that a query can filter the options in your datasource. |

### Server Side Search

Use Server side search when the option list is too large to load into the browser. The component stops filtering locally, and you bind its options to a query that returns only the matching rows.

:::warning
Server side mode does not fetch anything on its own, it only stops the component from filtering. If you enable it without binding the options to a query, the menu shows the full unfiltered list while the user types.
:::

To set up server side search:

1. Turn on **Show search in options**, then set **Search type** to **Server side**.

2. Create a query that filters on the component's `searchText`:

   ```sql
   SELECT name AS label, id AS value
   FROM public.sample_data_orders
   WHERE name ILIKE '%{{components.multiselect1.searchText || ""}}%'
   LIMIT 50
   ```

   Replace `multiselect1` with the name of your component.

3. Bind **Option values** and **Option labels**, or the **Schema** if you are using dynamic options, to the query's data. For example, `{{queries.searchOrders.data.map(o => o.value)}}`.

4. Add an event handler to the component:<br/>
   Event: **On search text changed**<br/>
   Action: **Run Query**<br/>
   Query: the query you created in step 2

5. Optionally, click on **fx** next to **Loading state** and enter `{{queries.searchOrders.isLoading}}` so that the menu shows a spinner while the query runs.

:::info
**On search text changed** fires on every keystroke, so each keystroke runs the query. Keep a `LIMIT` in the query to bound the number of rows returned.
:::

**Sort options** still applies in Server side mode and re-sorts whatever the query returned, in the browser. Set it to **None** if your query already sorts the results.

When the search box has text and **Show "All items are selected"** is enabled, the select all row reads `Select all <search text>`. In Server side mode, selecting it selects every option the query currently returned, not the entire underlying dataset.

## Events

| <div style={{ width:"135px"}}> Event </div> | <div style={{ width:"100px"}}> Description </div>          |
| :------------------------------------------ | :--------------------------------------------------------- |
| On select                                   | Triggers whenever an option is selected.                   |
| On search text changed                      | Triggers whenever the search text is changed.              |
| On focus                                    | Triggers whenever the user clicks inside the input field.  |
| On blur                                     | Triggers whenever the user clicks outside the input field. |

:::info
Check [Action Reference](/docs/actions/run-query) docs to get detailed information about all the **Actions**.
:::

## Component specific actions (CSA)

The following actions of the component can be controlled using the component-specific actions (CSA), you can trigger it using an event or use a RunJS query.

| <div style={{ width:"100px"}}> Actions </div> | <div style={{ width:"160px"}}> Description </div> | <div style={{width: "200px"}}> How To Access </div> |
| :-------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------- |
| clear( )                                      | Clears the selected option.                       | `components.multiselect1.clear()`                   |
| setVisibility( )                              | Sets the visibility of the component.             | `components.multiselect1.setVisibility(false)`      |
| setLoading( )                                 | Sets the loading state of the component.          | `components.multiselect1.setLoading(true)`          |
| setDisable( )                                 | Disables the component.                           | `components.multiselect1.setDisable(true)`          |
| selectOptions( )                              | Selects an option.                                | `components.multiselect1.selectOptions(['2','3'])`  |
| deselectOptions( )                            | Deselects all options.                            | `components.multiselect1.deselectOptions()`         |

**Note:**

1. The data type passed to CSAs like `selectOptions()` depends on how you configure the component. When adding options manually using the **Add new option** button, values must be strings (for example, `components.multiselect1.selectOptions(['2', '3'])`). When using dynamic options, supply values with the correct data types as they appear in your code logic.

   For example, if the code is:

   ```javascript
   {
     {
       [
         {
           label: "option1",
           value: 1,
           disable: false,
           visible: true,
           default: true,
         },
         { label: "option2", value: 2, disable: false, visible: true },
         { label: "option3", value: 3, disable: false, visible: true },
       ];
     }
   }
   ```

   You should pass numeric values in the `selectOptions` component-specific action since the value type is **Number**:

   ```javascript
   components.multiselect1.selectOptions([2, 3]);
   ```

2. When using the Control Component action to trigger selectOption in CSA, the values should be passed within `{{ }}`, e.g., `{{["1", "2"]}}`.

## Exposed Variables

| <div style={{ width:"100px"}}> Variable </div> | <div style={{ width:"200px"}}> Description </div>                       | <div style={{width: "200px"}}> How To Access </div> |
| :--------------------------------------------- | :---------------------------------------------------------------------- | :-------------------------------------------------- |
| searchText                                     | This variable is initially empty and holds the value whenever the user searches on the multiselect. | `{{components.multiselect1.searchText}}`            |
| label                                          | Holds the label name of the multiselect component.                      | `{{components.multiselect1.label}}`                 |
| value                                          | Holds the value selected by the user in the component.                  | `{{components.multiselect1.value}}`                 |
| options                                        | Holds all the option values of the multiselect component in array form. | `{{components.multiselect1.options}}`               |
| isValid                                        | Indicates if the input meets validation criteria.                       | `{{components.multiselect1.isValid}}`               |
| isMandatory                                    | Indicates if the field is required.                                     | `{{components.multiselect1.isMandatory}}`           |
| isLoading                                      | Indicates if the component is loading.                                  | `{{components.multiselect1.isLoading}}`             |
| isVisible                                      | Indicates if the component is visible.                                  | `{{components.multiselect1.isVisible}}`             |
| isDisabled                                     | Indicates if the component is disabled.                                 | `{{components.multiselect1.isDisabled}}`            |

## Validation

| <div style={{ width:"100px"}}> Validation Option </div> | <div style={{ width:"200px"}}> Description </div>                    | <div style={{width: "200px"}}> Expected Value </div>                                                                         |
| :------------------------------------------------------ | :------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| Make this field mandatory                               | Displays a 'Field cannot be empty' message if no option is selected. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Custom validation                                       | Specifies a validation error message for specific conditions.        | Logical Expression (e.g., `{{!components.multiselect1.value && "Please select an option"}}`).                                |

## Additional Actions

| <div style={{ width:"100px"}}> Action </div> | <div style={{ width:"150px"}}> Description </div>                                                       | <div style={{ width:"250px"}}> Configuration Options </div>                                                                  |
| :------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------- |
| Show clear selection button                  | Gives a button to clear all selections.                                                                 | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show search in options                       | Enables a search option.                                                                                | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Search type                                  | Sets whether the options menu is filtered in the browser (**Client side**) or by a query (**Server side**). Only visible when **Show search in options** is enabled. | Select **Client side** or **Server side**, or click on **fx** and enter an expression that resolves to a boolean (`{{true}}` for **Server side**). |
| Loading state                                | Enables a loading spinner, often used with `isLoading` to indicate progress. Toggle or set dynamically. | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Visibility                                   | Controls component visibility. Toggle or set dynamically.                                               | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Disable                                      | Enables or disables the component. Toggle or set dynamically.                                           | Enable/disable the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Tooltip | Provides additional information on hover. Supports **Plain text**, **Markdown**, and **HTML** formats. | String (e.g., `Select an option.` ).                                                                                         |

## Devices

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Expected Value </div>                                                                              |
| :--------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------- |
| Show on desktop                                | Makes the component visible in desktop view.      | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |
| Show on mobile                                 | Makes the component visible in mobile view.       | You can set it with the toggle button or dynamically configure the value by clicking on **fx** and entering a logical expression. |

## Style

### Label

| <div style={{ width:"100px"}}> Label Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>                                                                                                       |
| :--------------------------------------------------- | :------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color                                                | Sets the color of the component's label.          | Select the color or click on **fx** and input code that programmatically returns a Hex color code.                                                                |
| Alignment | Sets the position of the label and input field.   | Click on the toggle options or click on **fx** to input code that programmatically returns an alignment value - **side** or **top**. |
| Width | Sets the width of the input field. | Enable **Auto width** to use the standard width automatically. Disable it to manually adjust the width using the slider or by entering a numeric value via **fx**. You can also choose whether the width is calculated relative to the **Container** or relative to the **Field**. |

### Field

| <div style={{ width:"100px"}}> Field Property </div> | <div style={{ width:"150px"}}> Description </div>         | <div style={{ width:"250px"}}> Configuration Options </div>                                        |
| :--------------------------------------------------- | :-------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| Background                                           | Sets the background color of the component.               | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Border                                               | Sets the border color of the component.                   | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Accent                                               | Sets the color of the border when the dropdown is opened. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Text                                                 | Sets the text color of the text entered in the component. | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Error text                                           | Sets the text color of validation message that displays.  | Select the color or click on **fx** and input code that programmatically returns a Hex color code. |
| Icon                                                 | Allows you to select an icon for the component.           | Enable the icon visibility, select icon and icon color                                             |
| Border radius                                        | Modifies the border radius of the component.              | Enter a number or click on **fx** and enter a code that programmatically returns a numeric value.  |
| Box shadow                                           | Sets the box shadow properties of the component.          | Select the box shadow color and adjust the related properties.                                     |

## Container

**Padding** <br/>
Allows you to maintain a standard padding by enabling the `Default` option.

### Advanced

| <div style={{ width:"100px"}}> Property </div> | <div style={{ width:"150px"}}> Description </div> | <div style={{ width:"250px"}}> Configuration Options </div>|
|:----------------|:------------|:--------------|
| CSS class | Adds a custom CSS class to the component, which can be targeted using **[Custom Styles](/docs/app-builder/customstyles)** for advanced styling. | Enter one or more class names. |

:::info
The **Advanced** section is available only if your plan has the **[Custom Styles](/docs/app-builder/customstyles)** feature enabled.
:::
