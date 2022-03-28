export type SourceOptions = { access_token: string };
export type QueryOptions = {
  spreadsheet_id: string;
  spreadsheet_range: string;
  where_operation: string;
  where_field: string;
  where_value: string;
  order_field: string;
  order_type: string;
  body: string;
  sheet: string;
  row_index: string;
  operation: string;
  rows: [];
};
