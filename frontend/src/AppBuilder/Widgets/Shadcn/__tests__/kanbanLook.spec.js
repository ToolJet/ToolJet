import { badgeLook, kanbanLook } from '../kanbanLook';

describe('kanbanLook', () => {
  it('falls back to the app theme when nothing is set', () => {
    const look = kanbanLook({});
    expect(look.vars).toEqual({});
    expect(look.card.background).toBe('var(--sc-card)');
    expect(look.column.border).toBeUndefined();
  });

  it('turns the accent and text colours into variables the board reads', () => {
    const look = kanbanLook({
      accentColor: '#0f766e',
      columnTitleColor: '#134e4a',
      columnCountBackgroundColor: '#ccfbf1',
      columnCountTextColor: '#115e59',
      cardTitleColor: '#0f172a',
      cardTextColor: '#64748b',
      columnGap: 24,
    });
    expect(look.vars).toEqual({
      '--sc-primary': '#0f766e',
      '--kb-col-title': '#134e4a',
      '--kb-count-bg': '#ccfbf1',
      '--kb-count-fg': '#115e59',
      '--kb-card-title': '#0f172a',
      '--kb-card-text': '#64748b',
      '--kb-col-gap': '24px',
    });
  });

  it('colours progress bars on their own, else they follow the accent', () => {
    expect(kanbanLook({ progressColor: '#16a34a' }).progress).toEqual({ '--sc-primary': '#16a34a' });
    expect(kanbanLook({ accentColor: '#0f766e' }).progress).toBeUndefined();
  });

  it('draws a column border only when a column border colour is set', () => {
    expect(kanbanLook({ columnBorderColor: '#e2e8f0' }).column.border).toBe('1px solid #e2e8f0');
  });
});

describe('badgeLook', () => {
  it('colours a badge from the map by its exact or lower-case value', () => {
    expect(badgeLook('High', { High: '#dc2626' })).toEqual({
      '--kb-badge-fg': '#dc2626',
      '--kb-badge-bg': 'color-mix(in srgb, #dc2626 14%, transparent)',
    });
    expect(badgeLook('LOW', { low: '#16a34a' })['--kb-badge-fg']).toBe('#16a34a');
  });

  it('leaves a value the map does not name to the built-in badge colours', () => {
    expect(badgeLook('Medium', { High: '#dc2626' })).toBeNull();
    expect(badgeLook('High', undefined)).toBeNull();
  });
});
