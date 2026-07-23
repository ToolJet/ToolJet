# Module Parent Guard — Test Plan

## Prerequisites

1. A running ToolJet instance (local dev)
2. A valid auth token (grab from browser DevTools → Network → any API request → `Authorization` header)
3. A **module** app and a **regular (front-end)** app created in the workspace

### Getting IDs

Open the module app in the editor. From the network tab, note:

- `APP_ID` — the app UUID (from the URL: `/apps/:appId/...`)
- `VERSION_ID` — the version UUID (from any component API call URL: `.../versions/:versionId/...`)
- `PAGE_ID` — the page UUID (from the create-component payload in network tab, or from `GET /v2/apps/:appId/versions/:versionId/pages`)
- `MODULE_CONTAINER_ID` — the ModuleContainer's component UUID (from `GET /v2/apps/:appId/versions/:versionId` response → look for the component with `component: "ModuleContainer"`)

Repeat for the regular app to get `REGULAR_APP_ID`, `REGULAR_VERSION_ID`, `REGULAR_PAGE_ID`.

Set base URL:
```
BASE=http://localhost:3000/api/v2
```

---

## Test 1: Create component in module with null parent → should auto-parent to ModuleContainer

### API

```bash
COMPONENT_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')

curl -s -X POST "$BASE/apps/$APP_ID/versions/$VERSION_ID/components" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "'$PAGE_ID'",
    "diff": {
      "'$COMPONENT_ID'": {
        "name": "TestButton1",
        "type": "Button",
        "parent": null,
        "properties": {},
        "styles": {},
        "validation": {},
        "general": {},
        "generalStyles": {},
        "others": {},
        "layouts": {
          "desktop": { "top": 100, "left": 10, "width": 10, "height": 40 },
          "mobile": { "top": 100, "left": 2, "width": 10, "height": 40 }
        }
      }
    }
  }'
```

### Verify

```bash
# Fetch the version and find the created component
curl -s "$BASE/apps/$APP_ID/versions/$VERSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.pages[0].components["'$COMPONENT_ID'"].component.parent'
```

**Expected:** The parent should be `MODULE_CONTAINER_ID`, NOT `null`.

### UI

1. Open the module app in the editor
2. The newly created component should appear **inside** the ModuleContainer, not on the root canvas

---

## Test 2: Create component in module with explicit parent → should be preserved

### API

```bash
COMPONENT_ID2=$(uuidgen | tr '[:upper:]' '[:lower:]')

curl -s -X POST "$BASE/apps/$APP_ID/versions/$VERSION_ID/components" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "'$PAGE_ID'",
    "diff": {
      "'$COMPONENT_ID2'": {
        "name": "TestButton2",
        "type": "Button",
        "parent": "'$MODULE_CONTAINER_ID'",
        "properties": {},
        "styles": {},
        "validation": {},
        "general": {},
        "generalStyles": {},
        "others": {},
        "layouts": {
          "desktop": { "top": 150, "left": 10, "width": 10, "height": 40 },
          "mobile": { "top": 150, "left": 2, "width": 10, "height": 40 }
        }
      }
    }
  }'
```

**Expected:** Parent should be `MODULE_CONTAINER_ID` (explicitly set, unchanged by guard).

---

## Test 3: Update component parent to null in module → should re-parent to ModuleContainer

### API

```bash
# Use COMPONENT_ID from Test 1
curl -s -X PUT "$BASE/apps/$APP_ID/versions/$VERSION_ID/components" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diff": {
      "'$COMPONENT_ID'": {
        "component": {
          "parent": null
        }
      }
    }
  }'
```

### Verify

```bash
curl -s "$BASE/apps/$APP_ID/versions/$VERSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.pages[0].components["'$COMPONENT_ID'"].component.parent'
```

**Expected:** Parent should be `MODULE_CONTAINER_ID`, NOT `null`.

---

## Test 4: Update component parent to empty string in module → should re-parent to ModuleContainer

### API

```bash
curl -s -X PUT "$BASE/apps/$APP_ID/versions/$VERSION_ID/components" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diff": {
      "'$COMPONENT_ID'": {
        "component": {
          "parent": ""
        }
      }
    }
  }'
```

**Expected:** Same as Test 3 — parent should be `MODULE_CONTAINER_ID`.

---

## Test 5: Layout change with parent set to null in module → should re-parent to ModuleContainer

### API

```bash
curl -s -X PUT "$BASE/apps/$APP_ID/versions/$VERSION_ID/components/layout" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diff": {
      "'$COMPONENT_ID'": {
        "layouts": {
          "desktop": { "top": 200, "left": 15, "width": 10, "height": 40 }
        },
        "component": {
          "parent": null
        }
      }
    }
  }'
```

**Expected:** Component moves to new layout position, parent remains `MODULE_CONTAINER_ID`.

---

## Test 6: Batch operation — create with null parent in module

### API

```bash
COMPONENT_ID3=$(uuidgen | tr '[:upper:]' '[:lower:]')

curl -s -X PUT "$BASE/apps/$APP_ID/versions/$VERSION_ID/components/batch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diff": {
      "create": {
        "diff": {
          "'$COMPONENT_ID3'": {
            "name": "TestBatchButton",
            "type": "Button",
            "parent": null,
            "properties": {},
            "styles": {},
            "validation": {},
            "general": {},
            "generalStyles": {},
            "others": {},
            "layouts": {
              "desktop": { "top": 250, "left": 10, "width": 10, "height": 40 },
              "mobile": { "top": 250, "left": 2, "width": 10, "height": 40 }
            }
          }
        },
        "pageId": "'$PAGE_ID'"
      }
    }
  }'
```

**Expected:** New component's parent should be `MODULE_CONTAINER_ID`.

---

## Test 7: ModuleContainer itself is NOT re-parented (exemption check)

### API

```bash
curl -s -X PUT "$BASE/apps/$APP_ID/versions/$VERSION_ID/components" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "diff": {
      "'$MODULE_CONTAINER_ID'": {
        "component": {
          "parent": null
        }
      }
    }
  }'
```

### Verify

```bash
curl -s "$BASE/apps/$APP_ID/versions/$VERSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.pages[0].components["'$MODULE_CONTAINER_ID'"].component.parent'
```

**Expected:** Parent should remain `null` — the ModuleContainer is legitimately parentless.

---

## Test 8: Regular (non-module) app is unaffected — null parent stays null

### API

```bash
COMPONENT_ID4=$(uuidgen | tr '[:upper:]' '[:lower:]')

curl -s -X POST "$BASE/apps/$REGULAR_APP_ID/versions/$REGULAR_VERSION_ID/components" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pageId": "'$REGULAR_PAGE_ID'",
    "diff": {
      "'$COMPONENT_ID4'": {
        "name": "TestCanvasButton",
        "type": "Button",
        "parent": null,
        "properties": {},
        "styles": {},
        "validation": {},
        "general": {},
        "generalStyles": {},
        "others": {},
        "layouts": {
          "desktop": { "top": 100, "left": 10, "width": 10, "height": 40 },
          "mobile": { "top": 100, "left": 2, "width": 10, "height": 40 }
        }
      }
    }
  }'
```

### Verify

```bash
curl -s "$BASE/apps/$REGULAR_APP_ID/versions/$REGULAR_VERSION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.pages[0].components["'$COMPONENT_ID4'"].component.parent'
```

**Expected:** Parent should be `null` — regular apps allow root-canvas placement.

---

## Test 9: UI — drag & drop in module editor

1. Open a **module** app in the editor
2. Drag a Button widget from the widget panel onto the canvas
3. Check the network tab for the create/batch API call
4. Verify the component appears inside the ModuleContainer in the layers panel
5. Try moving the component out of the ModuleContainer (if the UI allows) — the server should re-parent it back

---

## Test 10: UI — drag & drop in regular app (regression)

1. Open a **regular** app in the editor
2. Drag a Button widget onto the root canvas
3. Verify it appears on the root canvas (parent: null)
4. Drag it into a Container widget, then drag it back out to the root canvas
5. Verify parent toggles correctly between the container ID and null

---

## Cleanup

Delete test components created via API:

```bash
curl -s -X DELETE "$BASE/apps/$APP_ID/versions/$VERSION_ID/components" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "diff": ["'$COMPONENT_ID'", "'$COMPONENT_ID2'", "'$COMPONENT_ID3'"] }'

curl -s -X DELETE "$BASE/apps/$REGULAR_APP_ID/versions/$REGULAR_VERSION_ID/components" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "diff": ["'$COMPONENT_ID4'"] }'
```

---

## Summary Matrix

| # | Scenario | App Type | Operation | Input Parent | Expected Parent |
|---|----------|----------|-----------|--------------|-----------------|
| 1 | Create with null parent | Module | POST create | `null` | ModuleContainer ID |
| 2 | Create with explicit parent | Module | POST create | ModuleContainer ID | ModuleContainer ID |
| 3 | Update parent to null | Module | PUT update | `null` | ModuleContainer ID |
| 4 | Update parent to empty | Module | PUT update | `""` | ModuleContainer ID |
| 5 | Layout change with null parent | Module | PUT layout | `null` | ModuleContainer ID |
| 6 | Batch create with null parent | Module | PUT batch | `null` | ModuleContainer ID |
| 7 | ModuleContainer itself | Module | PUT update | `null` | `null` (exempt) |
| 8 | Regular app null parent | Front-end | POST create | `null` | `null` (unaffected) |
| 9 | UI drag-drop in module | Module | UI | — | Inside ModuleContainer |
| 10 | UI drag-drop in regular app | Front-end | UI | — | Root canvas (null) |
