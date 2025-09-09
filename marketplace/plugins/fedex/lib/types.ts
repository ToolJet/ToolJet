export type SourceOptions = {
  client_id?: string;
  client_secret?: string;
  customer_type?: CustomerType;
  child_key?: string;
  child_secret?: string;
};

export enum CustomerType {
  INTERNAL = "internal_customers",
  PROPRIETARY_PARENT_CHILD = "proprietary_parent_child_customers",
}

export type QueryOptions = {
  operation: string;
};