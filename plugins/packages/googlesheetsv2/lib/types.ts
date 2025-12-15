export type SourceOptions = { 
 access_token: string,
 oauth_type: any,
    client_id ?: any,
    access_type ?: any
    client_email ?: any,
    client_secret ?: any,
    private_key ?: any
    scopes ?: any,
    service_account_json ?: any,
    authentication_type ? : any
};

export type QueryOptions = {
  spreadsheet_id: string;
  title: string;
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
  page_size: any,
  filter: any,
  page_token: any,
  primary_key: any,
  source_spreadsheet_id: any,
  destination_spreadsheet_id: any,
  source_range: any,
  destination_range: any,
  majorDimension:any,
  valueRenderOption:any,
  dateTimeRenderOption:any
  shiftDimension:any,
  values: any,
  ValueInputOption: any
};

export interface ConvertedFormat {
  method: string;
  headers: Record<string, string>;
  searchParams?: URLSearchParams;
  json?: any;
}
