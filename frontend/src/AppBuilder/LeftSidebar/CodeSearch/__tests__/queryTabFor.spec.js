import { queryTabFor } from '../buildSearchRecords';

const queryField = (...fieldPath) => ({ entityType: 'query', fieldPath });

describe('queryTabFor', () => {
  test('transformation fields open the Transformation tab', () => {
    expect(queryTabFor(queryField('options', 'transformations', 'javascript'))).toBe('transformation');
    expect(queryTabFor(queryField('options', 'transformation'))).toBe('transformation');
    expect(queryTabFor(queryField('options', 'enableTransformation'))).toBe('transformation');
  });

  test('run and notification options open the Settings tab', () => {
    expect(queryTabFor(queryField('options', 'runOnPageLoad'))).toBe('settings');
    expect(queryTabFor(queryField('options', 'successMessage'))).toBe('settings');
    expect(queryTabFor(queryField('options', 'query_timeout'))).toBe('settings');
  });

  test("a query's event handlers live in the Settings tab", () => {
    expect(queryTabFor({ entityType: 'event', ownerType: 'query', fieldPath: ['event', 'message'] })).toBe('settings');
  });

  test('the query name and data source options open Setup', () => {
    expect(queryTabFor(queryField('name'))).toBe('setup');
    expect(queryTabFor(queryField('options', 'url'))).toBe('setup');
    expect(queryTabFor(queryField('options', 'parameters', 0, 'defaultValue'))).toBe('setup');
  });
});
