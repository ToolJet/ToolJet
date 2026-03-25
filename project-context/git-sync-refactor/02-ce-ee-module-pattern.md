# Part 2: CE/EE Module Pattern

## Core Mechanism: Dynamic Import Path Switching

The CE/EE pattern hinges on `getImportPath()` in `server/src/modules/app/constants/index.ts:11`:

```
getTooljetEdition() returns 'ce' | 'ee' | 'cloud'

  CE    -> server/dist/src/modules/<module>/
  EE    -> server/dist/ee/<module>/
  Cloud -> server/dist/ee/<module>/
```

When `TOOLJET_EDITION=ee`, files load from `server/ee/` instead of `server/src/modules/`. **Same class names, different implementations.**

## The `SubModule` Base Class

**File:** `server/src/modules/app/sub-module.ts`

```ts
export abstract class SubModule {
  protected static async getProviders(configs, module, paths) {
    const importPath = await getImportPath(configs.IS_GET_CONTEXT);
    // importPath = ".../src/modules" (CE) or ".../ee" (EE)

    for (const path of paths) {
      const fullPath = `${importPath}/${module}/${path}`;
      const imported = await import(fullPath);  // dynamic import!
      Object.assign(providers, imported);
    }
    return providers;
  }
}
```

## GitSyncModule.register() — What Gets Loaded

**File:** `server/src/modules/git-sync/module.ts`

```ts
const {
  GitSyncController,
  GitSyncService,
  SourceControlProviderService,
  SSHGitSyncService,
  HTTPSGitSyncService,
  GitLabGitSyncService,
  // ... util services, base services
} = await this.getProviders(configs, 'git-sync', [
  'controller',
  'service',
  'source-control-provider',
  'providers/github-ssh/service',
  'providers/github-https/service',
  'providers/gitlab/service',
  'providers/github-https/util.service',
  'providers/github-ssh/util.service',
  'providers/gitlab/util.service',
  'base-git-util.service',
  'base-git.service',
]);
```

**On CE:** imports from `server/src/modules/git-sync/controller.ts` -> stubs
**On EE:** imports from `server/ee/git-sync/controller.ts` -> real code

## Side-by-Side: CE Stub vs EE Implementation

### Controller

| | CE (`src/modules/git-sync/controller.ts`) | EE (`ee/git-sync/controller.ts`) |
|---|---|---|
| **Extends** | Implements `IGitSyncController` | Extends CE `GitSyncController` |
| **Constructor** | Empty `constructor() {}` | Injects `GitSyncService` |
| **Guards** | None | `@UseGuards(JwtAuthGuard, FeatureAbilityGuard)` |
| **Methods** | All `throw new NotFoundException()` | All delegate to `this.gitSyncService.*` |
| **Features** | No `@InitFeature` decorators | Every method has `@InitFeature(FEATURE_KEY.*)` |
| **Extra endpoints** | None | Adds `POST /configs` (`saveProviderConfigs`) |

### Service

| | CE (`src/modules/git-sync/service.ts`) | EE (`ee/git-sync/service.ts`) |
|---|---|---|
| **Implements** | `IGitSyncService` | `IGitSyncService` (same interface) |
| **Constructor** | Empty | Injects `SourceControlProviderService` + `BaseGitSyncService` |
| **Methods** | All `throw new Error('Method not implemented.')` | All use strategy: `getSourceControlService() -> strategy.method()` |
| **Extra methods** | None | `saveProviderConfig()`, `getOrganizationById()` |

## The Inheritance Chain

```
                     IGitSyncController (interface)
                            |
              +-------------+-------------+
              |                           |
    CE GitSyncController         EE GitSyncController
    (all methods -> 404)         (extends CE, overrides all)
    @Controller('git-sync')      @Controller('git-sync')
                                 @UseGuards(JwtAuth, Feature)
                                 constructor(gitSyncService)


                     IGitSyncService (interface)
                            |
              +-------------+-------------+
              |                           |
    CE GitSyncService            EE GitSyncService
    (all methods -> Error)       (implements same interface)
                                 constructor(sourceControlProvider, baseGitSync)
                                 every method -> strategy dispatch
```

## Key Files

| File | Purpose |
|------|---------|
| `server/src/modules/app/sub-module.ts` | Base class with `getProviders()` dynamic import |
| `server/src/modules/app/constants/index.ts` | `getImportPath()` — switches path by edition |
| `server/src/modules/git-sync/module.ts` | Module registration with dynamic provider loading |
| `server/src/modules/git-sync/controller.ts` | CE stub controller (all 404) |
| `server/src/modules/git-sync/service.ts` | CE stub service (all throw Error) |
| `server/src/modules/git-sync/Interfaces/IController.ts` | Controller interface |
| `server/src/modules/git-sync/Interfaces/IService.ts` | Service interface |
| `server/ee/git-sync/controller.ts` | EE real controller |
| `server/ee/git-sync/service.ts` | EE real service with strategy dispatch |

## Issues for Refactoring

1. **EE controller extends CE controller** — CE stub must always exist, even though it's useless
2. **Route collision risk** — `GET :id` must be last in controller because `:id` matches `status`, `finalize`, etc.
3. **Interface mismatch** — `IGitSyncService.setFinalizeConfig` has 5 params but EE implementation calls `saveProviderConfig` with 3
4. **Dead code in EE service** — `setFinalizeConfig` line 83 has unreachable `return;`
5. **`sourceControlStrategy` as mutable class field** — Not thread-safe in theory (works due to Node.js single-threaded nature, but bad practice)
