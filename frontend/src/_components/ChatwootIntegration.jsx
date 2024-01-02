import { useEffect } from 'react';

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
      window.$chatwoot?.setUser(currentUser?.id, {
        email: currentUser?.email,
        name: currentUser?.first_name + ' ' + currentUser?.last_name,
      });
    });

    return () => {
      window.$chatwoot?.toggleBubbleVisibility('hide');
    };
  }, []);

  return null;
}

export default ChatwootIntegration;
