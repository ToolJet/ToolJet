import {
  parsePostgresConnectionString,
  detectPostgresConnectionStringChange,
  validatePostgresConnectionString,
} from '../postgresHelpers';

export const postgresqlAutoFillStrategy = {
  kind: 'postgresql',

  connectionStringKey: 'connection_string',
  connectionTypeKey: 'connection_type',
  activeConnectionTypeValue: 'string',

  autoFillableFields: ['host', 'port', 'username', 'password', 'database', 'ssl_enabled'],

  parse(connectionString) {
    return parsePostgresConnectionString(connectionString);
  },

  detectChanges(oldString, newString) {
    return detectPostgresConnectionStringChange(oldString, newString);
  },

  validate(connectionString) {
    return validatePostgresConnectionString(connectionString);
  },

  filterValidationErrors(errors, options) {
    const connectionType = options?.[this.connectionTypeKey]?.value;

    return errors.filter((err) => {
      if (connectionType === 'string' && err.keyword === 'if') return false;

      const errPath = err.instancePath || err.dataPath || '';
      if (
        connectionType === 'string' &&
        (errPath === '/connection_string' || errPath === '.connection_string') &&
        err.keyword === 'required' &&
        err.schemaPath.includes('allOf')
      ) {
        return false;
      }

      if (connectionType === 'manual' && errPath.includes('connection_string')) {
        return false;
      }

      return true;
    });
  },

  getManualEditResetBehavior(fieldKey, value) {
    if (fieldKey !== 'connection_string') {
      return { clearAll: false, preserve: [], remove: [] };
    }

    if (!value || value.trim() === '') {
      return { clearAll: true, preserve: [], remove: [] };
    }

    return { clearAll: true, preserve: [], remove: [] };
  },

  shouldTrackManualEdit() {
    return false;
  },
};
