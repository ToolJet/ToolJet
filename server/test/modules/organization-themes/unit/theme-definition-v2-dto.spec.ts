/** @group platform */
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Definition } from '@modules/organization-themes/dto';
import { TJDefaultTheme } from '@modules/organization-themes/constants';

/** Theme definition v2 keeps the colours in `colors.<group>.<token>`, beside the old groups until a cleanup migration.
 *  The theme routes validate with `whitelist: true`, which silently drops keys the DTO does not declare, so the DTO has
 *  to know both shapes and keep `colors` and `version`. */
describe('theme definition DTO (v2)', () => {
  const pair = (hex: string) => ({ light: hex, dark: hex });
  const colors = {
    brand: { primary: pair('#111111') },
    text: { primary: pair('#222222'), placeholder: pair('#333333'), onSolid: pair('#ffffff') },
    surface: {
      appBackground: pair('#444444'),
      surface1: pair('#555555'),
      surface2: pair('#666666'),
      surface3: pair('#777777'),
    },
    border: { strong: pair('#888888'), weak: pair('#999999') },
    systemStatus: { success: pair('#00aa00'), error: pair('#aa0000'), warning: pair('#aaaa00') },
  };

  // What the routes do: transform, then validate stripping undeclared keys.
  const validate = (definition: unknown) => {
    const instance = plainToInstance(Definition, definition);
    return { errors: validateSync(instance, { whitelist: true }), kept: instance as unknown as Record<string, any> };
  };

  it('accepts the old shape alone (tooljet-mcp and old bundles send it)', () => {
    expect(validate(TJDefaultTheme).errors).toEqual([]);
  });

  it('accepts both shapes together and keeps colors and version through the whitelist', () => {
    const { errors, kept } = validate({ ...TJDefaultTheme, version: 2, colors });
    expect(errors).toEqual([]);
    expect(kept.version).toBe(2);
    expect(kept.colors.text.onSolid).toEqual(pair('#ffffff'));
    expect(kept.colors.border.strong).toEqual(pair('#888888'));
  });

  it('accepts colors alone', () => {
    expect(validate({ version: 2, colors }).errors).toEqual([]);
  });

  it('rejects a definition with neither shape', () => {
    expect(validate({ version: 2 }).errors).not.toEqual([]);
  });

  it('rejects a colour that is not a light/dark pair of strings', () => {
    const broken = { ...colors, brand: { primary: { light: 1, dark: '#000000' } } };
    expect(validate({ version: 2, colors: broken }).errors).not.toEqual([]);
  });

  it('rejects an unknown version', () => {
    expect(validate({ ...TJDefaultTheme, version: 3, colors }).errors).not.toEqual([]);
  });
});
