import { QueryOptions, AddressData, ShipmentData, TrackerData, EasyPostClient, StandardError } from './types';

export class EasyPostOperationError extends Error {
  constructor(
    public operation: string,
    public details: Record<string, unknown> = {},
    message?: string
  ) {
    super(message);
    this.name = 'EasyPostOperationError';
  }
}

export async function createAddress(client: EasyPostClient, options: QueryOptions): Promise<object> {
  try {
    if (!options.address) {
      throw new EasyPostOperationError('create_address', {}, 'Address is required');
    }

    const address = typeof options.address === 'string'
      ? JSON.parse(options.address) as AddressData
      : options.address;

    // Handle verification options correctly
    const createParams: any = { ...address };

    if (options.verify && options.verify !== 'none') {
      createParams.verify = [options.verify];
    }

    return await client.Address.create(createParams);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new EasyPostOperationError(
        'create_address',
        { input: options.address },
        'Invalid JSON format for address'
      );
    }

    // Handle EasyPost API errors specifically
    if (error instanceof Error) {
      const details = {
        operation: 'create_address',
        address: options.address,
        verify: options.verify
      };

      throw new EasyPostOperationError(
        'create_address',
        details,
        `EasyPost API error: ${error.message}`
      );
    }

    throw error;
  }
}
export async function createShipment(client: EasyPostClient, options: QueryOptions): Promise<object> {
  try {
    if (!options.shipment) {
      throw new EasyPostOperationError('create_shipment', {}, 'Shipment data is required');
    }

    const shipment = typeof options.shipment === 'string'
      ? JSON.parse(options.shipment) as ShipmentData
      : options.shipment;

    return await client.Shipment.create(shipment);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new EasyPostOperationError(
        'create_shipment',
        { input: options.shipment },
        'Invalid JSON format for shipment'
      );
    }
    throw error;
  }
}

export async function buyShipment(client: EasyPostClient, options: QueryOptions): Promise<object> {
  try {
    if (!options.shipment_id) {
      throw new EasyPostOperationError('buy_shipment', {}, 'Shipment ID is required');
    }
    if (!options.rate_id) {
      throw new EasyPostOperationError('buy_shipment', {}, 'Rate ID is required');
    }

    return await client.Shipment.buy(options.shipment_id, options.rate_id);
  } catch (error) {
    throw new EasyPostOperationError(
      'buy_shipment',
      { shipment_id: options.shipment_id, rate_id: options.rate_id },
      error instanceof Error ? error.message : 'Failed to buy shipment'
    );
  }
}

export async function createTracker(client: EasyPostClient, options: QueryOptions): Promise<object> {
  try {
    if (!options.tracking_code) {
      throw new EasyPostOperationError('create_tracker', {}, 'Tracking code is required');
    }

    const trackerData: TrackerData = {
      tracking_code: options.tracking_code,
      ...(options.carrier ? { carrier: options.carrier } : {})
    };

    return await client.Tracker.create(trackerData);
  } catch (error) {
    throw new EasyPostOperationError(
      'create_tracker',
      { tracking_code: options.tracking_code, carrier: options.carrier },
      error instanceof Error ? error.message : 'Failed to create tracker'
    );
  }
}

export async function getTracker(client: EasyPostClient, options: QueryOptions): Promise<object> {
  try {
    if (!options.tracker_id) {
      throw new EasyPostOperationError('get_tracker', {}, 'Tracker ID is required');
    }

    return await client.Tracker.retrieve(options.tracker_id);
  } catch (error) {
    throw new EasyPostOperationError(
      'get_tracker',
      { tracker_id: options.tracker_id },
      error instanceof Error ? error.message : 'Failed to get tracker'
    );
  }
}