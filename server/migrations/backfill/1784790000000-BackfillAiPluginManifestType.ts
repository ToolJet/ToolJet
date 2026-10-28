import { MigrationInterface, QueryRunner, In } from 'typeorm';
import { Plugin } from '@entities/plugin.entity';
import { File } from '@entities/file.entity';
import { encode, decode } from 'js-base64';

// Marketplace plugin ids reclassified from the "api" manifest type to "ai"
// (see marketplace/plugins/<id>/lib/manifest.json). Plugins installed before
// that manifest change still carry the old type in their stored manifest
// file, so they need to be backfilled to show up under the "AI" category.
const AI_PLUGIN_IDS = [
  'anthropic',
  'aws-bedrock',
  'cohere',
  'gemini',
  'hugging_face',
  'mistral_ai',
  'openai',
  'pinecone',
  'portkey',
  'qdrant',
  'weaviate',
];

export class BackfillAiPluginManifestType1784790000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.updateManifestType(queryRunner, 'api', 'ai');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.updateManifestType(queryRunner, 'ai', 'api');
  }

  private async updateManifestType(queryRunner: QueryRunner, fromType: string, toType: string): Promise<void> {
    const manager = queryRunner.manager;

    const plugins = await manager.find(Plugin, {
      where: { pluginId: In(AI_PLUGIN_IDS) },
      relations: ['manifestFile'],
    });

    for (const plugin of plugins) {
      const manifestFile = plugin.manifestFile;
      if (!manifestFile) continue;

      const manifest = JSON.parse(decode(manifestFile.data.toString('utf8')));
      let changed = false;

      if (manifest.type === fromType) {
        manifest.type = toType;
        changed = true;
      }

      if (manifest['tj:source']?.type === fromType) {
        manifest['tj:source'].type = toType;
        changed = true;
      }

      if (!changed) continue;

      await manager.update(File, manifestFile.id, {
        data: encode(JSON.stringify(manifest)),
      });
    }
  }
}
