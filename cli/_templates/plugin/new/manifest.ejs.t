---
to: ../plugins/packages/<%= name %>/lib/manifest.json
---
{
  "$schema": "https://json-schema.org/",
  "$id": "https://tooljet.io/<%= Name %>/manifest.json",
  "title": "<%= Name %> datasource",
  "description": "A schema defining <%= name %> datasource",
  "type": "api",
  "source": {
    "name": "<%= Name %>",
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