# Bilig WorkPaper

Bilig WorkPaper lets ToolJet apps call a workbook formula service from datasource queries. Use it when a workflow needs to write an input cell, recalculate spreadsheet formulas, verify the readback, and return the computed JSON result without opening Excel.

## Local formula-readback service

Start a Bilig WorkPaper formula server before testing the datasource:

```bash
npm exec --package @bilig/workpaper@latest -- bilig-n8n-formula-server --port 4321
```

Use `http://localhost:4321` as the datasource base URL. The default formula-readback path is `/api/workpaper/n8n/forecast`.

## Operation

### Verify formula readback

Posts a cell write to the Bilig service and returns the verified formula output.

Inputs:

- `Sheet name`: sheet that contains the input cell, for example `Inputs`.
- `Cell address`: A1-style input cell address, for example `B3`.
- `Value`: JSON value to write before recalculation, for example `0.4`.
