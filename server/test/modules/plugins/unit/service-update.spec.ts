/** @group marketplace */
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PluginsService } from '@modules/plugins/service';

describe('PluginsService.update', () => {
  const stored = { id: 'row-1', pluginId: 'github', repo: 'tooljet/marketplace', version: '1.0.0' };
  let util: { fetchPluginFiles: jest.Mock; upgrade: jest.Mock };
  let service: PluginsService;

  beforeEach(() => {
    util = {
      fetchPluginFiles: jest
        .fn()
        .mockResolvedValue([Buffer.from('i'), Buffer.from('o'), Buffer.from('ic'), Buffer.from('m'), '1.1.0', {}]),
      upgrade: jest.fn().mockResolvedValue({ id: 'row-1' }),
    };
    service = new PluginsService(util as any, null as any, null as any);
    jest.spyOn(service, 'findOne').mockResolvedValue(stored as any);
  });

  it('upgrades the stored plugin to the requested version', async () => {
    await service.update('row-1', { pluginId: 'github', repo: 'tooljet/marketplace', version: '1.1.0' } as any);

    expect(util.fetchPluginFiles).toHaveBeenCalledWith('github', 'tooljet/marketplace');
    expect(util.upgrade).toHaveBeenCalledTimes(1);
  });

  it('rejects a body pluginId that differs from the stored one, so one plugin cannot be swapped for another', async () => {
    await expect(service.update('row-1', { pluginId: 'other-plugin', version: '1.1.0' } as any)).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(util.fetchPluginFiles).not.toHaveBeenCalled();
    expect(util.upgrade).not.toHaveBeenCalled();
  });

  it('fetches from the stored pluginId and repo even when the body omits them', async () => {
    await service.update('row-1', { version: '1.1.0' } as any);

    expect(util.fetchPluginFiles).toHaveBeenCalledWith('github', 'tooljet/marketplace');
  });

  it('returns 404 when the plugin row does not exist', async () => {
    (service.findOne as jest.Mock).mockResolvedValue(null);

    await expect(service.update('missing', { pluginId: 'github', version: '1.1.0' } as any)).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
