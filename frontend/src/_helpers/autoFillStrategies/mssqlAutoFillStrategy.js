export const mssqlAutoFillStrategy = {
  kind: 'mssql',
  connectionStringKey: 'connection_string',
  connectionTypeKey: 'connection_type',
  activeConnectionTypeValue: 'string',
  autoFillableFields: ['host', 'port', 'database', 'username', 'password'],

  parse(connectionString) {
    const params = {};
    const pairs = connectionString.split(';').filter(p => p.trim());
    
    pairs.forEach(pair => {
      if (!pair.includes('=')) return;
      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('=');
      const lowerKey = key.trim().toLowerCase();
      
      if (lowerKey === 'server' || lowerKey === 'data source') {
        const [host, port] = value.trim().split(',');
        params.host = host;
        if (port) params.port = parseInt(port);
      } else if (lowerKey === 'database' || lowerKey === 'initial catalog') {
        params.database = value.trim();
      } else if (lowerKey === 'user id' || lowerKey === 'uid' || lowerKey === 'user') {
        params.username = value.trim();
      } else if (lowerKey === 'password' || lowerKey === 'pwd') {
        params.password = value.trim();
      }
    });
    
    return params;
  },

  validate(connectionString, options) {
    if (!connectionString || !connectionString.trim()) {
      return { valid: false, error: 'Connection string is required' };
    }
    if (!connectionString.toLowerCase().includes('server=')) {
      return { valid: false, error: 'Connection string must include Server' };
    }
    return { valid: true, error: '' };
  },

  filterValidationErrors(errors, options) {
    const connectionType = options?.[this.connectionTypeKey]?.value;

    return errors.filter((err) => {
      if (connectionType === 'string' && err.keyword === 'if') {
        return false;
      }
      if (
        connectionType === 'string' &&
        err.dataPath === '.connection_string' &&
        err.keyword === 'required' &&
        err.schemaPath.includes('allOf')
      ) {
        return false;
      }
      if (connectionType === 'manual' && err.dataPath.includes('connection_string')) {
        return false;
      }
      return true;
    });
  },

  detectChanges(oldString, newString) {
    return null;
  },

  getManualEditResetBehavior(fieldKey, value, currentConnString) {
    if (fieldKey !== 'connection_string') {
      return { clearAll: false, preserve: [], remove: [] };
    }

    if (!value || value.trim() === '') {
      return { clearAll: true, preserve: [], remove: [] };
    }

    return { clearAll: true, preserve: [], remove: [] };
  },

  shouldTrackManualEdit(fieldKey) {
    return false;
  },
};