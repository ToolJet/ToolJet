import http from 'http';
import {
  SubscribeMessage,
  MessageBody,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { AuthService } from 'src/services/auth.service';
import { isEmpty } from 'lodash';
import { setupWSConnection } from 'y-websocket/bin/utils';

/**
 * Cannot add a namespace if we are using the "ws" package adapter
 * https://github.com/nestjs/nest/blob/master/packages/platform-ws/adapters/ws-adapter.ts#L53
 */
@WebSocketGateway()
export class YjsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private authService: AuthService) {}
  @WebSocketServer()
  server: Server;

  private getCookie = (cookie: string, n: string): string => {
    const a = `; ${cookie}`.match(`;\\s*${n}=([^;]+)`);
    return a ? a[1] : '';
  };

  protected authenticate = (connection: WebSocket, request: http.IncomingMessage) => {
    const WEBSOCKET_AUTH_FAILED = 4000;
    const token = this.getCookie(request?.headers?.cookie, 'auth_token');
    if (isEmpty(token)) {
      connection.close(WEBSOCKET_AUTH_FAILED);
    } else {
      const signedJwt = this.authService.verifyToken(token);
      if (isEmpty(signedJwt)) connection.close(WEBSOCKET_AUTH_FAILED);
      else {
        try {
          setupWSConnection(connection, request);
        } catch (error) {
          console.log(error);
        }
      }
    }
  };

  protected onConnection = async (connection: WebSocket, request: http.IncomingMessage) => {
    this.authenticate(connection, request);
  };

  handleConnection(client: any): void {
    this.server.on('connection', this.onConnection);
  }

  handleDisconnect(client: any): void {}

  broadcast(data) {
    this.server.clients.forEach((client: any) => {
      if (client.isAuthenticated && client.appId === data.appId) client.send(data.message);
    });
  }

  @SubscribeMessage('authenticate')
  onAuthenticateEvent(client: any, data: string) {
    const signedJwt = this.authService.verifyToken(data);
    if (isEmpty(signedJwt)) client._events.close();
    else client.isAuthenticated = true;
    return;
  }

  @SubscribeMessage('subscribe')
  onSubscribeEvent(client: any, data: string) {
    client.appId = data;
    return;
  }

  @SubscribeMessage('events')
  onEvent(@MessageBody() data: any) {
    this.broadcast(data);
    return data.message;
  }
}
