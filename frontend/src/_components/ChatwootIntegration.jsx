import { useEffect } from 'react';
import { getPrivateRoute } from '@/_helpers/routes';

function ChatwootIntegration({ token, darkMode, currentUser, hideMessageBubble = false }) {
  useEffect(() => {
    if (window.$chatwoot) {
      return window.$chatwoot.toggleBubbleVisibility('show');
    }
    window.chatwootSettings = {
      hideMessageBubble,
      position: 'right',
      locale: 'en',
      type: 'standard',
      darkMode: darkMode ? 'dark' : 'light',
    };

    (function (d, t) {
      var BASE_URL = 'https://app.chatwoot.com';
      var g = d.createElement(t),
        s = d.getElementsByTagName(t)[0];
      g.src = BASE_URL + '/packs/js/sdk.js';
      g.defer = true;
      g.async = true;
      s.parentNode.insertBefore(g, s);

      g.onload = function () {
        window.chatwootSDK.run({
          websiteToken: token,
          baseUrl: BASE_URL,
        });
      };
    })(document, 'script');

    window.addEventListener('chatwoot:ready', function () {
      if (!window.location.pathname.startsWith(getPrivateRoute('settings'))) {
        if (window.$chatwoot?.hasLoaded && !window.$chatwoot?.hideMessageBubble)
          window.$chatwoot?.toggleBubbleVisibility('hide');
      }
      window.$chatwoot?.setUser(currentUser?.id, {
        email: currentUser?.email,
        name: currentUser?.first_name + ' ' + currentUser?.last_name,
      });
    });

    return () => {
      if (window.$chatwoot?.hasLoaded) window.$chatwoot?.toggleBubbleVisibility('hide');
    };
  }, []);

  return null;
}

export default ChatwootIntegration;
