import http from 'http';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'ws';
import { setupWSConnection, setPersistence } from 'y-websocket/bin/utils';
import { RedisPubSub } from '../../helpers/redis';
import { maybeSetSubPath } from '../../helpers/utils.helper';
import { isEmpty } from 'lodash';
import { SessionUtilService } from '@modules/session/util.service';

// TODO: Mock redis for test env
if (process.env.NODE_ENV !== 'test') {
  const redis = new RedisPubSub({
    redisOpts: process.env.REDIS_URL
      ? process.env.REDIS_URL
      : {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          username: process.env.REDIS_USER || '',
          password: process.env.REDIS_PASSWORD || '',
        },
  });

  setPersistence({
    provider: redis,
    bindState: async (docName: any, ydoc: any) => {
      const persistedYdoc = redis.bindState(docName, ydoc);
      ydoc.on('update', persistedYdoc.updateHandler);
      ydoc.awareness.on('update', (update, conn) => persistedYdoc.updateAwarenessHandler(ydoc.awareness, update, conn));
    },
    writeState: (docName: any, ydoc: any) => {
      return new Promise((resolve) => {
        resolve(redis.closeDoc(docName));
      });
    },
  });
}

@WebSocketGateway({ path: maybeSetSubPath('/yjs') })
export class YjsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private sessionUtilService: SessionUtilService) {}
  @WebSocketServer()
  server: Server;

  private getCookie = (cookie: string, n: string): string => {
    const a = `; ${cookie}`.match(`;\\s*${n}=([^;]+)`);
    return a ? a[1] : '';
  };

  protected authenticate = (connection: WebSocket, request: http.IncomingMessage) => {
    // error code 4000 to communicate to client
    // that it should not reconnect if auth failed
    const ERROR_CODE_WEBSOCKET_AUTH_FAILED = 4000;
    const token = this.getCookie(request?.headers?.cookie, 'tj_auth_token');
    if (isEmpty(token)) {
      connection.close(ERROR_CODE_WEBSOCKET_AUTH_FAILED);
    } else {
      const signedJwt = this.sessionUtilService.verifyToken(token);
      if (isEmpty(signedJwt)) connection.close(ERROR_CODE_WEBSOCKET_AUTH_FAILED);
      else {
        try {
          const appId = this.getCookie(request?.headers?.cookie, 'app_id');
          setupWSConnection(connection, request, { docName: appId });
          console.log(`User connected with app-id: ${appId}`);
        } catch (error) {
          console.log(error);
        }
      }
    }
  };

  protected onConnection = (connection: WebSocket, request: http.IncomingMessage) => {
    this.authenticate(connection, request);
  };

  handleConnection(client: any, args: any): void {
    this.onConnection(client, args);
  }

  handleDisconnect(client: any): void {}
}
