import { getConstantReference, copyConstantReference } from '../constantReference';
import { copyToClipboard } from '@/_helpers/appUtils';

jest.mock('@/_helpers/appUtils', () => ({ copyToClipboard: jest.fn() }));

describe('getConstantReference', () => {
  it('returns a constants reference for a Global', () => {
    expect(getConstantReference({ type: 'Global', name: 'API_URL' })).toBe('{{constants.API_URL}}');
  });

  it('returns a secrets reference for a Secret', () => {
    expect(getConstantReference({ type: 'Secret', name: 'STRIPE_KEY' })).toBe('{{secrets.STRIPE_KEY}}');
  });
});

describe('copyConstantReference', () => {
  beforeEach(() => copyToClipboard.mockClear());

  it('copies the Global reference to the clipboard', () => {
    copyConstantReference({ type: 'Global', name: 'API_URL' });
    expect(copyToClipboard).toHaveBeenCalledWith('{{constants.API_URL}}');
  });

  it('copies the Secret reference to the clipboard', () => {
    copyConstantReference({ type: 'Secret', name: 'STRIPE_KEY' });
    expect(copyToClipboard).toHaveBeenCalledWith('{{secrets.STRIPE_KEY}}');
  });
});
