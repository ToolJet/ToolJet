import React from 'react';
import { render } from '@testing-library/react';
import OAuthConfiguration from '../GrantTypes';

describe('OAuth key-value field alignment', () => {
  it('keeps custom header and authentication parameter fields inside full-width columns', () => {
    const { container } = render(
      <OAuthConfiguration
        authConfig={{
          auth_url: '',
          custom_auth_params: [['prompt', 'login']],
          grant_type: 'authorization_code',
          multiple_auth_enabled: false,
          scopes: '',
        }}
        clientConfig={{}}
        tokenConfig={{
          access_token_custom_headers: [['X-Api-Key', 'value']],
        }}
        workspaceConfig={{ workspaceConstants: {} }}
        opt={{ selectedDataSource: {}, options: {} }}
        handlers={{ optionchanged: () => {}, optionsChanged: () => {} }}
        oauth_configs={{ allowed_grant_types: ['authorization_code'] }}
        isFieldAllowed={(field) => ['access_token_custom_headers', 'custom_auth_params'].includes(field)}
      />
    );

    [
      ['access-token-url-custom-headers-section', 'access-token-url-custom-headers-key-input-field-0'],
      ['custom-authentication-parameters-section', 'custom-authentication-parameters-key-input-field-0'],
    ].forEach(([sectionCy, keyInputCy]) => {
      const section = container.querySelector(`[data-cy="${sectionCy}"]`);
      const keyInput = container.querySelector(`[data-cy="${keyInputCy}"]`);
      const column = section?.closest('.col-md-12');

      expect(column).toBeInTheDocument();
      expect(column).toContainElement(section);
      expect(column).toContainElement(keyInput);
    });
  });
});
