import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';

// CE stub — the feature is EE/paid; real implementation lives in ee/custom-component-libraries/.
@Injectable()
export class DevBundleEventsService {
  subscribe(libraryId: string, userId: string): Observable<MessageEvent> {
    throw new Error('Method not implemented.');
  }

  async emit(libraryId: string, userId: string, devUploadedAt: Date): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
