import http from 'http';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'ws';
import { AuthService } from 'src/services/auth.service';
import { isEmpty } from 'lodash';
import { setupWSConnection } from 'y-websocket/bin/utils';

/**
 * Cannot add a namespace if we are using the "ws" package adapter
 * https://github.com/nestjs/nest/blob/master/packages/platform-ws/adapters/ws-adapter.ts#L53
 */
@WebSocketGateway(3001)
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
      else setupWSConnection(connection, request);
    }
  };

  protected onConnection = async (connection: WebSocket, request: http.IncomingMessage) => {
    this.authenticate(connection, request);
  };

  handleConnection(client: any): void {
    this.server.on('connection', this.onConnection);
  }

  handleDisconnect(client: any): void {}
}
