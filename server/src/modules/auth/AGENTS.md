# auth module

Owns authentication: password login (global + per-workspace), super-admin login, workspace
authorize/switch, forgot/reset password, and all SSO sign-in entry points (Google, GitHub,
OIDC, SAML, LDAP), plus AI-website onboarding with OTP MFA. Issues no tokens itself — JWT
signing and the `tj_auth_token` cookie are done by the session module. A user's origin is
recorded in `User.source` (`SOURCE` enum, `@modules/users/constants/lifecycle.ts`):
`signup`, `invite`, `google`, `git`, `openid`, `ldap`, `saml`, `workspace_signup`.

## Domain terms

- **Workspace** — user-facing term; code entity is `Organization` (legacy name), routes use `:organizationId`
- **Global login** — `POST authenticate` without workspace: resolves default/first form-enabled workspace, may auto-create a personal workspace
- **Workspace login** — `POST authenticate/:organizationId`: requires that workspace's `form` SSO config enabled
- **SSO config** — per-workspace `SSOConfigs` row; `form` (password) is itself an sso type
- **SSOResponse** — temp store for SAML response payloads (`oauth/repository/sso-response.repository.ts`), purged daily at 1AM by `schedulers/clear-sso-response.scheduler.ts`

## Key files

| File | Role |
|---|---|
| `module.ts` | dynamic `register()`; controllers mounted only when `isMainImport`; exports `AuthUtilService` |
| `controller.ts` | `authenticate`, `authenticate/super-admin`, `authenticate/:organizationId`, `authorize`, `switch/:organizationId`, `forgot-password`, `reset-password` |
| `service.ts` | login orchestration: workspace resolution, invite-redirect path, password-domain checks, forgot/reset |
| `util.service.ts` | `validateLoginUser()` + shared login/signup helpers; the module's DI hub |
| `oauth/controller.ts` | `@Controller(['oauth','sso'])`: `sign-in/:configId`, `sign-in/common/:ssoType`, `openid/configs/:configId`, `saml/configs/:configId`, `saml/:configId` |
| `oauth/service.ts` | SSO sign-in orchestration (`OauthService`) |
| `oauth/util-services/` | per-provider services; CE implements only `google-oauth` + `git-oauth` |
| `website/` | `@Controller('ai/onboarding')` + `@Controller('otp')` — AI onboarding signup, cookies, OTP |
| `mfa/repository.ts`, `scheduler.ts` | `UserMfaRepository`; `MfaCleanupScheduler` deletes MFA rows >48h old (daily 5AM) |
| `guards/` | `AuthorizeWorkspaceGuard`, `SwitchWorkspaceAuthGuard`, `WorkflowAuthGuard`, `ExternalApiSecurityGuard`, `OrganizationIdValidationGuard` |
| `constants/index.ts` | `FEATURE_KEY` per endpoint; `ability/` provides `FeatureAbilityGuard` |

## Edition split

- `server/ee/auth/` mirrors this module; EE classes extend CE bases (`AuthService`, `AuthUtilService`, `OauthService`, `AuthController`, guards).
- OIDC/SAML/LDAP implementations live **only** in `ee/auth/oauth/util-services/`; the CE
  counterparts (`oidc-auth.service.ts`, `saml.service.ts`, `ldap.service.ts`) are stubs
  throwing `Method not implemented`, and CE `oauth/controller.ts` returns 404 for
  OIDC/SAML redirect endpoints. Google/GitHub work in CE.
- EE `OauthService.signIn` license-gates providers via `licenseTermsService.getLicenseTerms(LICENSE_FIELD.GOOGLE|GITHUB|OIDC|LDAP, organizationId)`.
- EE adds MFA OTP (`requestOtpForMfa`/`verifyOtpForMfa` in `ee/auth/service.ts`) and group sync for LDAP/SAML/OIDC.

## Invariants & gotchas

- Cookie/JWT issuance is session-module territory: `SessionUtilService.generateLoginResultPayload()` sets `tj_auth_token`; controllers must use `@Res({ passthrough: true })` or the response hangs.
- Guard layering: `FeatureAbilityGuard` is class-level on every controller; auth routes use their own `AuthGuard('jwt')` subclasses (not session's `JwtAuthGuard`); oauth sign-in uses session's `OrganizationAuthGuard`.
- Invite-redirect login (`redirectTo` starts with `/organization-invitations/` or `/invitations/`) authenticates against `INVITED` workspace status and downgrades to global login (`organizationId` cleared).
- Global login auto-creates "My workspace" only when super admin or `ALLOW_PERSONAL_WORKSPACE` instance setting is `'true'`; archived workspaces are excluded from login resolution.
- Password-domain allow/restrict lists validated on every form login (workspace overrides instance); skipped for super admins.
- `forgotPassword` silently succeeds for unknown emails (username-enumeration protection).
- OIDC PKCE: code verifier rides the `oidc_code_verifier` cookie; token-exchange `redirect_uri` host must match the authorization request (custom-domain aware).
- Registering with `isMainImport=false` yields providers but no controllers — prevents duplicate route mounting when other modules import AuthModule.

## Related modules

- `session` — JWT sign/verify, cookie handling, `switchOrganization`, permission payloads
- `users`, `organization-users`, `roles`, `group-permissions` — user lookup, workspace membership, permissions on login
- `organizations`, `setup-organization` — workspace resolution/creation at login
- `login-configs` — `SSOConfigsRepository`; per-workspace SSO/form configuration
- `onboarding`, `instance-settings`, `custom-domains`, `licensing` (EE gating), `profile`
