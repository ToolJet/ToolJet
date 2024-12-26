---
id: data-types
title: Data Types
---

ToolJet Database supports several data types to accommodate various kinds of information. Each data type has its own characteristics and uses.

## Supported Data Types

| Data Type           | Description | Example |
|:--------------------|:----------- |:------- |
| **serial**          | Used to generate a sequence of integers, often used as the Primary key of a table. When a new table is created in the ToolJet database, a column **id** with the serial data type is automatically created as the **primary key** of the table. | Numbers starting from 1, 2, 3, 4, 5, etc. |
| **varchar**         | Used to store characters of indefinite length | Any string value |
| **int**             | A numeric data type used to store whole numbers, without fractional components. | Numbers ranging from -2147483648 to 2147483647 |
| **bigint**          | A numeric data type used to store larger whole numbers, without fractional components. | Numbers ranging from -9223372036854775808 to 9223372036854775807 |
| **float**          | A numeric data type used to store inexact, variable-precision values. | Any floating-point number, ex: 3.14 |
| **boolean**        | Can hold true, false, and null values. | `true` or `false` |
| **date with time** | Stores both date and time information in ISO 8601 format. The default timezone is set to the user's device time zone, with an option to specify a different timezone. All timestamp data is stored in UTC format and converted to the specified timezone when displayed. | '2024-07-22 15:30:00' |

<div style={{textAlign: 'center'}}>
    <img style={{ border:'0', marginBottom:'15px', borderRadius:'5px', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.2)' }} className="screenshot-full" src="/img/v2-beta/database/ux2/datatypes-v3.png" alt="ToolJet database" />
</div>


## Permissible Constraints per Data Type

The following table shows which constraints are permissible for each data type. For more detailed explanations of each constraint type, please refer to the [Column Constraints](/docs/tooljet-db/database-editor#column-constraints) section.

| Data Type | Primary Key | Foreign Key | Unique | Not Null |
|:-----------:|:--------------:|:-------------:|:--------:|:----------:|
| serial    |  ✅          |       ❌     | ✅      | ✅        |
| varchar   |  ✅          | ✅           | ✅      | ✅        |
| int       |  ✅          | ✅           | ✅      | ✅        |
| bigint    |  ✅          | ✅           | ✅      | ✅        |
| float     |  ✅          | ✅           | ✅      | ✅        |
| boolean   |  ❌          |     ❌       | ❌      | ✅        |
| date with time | ❌      | ❌           | ❌      | ✅        |