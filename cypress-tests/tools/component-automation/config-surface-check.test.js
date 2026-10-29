// config-surface-check.test.js
const assert = require("assert");
const { assertSurfaceShape } = require("./config-surface-check");

// A minimal surface YAML that HAS the new fields must pass
const good = `
component: button
runtimeCandidate: button1
surface:
  properties:
    - name: text
      type: code
      section: general
      fxCapable: true
      conditionallyRender: null
      source: button.js:15
  styles:
    - name: backgroundColor
      type: colorSwatches
      fxCapable: true
      conditionallyRender: { key: type, value: primary }
      source: button.js:84
`;
assert.deepStrictEqual(assertSurfaceShape(good).missing, [], "good surface should pass");

// Missing fxCapable + runtimeCandidate must be reported
const bad = `
component: button
surface:
  properties:
    - name: text
      type: code
      source: button.js:15
  styles:
    - name: backgroundColor
      type: colorSwatches
      fxCapable: true
      source: button.js:84
`;
const miss = assertSurfaceShape(bad).missing;
assert(miss.includes("runtimeCandidate"), "must flag missing runtimeCandidate");
assert(miss.some(m => m.includes("fxCapable")), "must flag missing fxCapable on a property");
assert(miss.some(m => m.startsWith("section@")), "must flag missing section on a property");
assert(miss.some(m => m.startsWith("conditionallyRender@")), "must flag missing conditionallyRender on property and styles");
console.log("config-surface-check.test PASS");
