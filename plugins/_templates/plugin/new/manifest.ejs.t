---
to: <%= plugins_path %>/packages/<%= name %>/lib/manifest.json
---
<%
 Display_name = h.capitalize(display_name)
%>
{
  "$schema": "https://raw.githubusercontent.com/ToolJet/ToolJet/develop/plugins/schemas/manifest.schema.json",
  "title": "<%= Name %> datasource",
  "description": "A schema defining <%= name %> datasource",
  "type": "<%= type %>",
  "source": {
    "name": "<%= Display_name %>",
    "kind": "<%= name %>",
    "exposedVariables": {
      "isLoading": {},
      "data": {},
      "rawData": {}
    },
    "options": {}
  },
  "defaults": {},
  "properties": {},
  "required": []
}