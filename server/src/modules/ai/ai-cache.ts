import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class AiCacheService implements OnModuleInit {
  onModuleInit() {
    // Initialize cache
  }
  onModuleDestroy() {
    // Cleanup resources
  }
}
