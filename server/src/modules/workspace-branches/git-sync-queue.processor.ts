import { Injectable } from '@nestjs/common';

// CE stub. No @Processor decorator — CE never consumes git-sync jobs.
@Injectable()
export class GitSyncQueueProcessor {}
