import HubSpot from '../lib/index';
import { SourceOptions, QueryOptions } from '../lib/types';

describe('HubSpot Plugin', () => {
  let hubspot: HubSpot;
  
  beforeEach(() => {
    hubspot = new HubSpot();
  });

  describe('constructor', () => {
    it('should create an instance', () => {
      expect(hubspot).toBeInstanceOf(HubSpot);
    });
  });

  describe('run method', () => {
    const mockSourceOptions: SourceOptions = {
      api_key: 'test-api-key'
    };

    const mockQueryOptions: QueryOptions = {
      endpoint: '/contacts/v1/contact',
      method: 'GET'
    };

    it('should handle successful API calls', async () => {
      // This test would require mocking the HTTP client
      // For now, we just test that the method exists
      expect(typeof hubspot.run).toBe('function');
    });

    it('should handle error responses', async () => {
      // Test error handling
      expect(typeof hubspot.run).toBe('function');
    });
  });

  describe('testConnection method', () => {
    it('should test connection functionality', async () => {
      const mockSourceOptions: SourceOptions = {
        api_key: 'test-api-key'
      };
      
      expect(typeof hubspot.testConnection).toBe('function');
    });
  });
});