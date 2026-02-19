export const mysqlAutoFillStrategy = {
  kind: 'mysql',
  connectionStringKey: 'connection_string',
  connectionTypeKey: 'connection_type',
  activeConnectionTypeValue: 'string',
  autoFillableFields: ['host', 'port', 'database', 'username', 'password'],

  parse(connectionString) {
    const params = {};

    // Try URI format: mysql://user:pass@host:port/database
    const uriMatch = connectionString.match(/^mysql:\/\/([^:]+):(.+)@([^:@]+):(\d+)(?:\/(.*))?$/);
    if (uriMatch) {
      params.username = decodeURIComponent(uriMatch[1]);
      params.password = decodeURIComponent(uriMatch[2]);
      params.host = uriMatch[3];
      params.port = parseInt(uriMatch[4]);
      if (uriMatch[5]) {
        params.database = uriMatch[5];
      }
      return params;
    }

    // Try key=value format: Server=host;Port=port;Database=db;Uid=user;Pwd=pass
    const pairs = connectionString.split(';').filter(p => p.trim());
    
    pairs.forEach(pair => {
      if (!pair.includes('=')) return;
      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('=');
      const lowerKey = key.trim().toLowerCase();
      
      if (lowerKey === 'server' || lowerKey === 'host') {
        params.host = value.trim();
      } else if (lowerKey === 'port') {
        params.port = parseInt(value.trim());
      } else if (lowerKey === 'database' || lowerKey === 'db') {
        params.database = value.trim();
      } else if (lowerKey === 'uid' || lowerKey === 'user' || lowerKey === 'username') {
        params.username = value.trim();
      } else if (lowerKey === 'pwd' || lowerKey === 'password') {
        params.password = value.trim();
      }
    });
    
    return params;
  },

  validate(connectionString, options) {
    if (!connectionString || !connectionString.trim()) {
      return { valid: false, error: 'Connection string is required' };
    }
    const trimmed = connectionString.trim();
    const hasUri = trimmed.startsWith('mysql://');
    const hasKeyValue = /server=|host=/i.test(trimmed);
    
    if (!hasUri && !hasKeyValue) {
      return { valid: false, error: 'Connection string must be in mysql:// URI format or include Server=/Host=' };
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