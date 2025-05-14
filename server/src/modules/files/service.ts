import { Injectable, Param, Res, StreamableFile } from '@nestjs/common';
import { Readable } from 'stream';
import { FilesRepository } from '@modules/files/repository';
import { Response } from 'express';
import { IFilesService } from '@modules/files/interfaces/IService';

@Injectable()
export class FilesService implements IFilesService {
  constructor(protected readonly filesRepository: FilesRepository) {}
  async getOne(@Param('id') id: string, @Res({ passthrough: true }) response: Response) {
    const file = await this.filesRepository.getOne(id);

    const stream = Readable.from(file.data);

    response.set({
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Content-Type': 'image',
    });

    // https://docs.nestjs.com/techniques/streaming-files
    return new StreamableFile(stream);
  }
}
