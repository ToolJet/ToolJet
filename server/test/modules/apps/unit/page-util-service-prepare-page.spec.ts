/**
 * A page created through the pages API keeps the declared page variables it was sent with.
 *
 * @group platform
 */
/// <reference types="jest" />
import { PageHelperService } from '@modules/apps/services/page.util.service';
import { CreatePageDto } from '@modules/apps/dto/page';

const variables = { selectedOrderId: { value: '42', fxActive: false } };

const dto = (extra: Partial<CreatePageDto> = {}) =>
  ({ id: 'page-1', name: 'Orders', handle: 'orders', index: 1, ...extra }) as CreatePageDto;

const service = () => new PageHelperService(undefined, undefined);

describe('PageHelperService | preparePageObject', () => {
  it('should keep the page variables sent with the page', async () => {
    const page = await service().preparePageObject(dto({ variables }), 'version-1', 'workspace-1');

    expect(page.variables).toEqual(variables);
  });

  it('should leave variables empty when none are sent', async () => {
    const page = await service().preparePageObject(dto(), 'version-1', 'workspace-1');

    expect(page.variables).toBeNull();
  });
});
