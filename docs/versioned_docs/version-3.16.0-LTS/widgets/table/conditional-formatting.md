---
id: conditional-formatting
title: Conditional Formatting
---

Conditional formatting lets you dynamically change the **text color** and **cell background color** of Table columns based on cell values or row data. You can use it to highlight important data, flag anomalies, or visually categorize records — all without writing a separate query or adding extra components.

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

## Supported Column Types

Not all column types support both formatting options. The table below summarizes support across column types.

| Column Type | Text Color | Cell Background Color |
|:------------|:----------:|:---------------------:|
| String      | Yes | Yes |
| Number      | Yes | Yes |
| Text        | Yes | Yes |
| Date Picker | Yes | Yes |
| Boolean     | Yes | Yes |
| Select      | Yes | No  |
| Multiselect | Yes | No  |
| Link        | Yes | No  |
| Image       | Yes | No  |
| Toggle      | Yes | No  |
| Default (Deprecated) | Yes | Yes |

## Configuring Conditional Formatting

1. Click the **Table** component to open the properties panel.
2. Go to the **Columns** section and select the column you want to format.
3. Scroll down to the **Styles** section of the column.
4. Click the **fx** icon next to **Text Color** or **Cell Color**.
5. Enter a JavaScript expression using `cellValue` or `rowData`.

The expression must return a valid CSS color value — a color name (e.g., `red`), hex code (e.g., `#D9534F`), or any other CSS-supported color format.

## Examples

### Text Color Based on Cell Value

Format a **Rating** column so that low ratings appear in red, mid-range in orange, and high ratings in green:

```js
{{cellValue >= 4 ? '#5CB85C' : cellValue >= 2.5 ? '#F0AD4E' : '#D9534F'}}
```

### Cell Background Color Based on Cell Value

Highlight a **Sales** column where high-value cells get a green background and low-value cells get a red background:

```js
{{cellValue >= 1000 ? '#e8f5e9' : cellValue >= 500 ? '#fff3e0' : '#ffebee'}}
```

### Text Color Based on Row Data

Change the text color of a **Product Name** column based on the `price` column in the same row:

```js
{{rowData.price > 100 ? '#D9534F' : '#5CB85C'}}
```

### Cell Background Color Based on Row Data

Color-code a **Title** column based on the product's `category`:

```js
{{rowData.category === 'electronics' ? '#e3f2fd' : rowData.category === 'jewelery' ? '#fce4ec' : '#f5f5f5'}}
```

### Combining Multiple Conditions

Use nested ternary operators or logical operators to build more complex rules. For example, format a **Name** column by combining `status` and `role` from row data:

```js
{{rowData.status === 'inactive' ? '#bdbdbd' : rowData.role === 'admin' ? '#1565c0' : '#212121'}}
```

:::info
You can use hex color codes, named CSS colors (`red`, `lightgreen`), or `rgb()`/`hsl()` functions in your expressions.
:::

## Dynamic Columns

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

## Related

- [Table Columns](/docs/widgets/table/table-columns) — Column types and their properties.
- [Using fx for Dynamic Behaviour](/docs/app-builder/custom-code/fx-dynamic-behaviour) — Writing dynamic expressions across ToolJet components.