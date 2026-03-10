# PRD: FileButton Widget

**Widget name:** `FileButton`
**Component name:** `FileButton`
**Display name:** `File button`
**Description:** A button that triggers file selection. Label updates to show selected file count after selection.
**Default size:** `width: 10, height: 40`
**Inspector:** Fall-through to FileInput (Pattern B)
**Section group:** `textInputs`

---

## Properties

| Key | Display Name | Type | Accordion | Default | Conditional |
|---|---|---|---|---|---|
| `buttonText` | Button text | `code` | Data | `'Upload file'` | — |
| `enableMultiple` | Enable multiple files | `toggle` | Data | `false` | — |
| `parseContent` | Parse file content | `toggle` | Data | `false` | — |
| `parseFileType` | File type | `select` | Data | `'auto-detect'` | parseContent = true |
| `delimiter` | Delimiter | `code` | Data | `','` | parseContent = true AND parseFileType = 'csv' |
| `enableClearSelection` | Show clear button | `toggle` | — | `true` | section: additionalActions |
| `loadingState` | Loading state | `toggle` | — | `false` | section: additionalActions |
| `visibility` | Visibility | `toggle` | — | `true` | section: additionalActions |
| `disabledState` | Disable | `toggle` | — | `false` | section: additionalActions |
| `tooltip` | Tooltip | `code` | — | `''` | section: additionalActions |

`parseFileType` options: `{ name: 'Autodetect from extension', value: 'auto-detect' }`, CSV, XLS, XLSX, JSON

---

## Validation

| Key | Display Name | Type | Default | Conditional |
|---|---|---|---|---|
| `enableValidation` | Make this field mandatory | `toggle` | `false` | — |
| `fileType` | Accepted file types | `code` | `'*/*'` | — |
| `minSize` | Min size (bytes) | `code` | `0` | — |
| `maxSize` | Max size (bytes) | `code` | `1048576` | — |
| `minFileCount` | Min files | `code` | `1` | enableMultiple = true (`parentObjectKey: 'properties'`) |
| `maxFileCount` | Max files | `code` | `2` | enableMultiple = true (`parentObjectKey: 'properties'`) |

---

## Styles

### `label and icon` accordion

| Key | Display Name | Type | Default | Notes |
|---|---|---|---|---|
| `labelSize` | Label size | `numberInput` | `14` | — |
| `labelWeight` | Label weight | `select` | `'medium'` | Options: `{ name: 'Light', value: 'light' }`, Normal, Medium, SemiBold, Bold |
| `labelColor` | Label color | `colorSwatches` | `var(--cc-text-on-solid)` | — |
| `icon` | Icon | `icon` | `'IconHome2'` | `visibility: false` |
| `iconColor` | — | `colorSwatches` | `var(--cc-default-icon)` | `showLabel: false`, `visibility: false` |
| `iconDirection` | — | `switch` (isIcon) | `'left'` | `isFxNotRequired: true`; options: alignleftinspector / alignrightinspector |
| `loaderColor` | Loader | `colorSwatches` | `var(--cc-surface1-surface)` | — |
| `contentAlignment` | Content alignment | `switch` (isIcon) | `'left'` | `isFxNotRequired: true`; options: left / center / right align icons |

### `button` accordion

| Key | Display Name | Type | Default | Notes |
|---|---|---|---|---|
| `buttonType` | Type | `switch` | `'solid'` | Options: Solid / Outline |
| `backgroundColor` | Background | `colorSwatches` | `var(--cc-primary-brand)` | — |
| `hoverBackgroundColor` | Hover background | `colorSwatches` | `'auto'` | Engineer can override |
| `borderRadius` | Border radius | `numberInput` | `14` | — |
| `boxShadow` | Box shadow | `boxShadow` | `'0px 0px 0px 0px #FF3366'` | — |
| `padding` | Padding | `switch` | `'default'` | Options: Default / None |

---

## Events

| Handle | Display Name |
|---|---|
| `onFileSelected` | On file selected |
| `onFileLoaded` | On file loaded |

---

## Actions (CSAs)

| Handle | Display Name | Params |
|---|---|---|
| `clear` | Clear | — |
| `setFocus` | Set focus | — |
| `setBlur` | Set blur | — |
| `setVisibility` | Set visibility | value (toggle, default `{{true}}`) |
| `setDisable` | Set disable | value (toggle, default `{{false}}`) |
| `setLoading` | Set loading | value (toggle, default `{{false}}`) |

---

## Exposed Variables

| Variable | Default |
|---|---|
| `files` | `[]` |
| `isParsing` | `false` |
| `isValid` | `false` |
| `isMandatory` | `false` |
| `isLoading` | `false` |
| `isVisible` | `true` |
| `isDisabled` | `false` |

---

## UI Behaviour

- Button displays `buttonText` by default
- After selection: label updates to `"{n} file(s) selected"` (or filename if single)
- When `enableClearSelection` is on: a clear/× control appears after selection
- No dropzone — clicking always opens OS file picker
