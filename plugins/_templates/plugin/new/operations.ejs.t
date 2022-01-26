---
to: <%= plugins_path %>/packages/<%= name %>/lib/operations.json
---
{
  "$schema": "https://raw.githubusercontent.com/ToolJet/ToolJet/add-custom-schema/plugins/schemas/operations.schema.json",
  "title": "<%= Name %> datasource",
  "description": "A schema defining <%= name %> datasource",
  "type": "<%= type %>",
  "defaults": {},
  "properties": {}
}