/** @group working */
import { Not } from 'typeorm';
import { AiService } from '@ee/ai/service';

describe('agent completion app names', () => {
  const app = { id: 'studio-app', name: 'Ceramic Studio' };
  const organizationId = 'craft-workspace';
  let service: any;
  let rows: any[];

  beforeEach(() => {
    rows = [{ ...app, organizationId }];
    service = Object.create(AiService.prototype);
    service.appRepository = {
      findOne: jest.fn(async ({ where }) =>
        rows.find(
          (row) =>
            row.name === where.name &&
            row.organizationId === where.organizationId &&
            (!where.id || row.id !== where.id.value)
        )
      ),
    };
  });

  it('keeps the existing name on an ordinary edit without a conflict lookup', async () => {
    expect(await service.resolveAgentAppName(app.name, app, organizationId)).toBe(app.name);
    expect(service.appRepository.findOne).not.toHaveBeenCalled();
  });

  it('preserves an explicit rename to an unused name', async () => {
    expect(await service.resolveAgentAppName('Kiln Schedule', app, organizationId)).toBe('Kiln Schedule');
    expect(service.appRepository.findOne).toHaveBeenCalledWith({
      where: { id: Not(app.id), name: 'Kiln Schedule', organizationId },
    });
  });

  it('does not treat a rename already applied by the agent as another app', async () => {
    rows[0].name = 'Glaze Inventory';
    expect(await service.resolveAgentAppName('Glaze Inventory', app, organizationId)).toBe('Glaze Inventory');
  });

  it('still disambiguates another app with the requested name in this workspace', async () => {
    rows.push({
      id: 'other-studio-app',
      name: 'Kiln Schedule',
      organizationId,
    });
    expect(await service.resolveAgentAppName('Kiln Schedule', app, organizationId)).toMatch(
      /^Kiln Schedule-[a-z0-9]{3}$/
    );
  });

  it('does not disambiguate names in another workspace', async () => {
    rows.push({
      id: 'other-studio-app',
      name: 'Kiln Schedule',
      organizationId: 'other-workspace',
    });
    expect(await service.resolveAgentAppName('Kiln Schedule', app, organizationId)).toBe('Kiln Schedule');
  });
});
