import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Component } from 'src/entities/component.entity'; // Adjust the import path as per your project structure

@Injectable()
export class ComponentsService {
  constructor(
    @InjectRepository(Component)
    private componentsRepository: Repository<Component>
  ) {}

  async findOne(id: string): Promise<Component> {
    return this.componentsRepository.findOne(id);
  }

  async createOrUpdate(componentDiff: any) {
    console.log('----arpit:::: component service', { componentDiff });
  }
}
