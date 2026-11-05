import { dropMovedComponentKeys, MovedComponentKeys } from '../dropMovedComponentKeys';

const MOVED: MovedComponentKeys = {
  SvgImage: [
    { from: ['styles', 'visibility'], to: ['properties', 'visibility'] },
    { from: ['general', 'tooltip'], to: ['properties', 'tooltip'] },
  ],
};

const HIDDEN = { value: '{{false}}' };

/** A SvgImage as a release-N server sends it while both places exist. */
const svgWithBothPlaces = () => ({
  component: {
    component: 'SvgImage',
    name: 'logo',
    definition: {
      properties: { data: { value: '<svg/>' }, visibility: HIDDEN, tooltip: { value: 'Logo' } },
      styles: { visibility: HIDDEN, alignment: { value: 'left' } },
      general: { tooltip: { value: 'Logo' } },
    },
  },
  layouts: { desktop: { top: 0, left: 0, width: 4, height: 40 } },
});

const button = () => ({
  component: {
    component: 'Button',
    name: 'save',
    definition: { properties: { text: { value: 'Save' } }, styles: { visibility: HIDDEN } },
  },
});

describe('dropMovedComponentKeys', () => {
  it('should drop the old place of each moved key and keep the new place and every other key', () => {
    const pages = [{ id: 'home', components: { logo: svgWithBothPlaces(), save: button() } }];

    const [home] = dropMovedComponentKeys(pages, MOVED);

    expect(home.components.logo.component.definition).toEqual({
      properties: { data: { value: '<svg/>' }, visibility: HIDDEN, tooltip: { value: 'Logo' } },
      styles: { alignment: { value: 'left' } },
      general: {},
    });
    expect(home.components.logo.layouts).toBe(pages[0].components.logo.layouts);
    // Another type with the same key keeps it: the move is per component type.
    expect(home.components.save).toBe(pages[0].components.save);
    // The loaded pages are not mutated.
    expect(pages[0].components.logo.component.definition.styles).toEqual({
      visibility: HIDDEN,
      alignment: { value: 'left' },
    });
  });

  it('should return the same pages when no component holds an old place', () => {
    const pages = [{ id: 'home', components: { save: button() } }, { id: 'empty' }];

    expect(dropMovedComponentKeys(pages, MOVED)).toBe(pages);
  });

  it('should return the same pages when no key has moved', () => {
    const pages = [{ id: 'home', components: { logo: svgWithBothPlaces() } }];

    expect(dropMovedComponentKeys(pages, {})).toBe(pages);
  });

  it('should keep a page that has nothing to drop, while copying the one that has', () => {
    type Entry = ReturnType<typeof svgWithBothPlaces> | ReturnType<typeof button>;
    const untouched = { id: 'settings', components: { save: button() } as Record<string, Entry> };
    const pages = [{ id: 'home', components: { logo: svgWithBothPlaces() } as Record<string, Entry> }, untouched];

    const loaded = dropMovedComponentKeys(pages, MOVED);

    expect(loaded).not.toBe(pages);
    expect(loaded[1]).toBe(untouched);
    expect(loaded[0].components.logo.component.definition.styles).toEqual({ alignment: { value: 'left' } });
  });
});
