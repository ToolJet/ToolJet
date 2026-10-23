import { WhitelistPluginGuard } from '../../../../src/modules/data-sources/guards/whitelist-plugin.guard';

function contextFor(kind: string, body: object): any {
  return { switchToHttp: () => ({ getRequest: () => ({ tj_data_source: { kind }, body }) }) };
}

describe('WhitelistPluginGuard', () => {
  it('allows cohere plugins to invoke methods', () => {
    expect(new WhitelistPluginGuard().canActivate(contextFor('cohere', { method: 'listModels' }))).toBe(true);
  });

  it('rejects plugin kinds that are not whitelisted', () => {
    expect(new WhitelistPluginGuard().canActivate(contextFor('unknown_plugin', { method: 'listModels' }))).toBe(false);
  });
});
