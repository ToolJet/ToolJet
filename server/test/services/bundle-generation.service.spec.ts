import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import * as esbuild from 'esbuild';
import * as crypto from 'crypto';
import { BundleGenerationService } from '../../ee/workflows/services/bundle-generation.service';
import { BundleGenerationService as BaseBundleGenerationService } from '../../src/modules/workflows/services/bundle-generation.service';
import { WorkflowBundle } from '../../src/entities/workflow_bundle.entity';

// Mock external dependencies
jest.mock('fs/promises');
jest.mock('child_process');
jest.mock('esbuild');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockExec = exec as jest.MockedFunction<typeof exec>;
const mockEsbuild = esbuild as jest.Mocked<typeof esbuild>;

/**
 * @group workflows
 */
describe('BundleGenerationService', () => {
  const mockWorkflowId = 'test-workflow-id-123';
  const mockDependencies = { lodash: '4.17.21', moment: '2.29.4' };

  describe('Community Edition', () => {
    let ceService: BaseBundleGenerationService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [BaseBundleGenerationService],
      }).compile();

      ceService = module.get<BaseBundleGenerationService>(BaseBundleGenerationService);
    });

    it('should throw error for updatePackages in CE', async () => {
      await expect(ceService.updatePackages(mockWorkflowId, mockDependencies)).rejects.toThrow(
        'Package bundling is not available in Community Edition'
      );
    });

    it('should throw error for generateBundle in CE', async () => {
      await expect(ceService.generateBundle(mockWorkflowId, mockDependencies)).rejects.toThrow(
        'Package bundling is not available in Community Edition'
      );
    });

    it('should return null for getBundleForExecution in CE', async () => {
      const result = await ceService.getBundleForExecution(mockWorkflowId);
      expect(result).toBeNull();
    });

    it('should return empty object for getCurrentDependencies in CE', async () => {
      const result = await ceService.getCurrentDependencies(mockWorkflowId);
      expect(result).toEqual({});
    });

    it('should return none status for getBundleStatus in CE', async () => {
      const result = await ceService.getBundleStatus(mockWorkflowId);
      expect(result).toEqual({ status: 'none' });
    });

    it('should throw error for rebuildBundle in CE', async () => {
      await expect(ceService.rebuildBundle(mockWorkflowId)).rejects.toThrow(
        'Package bundling is not available in Community Edition'
      );
    });

    it('should have all required methods', () => {
      expect(typeof ceService.updatePackages).toBe('function');
      expect(typeof ceService.generateBundle).toBe('function');
      expect(typeof ceService.getBundleForExecution).toBe('function');
      expect(typeof ceService.getCurrentDependencies).toBe('function');
      expect(typeof ceService.getBundleStatus).toBe('function');
      expect(typeof ceService.rebuildBundle).toBe('function');
    });
  });

  describe('Enterprise Edition', () => {
    let eeService: BundleGenerationService;
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
          BundleGenerationService,
          {
            provide: getRepositoryToken(WorkflowBundle),
            useValue: mockRepository,
          },
        ],
      }).compile();

      eeService = module.get<BundleGenerationService>(BundleGenerationService);
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
        // mkdtemp must return a concrete tmp dir path used later for writeFile/rm
        mockFs.mkdtemp = jest.fn().mockResolvedValue('/tmp/bundle-test-workflow-id-123-1699999999') as any;
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.writeFile.mockResolvedValue(undefined);
        mockFs.rm.mockResolvedValue(undefined);

        // Mock npm install
        const mockChildProcess = {
          stdout: '',
          stderr: '',
        };
        (mockExec as any).mockImplementation((cmd: string, options: any, callback: any) => {
          setTimeout(() => callback(null, mockChildProcess), 100);
        });

        // Mock esbuild
        const mockBundleContent = 'var WorkflowPackages = (() => { return { lodash: require("lodash") }; })();';
        mockEsbuild.build.mockResolvedValue({
          outputFiles: [{ text: mockBundleContent }],
          metafile: {},
        } as any);
      });

      it('should generate bundle with valid dependencies', async () => {
        await eeService.generateBundle(mockWorkflowId, mockDependencies);

        // Verify database operations
        expect(repository.upsert).toHaveBeenCalledTimes(2); // Once for 'building', once for 'ready'

        // Check final upsert call
        const finalCall = (repository.upsert as jest.Mock).mock.calls[1];
        expect(finalCall[0]).toMatchObject({
          dependencies: mockDependencies,
          status: 'ready',
          bundleContent: expect.any(String),
          bundleSize: expect.any(Number),
          bundleSha: expect.any(String),
          generationTimeMs: expect.any(Number),
          error: null,
        });
        expect(finalCall[1]).toEqual(['appVersionId']);
      });

      it('should calculate SHA-256 hash correctly', async () => {
        const mockBundleContent = 'test-bundle-content';
        mockEsbuild.build.mockResolvedValue({
          outputFiles: [{ text: mockBundleContent }],
          metafile: {},
        } as any);

        await eeService.generateBundle(mockWorkflowId, mockDependencies);

        const expectedSha = crypto.createHash('sha256').update(mockBundleContent).digest('hex');
        const finalCall = (repository.upsert as jest.Mock).mock.calls[1];
        expect(finalCall[0].bundleSha).toBe(expectedSha);
      });

      it('should handle empty dependencies object', async () => {
        await eeService.generateBundle(mockWorkflowId, {});

        expect(repository.upsert).toHaveBeenCalledTimes(2);
        const finalCall = (repository.upsert as jest.Mock).mock.calls[1];
        expect(finalCall[0].dependencies).toEqual({});
      });

      it('should block Node.js built-ins in esbuild config', async () => {
        await eeService.generateBundle(mockWorkflowId, mockDependencies);

        expect(mockEsbuild.build).toHaveBeenCalledWith(
          expect.objectContaining({
            external: expect.arrayContaining([
              'fs',
              'path',
              'crypto',
              'child_process',
              'net',
              'http',
              'https',
              'os',
              'process',
              'vm',
            ]),
          })
        );
      });

      it('should use secure npm install flags', async () => {
        await eeService.generateBundle(mockWorkflowId, mockDependencies);

        expect(mockExec).toHaveBeenCalledWith(
          'npm ci --production --ignore-scripts --no-audit --no-fund',
          expect.objectContaining({
            env: expect.objectContaining({
              npm_config_ignore_scripts: 'true',
              npm_config_audit: 'false',
              npm_config_fund: 'false',
            }),
          }),
          expect.any(Function)
        );
      });

      it('should cleanup temp directory on success', async () => {
        await eeService.generateBundle(mockWorkflowId, mockDependencies);

        expect(mockFs.rm).toHaveBeenCalledWith(expect.stringMatching(/\/tmp\/bundle-test-workflow-id-123-\d+/), {
          recursive: true,
          force: true,
        });
      });

      it('should cleanup temp directory on failure', async () => {
        mockEsbuild.build.mockRejectedValue(new Error('Build failed'));

        await expect(eeService.generateBundle(mockWorkflowId, mockDependencies)).rejects.toThrow('Build failed');

        expect(mockFs.rm).toHaveBeenCalledWith(expect.stringMatching(/\/tmp\/bundle-test-workflow-id-123-\d+/), {
          recursive: true,
          force: true,
        });
      });

      it('should update status to building during generation', async () => {
        await eeService.generateBundle(mockWorkflowId, mockDependencies);

        const firstCall = (repository.upsert as jest.Mock).mock.calls[0];
        expect(firstCall[0]).toMatchObject({
          appVersionId: mockWorkflowId,
          status: 'building',
          dependencies: mockDependencies,
        });
      });

      it('should update status to failed on error', async () => {
        const errorMessage = 'npm install failed';
        (mockExec as any).mockImplementation((cmd: string, options: any, callback: any) => {
          setTimeout(() => callback(new Error(errorMessage)), 100);
        });

        await expect(eeService.generateBundle(mockWorkflowId, mockDependencies)).rejects.toThrow(errorMessage);

        const finalCall = (repository.upsert as jest.Mock).mock.calls[1];
        expect(finalCall[0]).toMatchObject({
          appVersionId: mockWorkflowId,
          status: 'failed',
          error: errorMessage,
        });
      });

      it('should measure generation time accurately', async () => {
        const startTime = Date.now();
        await eeService.generateBundle(mockWorkflowId, mockDependencies);
        const endTime = Date.now();

        const finalCall = (repository.upsert as jest.Mock).mock.calls[1];
        const generationTime = finalCall[0].generationTimeMs;

        expect(generationTime).toBeGreaterThanOrEqual(0);
        expect(generationTime).toBeLessThanOrEqual(endTime - startTime + 100); // Allow small margin
      });
    });

    describe('getBundleForExecution', () => {
      it('should return bundle content for ready bundles', async () => {
        const mockBundleContent = 'test-bundle-content';
        repository.findOne.mockResolvedValue({
          bundleContent: mockBundleContent,
        } as WorkflowBundle);

        const result = await eeService.getBundleForExecution(mockWorkflowId);

        expect(result).toBe(mockBundleContent);
        expect(repository.findOne).toHaveBeenCalledWith({
          where: { appVersionId: mockWorkflowId, status: 'ready' },
          select: ['bundleContent'],
        });
      });

      it('should return null for non-existent bundles', async () => {
        repository.findOne.mockResolvedValue(null);

        const result = await eeService.getBundleForExecution(mockWorkflowId);

        expect(result).toBeNull();
      });

      it('should return null for failed bundles', async () => {
        // Only ready bundles should be returned
        repository.findOne.mockResolvedValue(null); // Query filters by status: 'ready'

        const result = await eeService.getBundleForExecution(mockWorkflowId);

        expect(result).toBeNull();
      });
    });

    describe('getCurrentDependencies', () => {
      it('should return dependencies for existing bundle', async () => {
        repository.findOne.mockResolvedValue({
          id: 'test-id',
          appVersionId: mockWorkflowId,
          dependencies: mockDependencies,
          bundleContent: null,
          bundleSize: null,
          bundleSha: null,
          generationTimeMs: null,
          error: null,
          status: 'none',
          createdAt: new Date(),
          updatedAt: new Date(),
          appVersion: null,
        } as WorkflowBundle);

        const result = await eeService.getCurrentDependencies(mockWorkflowId);

        expect(result).toEqual(mockDependencies);
        expect(repository.findOne).toHaveBeenCalledWith({
          where: { appVersionId: mockWorkflowId },
          select: ['dependencies'],
        });
      });

      it('should return empty object for non-existent bundle', async () => {
        repository.findOne.mockResolvedValue(null);

        const result = await eeService.getCurrentDependencies(mockWorkflowId);

        expect(result).toEqual({});
      });
    });

    describe('getBundleStatus', () => {
      it('should return complete status for existing bundle', async () => {
        const mockBundle = {
          status: 'ready' as const,
          bundleSize: 12345,
          generationTimeMs: 500,
          error: null,
          dependencies: mockDependencies,
          bundleSha: 'abcd1234',
        };
        repository.findOne.mockResolvedValue({
          id: 'test-id',
          appVersionId: mockWorkflowId,
          ...mockBundle,
          bundleContent: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          appVersion: null,
        } as WorkflowBundle);

        const result = await eeService.getBundleStatus(mockWorkflowId);

        expect(result).toEqual({
          status: 'ready',
          sizeBytes: 12345,
          generationTimeMs: 500,
          error: null,
          dependencies: mockDependencies,
          bundleSha: 'abcd1234',
        });
      });

      it('should return none status for non-existent bundle', async () => {
        repository.findOne.mockResolvedValue(null);

        const result = await eeService.getBundleStatus(mockWorkflowId);

        expect(result).toEqual({ status: 'none' });
      });
    });

    describe('rebuildBundle', () => {
      it('should rebuild existing bundle', async () => {
        repository.findOne.mockResolvedValue({
          id: 'test-id',
          appVersionId: mockWorkflowId,
          dependencies: mockDependencies,
          bundleContent: null,
          bundleSize: null,
          bundleSha: null,
          generationTimeMs: null,
          error: null,
          status: 'none',
          createdAt: new Date(),
          updatedAt: new Date(),
          appVersion: null,
        } as WorkflowBundle);

        // Mock the generateBundle method
        const generateBundleSpy = jest.spyOn(eeService, 'generateBundle').mockResolvedValue();

        await eeService.rebuildBundle(mockWorkflowId);

        expect(generateBundleSpy).toHaveBeenCalledWith(mockWorkflowId, mockDependencies);
      });

      it('should throw error for non-existent bundle', async () => {
        repository.findOne.mockResolvedValue(null);

        await expect(eeService.rebuildBundle(mockWorkflowId)).rejects.toThrow('No dependencies to rebuild');
      });

      it('should throw error for bundle with empty dependencies', async () => {
        repository.findOne.mockResolvedValue({
          dependencies: {},
        } as WorkflowBundle);

        await expect(eeService.rebuildBundle(mockWorkflowId)).rejects.toThrow('No dependencies to rebuild');
      });
    });

    describe('updatePackages', () => {
      it('should call generateBundle with correct parameters', async () => {
        const generateBundleSpy = jest.spyOn(eeService, 'generateBundle').mockResolvedValue();

        await eeService.updatePackages(mockWorkflowId, mockDependencies);

        expect(generateBundleSpy).toHaveBeenCalledWith(mockWorkflowId, mockDependencies);
      });
    });
  });
});
