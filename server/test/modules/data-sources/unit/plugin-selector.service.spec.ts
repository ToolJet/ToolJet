/** @group marketplace */
import { encode } from 'js-base64';
import { PluginsServiceSelector } from '../../../../src/modules/data-sources/services/plugin-selector.service';

const WEB_GLOBALS = ['DOMException', 'MessageChannel', 'MessagePort'];

// Mirrors undici 7, which references these globals at module load.
const pluginCode = `
  const globalsAtLoad = { ${WEB_GLOBALS.map((name) => `${name}: typeof ${name}`).join(', ')} };
  module.exports.default = class { globals() { return globalsAtLoad; } };
`;

function selectorWith(code: string): PluginsServiceSelector {
  const pluginsRepository = {
    findById: jest.fn().mockResolvedValue({ indexFile: { data: Buffer.from(encode(code)) } }),
  };
  return new PluginsServiceSelector(pluginsRepository as any, {} as any);
}

describe('PluginsServiceSelector | marketplace plugin sandbox', () => {
  it('should load a plugin that uses non-enumerable web globals at module load', async () => {
    const service = await selectorWith(pluginCode).getService('plugin-id', 'qdrant');

    expect(service.globals()).toEqual(Object.fromEntries(WEB_GLOBALS.map((name) => [name, 'function'])));
  });
});
