---
to: <%= name %>/package.json
---
{
  "name": "<%= name %>",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tooljet library dev",
    "build": "tooljet library build"
  },
  "dependencies": {
    "@tooljet/custom-component-sdk": "^1.0.0"
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
