---
id: generate-file
title: Generate file
---

# Generate file

This action allows you to construct files on the fly and let users download it.

## Options

| Option | Description |
|--------|-------------|
| Type   | Type of file to be generated. Types: `CSV` and `Text` |
| File name | Name of the file to be generated |
| Data | Data that will be used to construct the file. Its format will depend on the file type, as specified in the following section |
| Debounce | Debounce field is empty by default, you can enter a numerical value to specify the time in milliseconds after which the action will be performed. ex: `300` |

### Data format for CSV

For `CSV` file type, the data field should be supplied with an array objects. ToolJet assumes that the keys of each of
these objects are the same and that they represent the column headers of the csv file.

Example:

```javascript
{{
  [
    { name: 'John', email: 'john@tooljet.com' },
    { name: 'Sarah', email: 'sarah@tooljet.com' },
  ]
}}
```

Supplying the above snippet will generate a csv file which looks like this:

```csv
name,email
John,john@tooljet.com
Sarah,sarah@tooljet.com
```