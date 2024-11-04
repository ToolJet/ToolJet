---
id: dynamic-column
title: Dynamic Columns
---

ToolJet allows user to dynamically set the columns of the Table using a JSON value. In this guide we will see how we can use dynamic columns in ToolJet.

<div style={{paddingTop:'24px'}}>

## Using Dynamic Column

1. **Add a Table Component** <br/>
    To start with, we need to add a table component, you can drag it from the right-side component library to the canvas.

2. **Add data** <br/>
    You can add data to the table using a query.

3. Enable **Use dynamic column** <br/>
    You can use the toggle button to enable the dynamic column or you can click on a the **fx** button and add a logical expression. <br/>
    Now enter the JSON to display the dynamic column. <br/>
    For example, if you enter the below JSON, the table will display a column labeled "Name" where the data entries are editable strings, restricted in length between 5 and 20 characters, displayed in white text on a black background.

    ```json
    {
        "name":"Name",
        "columnType":"string",
        "key":"first_name",
        "cellBackgroundColor":"#000",
        "textColor":"#fff",
        "isEditable":true,
        "regex":"",
        "maxLength":20,
        "minLength":5,
        "customRule":""
    }
    ```

</div>

<div style={{paddingTop:'24px'}}>

## Displaying Different Table Schema Based on the Current User

In this example, we will see how we can display different table schema based on the current user using dynamic columns.

**Orignial Table Schema:**

| ID | Name | Email | Department | Salary | Performance | Login |
|----|------|-------|------------|--------|-------------|-------|

We need to display two different schema based on the current user as follow:

**For Admin**

| ID | Name | Email | Department | Salary | Performance | Login |
|----|------|-------|------------|--------|-------------|-------|

**For Employees**

| ID | Name | Email | Department | Login |
|----|------|-------|------------|-------|

To perform the above operation, go ahead and enable **Use dynamic column** following the steps mentioned [above](#using-dynamic-column).

Now, add the following JSON, this JSON runs an if-else statement by fetching the current user using `globals.currentUser.groups`

```json
{{globals.currentUser.groups.includes("admin") ? [
  { name: 'id', key: 'id', id: '1' },
  { name: 'Name', key: 'name', id: '2' },
  { name: 'Email', key: 'email', id: '3' },
  { name: 'Department', key: 'department', id: '4' },
  { name: 'Salary', key: 'salary', id: '5' },
  { name: 'Performance Rating', key: 'performance', id: '6' },
  { name: 'Last Login', columnType:"datePicker", key: 'login', id: '7' }
] : [
  { name: 'id', key: 'id', id: '1' },
  { name: 'Name', key: 'name', id: '2' },
  { name: 'Email', key: 'email', id: '3' },
  { name: 'Department', key: 'department', id: '4' },
  { name: 'Last Login', columnType:"datePicker", key: 'login', id: '5' }
]}}
```

</div>

<div style={{paddingTop:'24px'}}>

## Specifiying the Column Type

In this example, we will see how we can specify a column type using dynamic columns.

In ToolJet, the table component supports various types of column type, you can check them out [here](./columns.md).

We are going to add a table with the following columns and column types:
- Profile Photo - Image
- Name - String
- Contact Number - Number
- Date of Birth - Datepicker
- Website URL - Link

To perform the above operation, go ahead and enable **Use dynamic column** following the steps mentioned [above](#using-dynamic-column).

And now add the following JSON:
```json
{{[
  {name: 'Profile', key: 'photo',columnType: 'image', id: '1'},
  {name: 'Name', key: 'name', columnType:'string', id: '2'},
  {name: 'Contact', key: 'mobile_number', columnType:'number', id: '3'},
  {name: 'DOB', key: 'date', columnType:'datepicker', id: '4'}, 
  {name: 'Website', key: 'website', columnType:'link', id: '5'}
]}}
```

</div>
