---
to: <%= name %>/src/index.ts
---
// Only export React components from this file — anything else exported here
// (types, constants, helper functions) will be skipped when generating the manifest.
export { HelloWorld } from './components/HelloWorld'
