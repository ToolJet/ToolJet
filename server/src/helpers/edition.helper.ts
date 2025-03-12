import { DataSource } from 'typeorm';
import { getTooljetEdition } from './utils.helper';
import { INestApplication } from '@nestjs/common';
import { Metadata } from '@entities/metadata.entity';

const EDITION_PRIORITY = {
  ce: 0,
  ee: 1,
  cloud: 2,
};

export function getEditionPriority(edition: string): number {
  return EDITION_PRIORITY[edition?.toLowerCase()] ?? -1;
}

export function isEditionDowngrade(currentEdition: string, newEdition: string): boolean {
  if (!currentEdition || !newEdition) return false;
  return getEditionPriority(currentEdition) > getEditionPriority(newEdition);
}

export async function validateEdition(app: INestApplication) {
  if (process.env.NODE_ENV === 'production') return;

  const dataSource = app.get(DataSource);
  const metadataRepository = dataSource.getRepository(Metadata);
  const editionMetadata = (await metadataRepository.find())?.[0];

  const currentEdition = getTooljetEdition();
  const savedEdition = editionMetadata?.data?.edition;

  if (savedEdition) {
    if (isEditionDowngrade(savedEdition, currentEdition)) {
      console.error(
        `Cannot downgrade from ${savedEdition} to ${currentEdition}. Please use an equal or higher edition or reset the database.`
      );
      await app.close();
      process.exit(0);
    }
    // change edition
    if (savedEdition !== currentEdition) {
      await metadataRepository.update(
        { id: editionMetadata.id },
        { data: { ...editionMetadata.data, edition: currentEdition } }
      );
    }
  } else if (editionMetadata) {
    await metadataRepository.update(
      { id: editionMetadata.id },
      { data: { ...editionMetadata.data, edition: currentEdition } }
    );
  } else {
    await metadataRepository.save({
      data: { edition: currentEdition },
    });
  }
}
