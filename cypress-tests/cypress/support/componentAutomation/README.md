# componentAutomation surface cache

Written by the `tj-component-test` skill after each run. Git-tracked so runs compound across worktrees/teammates.

## Shape

```jsonc
{
  "shared": {
    "cssPropertyMap": {
      // key: "<styleType>:<styleName>"   value learned once, reused across components
      "colorSwatches:checkboxColor": {
        "cssProp": "background-color",     // the DOM CSS property this style drives
        "selector": "input:checked ~ .mark", // sub-selector under the widget, or "" for root
        "learnedFrom": "checkbox@a1b2c3d4"   // component@configHash that discovered it
      }
    }
  },
  "components": {
    "checkbox": {
      "configHash": "a1b2c3d4",                        // sha256 first 8 chars of the config file
      "runtimeName": "checkbox1",                       // derived or actual runtime widget instance name (e.g. richTextarea → richtexteditor1)
      "exposedVarDrift": [                              // runtime-only exposed vars not in config
        { "key": "isValid", "type": "Boolean", "value": "true" }
      ],
      "helperOverrides": { "eventTrigger": ".find('input').click({force:true})" },
      "notAutomatable": [ { "item": "customRule", "reason": "free-form code field; no deterministic assertion" } ]
    }
  }
}
```

## Rules
- `configHash` invalidates a component entry when the config file changes.
- `cssPropertyMap` keys are shared; a mapping learned for one component is reused for any component with the same `styleType:styleName`.
- The skill only writes here after a green or best-effort run.
