/** @jest-environment setup-polly-jest/jest-environment-node */

import { Test, TestingModule } from '@nestjs/testing';
import { PyPiRegistryService } from '../../ee/workflows/services/pypi-registry.service';
import { PyPiRegistryService as BasePyPiRegistryService } from '../../src/modules/workflows/services/pypi-registry.service';
import { setupPolly } from 'setup-polly-jest';
import * as NodeHttpAdapter from '@pollyjs/adapter-node-http';
import * as FSPersister from '@pollyjs/persister-fs';
import * as path from 'path';

/**
 * @group workflows
 */
describe('PyPiRegistryService', () => {
  describe('Community Edition', () => {
    let ceService: BasePyPiRegistryService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [BasePyPiRegistryService],
      }).compile();

      ceService = module.get<BasePyPiRegistryService>(BasePyPiRegistryService);
    });

    it('should throw error for searchPackages in CE', async () => {
      await expect(ceService.searchPackages('pandas', 5)).rejects.toThrow(
        'PyPI package search is not available in Community Edition'
      );
    });

    it('should throw error for getPackageInfo in CE', async () => {
      await expect(ceService.getPackageInfo('pandas')).rejects.toThrow(
        'PyPI package info is not available in Community Edition'
      );
    });

    it('should throw error for getPackageVersions in CE', async () => {
      await expect(ceService.getPackageVersions('pandas')).rejects.toThrow(
        'PyPI package versions is not available in Community Edition'
      );
    });

    it('should throw error for hasPrebuiltWheel in CE', async () => {
      await expect(ceService.hasPrebuiltWheel('pandas', '2.2.0')).rejects.toThrow(
        'PyPI wheel check is not available in Community Edition'
      );
    });

    it('should have required methods', () => {
      expect(typeof ceService.searchPackages).toBe('function');
      expect(typeof ceService.getPackageInfo).toBe('function');
      expect(typeof ceService.getPackageVersions).toBe('function');
      expect(typeof ceService.hasPrebuiltWheel).toBe('function');
    });
  });

  describe('Enterprise Edition', () => {
    let eeService: PyPiRegistryService;

    const context = setupPolly({
      adapters: [NodeHttpAdapter as any],
      persister: FSPersister as any,
      recordFailedRequests: true,
      matchRequestsBy: {
        method: true,
        headers: {
          exclude: ['user-agent', 'accept-encoding', 'connection'],
        },
        body: true,
        url: {
          protocol: true,
          username: true,
          password: true,
          hostname: true,
          port: true,
          pathname: true,
          query: true,
        },
      },
      persisterOptions: {
        fs: {
          recordingsDir: path.resolve(
            __dirname,
            `../__fixtures__/${path.basename(__filename).replace(/\.[tj]s$/, '')}`
          ),
        },
      },
    });

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [PyPiRegistryService],
      }).compile();

      eeService = module.get<PyPiRegistryService>(PyPiRegistryService);
    });

    afterEach(() => {
      context.polly.stop();
    });

    describe('getPackageInfo', () => {
      it('should fetch package info for pandas', async () => {
        const packageInfo = await eeService.getPackageInfo('pandas');

        expect(packageInfo).toBeDefined();
        expect(packageInfo).toHaveProperty('name', 'pandas');
        expect(packageInfo).toHaveProperty('description');
        expect(packageInfo).toHaveProperty('versions');
        expect(packageInfo).toHaveProperty('version');
        expect(Array.isArray(packageInfo.versions)).toBe(true);
        expect(packageInfo.versions.length).toBeGreaterThan(0);
      });

      it('should fetch package info for numpy', async () => {
        const packageInfo = await eeService.getPackageInfo('numpy');

        expect(packageInfo).toBeDefined();
        expect(packageInfo).toHaveProperty('name', 'numpy');
        expect(packageInfo).toHaveProperty('versions');
        expect(Array.isArray(packageInfo.versions)).toBe(true);
      });

      it('should throw error for non-existent packages', async () => {
        await expect(eeService.getPackageInfo('nonexistentpackagethatdoesnotexist12345')).rejects.toThrow();
      });

      it('should fetch package info for requests (pure Python package)', async () => {
        const packageInfo = await eeService.getPackageInfo('requests');

        expect(packageInfo).toBeDefined();
        expect(packageInfo).toHaveProperty('name', 'requests');
        expect(packageInfo).toHaveProperty('versions');
        expect(packageInfo).toHaveProperty('license');
      });
    });

    describe('getPackageVersions', () => {
      it('should return versions for pandas', async () => {
        const versions = await eeService.getPackageVersions('pandas');

        expect(versions).toBeDefined();
        expect(Array.isArray(versions)).toBe(true);
        expect(versions.length).toBeGreaterThan(0);
        // Versions should be strings
        expect(typeof versions[0]).toBe('string');
      });

      it('should return versions for flask', async () => {
        const versions = await eeService.getPackageVersions('flask');

        expect(versions).toBeDefined();
        expect(Array.isArray(versions)).toBe(true);
        expect(versions.length).toBeGreaterThan(0);
      });
    });

    describe('hasPrebuiltWheel', () => {
      it('should detect manylinux wheel for pandas', async () => {
        const hasWheel = await eeService.hasPrebuiltWheel('pandas', '2.2.0');

        expect(typeof hasWheel).toBe('boolean');
        expect(hasWheel).toBe(true); // pandas has manylinux wheels
      });

      it('should detect manylinux wheel for numpy', async () => {
        const hasWheel = await eeService.hasPrebuiltWheel('numpy', '1.26.0');

        expect(typeof hasWheel).toBe('boolean');
        expect(hasWheel).toBe(true); // numpy has manylinux wheels
      });

      it('should detect pure Python wheel for requests', async () => {
        const hasWheel = await eeService.hasPrebuiltWheel('requests', '2.31.0');

        expect(typeof hasWheel).toBe('boolean');
        expect(hasWheel).toBe(true); // requests is pure Python (-none-any.whl)
      });

      it('should return false for non-existent version', async () => {
        const hasWheel = await eeService.hasPrebuiltWheel('pandas', '999.999.999');

        expect(hasWheel).toBe(false);
      });
    });

    describe('searchPackages', () => {
      it('should search and find pandas package', async () => {
        const results = await eeService.searchPackages('pandas', 5);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);

        // Since we're using direct package lookup, should find pandas
        if (results.length > 0) {
          expect(results[0]).toHaveProperty('name');
          expect(results[0]).toHaveProperty('version');
          expect(results[0]).toHaveProperty('description');
        }
      });

      it('should return empty array for non-existent package', async () => {
        const results = await eeService.searchPackages('nonexistentpackagethatdoesnotexist12345', 10);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
      });

      it('should handle network errors gracefully', async () => {
        // Mock a network error scenario using Polly.js
        context.polly.server.get('https://pypi.org/pypi/*').intercept((req, res) => {
          res.status(500).send('Internal Server Error');
        });

        const results = await eeService.searchPackages('test-network-error', 5);

        // Should return empty array on error (graceful degradation)
        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
      });
    });

    describe('comprehensive integration tests', () => {
      it('should fetch package info with correct structure', async () => {
        const packageInfo = await eeService.getPackageInfo('flask');

        expect(packageInfo).toBeDefined();
        // PyPI returns canonical name which may be capitalized (e.g., "Flask")
        expect(packageInfo.name.toLowerCase()).toBe('flask');
        expect(packageInfo.version).toBeDefined();
        expect(Array.isArray(packageInfo.versions)).toBe(true);
        expect(packageInfo.versions.length).toBeGreaterThan(0);
      });

      it('should verify wheel availability matches package type', async () => {
        // pandas should have manylinux wheels (compiled)
        const pandasHasWheel = await eeService.hasPrebuiltWheel('pandas', '2.2.0');
        expect(pandasHasWheel).toBe(true);

        // requests should have pure Python wheels
        const requestsHasWheel = await eeService.hasPrebuiltWheel('requests', '2.31.0');
        expect(requestsHasWheel).toBe(true);
      });
    });
  });
});
