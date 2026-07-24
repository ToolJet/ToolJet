---
to: <%= name %>/package.json
---
{
  "name": "<%= name %>",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tooljet component dev",
    "build": "tooljet component build"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "~6.0.2"
  }
}
