---
to: <%= plugins_path %>/packages/<%= name %>/lib/operations.json
---
{
  "$schema": "https://json-schema.org/",
  "$id": "https://tooljet.io/dataqueries/<%= Name %>/operations.json",
  "title": "<%= Name %> datasource",
  "description": "A schema defining <%= name %> datasource",
  "type": "<%= type %>",
  "defaults": {},
  "properties": {}
}