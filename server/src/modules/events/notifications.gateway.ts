import http from 'http';
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, WebSocket } from 'ws';
import type { Redis } from 'ioredis';
import { isEmpty } from 'lodash';
import { maybeSetSubPath } from '../../helpers/utils.helper';
import { SessionUtilService } from '@modules/session/util.service';
import { RedisService } from '@modules/redis/service';
import { NOTIFICATION_REALTIME_CHANNEL } from '@modules/notifications/constants';

// Dedicated user-scoped socket for live notifications. The producer (worker pod) publishes to
// NOTIFICATION_REALTIME_CHANNEL; each web pod subscribes here and relays to its local sockets
// whose authenticated userId matches the target. Raw ws, no rooms — local filter by userId.
@WebSocketGateway({ path: maybeSetSubPath('/ws/notifications') })
export class NotificationsGateway implements OnGatewayConnection, OnModuleInit, OnModuleDestroy {
  constructor(
    protected readonly sessionUtilService: SessionUtilService,
    private readonly redisService: RedisService
  ) {}

  @WebSocketServer()
  server: Server;

  private subscriber: Redis;

  // error code 4000 tells the client not to reconnect after an auth failure
  private static readonly AUTH_FAILED = 4000;

  private getCookie(cookie: string, name: string): string {
    const a = `; ${cookie}`.match(`;\\s*${name}=([^;]+)`);
    return a ? a[1] : '';
  }

  handleConnection(client: any, request: http.IncomingMessage): void {
    const token = this.getCookie(request?.headers?.cookie, 'tj_auth_token');
    const signedJwt = isEmpty(token) ? null : this.sessionUtilService.verifyToken(token);
    if (isEmpty(signedJwt)) {
      client.close(NotificationsGateway.AUTH_FAILED);
      return;
    }
    // JWT payload: username holds the user id (see session util generateLoginResultPayload)
    client.userId = signedJwt.username;
  }

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'test') return;
    this.subscriber = this.redisService.createSubscriber();
    this.subscriber.subscribe(NOTIFICATION_REALTIME_CHANNEL);
    this.subscriber.on('message', (_channel: string, raw: string) => this.relay(raw));
  }

  onModuleDestroy(): void {
    this.subscriber?.disconnect();
  }

  private relay(raw: string): void {
    let userId: string;
    let toast: boolean;
    let notification: unknown;
    try {
      ({ userId, toast, notification } = JSON.parse(raw));
    } catch {
      return;
    }
    if (!userId) return;
    const frame = JSON.stringify({ event: 'notification', data: notification, toast: toast === true });
    this.server.clients.forEach((client: any) => {
      if (client.userId === userId && client.readyState === WebSocket.OPEN) client.send(frame);
    });
  }
}
