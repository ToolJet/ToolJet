import { scopedVariableHints } from '../ScopedVariablesContext';

describe('scopedVariableHints', () => {
  it('offers each scoped variable and its fields as context hints', () => {
    const hints = scopedVariableHints({
      app: { id: 'a-1', name: 'Payroll', folder_id: 'f-1', folder_name: 'Internal' },
    });

    expect(hints).toEqual([
      { hint: 'app', type: 'Object', isContext: true },
      { hint: 'app.id', type: 'String', isContext: true },
      { hint: 'app.name', type: 'String', isContext: true },
      { hint: 'app.folder_id', type: 'String', isContext: true },
      { hint: 'app.folder_name', type: 'String', isContext: true },
    ]);
  });

  it('offers nothing outside a provider', () => {
    expect(scopedVariableHints(null)).toEqual([]);
  });
});
