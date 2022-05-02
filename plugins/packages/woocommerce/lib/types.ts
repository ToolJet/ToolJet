export type SourceOptions = {
  consumer_key: string;
  consumer_secret: string;
  host: string;
};
export type QueryOptions = {
  operation: string;
  body: any;
  product_id: string;
  order_id: string;
  customer_id: string;
  resource: string;

  // customer params
  context?: string;
  page?: string;
  per_page?: string;
  search?: string;
  exclude?: string;
  include?: string;
  offset?: string;
  order?: string;
  orderby?: string;
  email?: string;
  role?: string;
};
