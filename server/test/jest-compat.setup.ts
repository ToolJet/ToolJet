import { EntityManager, Repository } from 'typeorm';

const FIND_OPTION_KEYS = new Set([
  'where',
  'select',
  'relations',
  'order',
  'skip',
  'take',
  'cache',
  'withDeleted',
  'loadEagerRelations',
  'loadRelationIds',
  'comment',
  'transaction',
  'lock',
  'relationLoadStrategy',
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeCriteria(criteria: unknown) {
  if (criteria === undefined || criteria === null) {
    return criteria;
  }

  if (typeof criteria === 'string' || typeof criteria === 'number') {
    return { where: { id: criteria } };
  }

  if (isPlainObject(criteria) && !Object.keys(criteria).some((key) => FIND_OPTION_KEYS.has(key))) {
    return { where: criteria };
  }

  return criteria;
}

function patchMethod<T extends object, K extends keyof T>(target: T, methodName: K, entityArgIndex = 1) {
  const original = target[methodName];
  if (typeof original !== 'function') {
    return;
  }

  Object.defineProperty(target, methodName, {
    configurable: true,
    value: function patchedMethod(...args: any[]) {
      const criteriaIndex = Math.min(entityArgIndex, args.length - 1);
      if (criteriaIndex >= 0) {
        args[criteriaIndex] = normalizeCriteria(args[criteriaIndex]);
      }
      return (original as any).apply(this, args);
    },
  });
}

patchMethod(EntityManager.prototype as any, 'findOne', 1);
patchMethod(EntityManager.prototype as any, 'findOneOrFail', 1);
patchMethod(EntityManager.prototype as any, 'find', 1);
patchMethod(EntityManager.prototype as any, 'count', 1);
patchMethod(Repository.prototype as any, 'findOne', 0);
patchMethod(Repository.prototype as any, 'findOneOrFail', 0);
patchMethod(Repository.prototype as any, 'find', 0);
patchMethod(Repository.prototype as any, 'count', 0);
