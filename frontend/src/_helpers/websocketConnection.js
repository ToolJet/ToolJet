import config from 'config';

class WebSocketConnection {
  constructor(appId) {
    this.socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${this.getWebsocketUrl()}`);

    this.addListeners(appId);
  }

  getWebsocketUrl() {
    const re = /https?:\/\//g;
    if (re.test(config.apiUrl)) return config.apiUrl.replace(/(^\w+:|^)\/\//, '').replace('/api', '');

    return window.location.host;
  }

  addListeners() {
    // Connection opened
    this.socket.addEventListener('open', (event) => {
      console.log('connection established', event);
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));

      this.socket.send(
        JSON.stringify({
          event: 'authenticate',
          data: currentUser.auth_token,
        })
      );
    });

    // Connection closed
    this.socket.addEventListener('close', (event) => {
      console.log('connection closed', event);
    });

    // Listen for possible errors
    this.socket.addEventListener('error', (event) => {
      console.log('WebSocket error: ', event);
    });
  }
}

export const createWebsocketConnection = (appId) => {
  return new WebSocketConnection(appId);
};
