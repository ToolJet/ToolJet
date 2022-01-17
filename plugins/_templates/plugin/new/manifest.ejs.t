---
to: <%= plugins_path %>/packages/<%= name %>/lib/manifest.json
---
<%
 Display_name = display_name.toUpperCase()
%>
{
  "$schema": "https://json-schema.org/",
  "$id": "https://tooljet.io/<%= Name %>/manifest.json",
  "title": "<%= Name %> datasource",
  "description": "A schema defining <%= name %> datasource",
  "type": "api",
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