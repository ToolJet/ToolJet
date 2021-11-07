import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'ws';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any): void {}

  handleDisconnect(client: any): void {}

  broadcast(data) {
    this.server.clients.forEach((client) => {
      if (client.appId === data.appId) client.send(data.message);
    });
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
