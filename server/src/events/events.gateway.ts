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

  @SubscribeMessage('authenticate')
  onAuthenticateEvent(client: any, data: any) {
    const signedJwt = this.authService.verifyToken(data.authToken);
    if (isEmpty(signedJwt)) {
      client._events.close();
    } else {
      client.isAuthenticated = true;
      client.userId = data.userId;
      client.organizationId = data.organizationId;
    }
    return;
  }

  @SubscribeMessage('app-edit')
  onSubscribeEvent(client: any, data: any) {
    client.appId = data.appId;
    return;
  }

  @SubscribeMessage('events')
  onEvent(@MessageBody() data: any) {
    if (data.message == 'notifications') {
      this.server.clients.forEach((client: any) => {
        if (client.isAuthenticated && client.appId === data.appId)
          client.send(JSON.stringify({ message: data.message }));
      });
    }

    if (data.message == 'threads') {
      this.server.clients.forEach((client: any) => {
        if (client.isAuthenticated && client.appId === data.appId)
          client.send(JSON.stringify({ message: data.message }));
      });
    }

    if (data.message == 'thread-update') {
      this.server.clients.forEach((client: any) => {
        if (client.isAuthenticated && client.appId === data.appId)
          client.send(JSON.stringify({ message: data.message, threadId: data.threadId }));
      });
    }

    if (data.message == 'force-logout') {
      this.server.clients.forEach((client: any) => {
        if (client.isAuthenticated && data.userIds.includes(client.userId)) {
          client.send(JSON.stringify({ message: data.message, toast: data.toast }));
        }
      });
    }

    return;
  }
}
