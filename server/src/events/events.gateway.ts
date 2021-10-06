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
    this.server.clients.forEach((client) => client.send(data));
  }

  @SubscribeMessage('events')
  onEvent(@MessageBody() data: unknown) {
    this.broadcast(data);
    return data;
  }
}
