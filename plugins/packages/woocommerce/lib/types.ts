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
  page?: number;
  per_page?: number;
  search?: string;
  exclude?: Array<string>;
  include?: Array<string>;
  offset?: number;
  order?: string;
  orderby?: string;
  email?: string;
  role?: string;

  //[product params]
  after?: string;
  before?: string;
  parent?: Array<string>;
  parent_exclude?: Array<string>;
  slug?: string;
  status?: Array<string>;
  type?: string;
  sku?: string;
  featured?: boolean;
  category?: string;
  tag?: string;
  shipping_class?: string;
  attribute?: string;
  attribute_term?: string;
  tax_class?: string;
  on_sale?: boolean;
  min_price?: string;
  max_price?: string;
  stock_status?: string;

  // [order params]
  customer?: string;
  product?: number;
  dp?: number;

  // coupon params
  code?: string;
};
