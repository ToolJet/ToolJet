/**
 * Page lookups return controlled 404s and are scoped to the request's version
 * (MCP validation report 2026-10-15, N1).
 *
 * deletePage threw a generic Error('Page not found') — surfaced as HTTP 500 — and looked
 * the page up by id alone, so a page id of another version passed the existence check.
 * The lookup must be scoped to the version being edited and a miss must be a 404.
 *
 * Strategy (repo precedent: apps-service-delete-guard.spec.ts): mock dbTransactionWrap,
 * stub the constructor dependencies, and drive findOne per test.
 */

import { NotFoundException } from '@nestjs/common';
import { Page } from '@entities/page.entity';

const findOne = jest.fn();
const managerDelete = jest.fn();

jest.mock('../../../../src/helpers/database.helper', () => ({
  dbTransactionWrap: jest.fn().mockImplementation(async (cb: (manager: any) => Promise<any>) => {
    return cb({ findOne, find: jest.fn().mockResolvedValue([]), delete: managerDelete, query: jest.fn() });
  }),
}));

import { PageService } from '@modules/apps/services/page.service';

describe('PageService page lookups', () => {
  const pageHelperService = {
    deletePageGroup: jest.fn(),
    rearrangePagesOrderPostDeletion: jest.fn().mockResolvedValue(undefined),
  };
  const eventHandlerService = { cascadeDeleteEvents: jest.fn() };
  const appValidationService = { check: jest.fn().mockResolvedValue({ errors: [], warnings: [] }) };
  const editingVersion = { id: 'v1', homePageId: 'home-page' } as any;

  const service = new PageService(
    null as any,
    pageHelperService as any,
    eventHandlerService as any,
    null as any,
    appValidationService as any
  );

  beforeEach(() => jest.clearAllMocks());

  describe('deletePage', () => {
    it('returns 404, not a 500, for a page id that does not exist', async () => {
      findOne.mockResolvedValue(null);

      await expect(service.deletePage('missing-page', 'v1', editingVersion, false, 'org1')).rejects.toBeInstanceOf(
        NotFoundException
      );

      expect(managerDelete).not.toHaveBeenCalled();
    });

    it("scopes the lookup to the request's version, so another version's page id is a 404", async () => {
      findOne.mockResolvedValue(null);

      await expect(service.deletePage('foreign-page', 'v1', editingVersion, false, 'org1')).rejects.toBeInstanceOf(
        NotFoundException
      );

      expect(findOne).toHaveBeenCalledWith(
        Page,
        expect.objectContaining({ where: { id: 'foreign-page', appVersionId: 'v1' } })
      );
    });

    it("deletes a page of the request's version", async () => {
      findOne.mockResolvedValue({ id: 'p2', appVersionId: 'v1', isPageGroup: false });
      managerDelete.mockResolvedValue({ affected: 1 });

      await service.deletePage('p2', 'v1', editingVersion, false, 'org1');

      expect(eventHandlerService.cascadeDeleteEvents).toHaveBeenCalledWith('p2');
      expect(managerDelete).toHaveBeenCalledWith(Page, 'p2');
    });
  });

  describe('updatePage', () => {
    it('returns 404, not a 500, for a page id outside the version', async () => {
      findOne.mockResolvedValue(null);

      await expect(
        service.updatePage({ pageId: 'foreign-page', diff: { name: 'x' } } as any, 'v1')
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(findOne).toHaveBeenCalledWith(
        Page,
        expect.objectContaining({ where: { id: 'foreign-page', appVersionId: 'v1' } })
      );
    });
  });

  describe('deletePageWithManager', () => {
    it('returns 404, not a 500, when the page is gone', async () => {
      const manager: any = { findOne: jest.fn().mockResolvedValue(null) };

      await expect(service.deletePageWithManager('missing-page', manager, 'org1')).rejects.toBeInstanceOf(
        NotFoundException
      );
    });
  });

  describe('clonePage', () => {
    it('returns 404, not a 500, when the page is not in this version', async () => {
      findOne.mockResolvedValue(null);

      await expect(service.clonePage('missing-page', 'v1', 'org1')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
