---
to: <%= plugins_path %>/plugins/<%= name %>/lib/operations.json
---
<%
 Display_name = h.capitalize(display_name)
%>
{
  "$schema": "https://raw.githubusercontent.com/ToolJet/ToolJet/develop/plugins/schemas/operations.schema.json",
  "title": "<%= Display_name %> datasource",
  "description": "A schema defining <%= Display_name %> datasource",
  "type": "<%= type %>",
  "defaults": {},
  "properties": {}
}