import config from 'config';

class WebSocketConnection {
  constructor(appId) {
    this.socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${this.getWebsocketUrl()}`);

    this.addListeners(appId);
  }

  getWebsocketUrl() {
    const re = /https?:\/\//g;
    const isSecure = re.test(config.apiUrl);

    let url;
    if (isSecure) {
      url = config.apiUrl.replace(/(^\w+:|^)\/\//, '').replace('/api', '/ws');
    } else {
      url = `${window.location.host}${config.apiUrl.replace(/(^\w+:|^)\/\//, '').replace('/api', '/ws')}`;
    }

    return url;
  }

  addListeners(appId) {
    // Connection opened
    this.socket.addEventListener('open', (event) => {
      console.log('connection established', event);

      //TODO: verify if the socket functionality is working or not
      this.socket.send(
        JSON.stringify({
          event: 'authenticate',
        })
      );

      this.socket.send(
        JSON.stringify({
          event: 'subscribe',
          data: appId,
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
