---
to: <%= plugins_path %>/packages/<%= name %>/tsconfig.json
---
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "lib"
  },
  "exclude": [
    "node_modules",
    "dist"
  ]
}