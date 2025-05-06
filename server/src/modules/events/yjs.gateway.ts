import http from 'http';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { maybeSetSubPath } from '../../helpers/utils.helper';
import { isEmpty } from 'lodash';
import { SessionUtilService } from '@modules/session/util.service';


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
