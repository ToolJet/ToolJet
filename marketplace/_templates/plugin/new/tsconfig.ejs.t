---
to: <%= plugins_path %>/plugins/<%= name %>/tsconfig.json
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