import { columnStyleVars, cardStyleVars } from '../helpers/styleVars';

describe('Kanban style variables', () => {
  it('maps column styles to CSS variables, radius in px', () => {
    expect(
      columnStyleVars({
        columnBackgroundColor: '#f4f4f5',
        columnBorderColor: '#e4e4e7',
        columnBorderRadius: 12,
        columnTitleColor: '#18181b',
      })
    ).toEqual({
      '--kb-col-bg': '#f4f4f5',
      '--kb-col-border': '#e4e4e7',
      '--kb-col-radius': '12px',
      '--kb-col-title': '#18181b',
    });
  });

  it('maps card styles, keeping a radius with its own unit and a shadow as written', () => {
    expect(
      cardStyleVars({
        cardBackgroundColor: '#fff',
        cardBorderColor: 'var(--cc-weak-border)',
        cardBorderRadius: '1rem',
        cardBoxShadow: '0px 4px 12px 0px #00000014',
      })
    ).toEqual({
      '--kb-card-bg': '#fff',
      '--kb-card-border': 'var(--cc-weak-border)',
      '--kb-card-radius': '1rem',
      '--kb-card-shadow': '0px 4px 12px 0px #00000014',
    });
  });

  it('maps a card shadow preset to its shadow, and the board default to nothing', () => {
    expect(cardStyleVars({ cardBoxShadow: 'none' })).toEqual({ '--kb-card-shadow': 'none' });
    expect(cardStyleVars({ cardBoxShadow: 'lg' })['--kb-card-shadow']).toMatch(/rgb\(0 0 0/);
    expect(cardStyleVars({ cardBoxShadow: 'default' })).toEqual({});
  });

  it('leaves out unset or empty values so the board style applies', () => {
    expect(columnStyleVars({ columnBackgroundColor: '', columnBorderRadius: undefined })).toEqual({});
    expect(cardStyleVars({})).toEqual({});
    expect(cardStyleVars({ cardBorderRadius: 0 })).toEqual({ '--kb-card-radius': '0px' });
  });
});
