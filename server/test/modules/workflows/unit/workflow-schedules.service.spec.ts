/// <reference types="jest" />
import { Repository } from 'typeorm';
import { AppVersion } from '@entities/app_version.entity';
import { WorkflowSchedule } from '@entities/workflow_schedule.entity';
import { AppEnvironmentUtilService } from '@ee/app-environments/util.service';
import { WorkflowSchedulesService } from '@ee/workflows/services/workflow-schedules.service';
import { WorkflowVersionUtilService } from '@ee/workflows/services/workflow-version.util.service';

/** @group workflows */
describe('WorkflowSchedulesService.create', () => {
  const organizationId = 'organization-id';
  const environmentId = 'development-environment-id';
  const workflowId = 'workflow-version-id';
  const appId = 'workflow-app-id';

  const makeService = (versionStatus: 'DRAFT' | 'PUBLISHED') => {
    const savedSchedule = {
      id: 'schedule-id',
      workflowId,
      workflow: { id: workflowId, name: 'v1', status: versionStatus },
      name: 'Daily report',
      appId,
      active: false,
      environmentId,
      type: 'interval',
      timezone: 'Asia/Calcutta',
      details: { frequency: 'minute' },
    } as WorkflowSchedule;

    const workflowSchedulesRepository = {
      create: jest.fn().mockReturnValue(savedSchedule),
      save: jest.fn().mockResolvedValue(savedSchedule),
      findOne: jest
        .fn()
        .mockImplementation(({ where }) => Promise.resolve(typeof where.id === 'string' ? savedSchedule : null)),
    };
    const appVersionsRepository = {
      findOne: jest.fn().mockResolvedValue({
        id: workflowId,
        appId,
        status: versionStatus,
        app: { organizationId },
      }),
    };
    const workflowVersionUtilService = {
      validateVersionEnvironmentCompatibility: jest.fn().mockResolvedValue(undefined),
    };
    const appEnvironmentUtilService = {
      resolveEnvironmentId: jest.fn().mockResolvedValue(environmentId),
    };

    const service = new WorkflowSchedulesService(
      workflowSchedulesRepository as unknown as Repository<WorkflowSchedule>,
      workflowVersionUtilService as unknown as WorkflowVersionUtilService,
      appVersionsRepository as unknown as Repository<AppVersion>,
      appEnvironmentUtilService as unknown as AppEnvironmentUtilService
    );

    return {
      appEnvironmentUtilService,
      service,
      workflowSchedulesRepository,
      workflowVersionUtilService,
    };
  };

  const createSchedule = (service: WorkflowSchedulesService) =>
    service.create({
      workflowId,
      name: '  Daily report  ',
      active: false,
      environmentId,
      type: 'interval',
      timezone: 'Asia/Calcutta',
      details: { frequency: 'minute' },
    });

  it.each(['DRAFT', 'PUBLISHED'] as const)(
    'should create a schedule pinned to a %s workflow version',
    async (status) => {
      const { appEnvironmentUtilService, service, workflowSchedulesRepository, workflowVersionUtilService } =
        makeService(status);

      const schedule = await createSchedule(service);

      expect(appEnvironmentUtilService.resolveEnvironmentId).toHaveBeenCalledWith(organizationId, environmentId);
      expect(workflowVersionUtilService.validateVersionEnvironmentCompatibility).toHaveBeenCalledWith(
        workflowId,
        environmentId
      );
      expect(workflowSchedulesRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          workflow: { id: workflowId },
          name: 'Daily report',
          appId,
          active: false,
          environmentId,
        })
      );
      expect(schedule).toMatchObject({
        id: 'schedule-id',
        workflowId,
        workflow: { id: workflowId, status },
      });
    }
  );

  it('should reject an incompatible version and environment before persisting the schedule', async () => {
    const { service, workflowSchedulesRepository, workflowVersionUtilService } = makeService('DRAFT');
    workflowVersionUtilService.validateVersionEnvironmentCompatibility.mockRejectedValue(
      new Error('Version is not available in this environment')
    );

    await expect(createSchedule(service)).rejects.toThrow('Version is not available in this environment');
    expect(workflowSchedulesRepository.create).not.toHaveBeenCalled();
    expect(workflowSchedulesRepository.save).not.toHaveBeenCalled();
  });

  it('should require a schedule name', async () => {
    const { service, workflowSchedulesRepository } = makeService('DRAFT');

    await expect(
      service.create({
        workflowId,
        name: '   ',
        active: false,
        environmentId,
        type: 'interval',
        timezone: 'Asia/Calcutta',
        details: { frequency: 'minute' },
      })
    ).rejects.toThrow('Schedule name is required');
    expect(workflowSchedulesRepository.save).not.toHaveBeenCalled();
  });

  it('should reject a case-insensitive duplicate name in the same workflow', async () => {
    const { service, workflowSchedulesRepository } = makeService('DRAFT');
    workflowSchedulesRepository.findOne.mockResolvedValueOnce({ id: 'existing-schedule' });

    await expect(createSchedule(service)).rejects.toThrow('A schedule with this name already exists in this workflow');
    expect(workflowSchedulesRepository.save).not.toHaveBeenCalled();
  });

  it('should persist and return a normalized schedule name when updating', async () => {
    const { service, workflowSchedulesRepository } = makeService('DRAFT');

    const schedule = await service.update('schedule-id', { name: '  Weekly report  ' });

    expect(workflowSchedulesRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'schedule-id', name: 'Weekly report' })
    );
    expect(schedule.name).toBe('Weekly report');
  });

  it('should persist per-schedule workflow input overrides', async () => {
    const { service, workflowSchedulesRepository } = makeService('DRAFT');

    await service.create({
      workflowId,
      name: 'Parameterized schedule',
      active: false,
      environmentId,
      type: 'interval',
      timezone: 'Asia/Calcutta',
      details: { frequency: 'minute' },
      params: { region: 'EU' },
    });

    expect(workflowSchedulesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ params: { region: 'EU' } })
    );
  });
});
