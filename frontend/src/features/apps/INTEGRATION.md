# AppsPageAdapter Integration Guide

## Quick Start

Replace the existing UI rendering in `HomePage.render()` with a single component:

```jsx
<AppsPageAdapter
  apps={this.state.apps}
  isLoading={this.state.isLoading}
  error={this.state.error}
  meta={this.state.meta}
  currentFolder={this.state.currentFolder}
  appSearchKey={this.state.appSearchKey}
  appType={this.props.appType}
  pageChanged={this.pageChanged}
  folderChanged={this.folderChanged}
  onSearch={(key) => this.fetchApps(1, this.state.currentFolder.id, key)}
  canCreateApp={this.canCreateApp}
  canDeleteApp={this.canDeleteApp}
  canUpdateApp={this.canUpdateApp}
  deleteApp={this.deleteApp}
  cloneApp={this.cloneApp}
  exportApp={this.exportApp}
  navigate={this.props.navigate}
  darkMode={this.props.darkMode}
/>
```

## Complete Props List

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `apps` | `Array<Object>` | HomePage apps array from state |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isLoading` | `boolean` | `false` | Loading state from HomePage |
| `error` | `Error \| string \| object` | `null` | Error state from HomePage |
| `meta` | `Object` | `{}` | Pagination metadata: `{current_page, total_pages, total_count, per_page}` |
| `currentFolder` | `Object` | `{}` | Current folder object: `{id, name, ...}` |
| `appSearchKey` | `string` | `''` | Search query from HomePage |
| `appType` | `'front-end' \| 'module' \| 'workflow'` | `'front-end'` | Type of apps to display |
| `pageChanged` | `Function` | - | Callback `(page: number) => void` for pagination changes |
| `folderChanged` | `Function` | - | Callback `(folder: Object) => void` for folder changes |
| `onSearch` | `Function` | - | Callback `(searchKey: string) => void` for search changes |
| `canCreateApp` | `Function \| boolean` | - | Permission check function or boolean |
| `canDeleteApp` | `Function` | - | Permission check `(app: Object) => boolean` |
| `canUpdateApp` | `Function` | - | Permission check `(app: Object) => boolean` |
| `deleteApp` | `Function` | - | Action handler `(app: Object) => void` |
| `cloneApp` | `Function` | - | Action handler `(app: Object) => void` |
| `exportApp` | `Function` | - | Action handler `(app: Object) => void` |
| `navigate` | `Function` | - | Navigation function from React Router (uses `useNavigate` if not provided) |
| `darkMode` | `boolean` | `false` | Dark mode prop |

## Data Transformation Mapping

The adapter transforms HomePage's app objects to `AppRow` format:

| HomePage Field | AppRow Field | Notes |
|----------------|--------------|-------|
| `app.id` | `id` | Required, fallback to random string if missing |
| `app.name` | `name` | Fallback to 'Untitled App' |
| `app.updated_at` or `app.updatedAt` | `lastEdited` | Falls back to `created_at`, then current date |
| `app.user?.name` or `app.user?.email` | `editedBy` | Falls back to `updated_by`, then 'Unknown' |
| `app.slug` | `slug` | Preserved as-is |
| `app.icon` | `icon` | Preserved as-is |
| `app.is_public` | `isPublic` | Boolean, defaults to false |
| `app.folder_id` | `folderId` | Preserved or null |
| `app.user_id` or `app.user?.id` | `userId` | Preserved |
| `app` (entire object) | `_originalApp` | **Critical**: Original app preserved for permission checks and actions |

## Permission Mapping

| HomePage Method | Adapter Permission | Usage |
|-----------------|-------------------|-------|
| `canCreateApp()` | `perms.canImport` | Controls import menu item visibility |
| `canUpdateApp(app)` | `perms.canEdit(appRow)` | Controls edit button state (uses `_originalApp`) |
| `canUpdateApp(app)` | `perms.canPlay(appRow)` | Controls play button state (uses `_originalApp`) |
| `canDeleteApp(app)` | Row action visibility | Controls delete option in dropdown (uses `_originalApp`) |

**Important**: Permission checks use `appRow._originalApp` to call HomePage methods with the original app object.

## Row Actions

The adapter wires row actions to HomePage methods:

| Action | Handler | Navigation |
|--------|---------|------------|
| Play | `handlePlay` | Navigates to `/:workspaceId/applications/:slug` |
| Edit | `handleEdit` | Navigates to `/:workspaceId/apps/:slug` |
| Delete | `deleteApp(_originalApp)` | Calls HomePage's `deleteApp` with original app |
| Clone | `cloneApp(_originalApp)` | Calls HomePage's `cloneApp` with original app |

## What Still Needs HomePage UI

The adapter handles the apps list view, but these features still require HomePage UI:

- **Modals**: Create app, clone app, import app, template library
- **Folder Management**: Create/edit/delete folders UI
- **Git Repository Import**: Git sync UI
- **Bulk Actions**: Multi-select operations
- **App Type Tabs**: Switching between apps/modules/workflows (if using separate routes)

## State Management

### Current Strategy (Phase 1)

The adapter uses **HomePage state as source of truth**:
- Search: `appSearchKey` from HomePage state
- Pagination: `meta.current_page` from HomePage state
- Folder: `currentFolder` from HomePage state

### Future Migration (Phase 2-3)

1. **Phase 2**: Add URL state sync alongside HomePage state (dual source)
2. **Phase 3**: Migrate fully to URL state, remove HomePage state dependency

## Troubleshooting

### Issue: Apps not displaying

**Check**:
- Is `apps` prop an array? (Adapter validates this)
- Are apps in the expected format? (Check browser console for transformation errors)

### Issue: Permissions not working

**Check**:
- Are `canCreateApp`, `canUpdateApp`, `canDeleteApp` functions provided?
- Do they accept the original app object? (Adapter uses `_originalApp`)
- Check browser console for permission check errors

### Issue: Pagination not syncing

**Check**:
- Is `pageChanged` callback provided?
- Is `meta.current_page` updating correctly?
- Check that pagination conversion (1-indexed → 0-indexed) is correct

### Issue: Search not working

**Check**:
- Is `onSearch` callback provided?
- Is `appSearchKey` updating in HomePage state?
- Check that search is not being debounced too aggressively

### Issue: Row actions not working

**Check**:
- Is `navigate` function provided? (Uses `useNavigate` as fallback)
- Are action handlers (`deleteApp`, `cloneApp`) provided?
- Check browser console for navigation errors

### Issue: Empty state showing incorrectly

**Check**:
- Is `isLoading` properly set to `false` when data is loaded?
- Is `appSearchKey` or `currentFolder.id` set when there's an active query?
- Check empty state logic: `apps.length === 0 && !hasQuery && !isLoading`

## Examples

### Basic Usage

```jsx
<AppsPageAdapter
  apps={this.state.apps}
  isLoading={this.state.isLoading}
  meta={this.state.meta}
  appSearchKey={this.state.appSearchKey}
  appType={this.props.appType}
  pageChanged={this.pageChanged}
  onSearch={(key) => this.fetchApps(1, this.state.currentFolder.id, key)}
  canCreateApp={this.canCreateApp}
  canUpdateApp={this.canUpdateApp}
  canDeleteApp={this.canDeleteApp}
  deleteApp={this.deleteApp}
  navigate={this.props.navigate}
/>
```

### With Error Handling

```jsx
{this.state.error ? (
  <ErrorComponent error={this.state.error} />
) : (
  <AppsPageAdapter
    apps={this.state.apps}
    isLoading={this.state.isLoading}
    error={this.state.error}
    // ... other props
  />
)}
```

### With Custom Navigation

```jsx
<AppsPageAdapter
  // ... other props
  navigate={(path) => {
    // Custom navigation logic
    this.props.navigate(path);
  }}
/>
```

## Performance Considerations

- The adapter memoizes all computed values (appRows, columns, permissions)
- Large apps arrays (>1000 items) may benefit from virtual scrolling (future enhancement)
- Permission checks are memoized per app row
- Table state is synced with HomePage state via `useEffect` hooks

## Accessibility

The adapter includes accessibility features:
- ARIA labels on error states (`role="alert"`, `aria-live="polite"`)
- ARIA labels on loading states (`aria-busy="true"`)
- ARIA labels on action buttons
- Screen reader friendly error messages

## Testing

### Unit Tests

- Transformer function: `features/apps/adapters/__tests__/homePageToAppRow.test.js`
- Adapter hook: `features/apps/hooks/__tests__/useAppsPageAdapter.test.js`

### Integration Tests

- Component: `components/AppsPage/__tests__/AppsPageAdapter.test.jsx`

### Storybook

- Stories: `components/AppsPage/stories/AppsPageAdapter.stories.jsx`

## Migration Checklist

- [ ] Replace HomePage render UI with `<AppsPageAdapter />`
- [ ] Pass all required props from HomePage state/methods
- [ ] Test pagination (change page, verify callback fires)
- [ ] Test search (type search, verify callback fires)
- [ ] Test row actions (play, edit, delete, clone)
- [ ] Test permissions (verify buttons enabled/disabled correctly)
- [ ] Test empty states (no apps, no results)
- [ ] Test error states (network errors, API errors)
- [ ] Test loading states
- [ ] Verify accessibility (screen reader, keyboard navigation)
- [ ] Check console for errors/warnings

## Support

For issues or questions:
1. Check browser console for errors
2. Review this documentation
3. Check Storybook examples
4. Contact the design engineering team

