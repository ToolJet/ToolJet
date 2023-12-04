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
import { maybeSetSubPath } from '../helpers/utils.helper';

@WebSocketGateway({ path: maybeSetSubPath('/ws') })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private authService: AuthService) {}
  @WebSocketServer()
  server: Server;

  handleConnection(client: any): void {}

  handleDisconnect(client: any): void {}

  broadcast(data) {
    this.server.clients.forEach((client: any) => {
      if (client.isAuthenticated && client.appId === data.appId) client.send(data.message);
    });
  }

  @SubscribeMessage('authenticate')
  onAuthenticateEvent(client: any, data: string) {
    const signedJwt = this.authService.verifyToken(data);
    if (isEmpty(signedJwt)) client.close();
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
