---
id: generate-file
title: Generate file
---

# Generate file

This action allows you to construct files on the fly and let users download it.
Presently, the only file type supported are `csv` and `text`.

## Options

| Option | Description |
|--------|-------------|
| Type   | Type of file to be generated |
| File name | Name of the file to be generated |
| Data | Data that will be used to construct the file. Its format will depend on the file type, as specified in the following section |

## Info
Check the how-to guide to [run actions using RunJS](https://docs.tooljet.com/docs/how-to/run-actions-from-runjs)
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