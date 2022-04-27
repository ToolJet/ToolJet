import {
  Controller,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileService } from '../services/file.service';
import { Readable } from 'stream';
import { Response } from 'express';

@Controller('files')
@UseInterceptors(ClassSerializerInterceptor)
export class FilesController {
  constructor(private readonly fileService: FileService) {}

  @Get(':id')
  async getDatabaseFileById(@Res({ passthrough: true }) response: Response, @Param('id') id: string) {
    const file = await this.fileService.getFileById(id);

    const stream = Readable.from(file.data);

    response.set({
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Content-Type': 'image',
    });

    // https://docs.nestjs.com/techniques/streaming-files
    return new StreamableFile(stream);
  }
}
