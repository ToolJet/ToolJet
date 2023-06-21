import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomStyles } from 'src/entities/custom_styles.entity';
import { Repository } from 'typeorm';
import postcss from 'postcss';
import * as parentSelector from 'postcss-parent-selector';

@Injectable()
export class CustomStylesService {
  constructor(
    @InjectRepository(CustomStyles)
    private customStylesRepository: Repository<CustomStyles>
  ) {}

  save(organizationId: string, styles: string) {
    return this.customStylesRepository.upsert(
      {
        organizationId,
        styles,
      },
      ['organizationId']
    );
  }

  async fetch(organizationId: string) {
    const stylesObject = await this.customStylesRepository.findOne({
      where: { organizationId },
    });

    /* 
    If the CSS parsing and processing fails, the unprocessed styles will be sent in the response. 
    This is a failsafe to prevent the controller from failing if the user saved invalid CSS. 
    TODO: This code will need to be refactored once CSS validation is added for the create API.
     */
    try {
      const processor = postcss([parentSelector({ selector: '.page-container' })]);

      const { css } = await processor.process(stylesObject.styles);

      return { ...stylesObject, css };
    } catch (error) {
      console.error(error);
    }
    return;
  }
}
