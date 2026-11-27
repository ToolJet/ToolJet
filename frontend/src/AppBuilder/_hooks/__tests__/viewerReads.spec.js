import { createViewerReads } from '../viewerReads';
import { appEnvironmentService, orgEnvironmentConstantService, dataqueryService } from '@/_services';

jest.mock('@/_services', () => ({
  appEnvironmentService: { getEnvironment: jest.fn() },
  orgEnvironmentConstantService: { getConstantsFromEnvironment: jest.fn() },
  dataqueryService: { getAll: jest.fn() },
}));

// A viewer of a version read its environment, then its constants, then its queries, each only after the app
// definition: four round trips in a row. It knows the environment and version from the start, so those reads now
// start with the definition.
describe('the reads a viewer makes after its app definition', () => {
  const ids = { environmentId: 'env-1', versionId: 'ver-1', slug: 'crm', mode: 'view' };

  beforeEach(() => {
    jest.clearAllMocks();
    appEnvironmentService.getEnvironment.mockResolvedValue({ environment: { id: 'env-1', name: 'production' } });
    orgEnvironmentConstantService.getConstantsFromEnvironment.mockResolvedValue({ constants: ['c'] });
    dataqueryService.getAll.mockResolvedValue({ data_queries: ['q'] });
  });

  it('starts them all at once when the viewer knows its environment and version', () => {
    createViewerReads({ early: true, ...ids });
    expect(appEnvironmentService.getEnvironment).toHaveBeenCalledWith('env-1', { slug: 'crm' });
    expect(orgEnvironmentConstantService.getConstantsFromEnvironment).toHaveBeenCalledWith('env-1');
    expect(dataqueryService.getAll).toHaveBeenCalledWith('ver-1', 'view');
  });

  it('answers each read from the one already started', async () => {
    const reads = createViewerReads({ early: true, ...ids });
    await expect(reads.environment('env-1', { slug: 'crm' })).resolves.toEqual({
      environment: { id: 'env-1', name: 'production' },
    });
    await expect(reads.constants('env-1')).resolves.toEqual({ constants: ['c'] });
    await expect(reads.queries('ver-1', 'view')).resolves.toEqual({ data_queries: ['q'] });
    expect(appEnvironmentService.getEnvironment).toHaveBeenCalledTimes(1);
    expect(orgEnvironmentConstantService.getConstantsFromEnvironment).toHaveBeenCalledTimes(1);
    expect(dataqueryService.getAll).toHaveBeenCalledTimes(1);
  });

  it('reads afresh when the definition names another environment or version', async () => {
    const reads = createViewerReads({ early: true, ...ids });
    await reads.constants('env-2');
    await reads.queries('ver-2', 'view');
    expect(orgEnvironmentConstantService.getConstantsFromEnvironment).toHaveBeenLastCalledWith('env-2');
    expect(dataqueryService.getAll).toHaveBeenLastCalledWith('ver-2', 'view');
  });

  it('starts nothing early otherwise, and reads each when asked', async () => {
    const reads = createViewerReads({ early: false, ...ids });
    expect(appEnvironmentService.getEnvironment).not.toHaveBeenCalled();
    expect(orgEnvironmentConstantService.getConstantsFromEnvironment).not.toHaveBeenCalled();
    expect(dataqueryService.getAll).not.toHaveBeenCalled();
    await reads.queries('ver-1', 'view');
    expect(dataqueryService.getAll).toHaveBeenCalledWith('ver-1', 'view');
  });

  it('fails a read where it is used, never before', async () => {
    const failure = new Error('constants unavailable');
    orgEnvironmentConstantService.getConstantsFromEnvironment.mockRejectedValue(failure);
    const unhandled = jest.fn();
    process.on('unhandledRejection', unhandled);
    const reads = createViewerReads({ early: true, ...ids });
    await new Promise((resolve) => setTimeout(resolve, 0));
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
    await expect(reads.constants('env-1')).rejects.toBe(failure);
  });
});
