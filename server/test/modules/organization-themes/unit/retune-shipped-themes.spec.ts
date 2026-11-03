import { RetuneShippedThemeNeutrals1792170000000 } from '../../../../data-migrations/1792170000000-RetuneShippedThemeNeutrals';

const { firstShippedDefinition } = RetuneShippedThemeNeutrals1792170000000;
import { shippedThemes } from '@modules/organization-themes/constants/shipped-themes';

/** Existing workspaces get the tinted neutrals only on shipped themes nobody has edited. The statement itself was run
 *  against a copy of staging data (see the review notes); this checks what it is given. */
describe('RetuneShippedThemeNeutrals', () => {
  const run = async () => {
    const calls: Array<[string, unknown[]]> = [];
    const queryRunner: any = { query: async (sql: string, params: unknown[]) => calls.push([sql, params]) };
    await new RetuneShippedThemeNeutrals1792170000000().up(queryRunner);
    return calls;
  };

  it('runs one statement that matches each theme by name and its first shipped definition', async () => {
    const calls = await run();
    expect(calls).toHaveLength(1);
    const [sql, [json]] = calls[0];
    expect(sql).toMatch(/t\.name = v\.name AND t\.definition::jsonb = v\.first/);
    const themes = JSON.parse(json as string);
    expect(themes.map((t: { name: string }) => t.name)).toEqual(shippedThemes.map((theme) => theme.name));
    for (const theme of themes) {
      expect(theme.first).toEqual(firstShippedDefinition(theme.name));
      expect(theme.next).toEqual(shippedThemes.find((t) => t.name === theme.name).definition);
    }
  });

  // The definition column is json, which keeps key order, and the app's theme loader depends on it: it turns every
  // border entry into a CSS variable, so border.radius after border.colors overwrote --cc-default-border with
  // "undefined" (18 Oct lifecycle tests: near-white borders in dark mode on every shipped theme). Passing the new
  // definitions through jsonb sorted their keys; they now go through json, as written.
  it('writes each new definition with its keys in the order it was written', async () => {
    const [[sql]] = await run();
    expect(sql).toMatch(/json_to_recordset\(\$1::json\) AS v\(name text, first jsonb, next json\)/);
    expect(sql).toMatch(/SET definition = v\.next,/);
  });

  it('keeps border.radius before border.colors in every shipped definition', () => {
    for (const theme of shippedThemes) expect(Object.keys(theme.definition.border)).toEqual(['radius', 'colors']);
  });

  it('only retunes themes whose definition changed', () => {
    for (const theme of shippedThemes) expect(firstShippedDefinition(theme.name)).not.toEqual(theme.definition);
  });
});
