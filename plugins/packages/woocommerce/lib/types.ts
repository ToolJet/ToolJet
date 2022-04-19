export type SourceOptions = {
  consumer_key: string;
  consumer_secret: string;
  port: string;
  host: string;
  protocol: string;
};
export type QueryOptions = {
  operation: string;
  data: string | object;
  key: string;
  body: object | Array<object>;
  product_id: string;
  order_id: string;
  customer_id: string;
};
