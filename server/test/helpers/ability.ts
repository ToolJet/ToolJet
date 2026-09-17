/**
 * Shared scaffolding for CASL ability / NestJS guard unit specs — the "guard/ability unit"
 * bucket in server/docs/testing-philosophy.md. Every one of these pieces replaces something
 * that was hand-rolled per-spec (basePerms objects, makeContext() functions, AbilityBuilder
 * boilerplate, feature-loop assertions) across the existing ability/guard specs.
 */
import { Ability, AbilityBuilder, AbilityClass, ExtractSubjectType } from '@casl/ability';
import { ExecutionContext, Type } from '@nestjs/common';
import { DEFAULT_USER_PERMISSIONS } from '@modules/ability/constants';
import { UserAllPermissions } from '@modules/app/types';
import { AbilityFactory } from '@modules/app/ability-factory';
import { User } from '@entities/user.entity';

/**
 * Builds a full UserAllPermissions object for ability tests. Role flags, user, and resource
 * default to the "no access" shape; userPermission is deep-merged onto DEFAULT_USER_PERMISSIONS
 * so callers only specify the fields their test cares about.
 */
export function buildPermissions(overrides: Partial<UserAllPermissions> = {}): UserAllPermissions {
  const { userPermission, ...rest } = overrides;
  return {
    superAdmin: false,
    isAdmin: false,
    isBuilder: false,
    isEndUser: false,
    user: {} as User,
    resource: [],
    ...rest,
    userPermission: {
      ...DEFAULT_USER_PERMISSIONS,
      ...userPermission,
    },
  };
}

/**
 * Replaces the `new AbilityBuilder<FeatureAbility>(Ability as AbilityClass<FeatureAbility>)`
 * one-liner duplicated across every pure-CASL ability spec (style (a) in the reconciliation
 * plan — calling a standalone `define*Ability` function directly with a fresh builder).
 */
export function makeAbilityBuilder<TAbility extends Ability>(): AbilityBuilder<TAbility> {
  return new AbilityBuilder<TAbility>(Ability as AbilityClass<TAbility>);
}

/**
 * Builds an ability via a FeatureAbilityFactory subclass, reaching into its protected
 * `defineAbilityFor` (style (b) in the reconciliation plan). Confines the `as any` cast onto
 * the protected member to this one place instead of every spec re-deriving it.
 *
 * `request` simulates the HTTP request object a guard would populate (e.g. `tj_app`,
 * `tj_admin_groups`, `tj_group`, `tj_resource_id`) — several factories key their grants off it.
 */
export async function buildAbilityViaFactory<TAbility extends Ability>(
  factory: AbilityFactory<any, any>,
  permissions: Partial<UserAllPermissions>,
  metadata: { moduleName: string; features: string[] } = { moduleName: '', features: [] },
  request?: unknown
): Promise<TAbility> {
  const { can, build } = makeAbilityBuilder<TAbility>();
  await (factory as unknown as { defineAbilityFor: AbilityFactory<any, any>['defineAbilityFor'] }).defineAbilityFor(
    can,
    buildPermissions(permissions),
    metadata,
    request
  );
  return build({
    detectSubjectType: (item) => item.constructor as ExtractSubjectType<any>,
  }) as TAbility;
}

/**
 * Builds a NestJS ExecutionContext for guard unit specs. Unlike the ad-hoc makeContext()
 * helpers scattered across existing guard specs — which only stub switchToHttp() — this also
 * wires getHandler()/getClass(), which AbilityGuard's Reflector reads to resolve
 * `tjModuleId`/`tjFeatureId` metadata. Without those, AbilityGuard itself was never unit-testable.
 */
export function makeExecutionContext(opts: {
  request?: Record<string, unknown>;
  handler?: (...args: unknown[]) => unknown;
  class?: Type<unknown>;
}): ExecutionContext {
  const request = opts.request ?? {};
  const handler = opts.handler ?? (() => undefined);
  const targetClass = opts.class ?? class {};
  return {
    switchToHttp: () => ({ getRequest: () => request, getResponse: () => ({}), getNext: () => undefined }),
    getHandler: () => handler,
    getClass: () => targetClass,
  } as unknown as ExecutionContext;
}

/**
 * Replaces the `for (const feature of LIST) expect(ability.can(feature, Subject)).toBe(x)`
 * loop duplicated ~20 times across ability specs. Reports which feature failed instead of a
 * bare `false !== true`.
 */
export function expectFeatures(
  ability: Ability<[any, any]>,
  subject: unknown,
  expectations: { allowed?: string[]; denied?: string[] }
): void {
  for (const feature of expectations.allowed ?? []) {
    if (!ability.can(feature, subject as any)) {
      throw new Error(`Expected feature "${feature}" to be ALLOWED on ${String(subject)}, but it was denied.`);
    }
  }
  for (const feature of expectations.denied ?? []) {
    if (ability.can(feature, subject as any)) {
      throw new Error(`Expected feature "${feature}" to be DENIED on ${String(subject)}, but it was allowed.`);
    }
  }
}
