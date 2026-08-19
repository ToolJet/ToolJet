export type SourceOptions = {
  sp_client_id: string;
  sp_client_secret: string;
  sp_tenant_id: string;
  /**
   * Address of the SharePoint site this connection points at, e.g.
   * https://contoso.sharepoint.com/sites/marketing. Resolved to a Graph site id at query time, so
   * no query ever carries a site id. One datasource means one site.
   */
  sp_site_url: string;
  access_token: string;
};
export type QueryOptions = {
  operation: string;
  sp_operation: string;
  sp_time_interval: string;
  sp_list_name: string;
  sp_list_id: string;
  sp_list_object: string;
  sp_item_id: string;
  sp_item_object: string;
  sp_top: string;
  sp_page: string;
};
