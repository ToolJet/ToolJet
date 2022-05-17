import { Module } from '@nestjs/common';
import { ExtensionsService } from '../../services/extensions.service';
import { ExtensionsController } from '../../controllers/extensions.controller';
import { Extension } from 'src/entities/extension.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslModule } from '../casl/casl.module';

@Module({
  controllers: [ExtensionsController],
  imports: [TypeOrmModule.forFeature([Extension]), CaslModule],
  providers: [ExtensionsService],
})
export class ExtensionsModule {}
