import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddArtifactsTable1748542504137 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'artifacts',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'uuid',
                    },
                    {
                        name: 'conversation_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'message_id',
                        type: 'uuid',
                        isNullable: false,
                    },
                    {
                        name: 'content',
                        type: 'jsonb',
                        isNullable: false,
                    },
                    {
                        name: 'identifier',
                        type: 'varchar',
                        isNullable: false,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        await queryRunner.createForeignKey(
            'artifacts',
            new TableForeignKey({
                columnNames: ['conversation_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'ai_conversations',
                onDelete: 'CASCADE',
            }),
        );

        await queryRunner.createForeignKey(
            'artifacts',
            new TableForeignKey({
                columnNames: ['message_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'ai_conversation_messages',
                onDelete: 'CASCADE',
            }),
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('artifacts');
        if (table) {
            const foreignKeys = table.foreignKeys;
            await Promise.all(foreignKeys.map(foreignKey => queryRunner.dropForeignKey('artifacts', foreignKey)));
        }
        await queryRunner.dropTable('artifacts');
    }
}
