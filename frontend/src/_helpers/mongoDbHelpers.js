export const validateMongoDBConnectionString = (connectionString, selectedFormat) => {
  if (!connectionString || connectionString.trim() === '') {
    return { valid: false, error: 'Connection string is required' };
  }

  const trimmedString = connectionString.trim();

  const hasValidProtocol = 
    trimmedString.startsWith('mongodb://') || 
    trimmedString.startsWith('mongodb+srv://');

  if (!hasValidProtocol) {
    return { 
      valid: false, 
      error: "Invalid protocol. Connection string must start with 'mongodb://' or 'mongodb+srv://'"
    };
  }

  const protocol = trimmedString.match(/^([a-z+]+):\/\//)?.[1];
  const isStandard = protocol === "mongodb";
  const isSrv = protocol === "mongodb+srv";

  if (selectedFormat) {
    const normalizedFormat = selectedFormat === 'mongodb+srv' ? 'mongodb+srv' : 'mongodb';
    
    if (normalizedFormat === 'mongodb' && isSrv) {
      return {
        valid: false,
        error: "Connection format mismatch. Selected format is 'Standard (mongodb://)' but connection string uses 'mongodb+srv://'"
      };
    }
    if (normalizedFormat === 'mongodb+srv' && isStandard) {
      return {
        valid: false,
        error: "Connection format mismatch. Selected format is 'SRV (mongodb+srv://)' but connection string uses 'mongodb://'"
      };
    }
  }

  const mongodbStandardRegex = /^mongodb:\/\/(?:([^:@]+)(?::([^@]+))?@)?([^/?]+)(?:\/([^?]*))?(\?.*)?$/;
  const mongodbSrvRegex = /^mongodb\+srv:\/\/(?:([^:@]+)(?::([^@]+))?@)?([^:/?]+)(?:\/([^?]*))?(\?.*)?$/;

  const regex = isStandard ? mongodbStandardRegex : mongodbSrvRegex;
  const match = trimmedString.match(regex);
  
  if (!match) {
    return { 
      valid: false, 
      error: 'Malformed MongoDB connection string' 
    };
  }

  const [, username, password, hosts] = match;

  if (!hosts || hosts.trim() === '') {
    return { 
      valid: false, 
      error: 'Missing host information in connection string'
    };
  }

  if (isSrv && hosts.includes(':')) {
    return { 
      valid: false, 
      error: "Invalid SRV connection string. 'mongodb+srv://' must not contain port numbers" 
    };
  }

  if (isStandard) {
    const hostList = hosts.split(',');
    
    for (const hostEntry of hostList) {
      const hostEntry_trimmed = hostEntry.trim();
      
      if (hostEntry_trimmed.includes(':')) {
        const [host, portStr] = hostEntry_trimmed.split(':');
        
        if (!host || !portStr || host.trim() === '' || portStr.trim() === '') {
          return { 
            valid: false, 
            error: 'Invalid host or port format. Expected format: host:port' 
          };
        }

        const port = parseInt(portStr);
        
        if (isNaN(port) || port < 1 || port > 65535) {
          return { 
            valid: false, 
            error: 'Invalid port number. Port must be between 1 and 65535' 
          };
        }
      }
    }
  }
  return { valid: true, error: '' };
};

export const parseMongoDBConnectionString = (connectionString) => {
  if (!connectionString || connectionString.trim() === '') {
    return null;
  }

  const trimmed = connectionString.trim();

  const isStandardFormat = trimmed.startsWith('mongodb://');
  const isSrvFormat = trimmed.startsWith('mongodb+srv://');

  if (!isStandardFormat && !isSrvFormat) {
    return null;
  }

  const standardConnectionRegex =
    /^mongodb:\/\/(?:([^:@]+)(?::([^@]+))?@)?([^/?]+)(?:\/([^?]*))?(\?.*)?$/;

  const srvConnectionRegex =
    /^mongodb\+srv:\/\/(?:([^:@]+)(?::([^@]+))?@)?([^:/?]+)(?:\/([^?]*))?(\?.*)?$/;

  const activeRegex = isStandardFormat
    ? standardConnectionRegex
    : srvConnectionRegex;

  const parsedParts = trimmed.match(activeRegex);

  if (!parsedParts) {
    return null;
  }

  const [, username, password, hostsSection, databaseName, querySection] =
    parsedParts;

  let primaryHost = '';
  let primaryPort = '';

  if (isSrvFormat) {
    primaryHost = hostsSection || '';
    primaryPort = '';
  } else if (isStandardFormat) {
    const firstHostEntry = hostsSection.split(',')[0].trim();

    if (firstHostEntry.includes(':')) {
      const [hostName, hostPort] = firstHostEntry.split(':');
      primaryHost = hostName || '';
      primaryPort = hostPort || '';
    } else {
      primaryHost = firstHostEntry || '';
      primaryPort = '';
    }
  }

  let useSsl = false;

  if (querySection) {
    const params = new URLSearchParams(querySection.substring(1));

    const sslParam = params.get('ssl');
    const tlsParam = params.get('tls');

    if (sslParam !== null) {
      useSsl = sslParam.toLowerCase() === 'true';
    } else if (tlsParam !== null) {
      useSsl = tlsParam.toLowerCase() === 'true';
    }
  }

  return {
    host: primaryHost,
    port: primaryPort,
    username: username || '',
    password: password || '',
    database: databaseName || '',
    connection_format: isSrvFormat ? 'mongodb+srv' : 'mongodb',
    use_ssl: useSsl,
    query_params: querySection || ''
  };
};

export const detectConnectionStringChange = (oldString, newString) => {
  if (!oldString || !newString) return null;
  
  const oldParsed = parseMongoDBConnectionString(oldString);
  const newParsed = parseMongoDBConnectionString(newString);
  
  if (!oldParsed || !newParsed) return null;
  
  const changes = {
    protocol: oldParsed.connection_format !== newParsed.connection_format,
    host: oldParsed.host !== newParsed.host,
    port: oldParsed.port !== newParsed.port,
    username: oldParsed.username !== newParsed.username,
    password: oldParsed.password !== newParsed.password,
    database: oldParsed.database !== newParsed.database,
    ssl: oldParsed.use_ssl !== newParsed.use_ssl,
    query: oldParsed.query_params !== newParsed.query_params
  };
  
  return { changes, newParsed };
};