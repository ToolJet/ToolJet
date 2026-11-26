import { sanitizeTraceObject } from '@otel/sanitize';

// Data source credentials arrive as a list of { key, value, encrypted } items.
const dataSourceBody = {
  name: 'orders-db',
  kind: 'postgresql',
  options: [
    { key: 'host', value: 'db.example.com', encrypted: false },
    { key: 'password', value: 'synthetic-db-password', encrypted: true },
    { key: 'connection_string', value: 'postgres://user:synthetic-embedded-secret@db/orders', encrypted: true },
  ],
};

describe('sanitizeTraceObject with data source options', () => {
  it('hides the value of an item marked encrypted', () => {
    const result = sanitizeTraceObject(dataSourceBody);
    expect(JSON.stringify(result)).not.toContain('synthetic-db-password');
    expect(JSON.stringify(result)).not.toContain('synthetic-embedded-secret');
  });

  it('hides the value when the item key names a credential, even if not flagged encrypted', () => {
    const result = sanitizeTraceObject({
      options: [{ key: 'client_secret', value: 'synthetic-client-secret', encrypted: false }],
    });
    expect(JSON.stringify(result)).not.toContain('synthetic-client-secret');
  });

  it('keeps non-secret fields so the span stays useful', () => {
    const result = sanitizeTraceObject(dataSourceBody);
    expect(result).toMatchObject({
      name: 'orders-db',
      kind: 'postgresql',
      options: expect.arrayContaining([{ key: 'host', value: 'db.example.com', encrypted: false }]),
    });
  });

  it('does not change the input object', () => {
    const copy = JSON.parse(JSON.stringify(dataSourceBody));
    sanitizeTraceObject(dataSourceBody);
    expect(dataSourceBody).toEqual(copy);
  });
});
