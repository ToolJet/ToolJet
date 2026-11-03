/**
 * Pure unit tests for the option-editor transforms behind the Select inspector
 * (DropdownV2 / MultiselectV2 options): duplicate, leading-icon visibility, leading image.
 * Plain options in, options out — no store, no mocks.
 */
import { duplicateOption, setIconVisibility, setImage } from '../Components/selectOptionTransforms';

const option = (value, extra = {}) => ({
  label: `Label ${value}`,
  value,
  visible: { value: '{{true}}' },
  disable: { value: '{{false}}' },
  default: { value: '{{false}}' },
  ...extra,
});

describe('duplicateOption', () => {
  test('inserts the copy right after the source with a unique `_copy` value, then `_copy_2`', () => {
    // Break this catches: a duplicate value — two Draggables share a key and select together.
    const once = duplicateOption([option('a'), option('b')], 0);
    expect(once.map((o) => o.value)).toEqual(['a', 'a_copy', 'b']);
    expect(once[1].label).toBe('Label a copy');

    const twice = duplicateOption(once, 0);
    expect(twice.map((o) => o.value)).toEqual(['a', 'a_copy_2', 'a_copy', 'b']);
  });

  test('a copy of the default option is not itself default, but keeps every other field', () => {
    // Break this catches: carrying `default` over, which would mark two options as default.
    const source = option('a', {
      default: { value: '{{true}}', fxActive: true },
      icon: { value: 'IconUser' },
      iconVisibility: true,
      image: 'https://example.com/a.png',
      imageVisibility: true,
      caption: 'cap',
    });
    const [, copy] = duplicateOption([source], 0);

    expect(copy.default).toEqual({ value: '{{false}}', fxActive: true });
    expect(source.default.value).toBe('{{true}}');
    expect(copy).toMatchObject({
      icon: { value: 'IconUser' },
      iconVisibility: true,
      image: 'https://example.com/a.png',
      imageVisibility: true,
      caption: 'cap',
    });
  });

  test('an out-of-range index leaves the options unchanged', () => {
    const options = [option('a')];
    expect(duplicateOption(options, 3)).toBe(options);
  });
});

describe('setIconVisibility', () => {
  test('turning the eye on for an option without an icon stamps the IconHome2 default', () => {
    // Break this catches: dropping the stamp — the picker shows IconHome2 but the widget gets '' and renders nothing.
    expect(setIconVisibility(option('a'), true)).toMatchObject({ iconVisibility: true, icon: { value: 'IconHome2' } });
    expect(setIconVisibility(option('a', { icon: { value: '' } }), true).icon).toEqual({ value: 'IconHome2' });
  });

  test('an existing icon is kept, and turning the eye off never stamps one', () => {
    expect(setIconVisibility(option('a', { icon: { value: 'IconUser' } }), true).icon).toEqual({ value: 'IconUser' });
    const hidden = setIconVisibility(option('a'), false);
    expect(hidden.iconVisibility).toBe(false);
    expect(hidden.icon).toBeUndefined();
  });
});

describe('setImage', () => {
  test('an image typed into the inspector turns its own visibility gate on; clearing it turns the gate off', () => {
    // Break this catches: an inspector image that stays hidden because imageVisibility was never set.
    expect(setImage(option('a'), 'https://example.com/a.png')).toMatchObject({
      image: 'https://example.com/a.png',
      imageVisibility: true,
    });
    const cleared = setImage(option('a', { image: 'x', imageVisibility: true }), '');
    expect(cleared.image).toBeUndefined();
    expect(cleared.imageVisibility).toBe(false);
  });
});
