export type SourceOptions = {
  username: string;
  database: string;
  port: string;
  host: string;
  protocol: string;
  password: string;
};
export type QueryOptions = {
  operation: string;
  tablename: string;
  name: string;
  data: string;
  key: string;
  body: object | Array<object>;
};
