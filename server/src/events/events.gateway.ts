import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
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
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private authService: AuthService) {}
  @WebSocketServer()
  server: Server;

  handleConnection(client: any): void {
    this.server.on('connection', setupWSConnection);
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
