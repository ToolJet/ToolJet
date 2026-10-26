import { Component } from '@entities/component.entity';
import { Layout } from '@entities/layout.entity';
import { ComponentPermission } from '@entities/component_permissions.entity';
import { ComponentUser } from '@entities/component_users.entity';
import { QueryPermission } from '@entities/query_permissions.entity';
import { QueryUser } from '@entities/query_users.entity';
import { PAGE_PERMISSION_TYPE } from '@modules/app-permissions/constants';
import { saveEntity } from './utils';

/** Who a page, component or query is restricted to: exactly one of groups or users. */
export type AccessRule = { groupIds: string[] } | { userIds: string[] };

const ruleType = (rule: AccessRule) => ('groupIds' in rule ? PAGE_PERMISSION_TYPE.GROUP : PAGE_PERMISSION_TYPE.SINGLE);

const ruleRows = (rule: AccessRule) =>
  'groupIds' in rule
    ? rule.groupIds.map((permissionGroupsId) => ({ permissionGroupsId, userId: null }))
    : rule.userIds.map((userId) => ({ userId, permissionGroupsId: null }));

/** Places a bare Text component on a page, with the desktop layout the page loaders require. */
export async function createComponent(pageId: string, name: string): Promise<Component> {
  const component = await saveEntity<Component>(Component, {
    name,
    type: 'Text',
    pageId,
    properties: {},
    styles: {},
    validation: {},
  });
  await saveEntity<Layout>(Layout, {
    componentId: component.id,
    type: 'desktop',
    top: 0,
    left: 0,
    width: 10,
    height: 40,
    dimensionUnit: 'count',
  });
  return component;
}

/** Restricts a component to the given groups or users (component-level app permission). */
export async function restrictComponent(componentId: string, rule: AccessRule): Promise<void> {
  const permission = await saveEntity<ComponentPermission>(ComponentPermission, { componentId, type: ruleType(rule) });
  for (const row of ruleRows(rule)) {
    await saveEntity<ComponentUser>(ComponentUser, { componentPermissionsId: permission.id, ...row });
  }
}

/** Restricts a data query to the given groups or users (query-level app permission). */
export async function restrictQuery(queryId: string, rule: AccessRule): Promise<void> {
  const permission = await saveEntity<QueryPermission>(QueryPermission, { queryId, type: ruleType(rule) });
  for (const row of ruleRows(rule)) {
    await saveEntity<QueryUser>(QueryUser, { queryPermissionsId: permission.id, ...row });
  }
}
