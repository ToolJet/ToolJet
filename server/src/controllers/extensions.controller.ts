import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ExtensionsService } from '../services/extensions.service';
import { CreateExtensionDto } from '../dto/create-extension.dto';
import { UpdateExtensionDto } from '../dto/update-extension.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Connection } from 'typeorm';

@Controller('extensions')
export class ExtensionsController {
  constructor(private readonly extensionsService: ExtensionsService, private connection: Connection) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  create(@Body() createExtensionDto: CreateExtensionDto, @UploadedFile() file: Express.Multer.File) {
    const queryRunner = this.connection.createQueryRunner();
    return this.extensionsService.create(createExtensionDto, file, queryRunner);
  }

  @Get()
  findAll() {
    return this.extensionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.extensionsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExtensionDto: UpdateExtensionDto) {
    return this.extensionsService.update(+id, updateExtensionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.extensionsService.remove(+id);
  }
}
