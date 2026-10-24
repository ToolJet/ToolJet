import { BadRequestException } from '@nestjs/common';
import { PluginsUtilService } from '../../../../src/modules/plugins/util.service';

describe('PluginsUtilService.fetchPluginFiles', () => {
  const service = new PluginsUtilService({} as never, {} as never);

  it.each(['../../etc', 'openai/../x', 'a b', '', undefined])('rejects plugin id %p', (id) => {
    expect(() => service.fetchPluginFiles(id as string, '')).toThrow(BadRequestException);
  });

  it('ignores repo and fetches marketplace files by id', () => {
    const fromS3 = jest
      .spyOn(
        service as unknown as { fetchPluginFilesFromS3: (id: string) => Promise<unknown> },
        'fetchPluginFilesFromS3'
      )
      .mockResolvedValue([]);

    service.fetchPluginFiles('hugging_face', 'attacker/repo');

    expect(fromS3).toHaveBeenCalledWith('hugging_face');
  });
});
