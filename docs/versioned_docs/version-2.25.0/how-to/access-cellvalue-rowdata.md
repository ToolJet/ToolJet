---
id: access-cellvalue-rowdata
title: Dynamically Change Cell Colors in Table
---

This guide shows how to change the text color and background color of certain cells in a Table component based on specific conditions.

## 1. Start by Creating a New Application and Setting up the Data Source
- Create a new app and add a **[Table](/docs/widgets/table)** component to the canvas.
- Open the Query Panel at the bottom and click on the `+ Add` button.
- Select REST API as your data source - your query will be named as restapi1 by default.
- Choose GET method and enter the below URL:
```
https://fakestoreapi.com/products
``` 
- To view the data that your query will return, click on the **Preview** button. Click on the **Run** button to execute the query and retrieve the data. 

## 2. Display Data on the Table

- Hide the Query Panel and click on the Table component to open its properties panel on the right.
- Under Table Data, enter the below code:
```
{{queries.restapi1.data}}
```
<div style={{textAlign: 'center'}}>
    <img style={{ border:'0' }} className="screenshot-full" src="/img/how-to/change-text-color/table-with-data.png" alt="Table Component With Data" />
</div>

## 3. Change Text Color Based on Cell Value

- Select the Table component and go to Columns.
- For the `category` column, paste the below code under Text Color to dynamically change the text color based on the value of the cell:

```
{{cellValue == 'electronics' ? 'red' : 'green'}}
```

Now, if the cell value is `electronics`, the text color will be red; otherwise, it will be green.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/how-to/change-text-color/conditional-text-color.png" alt="Conditional Text Color" />
</div>

<i>You can use also Hex color codes for more color options.</i>

## 4. Change Text Color Using Row Data

- Under Cell Background Color for the `symbol` column, paste the below code: 

```
{{rowData.price < 100? 'yellow': 'white'}}
```

The rowData identifier can be utilized to reference values from any column within the Table component. 

Now if the value in the price column is lesser than 100, the cell background color will be yellow or else it will be white.

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px' }} className="screenshot-full" src="/img/how-to/change-text-color/conditional-background-color.png" alt="Conditional Background Color" />
</div>

You can use the above methods to change the text and background colors of a cell dynamically.