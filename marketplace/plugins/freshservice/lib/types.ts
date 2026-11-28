export interface SourceOptions {
  /** Freshservice domain, e.g. yourcompany.freshservice.com */
  domain: string;
  /** Freshservice API key — sent as Basic auth username with "X" as password */
  api_key: string;
}

export type Operation =
  // Tickets
  | 'list_tickets'
  | 'get_ticket'
  | 'create_ticket'
  | 'update_ticket'
  | 'delete_ticket'
  | 'add_note_to_ticket'
  | 'reply_to_ticket'
  // Requesters & Agents
  | 'list_requesters'
  | 'list_agents'
  // Assets
  | 'list_assets'
  | 'create_asset'
  // Changes
  | 'list_changes'
  // Problems
  | 'list_problems'
  // Service Catalog
  | 'list_service_catalog_items';

export interface QueryOptions {
  operation: Operation;
  /** Ticket ID (number) */
  ticket_id?: string;
  /** Page number for paginated responses (1-indexed) */
  page?: string;
  /** Number of results per page (max 100) */
  per_page?: string;
  /** Body for create/update operations (JSON object or JSON string) */
  body?: string | Record<string, unknown>;
  /** Note body for add_note_to_ticket */
  note_body?: string;
  /** Whether the note is private (true) or public (false) */
  note_private?: string;
  /** Reply body for reply_to_ticket */
  reply_body?: string;
}
