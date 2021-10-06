import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  clients: any[];

  @WebSocketServer()
  server: Server;

  handleConnection(client: any): void {
    console.warn(`Client[${client.id}] connected]`);
    this.clients.push(client);
  }

  handleDisconnect(client: any): void {
    console.warn(`Client[${client.id}] disconnected]`);
    this.clients = this.clients.filter((c) => c !== client);
  }

  @SubscribeMessage('client')
  onEvent(client: any, data: any): void {
    console.warn(`Channel[${client.id}]: ${data}`);
    // const event = 'events';
    // this.server.clients.forEach((client) => {
    //   client.send(JSON.stringify({ event, data }));
    // });
  }
}
