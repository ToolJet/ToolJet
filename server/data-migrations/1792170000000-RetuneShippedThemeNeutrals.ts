import { MigrationInterface, QueryRunner } from 'typeorm';
import { TJDefaultTheme } from '@modules/organization-themes/constants';
import { shippedThemes } from '@modules/organization-themes/constants/shipped-themes';

// The shipped themes as AddShippedThemesToOrganizations wrote them (2026-10-13): the basic theme with the palette's
// primary, app background and second surface. Frozen here, so later palette changes do not change what this matches.
const FIRST_PALETTES: Array<{
  name: string;
  primary: [string, string];
  appBackground: [string, string];
  surface2: [string, string];
}> = [
  {
    name: 'ToolJet Ink',
    primary: ['#111827', '#6B7280'],
    appBackground: ['#F9FAFB', '#0F1115'],
    surface2: ['#F3F4F6', '#24272D'],
  },
  {
    name: 'ToolJet Slate',
    primary: ['#334155', '#64748B'],
    appBackground: ['#F8FAFC', '#0F1318'],
    surface2: ['#F1F5F9', '#252B33'],
  },
  {
    name: 'ToolJet Navy',
    primary: ['#1E3A8A', '#3B5FCC'],
    appBackground: ['#F5F7FB', '#0E121A'],
    surface2: ['#EEF2FA', '#232A38'],
  },
  {
    name: 'ToolJet Indigo',
    primary: ['#4F46E5', '#4F46E5'],
    appBackground: ['#F6F6FB', '#111218'],
    surface2: ['#F4F4FC', '#272A36'],
  },
  {
    name: 'ToolJet Emerald',
    primary: ['#047857', '#047857'],
    appBackground: ['#F4F8F6', '#0F1513'],
    surface2: ['#F1F7F4', '#24302B'],
  },
  {
    name: 'ToolJet Graphite',
    primary: ['#292524', '#78716C'],
    appBackground: ['#FAF9F7', '#14120F'],
    surface2: ['#F5F4F2', '#2C2825'],
  },
  {
    name: 'ToolJet Rose',
    primary: ['#BE123C', '#E11D48'],
    appBackground: ['#FAF6F7', '#161012'],
    surface2: ['#FBF1F3', '#33262A'],
  },
];

const pair = ([light, dark]: [string, string]) => ({ light, dark });

// Not exported: TypeORM loads every export of a migration file as a migration class (the class exposes it for specs).
const firstShippedDefinition = (name: string): unknown => {
  const palette = FIRST_PALETTES.find((p) => p.name === name);
  if (!palette) return undefined;
  return {
    ...TJDefaultTheme,
    brand: { colors: { ...TJDefaultTheme.brand.colors, primary: pair(palette.primary) } },
    surface: {
      colors: {
        ...TJDefaultTheme.surface.colors,
        appBackground: pair(palette.appBackground),
        surface2: pair(palette.surface2),
      },
    },
  };
};

/** Gives existing workspaces the shipped themes' tinted neutrals (constants/shipped-themes.ts): a shipped theme is
 *  updated only while its definition is still exactly as it was shipped, so a theme someone edited, or made with the
 *  same name, is left alone. One set-based statement: every workspace has these rows, so the cloud has many of them,
 *  and comparing as jsonb ignores key order. */
export class RetuneShippedThemeNeutrals1792170000000 implements MigrationInterface {
  /** The shipped theme `name` as AddShippedThemesToOrganizations first wrote it. */
  static readonly firstShippedDefinition = firstShippedDefinition;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const themes = shippedThemes.map((theme) => ({
      name: theme.name,
      first: firstShippedDefinition(theme.name),
      next: theme.definition,
    }));
    // The new definitions go in as json, keys in the order written: the column is json, and the app's theme loader
    // depends on that order (border.radius before border.colors; through jsonb, colors came first and the radius pass
    // set --cc-default-border to "undefined"). The match compares as jsonb, which ignores key order.
    await queryRunner.query(
      `UPDATE organization_themes AS t
          SET definition = v.next, updated_at = now()
         FROM json_to_recordset($1::json) AS v(name text, first jsonb, next json)
        WHERE t.name = v.name AND t.definition::jsonb = v.first`,
      [JSON.stringify(themes.filter((theme) => theme.first))]
    );
  }

  public async down(): Promise<void> {}
}
