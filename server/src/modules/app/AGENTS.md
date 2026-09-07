# app module (core)

The base module every other backend module builds on. Owns: the `SubModule` base class implementing the dynamic `register()` + edition-routing pattern (`getImportPath`), the CASL authorization skeleton (`AbilityFactory` + `AbilityGuard`), feature/license gating metadata (`MODULES`, `MODULE_INFO`, `@InitModule`/`@InitFeature`/`@RequireFeature`), shared param decorators, and the root `AppModule` that composes all ~50 feature modules plus infra (DB, queues, logging, otel).

## Key files

| File | Role |
|---|---|
| `sub-module.ts` | `SubModule` base class. `getProviders(configs, module, paths)` dynamically imports providers from the edition path; per-subclass `DynamicModule` cache (`buildCacheKey` / `getCachedModule` / `cacheModule`) avoids re-assembly during bootstrap |
| `constants/index.ts` | `getImportPath(isGetContext, edition)` — CE → `src/modules/`, EE **and** Cloud → `ee/`; `isGetContext=true` only for migrations (picks `src` vs `dist` by checking if `src/modules` exists). Also `TOOLJET_EDITIONS`, `LICENSE_FEATURE_ID_KEY`, root `FEATURE_KEY` |
| `constants/modules.ts` | `MODULES` enum — module ids used by `@InitModule` and as `MODULE_INFO` keys |
| `constants/module-info.ts` | `MODULE_INFO` — aggregates every module's `FEATURES` map into per-feature `FeatureConfig` (license, `isPublic`, `isSuperAdminFeature`, audit-log keys); EE feature sets merged by edition check |
| `guards/ability.guard.ts` | Abstract `AbilityGuard` (`CanActivate`) — reads `tjModuleId`/`tjFeatureId` metadata, enforces license (HTTP 451), public-feature/public-app short-circuits, super-admin check, then CASL `ability.can()` per feature. Override points: `getAbilityFactory()`, `getSubjectType()`, `getResource()`, `forwardAbility()` |
| `ability-factory.ts` | Abstract `AbilityFactory<TActions, TSubject>` — builds CASL ability from `AbilityService.resourceActionsPermission`; caches permissions on `request.tj_user_permissions`. Subclasses implement `getSubjectType()` + `defineAbilityFor()` |
| `decorators/init-module.ts` | `@InitModule(MODULES.X)` → `tjModuleId` metadata (class level) |
| `decorators/init-feature.decorator.ts` | `@InitFeature(FEATURE_KEY.X)` → `tjFeatureId` metadata (handler level) |
| `decorators/require-feature.decorator.ts` | `@RequireFeature(LICENSE_FIELD.X)` → license metadata |
| `decorators/app.decorator.ts` | `AppDecorator` — param decorator returning `request.tj_app` (import as `AppDecorator as App`) |
| `decorators/user.decorator.ts` | `@User()` — returns `request.user` |
| `decorators/ability.decorator.ts` / `user-permission.decorator.ts` | `request.tj_ability` / `request.tj_user_permissions` param decorators |
| `guards/organization-validate.guard.ts` | Asserts `:organizationId` param equals user's workspace id (`Organization` entity = Workspace, legacy name) |
| `guards/cloud-feature.guard.ts` | Route allowed only when edition is Cloud |
| `module.ts` | Root `AppModule.register()` — `AppModuleLoader.loadModules` + every feature module's `register(configs, true)`; conditional imports (Workflows + BullBoard non-Cloud, `SessionTransferModule` Cloud-only, Metrics via env) |
| `loader.ts` | Infra modules: TypeORM (main + `tooljetDb`), BullMQ, ConfigModule, pino logger, otel/Sentry, Redis, `GuardValidatorModule` |
| `validators/feature-guard.validator.ts` | `GuardValidator` — boot-time scan asserting every route has an `AbilityGuard` |
| `interceptors/response.interceptor.ts` | Emits audit-log events after responses, driven by `MODULE_INFO` feature config |
| `types.ts` | `FeatureConfig`, `ResourceDetails`, `UserAllPermissions` |
| `ability/` | The app module's own `FeatureAbilityFactory`/`FeatureAbilityGuard` (health/root endpoints) — smallest real example of the pattern |

## How other modules use it

Module registration (`src/modules/folders/module.ts`):

- `class FoldersModule extends SubModule` with `static async register(configs, isMainImport)`
- cache check via `this.buildCacheKey` / `this.getCachedModule`, then `this.getProviders(configs, 'folders', ['controller', 'service', 'util.service'])` — resolves CE or EE file by edition — and `this.cacheModule(...)`
- controllers registered only when `isMainImport` is true (root `AppModule` passes `true`)

Controller wiring (`src/modules/folders/controller.ts`):

- `@InitModule(MODULES.FOLDER)` on the class; per handler `@InitFeature(FEATURE_KEY.CREATE_FOLDER)` + `@UseGuards(JwtAuthGuard, FeatureAbilityGuard)`
- each module ships `ability/guard.ts` (`FeatureAbilityGuard extends AbilityGuard`, overrides `getAbilityFactory`/`getSubjectType`) and `ability/index.ts` (`FeatureAbilityFactory extends AbilityFactory`, overrides `defineAbilityFor`)
- `@AppDecorator as App` usage example: `src/modules/apps/controllers/workflow.controller.ts`

## Invariants & gotchas

- `getImportPath` maps **both** EE and Cloud to `ee/` — Cloud has no separate module tree; differentiate with runtime checks (`getTooljetEdition()`, `CloudFeatureGuard`).
- CE and EE files loaded via `getProviders` must export identical class names — imports are merged with `Object.assign`, so a renamed EE export silently drops the CE provider override.
- Every `@InitFeature` key must exist in `MODULE_INFO[module]`, else `AbilityGuard` throws 404 `Feature X not found in module Y` at request time. New feature = add to the module's `constants/features.ts` (wired into `module-info.ts`).
- Every route must carry an `AbilityGuard` subclass — `GuardValidator` scans all controllers at boot and reports unguarded routes.
- `register()` results are cached per subclass + args signature; don't put per-call side effects in `register()`.
- License gating is declarative: `FeatureConfig.license` in `MODULE_INFO` → guard returns HTTP 451 when the plan lacks the feature.
- Param decorators (`@User`, `App`, ability, permissions) return `cloneDeep` copies — mutating them never touches the request.
- `IS_GET_CONTEXT: true` is for migrations only (switches `src`/`dist` resolution); normal server startup always passes it false.
- Workspace = `Organization` entity/`organizationId` fields (legacy naming) — user-facing term is Workspace.

## Related modules

- `ability` — `AbilityService` + `UserPermissions` consumed by `AbilityFactory`
- `licensing` — `LICENSE_FIELD`, `LicenseTermsService` used in guard license checks
- `session` — `JwtAuthGuard` paired with `FeatureAbilityGuard` on every route
- `audit-logs` — consumes `ResponseInterceptor` events / `MODULE_INFO` audit keys
- `logging` — `TransactionLogger` (guard timing), `TypeormLoggerService` (loader)
