import EasyPost from '@easypost/api';

type EasyPostClient = InstanceType<typeof EasyPost>;

export async function createAddress(client: InstanceType<typeof EasyPost>, options: any): Promise<object> {
  const { address, verify } = options;
  const addressObj = typeof address === 'string' ? JSON.parse(address) : address;
  
  const verification = verify === 'none' ? undefined : [verify];
  
  const createdAddress = await client.Address.create({
    ...addressObj,
    ...(verification ? { verify: verification } : {})
  });
  return createdAddress;
}

export async function createShipment(client: EasyPostClient, options: any): Promise<object> {
  const { shipment } = options;
  const shipmentObj = typeof shipment === 'string' ? JSON.parse(shipment) : shipment;
  
  const createdShipment = await client.Shipment.create(shipmentObj);
  return createdShipment;
}

export async function buyShipment(client: EasyPostClient, options: any): Promise<object> {
  const { shipment_id, rate_id } = options;
  
  // Use the static buy method on Shipment
  const boughtShipment = await client.Shipment.buy(shipment_id, rate_id);
  return boughtShipment;
}

export async function createTracker(client: EasyPostClient, options: any): Promise<object> {
  const { tracking_code, carrier } = options;
  
  const tracker = await client.Tracker.create({
    tracking_code,
    carrier
  });
  return tracker;
}

export async function getTracker(client: EasyPostClient, options: any): Promise<object> {
  const { tracker_id } = options;
  
  const tracker = await client.Tracker.retrieve(tracker_id);
  return tracker;
}