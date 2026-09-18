import {
  getTooljetEditionFromVersion,
  checkIfToolJetCloud,
  checkIfToolJetEE,
  resolveEditionSpecificDefaults,
} from '../utils';

describe('getTooljetEditionFromVersion', () => {
  // buildVersion() on the server emits `<rawVersion>-<edition>` and, for LTS,
  // `<baseVersion>-<edition>-lts`. rawVersion itself may carry a pre-release tag
  // like `-beta`, so the edition is the last segment (ignoring a trailing -lts),
  // never a fixed index.
  it.each([
    ['3.21.71-cloud', 'cloud'],
    ['3.21.71-beta-cloud', 'cloud'],
    ['3.21.71-cloud-lts', 'cloud'],
    ['3.21.71-beta-cloud-lts', 'cloud'],
    ['3.21.71-ee', 'ee'],
    ['3.21.71-beta-ee', 'ee'],
    ['3.21.71-ee-lts', 'ee'],
    ['3.21.71-ce', 'ce'],
  ])('maps %s -> %s', (version, expected) => {
    expect(getTooljetEditionFromVersion(version)).toBe(expected);
  });

  it.each([undefined, null, '', '3.21.71', '2.50.0'])(
    'defaults unrecognised/versionless input (%s) to ce',
    (version) => {
      expect(getTooljetEditionFromVersion(version)).toBe('ce');
    }
  );

  it('is case-insensitive on the edition token', () => {
    expect(getTooljetEditionFromVersion('3.21.71-CLOUD')).toBe('cloud');
  });
});

describe('checkIfToolJetCloud / checkIfToolJetEE', () => {
  it('detects cloud only for cloud versions (including pre-release builds)', () => {
    expect(checkIfToolJetCloud('3.21.71-beta-cloud')).toBe(true);
    expect(checkIfToolJetCloud('3.21.71-beta-ee')).toBe(false);
    expect(checkIfToolJetCloud(undefined)).toBe(false);
  });

  it('detects ee only for ee versions (including pre-release builds)', () => {
    expect(checkIfToolJetEE('3.21.71-beta-ee')).toBe(true);
    expect(checkIfToolJetEE('3.21.71-beta-cloud')).toBe(false);
    expect(checkIfToolJetEE(undefined)).toBe(false);
  });
});

describe('resolveEditionSpecificDefaults', () => {
  const defaults = {
    access_type: { value: 'read' },
    authentication_type: {
      value: 'oauth2',
      editions: { ce: 'service_account', ee: 'service_account', cloud: 'oauth2' },
    },
    oauth_type: {
      value: 'custom_app',
      editions: { ce: 'custom_app', ee: 'custom_app', cloud: 'tooljet_app' },
    },
  };

  it('applies the cloud value for a cloud version', () => {
    const resolved = resolveEditionSpecificDefaults(defaults, '3.21.71-beta-cloud');
    expect(resolved.authentication_type.value).toBe('oauth2');
    expect(resolved.oauth_type.value).toBe('tooljet_app');
  });

  it('applies the ee value for an ee version', () => {
    const resolved = resolveEditionSpecificDefaults(defaults, '3.21.71-beta-ee');
    expect(resolved.authentication_type.value).toBe('service_account');
    expect(resolved.oauth_type.value).toBe('custom_app');
  });

  it('falls back to ce for a versionless/unknown build', () => {
    const resolved = resolveEditionSpecificDefaults(defaults, undefined);
    expect(resolved.authentication_type.value).toBe('service_account');
    expect(resolved.oauth_type.value).toBe('custom_app');
  });

  it('leaves entries without an editions map untouched', () => {
    const resolved = resolveEditionSpecificDefaults(defaults, '3.21.71-beta-cloud');
    expect(resolved.access_type).toEqual({ value: 'read' });
  });

  it('strips the editions map from resolved entries', () => {
    const resolved = resolveEditionSpecificDefaults(defaults, '3.21.71-beta-cloud');
    expect(resolved.authentication_type).not.toHaveProperty('editions');
  });

  it('preserves sibling fields (e.g. encrypted) while swapping value', () => {
    const withEncrypted = {
      key: { value: 'a', encrypted: true, editions: { ce: 'b', ee: 'b', cloud: 'a' } },
    };
    const resolved = resolveEditionSpecificDefaults(withEncrypted, '3.21.71-ee');
    expect(resolved.key).toEqual({ value: 'b', encrypted: true });
  });

  it('is a no-op passthrough for a manifest with no editions anywhere', () => {
    const plain = { host: { value: 'localhost' }, port: { value: '5432' } };
    expect(resolveEditionSpecificDefaults(plain, '3.21.71-beta-cloud')).toEqual(plain);
  });

  it('returns non-object input as-is', () => {
    expect(resolveEditionSpecificDefaults(undefined, '3.21.71-cloud')).toBeUndefined();
    expect(resolveEditionSpecificDefaults(null, '3.21.71-cloud')).toBeNull();
  });
});
