'use strict';

const Grpcv2QueryService = require('../lib').default;

describe('grpcv2', () => {
  describe('#17537: a query may only target services still configured on the data source', () => {
    const service = new Grpcv2QueryService();

    const sourceOptions = (selected_services) => ({
      proto_files: 'server_reflection',
      url: 'localhost:50051',
      ...(selected_services !== undefined ? { selected_services } : {}),
    });
    const queryOptions = { service: 'grep.Old', method: 'Search', raw_message: '{}' };

    it('rejects a service removed from the configuration before any client work', async () => {
      await expect(
        service.run(sourceOptions(['grep.New']), queryOptions, 'ds-id')
      ).rejects.toThrow(/no longer configured on this data source.*grep\.New/);
    });

    it('allows the query when the service is still selected', async () => {
      // Past the configured-service gate the next failure is client creation
      // against a dead URL — proving the gate let it through.
      await expect(
        service.run(sourceOptions(['grep.Old']), queryOptions, 'ds-id')
      ).rejects.toThrow(/Query could not be completed/);
    });

    it('stays permissive when no service selection is configured', async () => {
      // Legacy/unrestricted datasources have no selected_services; the gate
      // must not start rejecting them (again: dies later, at client creation).
      await expect(
        service.run(sourceOptions(undefined), queryOptions, 'ds-id')
      ).rejects.toThrow(/Query could not be completed/);
    });
  });
});
