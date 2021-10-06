import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsResponse,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'ws';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  clients: any[];

  @WebSocketServer()
  server: Server;

  handleConnection(client: any): void {
    console.warn('sock connected');

    // console.warn(`Client[${client.id}] connected]`);
    // this.clients.push(client);
  }

  handleDisconnect(client: any): void {
    console.warn('sock disconect');

    console.warn(`Client[${client.id}] disconnected]`);
    // this.clients = this.clients.filter((c) => c !== client);
  }

  // @SubscribeMessage('client')
  // onEvent(client: any, data: any): void {
  //   console.warn(`Channel`);
  //   console.warn(`Channel`);
  //   console.warn(`Channel`);
  //   console.log(`Channel`);
  //   console.log(`Channel`);
  //   console.log(`Channel`);
  //   console.log(`Channel`);
  //   console.log(`Channel`);
  //   // const event = 'events';
  //   // this.server.clients.forEach((client) => {
  //   //   client.send(JSON.stringify({ event, data }));
  //   // });
  // }

  @SubscribeMessage('events')
  onEvent(@MessageBody() data: unknown): WsResponse<unknown> {
    console.log('herE?????');
    console.log('herE?????');
    console.log('herE?????');

    const event = 'events';
    return { event, data };
  }
}
