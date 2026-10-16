import {
  RetuneShippedThemeNeutrals1792170000000,
  firstShippedDefinition,
} from '../../../../data-migrations/1792170000000-RetuneShippedThemeNeutrals';
import { shippedThemes } from '@modules/organization-themes/constants/shipped-themes';

/** Existing workspaces get the tinted neutrals only on shipped themes nobody has edited. */
describe('RetuneShippedThemeNeutrals', () => {
  const run = async (rows: Array<{ id: string; name: string; definition: unknown }>) => {
    const updates: Array<[string, unknown]> = [];
    const queryRunner: any = {
      query: async (sql: string, params: unknown[]) => {
        if (sql.startsWith('SELECT')) return rows;
        updates.push([params[1] as string, JSON.parse(params[0] as string)]);
        return [];
      },
    };
    await new RetuneShippedThemeNeutrals1792170000000().up(queryRunner);
    return updates;
  };

  it('updates an unedited shipped theme to its tinted definition', async () => {
    const navy = shippedThemes.find((theme) => theme.name === 'ToolJet Navy');
    const updates = await run([{ id: 'a', name: 'ToolJet Navy', definition: firstShippedDefinition('ToolJet Navy') }]);
    expect(updates).toEqual([['a', navy.definition]]);
  });

  it('accepts the definition stored as text, as a json column may return it', async () => {
    const updates = await run([
      { id: 'a', name: 'ToolJet Ink', definition: JSON.stringify(firstShippedDefinition('ToolJet Ink')) },
    ]);
    expect(updates.map(([id]) => id)).toEqual(['a']);
  });

  it('leaves an edited shipped theme, and a theme made with a shipped name, alone', async () => {
    const edited: any = firstShippedDefinition('ToolJet Rose');
    const updates = await run([
      { id: 'edited', name: 'ToolJet Rose', definition: { ...edited, text: { ...edited.text, font: 'Inter' } } },
      { id: 'own', name: 'ToolJet Slate', definition: { brand: { colors: { primary: { light: '#000000' } } } } },
    ]);
    expect(updates).toEqual([]);
  });
});
