import { acceptedTypes, toPropertyType } from '@/AppBuilder/Widgets/LibraryComponent/packPropertyTypes';

// QA board "Pack Components Full QA": pack properties the host converted to their declared type, blanking a shape the
// component reads (an object, a list, one value as text). Each now takes that shape as bound.
const reaches = (pack, component, name, type, value) =>
  toPropertyType(value, acceptedTypes(pack, component, { name, type })).value;

describe('pack properties that take more than their declared type', () => {
  test('[PackComponent-TYPES-001] Ant Descriptions items take an object of label: value (PF-004)', () => {
    expect(reaches('antd', 'Descriptions', 'items', 'array', { Name: 'Ada', Age: 36 })).toEqual({
      Name: 'Ada',
      Age: 36,
    });
    expect(reaches('antd', 'Descriptions', 'items', 'array', [['Name', 'Ada']])).toEqual([['Name', 'Ada']]);
  });

  test('[PackComponent-TYPES-002] Ant Hero meta takes facts and title a { label, value } (PF-010)', () => {
    const facts = [
      { label: 'A', value: '1' },
      { label: 'B', value: '2' },
    ];
    expect(reaches('antd', 'Hero', 'meta', 'string', facts)).toEqual(facts);
    expect(reaches('antd', 'Hero', 'title', 'string', { label: 'L', value: 'V' })).toEqual({ label: 'L', value: 'V' });
    // Another text property of the Hero is still text.
    expect(reaches('antd', 'Hero', 'subTitle', 'string', { label: 'L' })).toBe('');
  });

  test('[PackComponent-TYPES-003] Rocket Multi Select default values take one value as text (PF-140)', () => {
    expect(reaches('shadcn', 'MultiSelect', 'defaultValue', 'array', 'banana')).toBe('banana');
    expect(reaches('shadcn', 'MultiSelect', 'defaultValue', 'array', ['banana'])).toEqual(['banana']);
  });

  test.each(['routeStart', 'defaultPickedLocation', 'defaultCenter'])(
    '[PackComponent-TYPES-004] Rocket Map %s takes { lat, lng } (PF-169)',
    (name) => {
      expect(reaches('shadcn', 'Map', name, 'string', { lat: 37.78, lng: -122.41 })).toEqual({
        lat: 37.78,
        lng: -122.41,
      });
      expect(reaches('shadcn', 'Map', name, 'string', '37.78,-122.41')).toBe('37.78,-122.41');
    }
  );
});
