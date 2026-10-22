# organization-payments module

Stripe billing for Cloud **Workspaces**: checkout sessions for plan purchases, subscription changes
with proration, invoices, the Stripe customer portal, AI credit top-ups, and the Stripe webhook that
turns a completed payment into a per-Workspace license. It also serves plan prices to the pricing
table. CE ships stubs only; everything real lives in `server/ee/organization-payments/`.

## Domain terms

- **Plan** — code ids `starter` (legacy), `basicplus` (Basic), `pro`, `team`; Enterprise is sold by sales, not Stripe.
- **Price** — a Stripe price id per plan and billing period, from env `STRIPE_PRICE_ID_{PLAN}_{MONTHLY|YEARLY}_EDITOR` (`NEW_PLANS_MAPPING` in the EE service). "Editor" is the legacy name for a Builder seat.
- **Plan prices** — what the pricing table and checkout show: per-Builder amounts read from those Stripe prices (`ee/organization-payments/helpers/plan-prices.ts`).

## Key files

| File | Role |
|---|---|
| `constants/index.ts` | `FEATURE_KEY` per route |
| `constants/feature.ts` | Feature config; `STRIPE_WEBHOOK` and `GET_PLAN_PRICES` are `isPublic` |
| `ability/index.ts` | Admin-only for every route except the two public ones |
| `guards/organizationLicenseAccess.guard.ts` | `:organizationId` in the path must be the caller's Workspace |
| `guards/stripe-webhook.guard.ts` | Verifies the Stripe signature (`STRIPE_WEBHOOK_ENDPOINT_SECRET`) |
| `organizationAiFeature.repository.ts` | AI credit wallet balances (recurring / top-up) |
| `controller.ts`, `service.ts` | CE stubs (`Method not implemented`) |
| `ee/organization-payments/service.ts` | Stripe calls, webhook handlers, license writes, `getPlanPrices()` |
| `ee/organization-payments/helpers/plan-prices.ts` | Pure conversion of Stripe prices into plan prices, plus the relay shape check |

## Edition split

- CE: stubs only; the pricing surfaces are EE/Cloud frontend components.
- EE (self-hosted) and Cloud both load `ee/organization-payments/`. Only Cloud holds a Stripe key.
- `GET /api/organization/payment/plan-prices`: Cloud reads Stripe; self-hosted relays Cloud's copy from `TOOLJET_CLOUD_API_URL` (default `https://app.tooljet.ai/api`; redirects are refused, so a moved host fails loudly). Self-hosted is sold at Cloud's prices, so one source serves both.

## Invariants & gotchas

- Checkout charges `price × number of Builders`. Plan prices therefore accept only flat `per_unit` recurring prices billed every month or every year; anything else is rejected rather than shown wrongly.
- Yearly Stripe prices are one annual amount (e.g. Basic $278/year). `perMonth` is that ÷ 12, unrounded; the frontend rounds down for display and totals from `amount`.
- `yearlyDiscountPercent` is the smallest on-sale saving (Basic, Pro, Team), floored, so "Save N%" never overstates.
- Plan prices are cached in memory for an hour per server process; failures are never cached. Unavailable prices return **503**, and the frontend hides prices and blocks Upgrade.
- The prices route is public on purpose: Stripe list prices aren't secret, and self-hosted servers call Cloud's without a session.
- AI credit top-ups use an inline `price_data` ($1 per 100 credits), not a Stripe price id.
- Stripe is only called when a Workspace has a subscription row; a free Workspace never reaches Stripe from `getCurrentPlan`, but `new Stripe()` still throws without `STRIPE_API_KEY`.

## Related modules

- `licensing` — Cloud licenses written here are read back through `ORGANIZATION_LICENSE_URL` (`ee/licensing/services/terms.service.ts`); plan presets in `ee/licensing/constants/PlanTerms.ts`.
- `ai` — credit balances and the gateway wallets that top-ups fill.
- `email` — license update emails sent from the webhook handlers.
