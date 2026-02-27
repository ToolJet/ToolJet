export const mysqlAutoFillStrategy = {
  kind: 'mysql',
  connectionStringKey: 'connection_string',
  connectionTypeKey: 'connection_type',
  activeConnectionTypeValue: 'string',
  autoFillableFields: ['host', 'port', 'database', 'username', 'password', 'protocol', 'ssl_enabled', 'socket_path'],

  parse(connectionString) {
    const params = {};
    if (!connectionString) return params;

    const trimmed = connectionString.trim();

    try {
      const url = new URL(trimmed);
      if (url.protocol && url.protocol.startsWith('mysql')) {
        if (url.username) params.username = decodeURIComponent(url.username);
        if (url.password) params.password = decodeURIComponent(url.password);

        if (url.hostname) params.host = decodeURIComponent(url.hostname);

        if (url.port) {
          const p = parseInt(url.port, 10);
          if (!isNaN(p)) params.port = p;
        }

        if (url.pathname && url.pathname !== '/') {
          params.database = decodeURIComponent(url.pathname.slice(1));
        }

        const queryParams = {};
        url.searchParams.forEach((v, k) => {
          queryParams[k] = v;
        });

        if (Object.keys(queryParams).length) {
          params.params = queryParams;
        }

        const socket =
          url.searchParams.get('socket') ||
          url.searchParams.get('socketPath');

        if (socket) params.socket_path = socket;
        params.protocol = socket ? 'socket' : 'hostname';                          

        const sslParam = url.searchParams.get('ssl')                                
          || url.searchParams.get('sslmode')                                        
          || url.searchParams.get('ssl_mode') 
          || url.searchParams.get('ssl-mode');                                     
        if (sslParam !== null) {                                                    
          params.ssl_enabled = ['true', '1', 'disabled', 'preferred', 'require',
            'required', 'verify-ca', 'verify_ca', 'verify-full',
            'verify_identity', 'verify-identity'].includes(sslParam.toLowerCase());           
        } 
        if (!params.ssl_enabled) {
            const hasSslFields =
              url.searchParams.get('ssl-ca') || url.searchParams.get('ssl_ca') ||
              url.searchParams.get('ssl-cert') || url.searchParams.get('ssl_cert') ||
              url.searchParams.get('ssl-key') || url.searchParams.get('ssl_key') ||
              url.searchParams.get('tls-version') || url.searchParams.get('tls_version');
            if (hasSslFields) params.ssl_enabled = true;
          }

        return params;
      }
    } catch (e) {}

    const regex =
      /^mysql:\/\/(?:([^:@\/?#]+)(?::([^@\/?#]*))?@)?(\[[^\]]+\]|[^:\/?#]+)?(?::(\d+))?(?:\/([^?]*))?(?:\?(.*))?$/;

    const m = trimmed.match(regex);

    if (m) {
      const user = m[1];
      const pass = m[2];
      const hostRaw = m[3];
      const portRaw = m[4];
      const db = m[5];
      const query = m[6];

      if (user) params.username = decodeURIComponent(user);
      if (pass !== undefined) params.password = decodeURIComponent(pass);

      if (hostRaw) {
        let host = hostRaw;
        if (host.startsWith('[') && host.endsWith(']')) {
          host = host.slice(1, -1);
        }
        params.host = decodeURIComponent(host);
      }

      if (portRaw) {
        const p = parseInt(portRaw, 10);
        if (!isNaN(p)) params.port = p;
      }

      if (db) {
        params.database = decodeURIComponent(db);
      }

      if (query) {
        const q = {};
        query.split('&').forEach(part => {
          if (!part) return;
          const idx = part.indexOf('=');
          if (idx === -1) {
            q[decodeURIComponent(part)] = '';
          } else {
            const k = part.slice(0, idx);
            const v = part.slice(idx + 1);
            q[decodeURIComponent(k)] = decodeURIComponent(v);
          }
        });

        if (Object.keys(q).length) params.params = q;
        if (q.socket || q.socketPath) {
          params.socket_path = q.socket || q.socketPath;
        }

        const sslMode = q.ssl || q.sslmode || q.ssl_mode || q['ssl-mode'];                     
        if (sslMode !== undefined) {                                            
          params.ssl_enabled = ['true', '1', 'disabled', 'preferred', 'require',
            'required', 'verify-ca', 'verify_ca', 'verify-full',
            'verify_identity', 'verify-identity'].includes(sslMode.toLowerCase());        
        }
        if (!params.ssl_enabled) {
            if (q['ssl-ca'] || q['ssl_ca'] || q['ssl-cert'] || q['ssl_cert'] ||
                q['ssl-key'] || q['ssl_key'] || q['tls-version'] || q['tls_version']) {
              params.ssl_enabled = true;
            }
          } 
      }
       params.protocol = params.socket_path ? 'socket' : 'hostname';  


      return params;
    }

    const pairs = trimmed.split(';').filter(p => p.trim());

    pairs.forEach(pair => {
      if (!pair.includes('=')) return;

      const [key, ...valueParts] = pair.split('=');
      const value = valueParts.join('=').trim();
      const lowerKey = key.trim().toLowerCase();

      if (lowerKey === 'server' || lowerKey === 'host') {
        params.host = value;
      } else if (lowerKey === 'port') {
        const p = parseInt(value, 10);
        if (!isNaN(p)) params.port = p;
      } else if (lowerKey === 'database' || lowerKey === 'db') {
        params.database = value;
      } else if (
        lowerKey === 'uid' ||
        lowerKey === 'user' ||
        lowerKey === 'username'
      ) {
        params.username = value;
      } else if (lowerKey === 'pwd' || lowerKey === 'password') {
        params.password = value;
      } else if (lowerKey === 'socket' || lowerKey === 'socketpath') {
        params.socket_path = value;
      }else if (lowerKey === 'ssl' || lowerKey === 'sslmode'          
        || lowerKey === 'ssl_mode' || lowerKey === 'ssl-mode' || lowerKey === 'usessl') {         
        const v = value.toLowerCase();                                 
              params.ssl_enabled = ['true', '1', 'disabled', 'preferred', 'require',
        'required', 'verify-ca', 'verify_ca', 'verify-full',
        'verify_identity', 'verify-identity'].includes(v);                     
      }else if (['ssl-ca','ssl_ca','sslca','ssl-cert','ssl_cert','sslcert',
                      'ssl-key','ssl_key','sslkey','tls-version','tls_version','tlsversion'].includes(lowerKey)) {
            params.ssl_enabled = true;
          } else {
        if (!params.params) params.params = {};
        params.params[key.trim()] = value;
      }
    });
    params.protocol = params.socket_path ? 'socket' : 'hostname';

    return params;
  },

  validate(connectionString) {
    if (!connectionString || !connectionString.trim()) {
      return { valid: false, error: 'Connection string is required' };
    }

    const trimmed = connectionString.trim();
    const hasUri = trimmed.startsWith('mysql://');
    const hasKeyValue = /server=|host=/i.test(trimmed);

    if (!hasUri && !hasKeyValue) {
      return {
        valid: false,
        error:
          'Connection string must be in mysql:// URI format or include Server=/Host=',
      };
    }

    return { valid: true, error: '' };
  },

  filterValidationErrors(errors, options) {
    const connectionType = options?.[this.connectionTypeKey]?.value;

    return errors.filter(err => {
      if (connectionType === 'string' && err.keyword === 'if') return false;
      if (
        connectionType === 'string' &&
        err.dataPath === '.connection_string' &&
        err.keyword === 'required' &&
        err.schemaPath.includes('allOf')
      )
        return false;
      if (
        connectionType === 'manual' &&
        err.dataPath.includes('connection_string')
      )
        return false;
      return true;
    });
  },

  detectChanges() {
    return null;
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