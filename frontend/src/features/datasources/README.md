# Datasources Feature

Complete datasources page adapter with Storybook stories and mock data.

## Files Created

### Adapters
- **`DatasourcesPageAdapter.jsx`** — Main adapter component that orchestrates the datasources page
- **`homePageToDatasourceRow.js`** — Data transformer that converts API datasource objects to table row format
- **`index.js`** — Exports for the adapter and transformer

### Stories
- **`DatasourcesPageAdapter.stories.jsx`** — Storybook stories with 8 variants:
  - Default (50 datasources)
  - Empty (no datasources)
  - Loading (skeleton state)
  - WithError (error state)
  - ReachedLimit (subscription limit reached)
  - FewDatasources (5 datasources)
  - WithSearch (with search filter applied)
  - NoPermissions (read-only mode)

- **`mockData.js`** — Mock datasource data and environments
- **`utils.js`** — Helper functions to generate mock data
- **`data.json`** — Static fixture data for E2E tests (15 datasources)

## Usage

```jsx
import { DatasourcesPageAdapter } from '@/features/datasources/adapters';

<DatasourcesPageAdapter
  data={{
    datasources: [],
    isLoading: false,
    error: null,
    meta: {},
  }}
  filters={{
    datasourceSearchKey: "",
    currentEnvironment: null,
    environments: [],
    environmentsLoading: false,
  }}
  actions={{
    pageChanged: (pageIndex) => {},
    environmentChanged: (env) => {},
    onSearch: (query) => {},
    deleteDatasource: (ds) => {},
    testConnection: (ds) => {},
    reloadDatasources: () => {},
    duplicateDatasource: (ds) => {},
    createDatasource: () => {},
  }}
  permissions={{
    canCreateDatasource: true,
    canDeleteDatasource: true,
    canUpdateDatasource: true,
  }}
  navigation={{
    navigate: useNavigate(),
    workspaceId: "123",
  }}
  layout={{
    workspaceName: "My Workspace",
    workspaces: [],
    onWorkspaceChange: () => {},
    sidebarUser: {},
    sidebarTeams: [],
    sidebarNavMain: [],
    sidebarProjects: [],
    sidebarUserMenuItems: [],
    sidebarPlatformVersion: "v1.0",
  }}
  ui={{
    darkMode: false,
  }}
  subscriptionLimits={{
    datasourcesLimit: {},
  }}
/>
```

## Viewing Stories

Run Storybook to view all datasources stories:

```bash
npm run storybook
# or
yarn storybook
```

Navigate to: **Features > Datasources > DatasourcesPageAdapter**

## Mock Data

### Datasource Types Supported
- PostgreSQL (`postgres`)
- MySQL (`mysql`)
- MongoDB (`mongodb`)
- Redis (`redis`)
- REST API (`restapi`)
- GraphQL (`graphql`)
- Elasticsearch (`elasticsearch`)
- DynamoDB (`dynamodb`)

### Generating Mock Data

```javascript
import { generateMockDatasources, generateMockEnvironments } from './utils';

const datasources = generateMockDatasources(50); // Generate 50 mock datasources
const environments = generateMockEnvironments(5); // Generate 5 mock environments
```

## Architecture

The datasources feature follows the same pattern as the apps feature, using:

- **Commons hooks**: `useResourcePageAdapter`, `useResourceActions`, `useResourcePermissions`, `useResourcePageState`
- **Commons components**: `ResourceShellView`, `EmptyResource`, `ResourceTableSkeleton`, `ResourceTable`
- **Configurable navigation**: Custom paths via `getPlayPath` and `getEditPath`
- **Environment filtering**: Similar to folder filtering in apps, but for datasource environments

## Key Differences from Apps Feature

1. **Single tab** instead of dual tabs (apps + modules)
2. **Environment filtering** instead of folder filtering
3. **Datasource-specific actions**: test connection, reload, duplicate
4. **Different navigation structure**: `/datasources/:id/edit` instead of `/apps/:slug`
5. **Type-based organization**: datasources grouped by type (postgres, mysql, etc.)

## Testing

The stories include comprehensive test scenarios:

- ✅ Default state with pagination
- ✅ Empty state handling
- ✅ Loading/skeleton states
- ✅ Error state handling
- ✅ Subscription limits
- ✅ Search functionality
- ✅ Permission restrictions
- ✅ Environment filtering

Run visual regression tests using Storybook or Chromatic.
