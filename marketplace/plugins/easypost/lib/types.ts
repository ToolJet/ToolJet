import EasyPost from '@easypost/api';

// Add this at the top of your types.ts
export type EasyPostClient = InstanceType<typeof EasyPost>;

export interface AddressData {
  name?: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
  residential?: boolean;
}

export interface ShipmentData {
  to_address: string | AddressData;
  from_address: string | AddressData;
  parcel: string | {
    length: number;
    width: number;
    height: number;
    weight: number;
    predefined_package?: string;
  };
  options?: {
    saturday_delivery?: boolean;
    signature_confirmation?: 'adult' | 'direct' | 'indirect';
    delivery_confirmation?: 'NO_SIGNATURE' | 'SIGNATURE' | 'ADULT_SIGNATURE';
    insurance?: string;
    label_format?: 'PNG' | 'PDF' | 'ZPL' | 'EPL2';
  };
  reference?: string;
  service?: string;
}

export interface TrackerData {
  tracking_code: string;
  carrier?: string;
}

export interface BuyShipmentOptions {
  rate: {
    id: string;
  } | {
    carrier: string;
    service: string;
  };
  insurance?: string;
}

export interface SourceOptions {
  api_key: string;
}

export interface QueryOptions {
  operation: 
    | 'create_address'
    | 'get_address'
    | 'list_addresses'
    | 'create_shipment'
    | 'get_shipment'
    | 'list_shipments'
    | 'buy_shipment'
    | 'create_tracker'
    | 'get_tracker'
    | 'list_trackers';
  
  // Address operations
  address?: AddressData | string;
  verify?: 'none' | 'delivery' | 'zip4';
  id?: string;
  
  // Shipment operations
  shipment?: ShipmentData | string;
  shipment_id?: string;
  rate_id?: string;
  
  // Tracker operations
  tracker?: TrackerData | string;
  tracking_code?: string;
  carrier?: string;
  tracker_id?: string;
  
  // Pagination
  before_id?: string;
  after_id?: string;
  start_datetime?: string;
  end_datetime?: string;
  page_size?: number;
  purchased?: boolean;
}

export interface ErrorResponse {
  error: {
    code?: string;
    message: string;
    errors?: Array<{
      field?: string;
      message?: string;
    }>;
  };
}

export interface StandardError {
  code?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ErrorResponse {
  error: {
    code?: string;
    message: string;
    errors?: Array<{
      field?: string;
      message?: string;
    }>;
  };
  status?: number;
}