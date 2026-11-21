'use strict';

// node-appwrite's client pulls in a package that jest 27 cannot resolve (subpath exports),
// so stand in a Query builder that records what the plugin passes to it.
jest.mock('node-appwrite', () => ({
  Query: new Proxy(
    {},
    { get: (_, method) => (attribute, value) => JSON.stringify({ method, attribute, values: [value] }) }
  ),
}));

const { queryCollection } = require('../lib/operations');

const runFilter = async (whereValue, operation = '==') => {
  const db = { listDocuments: jest.fn().mockResolvedValue({ total: 0, documents: [] }) };
  await queryCollection(db, 'db-id', 'collection-id', '', undefined, undefined, 'field', operation, whereValue);
  const [, , queries] = db.listDocuments.mock.calls[0];
  const filter = queries.map((q) => JSON.parse(q)).find((q) => q.attribute === 'field');
  return filter.values[0];
};

describe('appwrite queryCollection where value', () => {
  it('converts integer strings to numbers', async () => {
    expect(await runFilter('42')).toBe(42);
  });

  it('keeps the fractional part of decimal values', async () => {
    expect(await runFilter('9.99', '>=')).toBe(9.99);
    expect(await runFilter(9.99, '>=')).toBe(9.99);
  });

  it('does not turn strings that start with digits into numbers', async () => {
    expect(await runFilter('2024-01-15')).toBe('2024-01-15');
    expect(await runFilter('12abc')).toBe('12abc');
    expect(await runFilter('00123')).toBe('00123');
  });

  it('still parses booleans and plain strings', async () => {
    expect(await runFilter('true')).toBe(true);
    expect(await runFilter('alice')).toBe('alice');
  });
});
