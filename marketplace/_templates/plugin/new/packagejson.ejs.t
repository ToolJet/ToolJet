---
to: <%= plugins_path %>/plugins/<%= name %>/package.json
---
{
  "name": "@tooljet-marketplace/<%= name %>",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "directories": {
    "lib": "lib",
    "test": "__tests__"
  },
  "files": [
    "lib"
  ],
  "scripts": {
    "test": "echo \"Error: run tests from root\" && exit 1",
    "build": "ncc build lib/index.ts -o dist",
    "watch": "ncc build lib/index.ts -o dist --watch"
  },
  "homepage": "https://github.com/tooljet/tooljet#readme",
  "dependencies": {
    "@tooljet-marketplace/common": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^4.7.4",
    "@vercel/ncc": "^0.34.0"
  }
}
