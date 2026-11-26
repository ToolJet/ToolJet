export enum FEATURE_KEY {
  GET_STATUS = 'GET_STATUS',
  GET_WORKSPACE_SUMMARY = 'GET_WORKSPACE_SUMMARY',
  GET_WORKSPACE_ACTIVE_USERS = 'GET_WORKSPACE_ACTIVE_USERS',
  GET_WORKSPACE_APPS = 'GET_WORKSPACE_APPS',
  GET_APP_SUMMARY = 'GET_APP_SUMMARY',
  GET_APP_ACTIVE_USERS = 'GET_APP_ACTIVE_USERS',
  GET_APP_USERS = 'GET_APP_USERS',
}

/** Nest event emitted by AppsService when a logged-in user opens a released app. */
export const APP_OPENED_EVENT = 'app-usage.app-opened';

/** BullMQ queue that carries usage events from the request path to the analytics worker. */
export const APP_USAGE_QUEUE = 'app-usage-analytics';

export const TIME_GRAINS = ['day', 'week', 'month'] as const;
export type TimeGrain = (typeof TIME_GRAINS)[number];

/** Longest range a client may ask for; daily data is only kept for 13 months anyway. */
export const MAX_RANGE_DAYS = 400;

/** Whole months of daily rows kept (monthly partitions older than this are dropped). */
export const DAILY_RETENTION_MONTHS = 13;

/** Days of daily rows kept for a workspace whose plan lacks usage analytics, so an upgrade starts with some history. */
export const UNLICENSED_RETENTION_DAYS = 60;

export const APP_TAGS = ['public'] as const;
export type AppTag = (typeof APP_TAGS)[number];
