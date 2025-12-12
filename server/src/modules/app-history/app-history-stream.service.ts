import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AppHistoryStreamService {
  getStream(_appVersionId: string, _getInitialData: () => Promise<any>): Observable<MessageEvent> {
    throw new Error('Method not implemented.');
  }

  emitHistoryUpdate(_appVersionId: string, _historyEntry: any): void {
    throw new Error('Method not implemented.');
  }
}
