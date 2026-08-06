import { SSOType } from '@entities/sso_config.entity';
import { LICENSE_FIELD } from '@modules/licensing/constants';
import { EnvKeyName, EnvParseResult } from '@modules/organization-env/types/env-parse-result';
import { SAML_ENV_KEYS, LDAP_ENV_KEYS, REQUIRED_KEYS } from '@modules/organization-env/constants';
import { SamlEnvConfig, LdapEnvConfig } from '@modules/organization-env/types';
import { parseSamlEnvConfig, parseLdapEnvConfig, deriveSamlTemplate, deriveLdapTemplate } from '@modules/organization-env/parsers/parse-env-config';

/**
 * Everything that's specific to one env-config provider (SAML, LDAP — OIDC's shape differs too
 * much to be a spec instance of the same generic service, see OidcEnvUtilService), so
 * EnvSettingsSourceService<T> can hold ALL the shared plumbing (initialize, ensureResolved,
 * license checks, hydrate/revoke, provider state) exactly once instead of hand-copied per
 * provider. hasGuiFallback answers "is there a usable saved GUI config to fall back to if env
 * config is turned off/becomes invalid" — used only by the revoke path, never by parse.
 */
export interface EnvSourceSpec<T> {
  readonly sso: SSOType;
  readonly licenseField: LICENSE_FIELD;
  readonly allKeys: readonly string[];
  readonly requiredKeys: readonly string[];
  parse(values: Record<string, string | undefined>): EnvParseResult<T>;
  deriveTemplate(values: Record<string, string | undefined>, has: (key: string) => boolean): Partial<T> | null;
  hasGuiFallback(configs: Record<string, unknown>): boolean;
}

export const SAML_SPEC: EnvSourceSpec<SamlEnvConfig> = {
  sso: SSOType.SAML,
  licenseField: LICENSE_FIELD.SAML,
  allKeys: Object.values(SAML_ENV_KEYS),
  requiredKeys: REQUIRED_KEYS.SAML,
  parse: parseSamlEnvConfig,
  deriveTemplate: (values, has) => deriveSamlTemplate(has, (key) => key as EnvKeyName),
  hasGuiFallback: (configs) => !!configs.idpMetadata,
};

export const LDAP_SPEC: EnvSourceSpec<LdapEnvConfig> = {
  sso: SSOType.LDAP,
  licenseField: LICENSE_FIELD.LDAP,
  allKeys: Object.values(LDAP_ENV_KEYS),
  requiredKeys: REQUIRED_KEYS.LDAP,
  parse: parseLdapEnvConfig,
  deriveTemplate: (values, has) => deriveLdapTemplate(values, has, (key) => key as EnvKeyName),
  hasGuiFallback: (configs) => !!(configs.host && configs.port && configs.basedn),
};
