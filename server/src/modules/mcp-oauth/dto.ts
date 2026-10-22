/** Explicit browser API contracts. Keep existing wire names independent of storage mappings. */
export interface ConnectedClientResponse {
  id: string;
  client_name: string;
  scopes: string[];
  created_at: string;
  expires_at: string;
}
export interface InteractionPreviewResponse {
  clientName: string;
  clientId: string;
  redirectUri: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string | null;
  scopes: string[];
  csrfToken: string;
  loginUrl: string;
}
// Inputs remain unknown until the existing protocol validation has checked them.
export interface ConsentInput { allow: unknown }
export interface BootstrapInput { ticket: unknown; nonce: unknown }
export interface ViewerInput { app_id: unknown }
