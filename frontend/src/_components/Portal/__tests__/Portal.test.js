import { formatHeaderTitle } from '../Portal';

describe('formatHeaderTitle', () => {
  test('returns "Editor" for undefined, null, or non-string values', () => {
    expect(formatHeaderTitle(undefined)).toBe('Editor');
    expect(formatHeaderTitle(null)).toBe('Editor');
    expect(formatHeaderTitle('')).toBe('Editor');
    expect(formatHeaderTitle('   ')).toBe('Editor');
    expect(formatHeaderTitle(123)).toBe('Editor');
  });

  test('formats component field names with component/ prefix and :: separator', () => {
    expect(formatHeaderTitle('component/button1::text')).toBe('button1 - text');
    expect(formatHeaderTitle('component/table1::data')).toBe('table1 - data');
    expect(formatHeaderTitle('component/chart1::bar')).toBe('chart1 - bar');
  });

  test('formats component field names with /default prefix', () => {
    expect(formatHeaderTitle('component/table1/default::columns')).toBe('table1 - columns');
  });

  test('formats custom component slash paths', () => {
    expect(formatHeaderTitle('component/customcomponent1/data')).toBe('customcomponent1 - data');
    expect(formatHeaderTitle('component/customcomponent1/code')).toBe('customcomponent1 - code');
  });

  test('formats query editor field names', () => {
    expect(formatHeaderTitle('restapi1::url')).toBe('restapi1 - url');
    expect(formatHeaderTitle('restapi1/headers::key::0')).toBe('restapi1 - headers - key');
  });

  test('preserves clean query/action names', () => {
    expect(formatHeaderTitle('Runjs')).toBe('Runjs');
    expect(formatHeaderTitle('Runpy')).toBe('Runpy');
    expect(formatHeaderTitle('transformation')).toBe('transformation');
    expect(formatHeaderTitle('graphql')).toBe('graphql');
    expect(formatHeaderTitle('RunJS Params')).toBe('RunJS Params');
  });
});
