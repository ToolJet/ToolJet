import { act, renderHook } from '@testing-library/react';
import { useConstantForm } from '../useConstantForm';

const ENVS = [
  { id: 'dev', name: 'Development', enabled: true },
  { id: 'stg', name: 'Staging', enabled: true },
  { id: 'prod', name: 'Production', enabled: true },
];

const setup = (props = {}) =>
  renderHook((p) => useConstantForm(p), { initialProps: { mode: 'create', environments: ENVS, ...props } });

const fill = (result, name, values = {}) => {
  act(() => result.current.setName(name));
  Object.entries(values).forEach(([envId, value]) => {
    act(() => result.current.addEnvironment(envId));
    act(() => result.current.setValue(envId, value));
  });
};

const globalConstant = (overrides = {}) => ({
  id: 'c1',
  name: 'API_URL',
  type: 'Global',
  values: [
    { environment_id: 'dev', environment_name: 'Development', has_value: true, value: 'http://dev' },
    { environment_id: 'stg', environment_name: 'Staging', has_value: true, value: 'http://stg' },
    { environment_id: 'prod', environment_name: 'Production', has_value: false, value: null },
  ],
  ...overrides,
});

const secretConstant = () =>
  globalConstant({
    type: 'Secret',
    values: [
      { environment_id: 'dev', environment_name: 'Development', has_value: true, value: null },
      { environment_id: 'stg', environment_name: 'Staging', has_value: true, value: null },
    ],
  });

describe('useConstantForm — create', () => {
  it('accepts a valid name and reports no error', () => {
    const { result } = setup();
    act(() => result.current.setName('API_KEY_2'));
    expect(result.current.nameValid).toBe(true);
    expect(result.current.nameError).toBeNull();
  });

  it.each([
    ['starts with a digit', '1KEY'],
    ['contains a dash', 'MY-KEY'],
    ['contains a space', 'MY KEY'],
  ])('rejects a name that %s', (_, name) => {
    const { result } = setup();
    act(() => result.current.setName(name));
    expect(result.current.nameValid).toBe(false);
    expect(result.current.nameError).toMatch(/letters, numbers and underscores/i);
  });

  it('rejects a name longer than 50 characters and accepts exactly 50', () => {
    const { result } = setup();
    act(() => result.current.setName('A'.repeat(51)));
    expect(result.current.nameValid).toBe(false);
    expect(result.current.nameError).toMatch(/50 characters/i);
    act(() => result.current.setName('A'.repeat(50)));
    expect(result.current.nameValid).toBe(true);
  });

  it('is invalid without showing an error while the name is empty', () => {
    const { result } = setup();
    expect(result.current.nameValid).toBe(false);
    expect(result.current.nameError).toBeNull();
  });

  it('cannot submit until the name is valid and a value is non-empty', () => {
    const { result } = setup();
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setName('KEY'));
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.addEnvironment('dev'));
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setValue('dev', 'v'));
    expect(result.current.canSubmit).toBe(true);
  });

  it('builds the body from non-empty rows in environment order', () => {
    const { result } = setup();
    fill(result, 'KEY', { prod: 'p', dev: 'd', stg: '' });
    act(() => result.current.setType('Secret'));
    expect(result.current.toApiBody()).toEqual({
      name: 'KEY',
      type: 'Secret',
      values: [
        { environment_id: 'dev', value: 'd' },
        { environment_id: 'prod', value: 'p' },
      ],
    });
  });

  it('lists rows in environment order regardless of the order they were added', () => {
    const { result } = setup();
    act(() => result.current.addEnvironment('prod'));
    act(() => result.current.addEnvironment('dev'));
    expect(result.current.rows.map((r) => r.environmentId)).toEqual(['dev', 'prod']);
  });

  it('defaults the type to Global', () => {
    const { result } = setup();
    fill(result, 'KEY', { dev: 'd' });
    expect(result.current.toApiBody().type).toBe('Global');
  });

  it('hides added environments from the available list', () => {
    const { result } = setup();
    act(() => result.current.addEnvironment('stg'));
    expect(result.current.availableEnvironments.map((e) => e.id)).toEqual(['dev', 'prod']);
    expect(result.current.rows.map((r) => r.environmentId)).toEqual(['stg']);
  });

  it('ignores adding a locked environment but still lists it as available', () => {
    const envs = [ENVS[0], { ...ENVS[1], enabled: false }];
    const { result } = setup({ environments: envs });
    act(() => result.current.addEnvironment('stg'));
    expect(result.current.rows).toHaveLength(0);
    expect(result.current.availableEnvironments.find((e) => e.id === 'stg')).toMatchObject({ enabled: false });
  });

  it('reports all environments added once every enabled environment has a row, ignoring locked ones', () => {
    const envs = [ENVS[0], { ...ENVS[1], enabled: false }];
    const { result } = setup({ environments: envs });
    expect(result.current.allEnvironmentsAdded).toBe(false);
    act(() => result.current.addEnvironment('dev'));
    expect(result.current.allEnvironmentsAdded).toBe(true);
  });

  it('deletes a row outright when it is removed', () => {
    const { result } = setup();
    fill(result, 'KEY', { dev: 'd', stg: 's' });
    act(() => result.current.removeRow('dev'));
    expect(result.current.rows.map((r) => r.environmentId)).toEqual(['stg']);
    expect(result.current.availableEnvironments.map((e) => e.id)).toContain('dev');
  });

  it('flags a value over 10000 characters and blocks submit', () => {
    const { result } = setup();
    fill(result, 'KEY', { dev: 'x'.repeat(10001) });
    expect(result.current.rows[0].error).toMatch(/10000/);
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setValue('dev', 'x'.repeat(10000)));
    expect(result.current.rows[0].error).toBeNull();
    expect(result.current.canSubmit).toBe(true);
  });

  it('flags a cleared stored Global value at once, and only that row', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    act(() => result.current.setValue('stg', ''));
    expect(result.current.rows.find((r) => r.environmentId === 'stg').error).toBe('Value is required');
    expect(result.current.rows.find((r) => r.environmentId === 'dev').error).toBeNull();
    act(() => result.current.setValue('stg', 'http://stg'));
    expect(result.current.rows.find((r) => r.environmentId === 'stg').error).toBeNull();
  });

  it('does not flag a new empty row until it has been touched', () => {
    const { result } = setup();
    act(() => result.current.addEnvironment('dev'));
    expect(result.current.rows[0].error).toBeNull();
    act(() => result.current.touchRow('dev'));
    expect(result.current.rows[0].error).toBe('Value is required');
    act(() => result.current.setValue('dev', 'v'));
    expect(result.current.rows[0].error).toBeNull();
  });

  it('does not flag a touched empty row that is ignored because another row has a value', () => {
    const { result } = setup();
    fill(result, 'KEY', { dev: 'd', stg: '' });
    act(() => result.current.touchRow('stg'));
    expect(result.current.rows.find((r) => r.environmentId === 'stg').error).toBeNull();
    expect(result.current.canSubmit).toBe(true);
  });

  it('never flags the empty box of a stored Secret, which means "unchanged"', () => {
    const { result } = setup({ mode: 'edit', constant: secretConstant() });
    act(() => result.current.touchRow('dev'));
    expect(result.current.rows.every((r) => r.error === null)).toBe(true);
  });

  it('allows a single row when the licence does not cover multiple environments', () => {
    const { result } = setup({ multiEnvironment: false });
    expect(result.current.canAddEnvironment).toBe(true);
    act(() => result.current.addEnvironment('dev'));
    expect(result.current.canAddEnvironment).toBe(false);
    act(() => result.current.addEnvironment('stg'));
    expect(result.current.rows).toHaveLength(1);
  });
});

describe('useConstantForm — edit', () => {
  it('lists one row per stored environment, and sends only the changed one', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    expect(result.current.rows.map((r) => r.environmentId)).toEqual(['dev', 'stg']);
    act(() => result.current.setValue('stg', 'http://new'));
    expect(result.current.toApiBody()).toEqual({ values: [{ environment_id: 'stg', value: 'http://new' }] });
  });

  it('lists a single row when the licence does not cover multiple environments', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant(), multiEnvironment: false });
    expect(result.current.rows.map((r) => [r.environmentId, r.value])).toEqual([['dev', 'http://dev']]);
  });

  it('sends exactly one value for a single-value edit', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant(), multiEnvironment: false });
    act(() => result.current.setValue('dev', 'http://new'));
    expect(result.current.toApiBody()).toEqual({ values: [{ environment_id: 'dev', value: 'http://new' }] });
  });

  it('keeps a locked environment out of the single value', () => {
    const environments = [{ ...ENVS[0], enabled: false }, ENVS[1], ENVS[2]];
    const { result } = setup({ mode: 'edit', constant: globalConstant(), environments, multiEnvironment: false });
    expect(result.current.rows.map((r) => r.environmentId)).toEqual(['stg']);
  });

  it('cannot remove a stored value when the licence does not cover multiple environments', () => {
    const multi = setup({ mode: 'edit', constant: globalConstant() });
    expect(multi.result.current.canRemove('dev')).toBe(true);
    const single = setup({ mode: 'edit', constant: globalConstant(), multiEnvironment: false });
    expect(single.result.current.canRemove('dev')).toBe(false);
  });

  it('prefills Global rows with the stored value and skips environments without a value', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    expect(result.current.name).toBe('API_URL');
    expect(result.current.type).toBe('Global');
    expect(result.current.rows.map((r) => [r.environmentId, r.value, r.masked])).toEqual([
      ['dev', 'http://dev', false],
      ['stg', 'http://stg', false],
    ]);
    expect(result.current.availableEnvironments.map((e) => e.id)).toEqual(['prod']);
  });

  it('shows Secret rows empty and masked', () => {
    const { result } = setup({ mode: 'edit', constant: secretConstant() });
    expect(result.current.rows.map((r) => [r.value, r.masked])).toEqual([
      ['', true],
      ['', true],
    ]);
  });

  it('never shows a Secret value, even if the payload carries one', () => {
    const constant = secretConstant();
    constant.values[0].value = 'leaked';
    const { result } = setup({ mode: 'edit', constant });
    expect(result.current.rows[0].value).toBe('');
  });

  it('is not dirty and sends nothing until something changes', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.canSubmit).toBe(false);
    expect(result.current.toApiBody()).toEqual({ values: [] });
  });

  it('sends only the Global rows that changed', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    act(() => result.current.setValue('stg', 'http://stg-2'));
    expect(result.current.isDirty).toBe(true);
    expect(result.current.canSubmit).toBe(true);
    expect(result.current.toApiBody()).toEqual({ values: [{ environment_id: 'stg', value: 'http://stg-2' }] });
  });

  it('is clean again when a Global value is put back', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    act(() => result.current.setValue('stg', 'x'));
    act(() => result.current.setValue('stg', 'http://stg'));
    expect(result.current.isDirty).toBe(false);
  });

  it('blocks submit when a stored Global value is emptied, even alongside another change', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    act(() => result.current.setValue('dev', 'http://dev-2'));
    expect(result.current.canSubmit).toBe(true);
    act(() => result.current.setValue('stg', ''));
    expect(result.current.canSubmit).toBe(false);
  });

  it('sends a Secret row only when a value was typed', () => {
    const { result } = setup({ mode: 'edit', constant: secretConstant() });
    expect(result.current.toApiBody()).toEqual({ values: [] });
    act(() => result.current.setValue('dev', 'new-secret'));
    expect(result.current.toApiBody()).toEqual({ values: [{ environment_id: 'dev', value: 'new-secret' }] });
    act(() => result.current.setValue('dev', ''));
    expect(result.current.toApiBody()).toEqual({ values: [] });
    expect(result.current.isDirty).toBe(false);
  });

  it('sends a value for an environment added during the edit', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    act(() => result.current.addEnvironment('prod'));
    expect(result.current.canSubmit).toBe(false);
    act(() => result.current.setValue('prod', 'http://prod'));
    expect(result.current.toApiBody()).toEqual({ values: [{ environment_id: 'prod', value: 'http://prod' }] });
  });

  it('marks a stored value for removal and sends null', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    act(() => result.current.removeRow('stg'));
    expect(result.current.rows.find((r) => r.environmentId === 'stg')).toMatchObject({ removed: true });
    expect(result.current.toApiBody()).toEqual({ values: [{ environment_id: 'stg', value: null }] });
    expect(result.current.canSubmit).toBe(true);
  });

  it('offers a removed environment in the Add menu again, and adding it restores the stored value', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    act(() => result.current.removeRow('stg'));
    expect(result.current.availableEnvironments.map((e) => e.id)).toContain('stg');
    expect(result.current.allEnvironmentsAdded).toBe(false);
    act(() => result.current.addEnvironment('stg'));
    expect(result.current.rows.find((r) => r.environmentId === 'stg')).toMatchObject({
      removed: false,
      value: 'http://stg',
    });
    expect(result.current.availableEnvironments.map((e) => e.id)).not.toContain('stg');
    expect(result.current.isDirty).toBe(false);
  });

  it('drops a row added in this edit instead of marking it', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    act(() => result.current.addEnvironment('prod'));
    act(() => result.current.removeRow('prod'));
    expect(result.current.rows.map((r) => r.environmentId)).toEqual(['dev', 'stg']);
    expect(result.current.toApiBody()).toEqual({ values: [] });
  });

  it('does not allow removing the last remaining value', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    expect(result.current.canRemove('dev')).toBe(true);
    act(() => result.current.removeRow('stg'));
    expect(result.current.canRemove('dev')).toBe(false);
    act(() => result.current.removeRow('dev'));
    expect(result.current.rows.find((r) => r.environmentId === 'dev').removed).toBe(false);
    act(() => result.current.addEnvironment('stg'));
    expect(result.current.canRemove('dev')).toBe(true);
  });

  it('keeps a value for an environment the plan no longer covers out of the body and the remove count', () => {
    const envs = [ENVS[0], { ...ENVS[1], enabled: false }, ENVS[2]];
    const { result } = setup({ mode: 'edit', constant: globalConstant(), environments: envs });
    const stg = result.current.rows.find((r) => r.environmentId === 'stg');
    expect(stg.locked).toBe(true);
    expect(result.current.canRemove('stg')).toBe(false);
    expect(result.current.canRemove('dev')).toBe(false);
    act(() => result.current.setValue('stg', 'tampered'));
    expect(result.current.toApiBody()).toEqual({ values: [] });
  });

  it('keeps name and type read-only', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    act(() => result.current.setName('OTHER'));
    act(() => result.current.setType('Secret'));
    expect(result.current.name).toBe('API_URL');
    expect(result.current.type).toBe('Global');
  });

  it('reports all environments added once every enabled environment has a value', () => {
    const { result } = setup({ mode: 'edit', constant: globalConstant() });
    expect(result.current.allEnvironmentsAdded).toBe(false);
    act(() => result.current.addEnvironment('prod'));
    expect(result.current.allEnvironmentsAdded).toBe(true);
  });
});
