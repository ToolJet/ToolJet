---
id: conditional-formatting
title: Conditional Formatting
---

Conditional formatting lets you dynamically change the **text color**, **background color** and **disable action button** of Table columns based on cell values or row data. You can use it to highlight important data, flag anomalies, or visually categorize records, all without writing a separate query or adding extra components.

## How It Works

Each column in the Table component has **Text Color** and **Cell Color** style properties. By default, these accept a static color value. Clicking the **fx** icon next to these properties lets you write JavaScript expressions inside `{{ }}` that evaluate per row at render time.

Two identifiers are available inside these expressions:

| Identifier | Description |
|:-----------|:------------|
| `cellValue` | The value of the current cell in that row. Use this when the formatting condition depends on the column's own data. |
| `rowData`  | An object containing all column values for the current row. Use this when the formatting condition depends on data from other columns. |

:::info
To learn more about writing dynamic expressions, see [Using fx for Dynamic Behaviour](/docs/app-builder/custom-code/fx-dynamic-behaviour).
:::

## Configuring Conditional Formatting

1. Click the **Table** component to open the properties panel.
2. Go to the **Columns** section and select the column you want to format.
3. Scroll down to the **Styles** section of the column.
4. Click the **fx** icon next to **Text Color** or **Cell Color**.
5. Enter a JavaScript expression using `cellValue` or `rowData`.

The expression must return a valid CSS color value — a color name (e.g., `red`), hex code (e.g., `#D9534F`), or any other CSS-supported color format.

### Supported Column Types

Not all column types support both formatting options. The table below summarizes support across column types.

<div style={{ display: 'flex' }} >

<div style = {{ width:'50%' }} >

| Column Type | Text Color | Cell Background Color |
|:------------|:----------|:---------------------|
| String      | Yes | Yes |
| Number      | Yes | Yes |
| Text        | Yes | Yes |
| Date Picker | Yes | Yes |
| Boolean     | Yes | Yes |

</div>

<div style = {{ width:'50%' }} >

| Column Type | Text Color | Cell Background Color |
|:------------|:----------|:---------------------|
| Select      | Yes | No  |
| Multiselect | Yes | No  |
| Link        | Yes | No  |
| Image       | Yes | No  |
| Toggle      | Yes | No  |

</div>

</div>

### Examples

#### Text Color Based on Cell Value

Format a **Rating** column so that low ratings appear in red, mid-range in orange, and high ratings in green:

```js
{{cellValue >= 4 ? '#5CB85C' : cellValue >= 2.5 ? '#F0AD4E' : '#D9534F'}}
```

<img className="screenshot-full img-l" src="/img/widgets/table/conditional-formatting/text-cv.png" alt="Text Color Based on Cell Value" /> 

#### Cell Background Color Based on Cell Value

Highlight a **Sales** column where high-value cells get a green background and low-value cells get a red background:

```js
{{cellValue >= 1000 ? '#e8f5e9' : cellValue >= 500 ? '#fff3e0' : '#ffebee'}}
```

<img className="screenshot-full img-l" src="/img/widgets/table/conditional-formatting/cell-cv.png" alt="Cell Color Based on Cell Value" /> 

#### Text Color Based on Row Data

Change the text color of a **id** column based on the `phone` column in the same row:

```js
{{ rowData.id > 3 ? '#D9534F' : '#5CB85C' }}
```

<img className="screenshot-full img-l" src="/img/widgets/table/conditional-formatting/text-rowdata.png" alt="Text Color Based on Row Data" /> 


#### Cell Background Color Based on Row Data

Color-code a **Title** column based on the product's `interest`:

```js
{{ 
  rowData.interest?.includes('Photography') ? '#030f16' : rowData.interest?.includes('Traveling') ? '#5ec522' : '#ed1717' 
}}
```

<img className="screenshot-full img-l" src="/img/widgets/table/conditional-formatting/cell-rowdata.png" alt="Cell Background Based on Row Data" /> 

#### Combining Multiple Conditions

Use nested ternary operators or logical operators to build more complex rules. For example, format a **Name** column by combining `id` and `phone` from row data:

```js
{{ 
  rowData.id === 1 ? '#1565c0' : rowData.phone > 9000000000 ? '#212121' : '#bdbdbd' 
}}
```

<img className="screenshot-full img-l" src="/img/widgets/table/conditional-formatting/multiple-condition.png" alt="Combining Multiple Conditions" /> 

:::info
You can use hex color codes, named CSS colors (`red`, `lightgreen`), or `rgb()`/`hsl()` functions in your expressions.
:::

#### Dynamic Columns

When using **[Dynamic Columns](/docs/widgets/table/dynamic-column)**, you can set conditional formatting directly in the column JSON definition using the `textColor` and `cellBackgroundColor` keys:

```json
{
   "name": "Revenue",
   "columnType": "number",
   "key": "revenue",
   "textColor": "{{cellValue > 5000 ? '#2e7d32' : '#c62828'}}",
   "cellBackgroundColor": "{{cellValue > 5000 ? '#e8f5e9' : '#ffebee'}}",
   "isEditable": false
}
```

## Disabling Action Buttons

You can conditionally disable action buttons on a per-row basis using the same `cellValue` and `rowData` identifiers available in conditional formatting. A disabled button appears greyed out and cannot be clicked.

### Configuration

1. Click the **Table** component to open the properties panel.
2. Go to the **Action Buttons** section and select the action button you want to configure.
3. Find the **Disable action button** property.
4. Click the **fx** icon to switch to a dynamic expression.
5. Enter a JavaScript expression using `cellValue` or `rowData` that returns `true` to disable the button or `false` to keep it enabled.

### Examples

**Disable based on row status**

Disable a button when the row's `status` is `completed`:

```js
{{rowData.status === 'completed'}}
```

**Disable based on a numeric threshold**

Disable a "Refund" button when the `amount` is zero or negative:

```js
{{rowData.amount <= 0}}
```

**Disable based on multiple conditions**

Disable an "Approve" button when the row is already approved or the user role is `viewer`:

```js
{{rowData.approved === true || rowData.role === 'viewer'}}
```

**Disable while a query is loading**

Disable the button while a related query is in progress to prevent duplicate submissions:

```js
{{queries.updateRecord.isLoading}}
```

## Related

- [Using fx for Dynamic Behaviour](/docs/app-builder/custom-code/fx-dynamic-behaviour) — Writing dynamic expressions across ToolJet components.