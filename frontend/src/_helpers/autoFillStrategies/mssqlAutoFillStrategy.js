export const mssqlAutoFillStrategy = {
  kind: 'mssql',
  connectionStringKey: 'connection_string',
  connectionTypeKey: 'connection_type',
  activeConnectionTypeValue: 'string',
  autoFillableFields: ['host', 'port', 'database', 'username', 'password','azure', 'instance_name'],

  parse(connectionString) {
    const params = {};
    if (!connectionString) return params;

    const trimmed = connectionString.trim();

    const withoutScheme = /^sqlserver:\/\//i.test(trimmed)
      ? trimmed.replace(/^sqlserver:\/\//i, '')
      : trimmed;

    const looksLikeHybrid = withoutScheme.includes(';') &&
      !/^[a-z ]+=/i.test(withoutScheme.split(';')[0]);

    if (looksLikeHybrid) {
      const firstSemi = withoutScheme.indexOf(';');
      const hostSegment = withoutScheme.slice(0, firstSemi);
      const rest = withoutScheme.slice(firstSemi + 1);

      const hostMatch = hostSegment.match(/^([^:\\,]+)(?::(\d+))?(?:\\([^,]*))?(?:,(\d+))?/);
      if (hostMatch) {
        if (hostMatch[1]) params.host = hostMatch[1].trim();
        if (hostMatch[2]) params.port = parseInt(hostMatch[2], 10);
        if (hostMatch[3]) params.instance_name = hostMatch[3].trim();
        if (hostMatch[4]) params.port = parseInt(hostMatch[4], 10);
      }

      rest.split(';').forEach(pair => {
        if (!pair.includes('=')) return;
        const [key, ...valueParts] = pair.split('=');
        const value = valueParts.join('=').trim();
        const lowerKey = key.trim().toLowerCase();

        if (lowerKey === 'database' || lowerKey === 'initial catalog') {
          params.database = value;
        } else if (lowerKey === 'user id' || lowerKey === 'uid' || lowerKey === 'user') {
          params.username = value;
        } else if (lowerKey === 'password' || lowerKey === 'pwd') {
          params.password = value;
        } else if (lowerKey === 'encrypt') {
          params.azure = ['true', '1', 'yes'].includes(value.toLowerCase());
        } else if (lowerKey === 'port') {
          params.port = parseInt(value, 10);
        } else if (lowerKey === 'instance' || lowerKey === 'instance name') {
          params.instance_name = value;
        }
      });

      return params;
    }

    return params;
  },

  validate(connectionString) {
    if (!connectionString || !connectionString.trim()) {
      return { valid: false, error: 'Connection string is required' };
    }

    const trimmed = connectionString.trim();
    const withoutScheme = /^sqlserver:\/\//i.test(trimmed)
      ? trimmed.replace(/^sqlserver:\/\//i, '')
      : trimmed;

    const looksLikeHybrid = withoutScheme.includes(';') &&
      !/^[a-z ]+=/i.test(withoutScheme.split(';')[0]);

    if (!looksLikeHybrid) {
      return {
        valid: false,
        error: 'Connection string must be in host;key=value format or sqlserver://host;key=value format',
      };
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