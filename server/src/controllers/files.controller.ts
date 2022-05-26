import {
  Controller,
  Get,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  Res,
  StreamableFile,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { Readable } from 'stream';
import { Response } from 'express';
import { FilesService } from '../services/files.service';
import { UpdateFileDto } from '../dto/update-file.dto';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';

@Controller('files')
@UseInterceptors(ClassSerializerInterceptor)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.filesService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Res({ passthrough: true }) response: Response) {
    const file = await this.filesService.findOne(id);

    const stream = Readable.from(file.data);

    response.set({
      'Content-Disposition': `inline; filename="${file.filename}"`,
      'Content-Type': 'image',
    });

    // https://docs.nestjs.com/techniques/streaming-files
    return new StreamableFile(stream);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.filesService.update(id, updateFileDto);
  }
}
