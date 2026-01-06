import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import * as crypto from 'crypto';
import { PythonBundleGenerationService } from '../../ee/workflows/services/python-bundle-generation.service';
import { WorkflowBundle } from '../../src/entities/workflow_bundle.entity';

// Mock external dependencies
jest.mock('fs/promises');
jest.mock('child_process');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockExec = exec as jest.MockedFunction<typeof exec>;

/**
 * @group workflows
 */
describe('WorkflowBundle Entity - Python Support', () => {
  let repository: jest.Mocked<Repository<WorkflowBundle>>;

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn((entity) => ({ ...entity } as WorkflowBundle)),
      findOne: jest.fn(),
      save: jest.fn(),
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(WorkflowBundle),
          useValue: mockRepository,
        },
      ],
    }).compile();

    repository = module.get(getRepositoryToken(WorkflowBundle));
  });

  describe('language column', () => {
    it('should accept javascript as language value', () => {
      const bundle = repository.create({
        appVersionId: 'test-app-version-js',
        dependencies: '{"lodash": "4.17.21"}', // JSON string for JavaScript
        language: 'javascript',
        status: 'none',
      });

      expect(bundle.language).toBe('javascript');
    });

    it('should accept python as language value', () => {
      const bundle = repository.create({
        appVersionId: 'test-app-version-python',
        dependencies: 'pandas==2.2.0', // requirements.txt format for Python
        language: 'python',
        status: 'none',
      });

      expect(bundle.language).toBe('python');
    });
  });

  describe('runtimeVersion column', () => {
    it('should accept semver format for Python version', () => {
      const bundle = repository.create({
        appVersionId: 'test-app-version-py-version',
        dependencies: 'numpy==1.26.0', // requirements.txt format
        language: 'python',
        runtimeVersion: '3.11.0',
        status: 'none',
      });

      expect(bundle.runtimeVersion).toBe('3.11.0');
    });

    it('should accept semver format for Node version', () => {
      const bundle = repository.create({
        appVersionId: 'test-app-version-node-version',
        dependencies: '{"lodash": "4.17.21"}', // JSON string
        language: 'javascript',
        runtimeVersion: '20.10.0',
        status: 'none',
      });

      expect(bundle.runtimeVersion).toBe('20.10.0');
    });

    it('should allow undefined runtimeVersion for backward compatibility', () => {
      const bundle = repository.create({
        appVersionId: 'test-app-version-no-version',
        dependencies: '{"lodash": "4.17.21"}', // JSON string
        status: 'none',
      });

      expect(bundle.runtimeVersion).toBeUndefined();
    });
  });

  describe('bundleBinary column', () => {
    it('should accept Buffer for Python tar.gz bundles', () => {
      const tarGzContent = Buffer.from('fake-tar-gz-content-for-testing');

      const bundle = repository.create({
        appVersionId: 'test-app-version-binary',
        dependencies: 'pandas==2.2.0', // requirements.txt format
        language: 'python',
        runtimeVersion: '3.11.0',
        bundleBinary: tarGzContent,
        status: 'ready',
      });

      expect(bundle.bundleBinary).toBeInstanceOf(Buffer);
      expect(bundle.bundleBinary.toString()).toBe('fake-tar-gz-content-for-testing');
    });

    it('should accept Buffer for JavaScript bundles (consolidated schema)', () => {
      const jsBundle = repository.create({
        appVersionId: 'test-app-version-js-binary',
        dependencies: '{"lodash": "4.17.21"}', // JSON string
        language: 'javascript',
        bundleBinary: Buffer.from('var WorkflowPackages = {};', 'utf-8'),
        status: 'ready',
      });

      expect(jsBundle.bundleBinary).toBeInstanceOf(Buffer);
      expect(jsBundle.bundleBinary.toString('utf-8')).toBe('var WorkflowPackages = {};');
    });
  });

  describe('consolidated schema - JS and Python both use bundleBinary', () => {
    it('should support JavaScript bundle with bundleBinary (BYTEA - stores text as Buffer)', () => {
      const jsBundle = repository.create({
        appVersionId: 'test-unified-js',
        dependencies: '{"lodash": "4.17.21"}', // JSON string
        language: 'javascript',
        runtimeVersion: '20.10.0',
        bundleBinary: Buffer.from('var WorkflowPackages = { lodash: {} };', 'utf-8'),
        status: 'ready',
      });

      expect(jsBundle.language).toBe('javascript');
      expect(jsBundle.bundleBinary).toBeDefined();
      expect(jsBundle.bundleBinary.toString('utf-8')).toContain('WorkflowPackages');
    });

    it('should support Python bundle with bundleBinary (BYTEA - stores tar.gz)', () => {
      const pyBundle = repository.create({
        appVersionId: 'test-unified-py',
        dependencies: 'pandas==2.2.0', // requirements.txt format
        language: 'python',
        runtimeVersion: '3.11.0',
        bundleBinary: Buffer.from('tar-gz-content'),
        status: 'ready',
      });

      expect(pyBundle.language).toBe('python');
      expect(pyBundle.bundleBinary).toBeDefined();
    });
  });
});

describe('WorkflowBundle Entity - Type Definitions', () => {
  it('should have correct TypeScript types for new columns', () => {
    // Type-level test - if this compiles, types are correct
    const bundle: Partial<WorkflowBundle> = {
      language: 'python',
      runtimeVersion: '3.11.0',
      bundleBinary: Buffer.from('test'),
    };

    expect(bundle.language).toBe('python');
    expect(bundle.runtimeVersion).toBe('3.11.0');
    expect(bundle.bundleBinary).toBeInstanceOf(Buffer);
  });

  it('should only allow valid language values', () => {
    // TypeScript compile-time check - these should be the only valid values
    const jsBundle: Partial<WorkflowBundle> = { language: 'javascript' };
    const pyBundle: Partial<WorkflowBundle> = { language: 'python' };

    expect(jsBundle.language).toBe('javascript');
    expect(pyBundle.language).toBe('python');
  });
});

describe('PythonBundleGenerationService', () => {
  const mockAppVersionId = 'test-workflow-id-123';
  // Python dependencies are stored as raw requirements.txt content (string format)
  const mockDependencies = 'pandas==2.2.0\nnumpy==1.26.0';

  let service: PythonBundleGenerationService;
  let repository: jest.Mocked<Repository<WorkflowBundle>>;

  beforeEach(async () => {
    const mockRepository = {
      findOne: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PythonBundleGenerationService,
        {
          provide: getRepositoryToken(WorkflowBundle),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PythonBundleGenerationService>(PythonBundleGenerationService);
    repository = module.get(getRepositoryToken(WorkflowBundle));

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateBundle', () => {
    beforeEach(() => {
      // Mock filesystem operations
      mockFs.mkdtemp = jest.fn().mockResolvedValue('/tmp/python-bundle-test-123') as any;
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(Buffer.from('fake-tar-gz-content'));
      mockFs.rm.mockResolvedValue(undefined);

      // Mock exec for pip install and tar commands
      (mockExec as any).mockImplementation((cmd: string, options: any, callback: any) => {
        setTimeout(() => callback(null, { stdout: '', stderr: '' }), 10);
      });
    });

    it('should create requirements.txt from dependencies', async () => {
      await service.generateBundle(mockAppVersionId, mockDependencies);

      // Verify requirements.txt was written with correct format
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/requirements\.txt$/),
        expect.stringContaining('pandas==2.2.0')
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/requirements\.txt$/),
        expect.stringContaining('numpy==1.26.0')
      );
    });

    it('should run pip install with correct flags', async () => {
      await service.generateBundle(mockAppVersionId, mockDependencies);

      // Verify pip install was called with --target and --no-cache-dir
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('pip3 install'),
        expect.anything(),
        expect.any(Function)
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('--target'),
        expect.anything(),
        expect.any(Function)
      );
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('--no-cache-dir'),
        expect.anything(),
        expect.any(Function)
      );
    });

    it('should create tar.gz archive', async () => {
      await service.generateBundle(mockAppVersionId, mockDependencies);

      // Verify tar command was called
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('tar -czf'),
        expect.anything(),
        expect.any(Function)
      );
    });

    it('should store bundle in database with correct columns', async () => {
      await service.generateBundle(mockAppVersionId, mockDependencies);

      // Verify database upsert was called twice (building, then ready)
      expect(repository.upsert).toHaveBeenCalledTimes(2);

      // Check final upsert call
      const finalCall = (repository.upsert as jest.Mock).mock.calls[1];
      expect(finalCall[0]).toMatchObject({
        appVersionId: mockAppVersionId,
        language: 'python',
        runtimeVersion: expect.stringMatching(/^\d+\.\d+\.\d+$/), // semver
        dependencies: mockDependencies,
        bundleBinary: expect.any(Buffer),
        bundleSize: expect.any(Number),
        bundleSha: expect.any(String),
        status: 'ready',
        error: null,
        generationTimeMs: expect.any(Number),
      });
      expect(finalCall[1]).toEqual(['appVersionId', 'language']);
    });

    it('should calculate SHA-256 hash of tar.gz', async () => {
      const mockTarContent = Buffer.from('test-tar-content');
      mockFs.readFile.mockResolvedValue(mockTarContent);

      await service.generateBundle(mockAppVersionId, mockDependencies);

      const expectedSha = crypto.createHash('sha256').update(mockTarContent).digest('hex');
      const finalCall = (repository.upsert as jest.Mock).mock.calls[1];
      expect(finalCall[0].bundleSha).toBe(expectedSha);
    });

    it('should update status to building during generation', async () => {
      await service.generateBundle(mockAppVersionId, mockDependencies);

      const firstCall = (repository.upsert as jest.Mock).mock.calls[0];
      expect(firstCall[0]).toMatchObject({
        appVersionId: mockAppVersionId,
        language: 'python',
        status: 'building',
        dependencies: mockDependencies,
      });
    });

    it('should update status to failed on pip error', async () => {
      const errorMessage = 'pip install failed';
      (mockExec as any).mockImplementation((cmd: string, options: any, callback: any) => {
        if (cmd.includes('pip')) {
          setTimeout(() => callback(new Error(errorMessage)), 10);
        } else {
          setTimeout(() => callback(null, { stdout: '', stderr: '' }), 10);
        }
      });

      await expect(service.generateBundle(mockAppVersionId, mockDependencies)).rejects.toThrow(errorMessage);

      const finalCall = (repository.upsert as jest.Mock).mock.calls[1];
      expect(finalCall[0]).toMatchObject({
        appVersionId: mockAppVersionId,
        status: 'failed',
        error: errorMessage,
      });
    });

    it('should cleanup temp directory on success', async () => {
      await service.generateBundle(mockAppVersionId, mockDependencies);

      expect(mockFs.rm).toHaveBeenCalledWith(
        expect.stringMatching(/\/tmp\/python-bundle/),
        { recursive: true, force: true }
      );
    });

    it('should cleanup temp directory on failure', async () => {
      (mockExec as any).mockImplementation((cmd: string, options: any, callback: any) => {
        setTimeout(() => callback(new Error('Build failed')), 10);
      });

      await expect(service.generateBundle(mockAppVersionId, mockDependencies)).rejects.toThrow('Build failed');

      expect(mockFs.rm).toHaveBeenCalledWith(
        expect.stringMatching(/\/tmp\/python-bundle/),
        { recursive: true, force: true }
      );
    });

    it('should handle empty dependencies', async () => {
      await service.generateBundle(mockAppVersionId, ''); // Empty requirements.txt

      expect(repository.upsert).toHaveBeenCalledTimes(2);
      const finalCall = (repository.upsert as jest.Mock).mock.calls[1];
      expect(finalCall[0].dependencies).toEqual('');
    });

    it('should measure generation time accurately', async () => {
      const startTime = Date.now();
      await service.generateBundle(mockAppVersionId, mockDependencies);
      const endTime = Date.now();

      const finalCall = (repository.upsert as jest.Mock).mock.calls[1];
      const generationTime = finalCall[0].generationTimeMs;

      expect(generationTime).toBeGreaterThanOrEqual(0);
      expect(generationTime).toBeLessThanOrEqual(endTime - startTime + 100);
    });
  });

  describe('getBundleForExecution', () => {
    it('should return bundleBinary for ready Python bundles', async () => {
      const mockBinaryContent = Buffer.from('mock-tar-gz-content');
      repository.findOne.mockResolvedValue({
        bundleBinary: mockBinaryContent,
        language: 'python',
      } as unknown as WorkflowBundle);

      const result = await service.getBundleForExecution(mockAppVersionId);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('mock-tar-gz-content');
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { appVersionId: mockAppVersionId, language: 'python', status: 'ready' },
        select: ['bundleBinary'],
      });
    });

    it('should return null for non-existent bundles', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getBundleForExecution(mockAppVersionId);

      expect(result).toBeNull();
    });
  });

  describe('getCurrentDependencies', () => {
    it('should return dependencies for existing Python bundle', async () => {
      repository.findOne.mockResolvedValue({
        dependencies: mockDependencies,
        language: 'python',
      } as unknown as WorkflowBundle);

      const result = await service.getCurrentDependencies(mockAppVersionId);

      expect(result).toEqual(mockDependencies);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { appVersionId: mockAppVersionId, language: 'python' },
        select: ['dependencies'],
      });
    });

    it('should return empty string for non-existent bundle', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getCurrentDependencies(mockAppVersionId);

      expect(result).toEqual(''); // Empty requirements.txt content
    });
  });

  describe('getBundleStatus', () => {
    it('should return complete status for existing bundle', async () => {
      const mockBundle = {
        status: 'ready' as const,
        bundleSize: 5000000,
        generationTimeMs: 30000,
        error: null,
        dependencies: mockDependencies,
        bundleSha: 'abcd1234',
        language: 'python',
        runtimeVersion: '3.11.0',
      };
      repository.findOne.mockResolvedValue(mockBundle as unknown as WorkflowBundle);

      const result = await service.getBundleStatus(mockAppVersionId);

      expect(result).toEqual({
        status: 'ready',
        sizeBytes: 5000000,
        generationTimeMs: 30000,
        error: null,
        dependencies: mockDependencies,
        bundleSha: 'abcd1234',
        language: 'python',
        runtimeVersion: '3.11.0',
      });
    });

    it('should return none status for non-existent bundle', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.getBundleStatus(mockAppVersionId);

      expect(result).toEqual({ status: 'none' });
    });
  });

  describe('updatePackages', () => {
    beforeEach(() => {
      mockFs.mkdtemp = jest.fn().mockResolvedValue('/tmp/python-bundle-test-123') as any;
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(Buffer.from('fake-tar-gz-content'));
      mockFs.rm.mockResolvedValue(undefined);

      (mockExec as any).mockImplementation((cmd: string, options: any, callback: any) => {
        setTimeout(() => callback(null, { stdout: '', stderr: '' }), 10);
      });
    });

    it('should call generateBundle with correct parameters', async () => {
      const generateBundleSpy = jest.spyOn(service, 'generateBundle').mockResolvedValue(undefined);

      await service.updatePackages(mockAppVersionId, mockDependencies);

      expect(generateBundleSpy).toHaveBeenCalledWith(mockAppVersionId, mockDependencies);
    });
  });
});
