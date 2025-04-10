---
id: dynamic-column
title: Dynamic Columns
---

ToolJet allows users to dynamically set the columns of a **Table** component using a JSON value. This guide explains how to configure dynamic columns in ToolJet.

<div style={{paddingTop:'24px'}}>

## Using Dynamic Column

1. Drag a **Table** component from the right-side component library onto the canvas.
2. Populate the **Table** component with data by connecting it to a query.
3. Toggle the Use dynamic column option.
4. Enter JSON to define the **Table's** columns dynamically. For example:

```json 
{
  "name": "Name",
  "columnType": "string",
  "key": "first_name",
  "cellBackgroundColor": "#000",
  "textColor": "#fff",
  "isEditable": true,
  "regex": "",
  "maxLength": 20,
  "minLength": 5,
  "customRule": ""
}
```

This configuration displays a column labeled Name with editable string data restricted to lengths between 5 and 20 characters, with white text on a black background.

</div>

<div style={{paddingTop:'24px'}}>

## Displaying Different Table Schema Based on the Current User

You can use dynamic columns to display different table schemas depending on the current user. Let's look at an example with the below schema:

| ID | Name | Email | Department | Salary | Performance | Login |
|----|------|-------|------------|--------|-------------|-------|

Here, two different schemas are to be displayed based on the current user.

**For Admin:**

| ID | Name | Email | Department | Salary | Performance | Login |
|----|------|-------|------------|--------|-------------|-------|

**For Employees:**

| ID | Name | Email | Department | Login |
|----|------|-------|------------|-------|

1. To configure the schema as per the user, enable Use dynamic column property.

2. Use the following JSON logic to dynamically adjust the schema based on the current user's role:

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

Dynamic columns in ToolJet support various types, such as strings, numbers, dates, and links. 

In this example, you can see how you can specify a column type using dynamic columns.

1. Add a **Table** component with the following columns and column types:
    - Profile Photo - Image
    - Name - String
    - Contact Number - Number
    - Date of Birth - Datepicker
    - Website URL - Link

2. Toggle the Use dynamic column option.

3. Add the following JSON to define the columns:

```json
{{[
  {name: 'Profile', key: 'photo',columnType: 'image', id: '1'},
  {name: 'Name', key: 'name', columnType:'string', id: '2'},
  {name: 'Contact', key: 'mobile_number', columnType:'number', id: '3'},
  {name: 'DOB', key: 'date', columnType:'datepicker', id: '4'}, 
  {name: 'Website', key: 'website', columnType:'link', id: '5'}
]}}
```

This configuration will create a table with the specified column types.

</div>
