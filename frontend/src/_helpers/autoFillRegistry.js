import { mongoDbAutoFillStrategy } from './autoFillStrategies/mongodbAutoFillStategy';
import { mssqlAutoFillStrategy } from './autoFillStrategies/mssqlAutoFillStrategy';
import { mysqlAutoFillStrategy } from './autoFillStrategies/mysqlAutoFillStrategy';

const strategiesByKind = {
  mongodb: mongoDbAutoFillStrategy,
  mssql: mssqlAutoFillStrategy,
  mysql: mysqlAutoFillStrategy,
};

const strategiesByName = {
  MongoDB: mongoDbAutoFillStrategy,
  'SQL Server': mssqlAutoFillStrategy,
  'MySQL': mysqlAutoFillStrategy,
};

/**
 * Returns the autofill strategy for the given datasource schema,
 * or null if no autofill is needed for this datasource.
 *
 * Checks tj:source.kind first, then falls back to tj:source.name
 * to match the original MongoDB detection logic.
 *
 * @param {object} schema - The datasource schema containing tj:source
 * @returns {object|null} The autofill strategy or null
 */
export function getAutoFillStrategy(schema) {
  const kind = schema?.['tj:source']?.kind;
  const name = schema?.['tj:source']?.name;
  return strategiesByKind[kind] ?? strategiesByName[name] ?? null;
}
