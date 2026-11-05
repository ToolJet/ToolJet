export interface IOrganizationUser {
  id: string;
  role: string;
  status: 'invited' | 'active' | 'archived';
  source: 'signup' | 'invite';
  organization_id: string;
  user_id: string;
  invitation_token: string | null;
  invitation_token_expiry: string | null;
  llm_provider: string | null;
  llm_model: string | null;
  llm_model_context_window: number | null;
  created_at: string;
  updated_at: string;
}

export interface IOrganizationLicenseType {
  is_license_valid: boolean;
  license_type: string;
  /** Absent for some license types (e.g. `basic`). */
  is_expired?: boolean;
  /** ISO date; absent for some license types (e.g. `basic`). */
  expiry_date?: string;
}

// Shape of an item in the `GET /organizations` response (server returns snake_case keys).
export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  password_allowed_domains: string | null;
  password_restricted_domains: string | null;
  is_default: boolean;
  enable_sign_up: boolean;
  inherit_s_s_o: boolean;
  automatic_sso_login: boolean;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  /** Not returned for every user (e.g. absent for some non-cloud responses). */
  organization_users?: IOrganizationUser[];
  /** Cloud edition only. */
  plan?: string;
  /** Cloud edition only. */
  license_type?: IOrganizationLicenseType;
  /** Cloud edition only; `null` when the workspace has no active custom domain. */
  custom_domain?: string | null;
}

export interface IGetOrganizationsResponse {
  organizations: IOrganization[];
  total_count?: number;
}

export interface ICurrentSessionStoreActions {
  fetchOrganizations: () => Promise<void>;
  setOrganizations: (organizations: IOrganization[]) => void;
}

export interface ICurrentSessionStore {
  organizations: IOrganization[];
  isGettingOrganizations: boolean;
  actions: ICurrentSessionStoreActions;
}

export type ICurrentSessionStoreInitialState = Pick<ICurrentSessionStore, 'organizations' | 'isGettingOrganizations'>;
