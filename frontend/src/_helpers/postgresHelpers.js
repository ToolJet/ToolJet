export const validatePostgresConnectionString = (connectionString) => {
  if (!connectionString || connectionString.trim() === '') {
    return { valid: false, error: 'Connection string is required' };
  }

  const trimmed = connectionString.trim();

  if (
    !trimmed.startsWith('postgres://') &&
    !trimmed.startsWith('postgresql://')
  ) {
    return {
      valid: false,
      error:
        "Invalid protocol. Connection string must start with 'postgres://' or 'postgresql://'",
    };
  }

  try {
    const url = new URL(trimmed);

    if (!url.hostname) {
      return { valid: false, error: 'Missing host in connection string' };
    }

    if (url.port) {
      const port = parseInt(url.port);
      if (isNaN(port) || port < 1 || port > 65535) {
        return {
          valid: false,
          error: 'Invalid port number. Must be between 1 and 65535',
        };
      }
    }

    return { valid: true, error: '' };
  } catch {
    return { valid: false, error: 'Malformed PostgreSQL connection string' };
  }
};

export const parsePostgresConnectionString = (connectionString) => {
  if (!connectionString || connectionString.trim() === '') {
    return null;
  }

  try {
    const url = new URL(connectionString.trim());

    const sslmode = url.searchParams.get('sslmode');
    const ssl = url.searchParams.get('ssl'); // for ORM-generated strings

    const isSslOn =
      sslmode === 'require' ||
      sslmode === 'verify-full' ||
      sslmode === 'verify-ca' ||
      sslmode === 'prefer' ||
      sslmode === 'allow' ||
      ssl === 'true' ||
      ssl === '1';

    const isSslOff =
      sslmode === 'disable' ||
      ssl === 'false' ||
      ssl === '0';

    return {
      host: url.hostname || '',
      port: url.port || '5432',
      username: decodeURIComponent(url.username || ''),
      password: decodeURIComponent(url.password || ''),
      database: url.pathname.replace(/^\//, '') || '',
      ssl_enabled: isSslOn ? 'enabled' : isSslOff ? 'disabled' : undefined,
      query_params: url.search || '',
      protocol: url.protocol.replace(':', ''),
    };
  } catch {
    return null;
  }
};

export const detectPostgresConnectionStringChange = (
  oldString,
  newString
) => {
  if (!oldString || !newString) return null;

  const oldParsed = parsePostgresConnectionString(oldString);
  const newParsed = parsePostgresConnectionString(newString);

  if (!oldParsed || !newParsed) return null;

  const changes = {
    protocol: oldParsed.protocol !== newParsed.protocol,
    host: oldParsed.host !== newParsed.host,
    port: oldParsed.port !== newParsed.port,
    username: oldParsed.username !== newParsed.username,
    password: oldParsed.password !== newParsed.password,
    database: oldParsed.database !== newParsed.database,
    ssl_enabled: oldParsed.ssl_enabled !== newParsed.ssl_enabled,
    query: oldParsed.query_params !== newParsed.query_params,
  };

  return { changes, newParsed };
};
