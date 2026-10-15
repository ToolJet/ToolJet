import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type Stripe from 'stripe';
import { buildPlanPrices, isPlanPrices, toPlanPrice } from '@ee/organization-payments/helpers/plan-prices';
// jest.mock calls below are hoisted above these imports, so the service picks up the mocks.
import { OrganizationPaymentService } from '@ee/organization-payments/service';

const mockRetrieve = jest.fn();
jest.mock('stripe', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({ prices: { retrieve: mockRetrieve } })),
}));

const mockGot = jest.fn();
jest.mock('got', () => ({ __esModule: true, default: (...args: unknown[]) => mockGot(...args) }));

const mockEdition = jest.fn();
jest.mock('@helpers/utils.helper', () => ({
  ...jest.requireActual<Record<string, unknown>>('@helpers/utils.helper'),
  getTooljetEdition: () => mockEdition(),
}));

/** A Stripe price as the API returns it, trimmed to the fields the conversion reads. */
const stripePrice = (
  id: string,
  dollars: number,
  interval: 'month' | 'year',
  overrides: Record<string, unknown> = {}
): Stripe.Price =>
  ({
    id,
    currency: 'usd',
    billing_scheme: 'per_unit',
    unit_amount: Math.round(dollars * 100),
    recurring: { interval, interval_count: 1 },
    ...overrides,
  }) as unknown as Stripe.Price;

// The ToolJet Staging test-mode prices.
const STAGING = {
  starter: { monthly: stripePrice('starter_m', 24, 'month'), yearly: stripePrice('starter_y', 228, 'year') },
  basicplus: { monthly: stripePrice('basic_m', 29, 'month'), yearly: stripePrice('basic_y', 278, 'year') },
  pro: { monthly: stripePrice('pro_m', 99, 'month'), yearly: stripePrice('pro_y', 948, 'year') },
  team: { monthly: stripePrice('team_m', 249, 'month'), yearly: stripePrice('team_y', 2388, 'year') },
};

const PRICE_ENV: Record<string, string> = {
  STRIPE_API_KEY: 'sk_test_example',
  STRIPE_PRICE_ID_STARTER_MONTHLY_EDITOR: 'starter_m',
  STRIPE_PRICE_ID_STARTER_YEARLY_EDITOR: 'starter_y',
  STRIPE_PRICE_ID_BASICPLUS_MONTHLY_EDITOR: 'basic_m',
  STRIPE_PRICE_ID_BASICPLUS_YEARLY_EDITOR: 'basic_y',
  STRIPE_PRICE_ID_PRO_MONTHLY_EDITOR: 'pro_m',
  STRIPE_PRICE_ID_PRO_YEARLY_EDITOR: 'pro_y',
  STRIPE_PRICE_ID_TEAM_MONTHLY_EDITOR: 'team_m',
  STRIPE_PRICE_ID_TEAM_YEARLY_EDITOR: 'team_y',
};
const BY_ID = Object.fromEntries(
  Object.values(STAGING).flatMap(({ monthly, yearly }) => [
    [monthly.id, monthly],
    [yearly.id, yearly],
  ])
);

type ServiceDependencies = ConstructorParameters<typeof OrganizationPaymentService>;

// Only ConfigService is used by the price lookup; the other dependencies are never touched.
/** What got resolves with for a cloud response; the relay reads the status, headers and raw body. */
const cloudResponse = (body: unknown, statusCode = 200, headers: Record<string, string> = {}) => ({
  statusCode,
  headers,
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

const makeService = (env: Record<string, string> = PRICE_ENV) => {
  const configService = { get: (key: string) => env[key] } as unknown as ConfigService;
  const unused = {} as never;
  return new OrganizationPaymentService(
    ...([configService, unused, unused, unused, unused, unused, unused] as unknown as ServiceDependencies)
  );
};

describe('plan price conversion', () => {
  it('spreads a yearly price over twelve months without rounding', () => {
    expect(toPlanPrice(STAGING.basicplus.yearly, 'yearly')).toEqual({ amount: 278, perMonth: 278 / 12 });
    expect(toPlanPrice(STAGING.basicplus.monthly, 'monthly')).toEqual({ amount: 29, perMonth: 29 });
  });

  it.each([
    ['tiered pricing', { billing_scheme: 'tiered', unit_amount: null }],
    ['a missing amount', { unit_amount: null }],
    ['the wrong interval', { recurring: { interval: 'month', interval_count: 1 } }],
    ['a multi-year interval', { recurring: { interval: 'year', interval_count: 2 } }],
  ])('rejects %s rather than showing a wrong figure', (_label, overrides) => {
    expect(() => toPlanPrice(stripePrice('bad', 278, 'year', overrides), 'yearly')).toThrow('bad');
  });

  it('reports the smallest on-sale yearly saving, floored', () => {
    // Basic 20.11%, Pro 20.20%, Team 20.08% → 20.
    expect(buildPlanPrices(STAGING).yearlyDiscountPercent).toBe(20);
  });

  it('refuses prices in mixed currencies', () => {
    const mixed = { ...STAGING, team: { ...STAGING.team, yearly: { ...STAGING.team.yearly, currency: 'eur' } } };
    expect(() => buildPlanPrices(mixed)).toThrow('mixed currencies');
  });

  it('recognises a well-formed relayed response and rejects a malformed one', () => {
    expect(isPlanPrices(buildPlanPrices(STAGING))).toBe(true);
    expect(isPlanPrices({ currency: 'usd', yearlyDiscountPercent: 20, plans: { team: {} } })).toBe(false);
    expect(isPlanPrices({ error: 'Not found' })).toBe(false);
  });
});

describe('getPlanPrices', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockRetrieve.mockImplementation(async (id: string) => BY_ID[id]);
  });

  describe('on cloud', () => {
    beforeEach(() => mockEdition.mockReturnValue('cloud'));

    it('reads every plan from Stripe and caches the result', async () => {
      const service = makeService();

      const prices = await service.getPlanPrices();
      expect(prices.plans.team).toEqual({
        monthly: { amount: 249, perMonth: 249 },
        yearly: { amount: 2388, perMonth: 199 },
      });
      expect(mockRetrieve).toHaveBeenCalledTimes(8);

      await service.getPlanPrices();
      expect(mockRetrieve).toHaveBeenCalledTimes(8);
    });

    it('shares one Stripe lookup between concurrent requests', async () => {
      const service = makeService();
      await Promise.all([service.getPlanPrices(), service.getPlanPrices(), service.getPlanPrices()]);
      expect(mockRetrieve).toHaveBeenCalledTimes(8);
    });

    it('reports unavailable when Stripe fails, and retries on the next request', async () => {
      const service = makeService();
      mockRetrieve.mockRejectedValueOnce(new Error('Stripe is down'));

      await expect(service.getPlanPrices()).rejects.toBeInstanceOf(ServiceUnavailableException);

      mockRetrieve.mockImplementation(async (id: string) => BY_ID[id]);
      await expect(service.getPlanPrices()).resolves.toMatchObject({ yearlyDiscountPercent: 20 });
    });

    it('reports unavailable when a price ID is not configured', async () => {
      const env = { ...PRICE_ENV };
      delete env.STRIPE_PRICE_ID_TEAM_YEARLY_EDITOR;
      await expect(makeService(env).getPlanPrices()).rejects.toBeInstanceOf(ServiceUnavailableException);
      expect(mockGot).not.toHaveBeenCalled();
    });
  });

  describe('on self-hosted', () => {
    beforeEach(() => mockEdition.mockReturnValue('ee'));

    it('relays cloud prices without touching Stripe', async () => {
      const cloudPrices = buildPlanPrices(STAGING);
      mockGot.mockResolvedValue(cloudResponse(cloudPrices));

      await expect(makeService().getPlanPrices()).resolves.toEqual(cloudPrices);
      expect(mockGot).toHaveBeenCalledWith(
        'https://app.tooljet.ai/api/organization/payment/plan-prices',
        expect.objectContaining({ followRedirect: false })
      );
      expect(mockRetrieve).not.toHaveBeenCalled();
    });

    it('uses TOOLJET_CLOUD_API_URL when set', async () => {
      mockGot.mockResolvedValue(cloudResponse(buildPlanPrices(STAGING)));
      await makeService({ TOOLJET_CLOUD_API_URL: 'http://localhost:3000/api/' }).getPlanPrices();
      expect(mockGot).toHaveBeenCalledWith(
        'http://localhost:3000/api/organization/payment/plan-prices',
        expect.any(Object)
      );
    });

    it.each([
      ['cloud is unreachable', () => mockGot.mockRejectedValue(new Error('ENOTFOUND'))],
      ['cloud answers with something else', () => mockGot.mockResolvedValue(cloudResponse({ message: 'Not found' }))],
      ['cloud answers with a page', () => mockGot.mockResolvedValue(cloudResponse('<!doctype html>'))],
      [
        'the cloud host has moved',
        () => mockGot.mockResolvedValue(cloudResponse('', 308, { location: 'https://app.tooljet.ai/' })),
      ],
    ])('reports unavailable when %s', async (_label, arrange) => {
      arrange();
      await expect(makeService().getPlanPrices()).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });
});
