import { tableConfig } from 'src/modules/apps/services/widget-config/table';

// App load merges this copy's definition defaults into saved Tables and shows its property list in the Inspector
describe('Table widget config (server copy): showRecordCount', () => {
  it('is in the property list, so the Inspector can render the toggle', () => {
    expect(tableConfig.properties).toHaveProperty('showRecordCount');
  });

  it('has no definition default, so saved Tables without it keep following pagination', () => {
    expect(tableConfig.definition.properties).not.toHaveProperty('showRecordCount');
  });
});
