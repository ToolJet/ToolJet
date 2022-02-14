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

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private authService: AuthService) {}
  @WebSocketServer()
  server: Server;

  handleConnection(client: any): void {}

  handleDisconnect(client: any): void {}

  broadcast(data: any) {
    switch (data.message) {
      case 'subscribe':
        this.server.clients.size > 1 &&
          this.server.clients.forEach((client: any) => {
            if (client.isAuthenticated && client.appId === data.appId && client.id !== data.clientId)
              client.send(JSON.stringify(data));
          });
        break;

      default:
        this.server.clients.forEach((client: any) => {
          if (client.isAuthenticated && client.appId === data.appId) client.send(data.message);
        });
        break;
    }
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
    const _data = JSON.parse(data);
    client.appId = _data.appId;
    client.id = _data.clientId;
    client.meta = _data.meta;
    _data.message = 'subscribe';
    this.broadcast(_data);
    return;
  }

  @SubscribeMessage('events')
  onEvent(@MessageBody() data: any) {
    this.broadcast(data);
    return data.message;
  }
}
