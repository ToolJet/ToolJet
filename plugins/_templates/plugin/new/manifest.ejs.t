---
to: <%= plugins_path %>/packages/<%= name %>/lib/manifest.json
---
<%
 Display_name = h.capitalize(display_name)
%>
{
  "$schema": "https://raw.githubusercontent.com/ToolJet/ToolJet/develop/plugins/schemas/manifest.schema.json",
  "title": "<%= Display_name %> datasource",
  "description": "A schema defining <%= Display_name %> datasource",
  "type": "<%= type %>",
  "source": {
    "name": "<%= Display_name %>",
    "kind": "<%= name %>",
    "exposedVariables": {
      "isLoading": false,
      "data": {},
      "rawData": {}
    },
    "options": {}
  },
  "defaults": {},
  "properties": {},
  "required": []
}