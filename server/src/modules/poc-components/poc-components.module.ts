import { Module } from '@nestjs/common';
import { PocComponentsController } from './poc-components.controller';

// POC: plain module (no edition/register ceremony — nothing edition-specific here yet).
@Module({ controllers: [PocComponentsController] })
export class PocComponentsModule {}
