/** @jest-environment setup-polly-jest/jest-environment-node */

import { Test, TestingModule } from '@nestjs/testing';
import { NpmRegistryService } from '../../ee/workflows/services/npm-registry.service';
import { NpmRegistryService as BaseNpmRegistryService } from '../../src/modules/workflows/services/npm-registry.service';
import { setupPolly } from 'setup-polly-jest';
import * as NodeHttpAdapter from '@pollyjs/adapter-node-http';
import * as FSPersister from '@pollyjs/persister-fs';
import * as path from 'path';

/**
 * @group workflows
 */
describe('NpmRegistryService', () => {
  describe('Community Edition', () => {
    let ceService: BaseNpmRegistryService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [BaseNpmRegistryService],
      }).compile();

      ceService = module.get<BaseNpmRegistryService>(BaseNpmRegistryService);
    });

    it('should throw error for searchPackages in CE', async () => {
      await expect(ceService.searchPackages('lodash', 5)).rejects.toThrow(
        'NPM package search is not available in Community Edition'
      );
    });

    it('should throw error for getPackageInfo in CE', async () => {
      await expect(ceService.getPackageInfo('lodash')).rejects.toThrow(
        'NPM package info is not available in Community Edition'
      );
    });

    it('should have required methods', () => {
      expect(typeof ceService.searchPackages).toBe('function');
      expect(typeof ceService.getPackageInfo).toBe('function');
    });
  });

  describe('Enterprise Edition', () => {
    let eeService: NpmRegistryService;

    const context = setupPolly({
      adapters: [NodeHttpAdapter as any],
      persister: FSPersister as any,
      recordFailedRequests: true,
      matchRequestsBy: {
        method: true,
        headers: {
          exclude: ['user-agent', 'accept-encoding', 'connection'], // Exclude dynamic headers
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
          // Store recordings as __fixtures__/spec-file-name/*
          recordingsDir: path.resolve(
            __dirname,
            `../__fixtures__/${path.basename(__filename).replace(/\.[tj]s$/, '')}`
          ),
        },
      },
    });

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [NpmRegistryService],
      }).compile();

      eeService = module.get<NpmRegistryService>(NpmRegistryService);
    });

    afterEach(() => {
      context.polly.stop();
    });

    describe('searchPackages', () => {
      it('should search packages from NPM registry', async () => {
        const results = await eeService.searchPackages('lodash', 5);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeGreaterThan(0);
        expect(results.length).toBeLessThanOrEqual(5);

        // Check structure of first result
        if (results.length > 0) {
          const firstResult = results[0];
          expect(firstResult).toHaveProperty('name');
          expect(firstResult).toHaveProperty('version');
          expect(firstResult).toHaveProperty('description');
          expect(typeof firstResult.name).toBe('string');
          expect(typeof firstResult.version).toBe('string');
        }
      });

      it('should handle empty search results gracefully', async () => {
        const results = await eeService.searchPackages('nonexistentpackagethatdoesnotexist12345', 10);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        // Should return empty array for non-existent packages
        expect(results.length).toBe(0);
      });

      it('should respect limit parameter', async () => {
        const results = await eeService.searchPackages('react', 3);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeLessThanOrEqual(3);
      });

      it('should handle scoped packages', async () => {
        const results = await eeService.searchPackages('@types/node', 5);

        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);

        if (results.length > 0) {
          const hasTypesNode = results.some((pkg) => pkg.name.includes('@types/node'));
          expect(hasTypesNode).toBe(true);
        }
      });

      it('should handle network errors gracefully', async () => {
        // Mock a network error scenario using Polly.js
        context.polly.server.get('https://registry.npmjs.org/-/v1/search').intercept((req, res) => {
          res.status(500).send('Internal Server Error');
        });

        const results = await eeService.searchPackages('test-network-error', 5);

        // Should return empty array on error (graceful degradation)
        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
      });
    });

    describe('getPackageInfo', () => {
      it('should fetch package info for valid package', async () => {
        const packageInfo = await eeService.getPackageInfo('lodash');

        expect(packageInfo).toBeDefined();
        expect(packageInfo).toHaveProperty('name', 'lodash');
        expect(packageInfo).toHaveProperty('description');
        expect(packageInfo).toHaveProperty('versions');
        expect(packageInfo).toHaveProperty('dist-tags');
        expect(typeof packageInfo.versions).toBe('object');
        expect(typeof packageInfo['dist-tags']).toBe('object');
        expect(packageInfo['dist-tags']).toHaveProperty('latest');
      });

      it('should handle scoped packages', async () => {
        const packageInfo = await eeService.getPackageInfo('@types/node');

        expect(packageInfo).toBeDefined();
        expect(packageInfo).toHaveProperty('name', '@types/node');
        expect(packageInfo).toHaveProperty('versions');
        expect(packageInfo).toHaveProperty('dist-tags');
      });

      it('should throw error for non-existent packages', async () => {
        await expect(eeService.getPackageInfo('nonexistentpackagethatdoesnotexist12345')).rejects.toThrow();
      });

      it('should handle packages with special characters', async () => {
        const packageInfo = await eeService.getPackageInfo('is-odd');

        expect(packageInfo).toBeDefined();
        expect(packageInfo).toHaveProperty('name', 'is-odd');
        expect(packageInfo).toHaveProperty('dist-tags');
        expect(packageInfo['dist-tags']).toHaveProperty('latest');
      });
    });

    describe('comprehensive integration tests', () => {
      it('should handle different search queries with correct results', async () => {
        const lodashResults = await eeService.searchPackages('lodash', 5);
        const reactResults = await eeService.searchPackages('react', 3);

        expect(lodashResults).toBeDefined();
        expect(reactResults).toBeDefined();
        expect(lodashResults.length).toBeGreaterThan(0);
        expect(reactResults.length).toBeGreaterThan(0);
        expect(lodashResults[0].name !== reactResults[0].name).toBe(true);
      });

      it('should properly handle version information structure', async () => {
        const packageInfo = await eeService.getPackageInfo('is-odd');

        expect(packageInfo).toBeDefined();
        expect(packageInfo.name).toBe('is-odd');
        expect(packageInfo['dist-tags']).toBeDefined();
        expect(packageInfo['dist-tags'].latest).toBeDefined();
        expect(typeof packageInfo.versions).toBe('object');
      });
    });
  });
});
