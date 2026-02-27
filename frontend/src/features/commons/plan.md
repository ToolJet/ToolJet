Refactoring plan: Move reusable components from Apps to Commons
Analysis summary
Reusable components (move to commons):
Hooks: useResourcePageAdapter, useResourceActions, useResourcePermissions, useResourcePageState, useAppsTableState → useResourceTableState
Components: AppsShellView → ResourceShellView, EndUserShellView → EndUserResourceShellView, PageContainer, AppsTable → ResourceTable, AppsGrid → ResourceGrid, AppsTableSkeleton → ResourceTableSkeleton, EmptyNoApps → EmptyResource
App-specific (keep in apps):
AppsPageAdapter, EndUserAppsPageAdapter, CreateAppModal, homePageToAppRow
Already generic (no change):
ResourcePageHeader, ResourceViewHeader, ResourceTabs (in @/components/ui/blocks/)


Implementation plan
Phase 1: Move and generalize hooks
useAppsTableState → useResourceTableState (commons)
Rename and move to commons/hooks/useResourceTableState.js
Update imports in useResourcePageAdapter
useResourcePageState → commons
Move to commons/hooks/useResourcePageState.js
Already generic
useResourcePageAdapter → commons
Move to commons/hooks/useResourcePageAdapter.js
Make transformer configurable (accept transformFn prop)
Update imports
useResourceActions → commons
Move to commons/hooks/useResourceActions.js
Make navigation paths configurable (accept getPlayPath, getEditPath functions)
Update imports
useResourcePermissions → commons
Move to commons/hooks/useResourcePermissions.js
Already generic, just rename references


Phase 2: Move and generalize components
PageContainer → commons
Move to commons/components/PageContainer.jsx
Already generic
AppsTable → ResourceTable
Move to commons/components/ResourceTable.jsx
Rename and update imports
AppsTableSkeleton → ResourceTableSkeleton
Move to commons/components/ResourceTableSkeleton.jsx
Make column count configurable
Update imports
AppsGrid → ResourceGrid
Move to commons/components/ResourceGrid.jsx
Accept renderItem prop (customize card rendering per resource type)
Update imports
EmptyNoApps → EmptyResource
Move to commons/components/EmptyResource.jsx
Accept title, description, icon props
Update imports
AppsShellView → ResourceShellView
Move to commons/components/ResourceShellView.jsx
Make search placeholder configurable
Update imports
EndUserShellView → EndUserResourceShellView
Move to commons/components/EndUserResourceShellView.jsx
Make search placeholder configurable
Update imports


Phase 3: Update apps feature
Update all imports in apps feature
Update AppsPageAdapter.jsx
Update EndUserAppsPageAdapter.jsx
Update story files
Update any other files using these components
Create app-specific wrappers (if needed)
AppsGrid wrapper that uses ResourceGrid with app-specific rendering
AppsTable wrapper that uses ResourceTable

Phase 4: File structure
frontend/src/features/
├── apps/
│   ├── adapters/
│   │   ├── AppsPageAdapter.jsx (uses commons)
│   │   ├── EndUserAppsPageAdapter.jsx (uses commons)
│   │   └── homePageToAppRow.js (app-specific)
│   ├── components/
│   │   ├── CreateAppModal.jsx (app-specific)
│   │   └── [other app-specific components]
│   └── hooks/
│       └── [app-specific hooks only]
└── commons/
    ├── columns/ ✅ (already moved)
    ├── components/
    │   ├── PageContainer.jsx
    │   ├── ResourceTable.jsx
    │   ├── ResourceGrid.jsx
    │   ├── ResourceTableSkeleton.jsx
    │   ├── EmptyResource.jsx
    │   ├── ResourceShellView.jsx
    │   └── EndUserResourceShellView.jsx
    └── hooks/
        ├── useResourceTableState.js
        ├── useResourcePageState.js
        ├── useResourcePageAdapter.js
        ├── useResourceActions.js
        └── useResourcePermissions.js


Detailed changes
1. useResourcePageAdapter generalization
// Before: Hardcoded transformAppsToAppRow
import { transformAppsToAppRow } from '@/features/apps/adapters/homePageToAppRow';

// After: Accept transform function
export function useResourcePageAdapter({ 
  data = {}, 
  filters = {}, 
  actions = {}, 
  columns = [],
  transformFn // NEW: configurable transformer
}) {
  const rows = useMemo(() => {
    if (!data.items || !Array.isArray(data.items)) return [];
    return transformFn ? transformFn(data.items) : data.items;
  }, [data.items, transformFn]);
  // ... rest of logic
}

2. useResourceActions generalization
// Before: Hardcoded app paths
navigateToApp(`/${workspaceId}/applications/${originalApp.slug}`);

// After: Configurable paths
export function useResourceActions({ 
  navigate, 
  workspaceId, 
  handlers = {},
  getPlayPath, // NEW: (item) => string
  getEditPath  // NEW: (item) => string
}) {
  const handlePlay = useCallback((item) => {
    const path = getPlayPath ? getPlayPath(item) : `/${workspaceId}/applications/${item.slug}`;
    navigateToApp(path);
  }, [getPlayPath, navigateToApp, workspaceId]);
  // ... rest
}

3. ResourceGrid generalization
// Before: App-specific rendering
export const AppsGrid = ({ table, actions, perms, canDelete }) => {
  const renderAppCard = (app, index) => { /* app-specific */ };
  return <ResourceGrid items={items} renderItem={renderAppCard} />;
};

// After: Generic with renderItem prop
export const ResourceGrid = ({ table, renderItem }) => {
  const rows = table.getRowModel().rows;
  const items = rows.map((row) => row.original);
  return <ResourceGrid items={items} renderItem={renderItem} />;
};

// Apps feature creates wrapper:
export const AppsGrid = ({ table, actions, perms, canDelete }) => {
  const renderAppCard = (app, index) => { /* app-specific */ };
  return <ResourceGrid table={table} renderItem={renderAppCard} />;
};

Migration order
Move hooks (least dependencies)
Move simple components (PageContainer, ResourceTable, ResourceTableSkeleton)
Generalize complex components (ResourceGrid, EmptyResource)
Move shell views
Update apps feature imports
Test and verify
