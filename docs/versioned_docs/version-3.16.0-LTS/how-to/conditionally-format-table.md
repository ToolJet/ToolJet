---
id: conditionally-format-table
title: Conditional Formatting in Table
---
<div style={{paddingBottom:'24px'}}>

Conditional formatting enhances the visual representation of data by allowing you to dynamically adjust the appearance of cells in **Table** component based on specific conditions. This how-to guide will guide you through the process of implementing advanced conditional formatting for text color and background color in a Table component.

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Create a New Application and Set Up Data Source

- Create a new application and add a Table component to the canvas.

- Open the Query Panel at the bottom and click on the **+ Add** button.

- Choose **REST API** as your data source and set the method to GET.

- Enter the following URL as REST API endpoint:
```bash title="REST API Endpoint"
https://fakestoreapi.com/products
```

- Click on the **Preview** button to view the data. Execute the query by clicking on the **Run** button.

<div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/conditionally-format/query.png" alt="Table Component With Data" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Display Data on the Table

- Hide the Query Panel and click on the Table component to open its properties panel.

- Under the `Data` property, enter the following code:
```js title="Data"
{{queries.restapi1.data}}
```
   
<div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/conditionally-format/tabledata.png" alt="Table Component With Data" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Enabling Conditional Formatting

- Go to the `Columns` property of the Table component.

- Select the column for which you want to enable conditional formatting (e.g., category).

- If the column type is set to `Default` or `String`, you can set the conditional formatting for `Text color` and `Cell background color`. 

**Note**: Only `cellValue` and `rowData` can be used as identifiers for conditional formatting.

<div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/conditionally-format/column.png" alt="Table Component With Data" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Conditional Formatting using Cell Value

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Example 1: Changing Text Color Based on Cell Value

- Select the `Rate` column which has a column type of `Default`/`String`. This column contains the rating of each product on a scale of 1 to 5.

- Under the `Text color` property, enter the following condition:

```js 
{{cellValue < 2 ? 'red' : cellValue > 2 && cellValue < 3 ? 'Orange' : 'green'}}
```

The above condition will change the text color to red if the cell value is less than 2, orange if the cell value is greater than 2 and less than 3, and green if the cell value is greater than 3.

<div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/conditionally-format/textcv.png" alt="Table Component With Data" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Example 2: Changing Cell Background Color Based on Cell Value

- Select the `Rate` column, enter the following condition under the `Cell background color` property:
  
```js
{{cellValue >= 4 ? 'lightgreen' : cellValue >= 3 ? 'lightyellow' : 'lightcoral'}}
```
  
The above condition will change the cell background color to lightgreen if the cell value is greater than or equal to 4, lightyellow if the cell value is greater than or equal to 3, and lightcoral if the cell value is less than 3.

<div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/conditionally-format/cellcv.png" alt="Table Component With Data" />
</div>

</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

## Conditional Formatting using Row Data

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Example 1: Changing Text Color Based on Row Data

- Select the `Title` column, enter the following condition under the `Text color` property:
  
```js
{{rowData.price > 50 ? '#D9534F' : (rowData.rating.rate >= 4 ? '#5CB85C'  : rowData.rating.rate >= 3 ? '#F0AD4E' : '#D9534F' )}}
```
  
The above condition will change the text color of the `Title` based on the value of the `price` and `rating` columns. If the value in the `price` column is greater than 50, the text color will be red. If the value in the `rating` column is greater than or equal to 4, the text color will be green. If the value in the `rating` column is greater than or equal to 3, the text color will be yellow. Otherwise, the text color will be red.

<div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/conditionally-format/textrd.png" alt="Table Component With Data" />
</div>

</div>

<div style={{paddingTop:'24px', paddingBottom:'24px'}}>

### Example 2: Changing Cell Background Color based on Row Data

- In this example, we will change the cell background color of the `Title` column based on the category of the product.

- Select the `Title` column, enter the following condition under the `Cell background color` property:
  
```js
{{rowData.category === "electronics" ? 'cyan' : rowData.category === "jewelery" ? 'pink' : 'lightgray'}}
```

The above condition will change the cell background color of the `Title` column based on the value of the `category` column. If the value in the `category` column is `electronics`, the cell background color will be cyan. If the value in the `category` column is `jewelery`, the cell background color will be pink. Otherwise, the cell background color will be lightgray.

<div style={{textAlign: 'center'}}>
   <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/how-to/conditionally-format/cellrd.png" alt="Table Component With Data" />
</div>

</div>

</div>

---

By following these steps, you can implement advanced conditional formatting for `Text color` and `Cell background color` in your Table component. Experiment with different conditions and color combinations to create visually appealing and informative tables in your applications.

