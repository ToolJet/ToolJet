import {
  Controller,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  Res,
  StreamableFile,
  Post,
  Req,
  UploadedFile,
} from '@nestjs/common';
import { FileService } from '../services/file.service';
import { Readable } from 'stream';
import { Response } from 'express';
import { Connection } from 'typeorm';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
@UseInterceptors(ClassSerializerInterceptor)
export class FilesController {
  constructor(private readonly fileService: FileService, private connection: Connection) {}

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

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  public async createFile(@Req() req, @UploadedFile() file: Express.Multer.File) {
    const queryRunner = this.connection.createQueryRunner();
    return this.fileService.uploadFile(file.buffer, file.originalname, queryRunner);
  }
}
