import { Building2, LayoutGrid } from 'lucide-react';
import { categoryIcon, iconColor, ICON_COLORS } from '../templateIcons';

describe('categoryIcon', () => {
  it('returns the icon mapped to a known category', () => {
    expect(categoryIcon('property-and-facilities')).toBe(Building2);
  });

  it('falls back to the default icon for a category it does not know', () => {
    expect(categoryIcon('a-brand-new-category')).toBe(LayoutGrid);
  });
});

describe('iconColor', () => {
  it('rotates through the palette in order', () => {
    ICON_COLORS.forEach((color, index) => expect(iconColor(index)).toBe(color));
  });

  it('wraps back to the first colour after the last one', () => {
    expect(iconColor(ICON_COLORS.length)).toBe(ICON_COLORS[0]);
    expect(iconColor(ICON_COLORS.length + 2)).toBe(ICON_COLORS[2]);
  });

  it('uses the product palette', () => {
    expect(ICON_COLORS).toEqual(['#C1A1FC', '#7FBF92', '#97AEFC', '#CEAD69', '#E998C8', '#86B9FB', '#FFB8B9']);
  });
});
