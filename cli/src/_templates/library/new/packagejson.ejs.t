---
to: <%= name %>/package.json
---
{
  "name": "<%= name %>",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "lib:dev": "tooljet library dev",
    "lib:build": "tooljet library build",
    "lib:publish": "tooljet library publish"
  },
  "dependencies": {
    "@tooljet/custom-component-sdk": "0.1.0-beta.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
