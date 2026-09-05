import FirecrawlQueryService from '../lib/index';
import { QueryError } from '@tooljet-plugins/common';

describe('FirecrawlQueryService', () => {
  let service: FirecrawlQueryService;

  beforeEach(() => {
    service = new FirecrawlQueryService();
  });

  describe('Validation', () => {
    it('throws error when scrape operation is missing URL', async () => {
      await expect(
        service.run({ api_key: 'test_key' }, { operation: 'scrape' } as any)
      ).rejects.toThrow(QueryError);
    });

    it('throws error when search operation is missing query', async () => {
      await expect(
        service.run({ api_key: 'test_key' }, { operation: 'search' } as any)
      ).rejects.toThrow(QueryError);
    });

    it('throws error when crawl_status operation is missing job_id', async () => {
      await expect(
        service.run({ api_key: 'test_key' }, { operation: 'crawl_status' } as any)
      ).rejects.toThrow(QueryError);
    });

    it('throws error on unsupported operation', async () => {
      await expect(
        service.run({ api_key: 'test_key' }, { operation: 'unknown_op' as any })
      ).rejects.toThrow(QueryError);
    });
  });
});
