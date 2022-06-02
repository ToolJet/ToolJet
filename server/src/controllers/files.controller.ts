import {
  Controller,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { Readable } from 'stream';
import { Response } from 'express';
import { FilesService } from '../services/files.service';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';

@Controller('files')
@UseInterceptors(ClassSerializerInterceptor)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async show(@Param('id') id: string, @Res({ passthrough: true }) response: Response) {
    const file = await this.filesService.findOne(id);

    const stream = Readable.from(file.data);

    response.set({
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Content-Type': 'image',
    });

    // https://docs.nestjs.com/techniques/streaming-files
    return new StreamableFile(stream);
  }
}
