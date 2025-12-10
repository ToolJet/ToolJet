import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrateDividerStylesForm1765256114161 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        const batchSize = 100;
        let offset = 0;
        let hasMoreData = true;

        while (hasMoreData) {
            // Fetch components in batches using raw SQL
            const components = await queryRunner.query(
                `SELECT id, styles
                 FROM components
                 WHERE type = 'Form'
                 ORDER BY "created_at" ASC
                 LIMIT $1 OFFSET $2`,
                [batchSize, offset]
            );
            if (components.length === 0) {
                hasMoreData = false;
                break;
            }

            await this.processUpdates(queryRunner, components);
            offset += batchSize;
        }
    }

    private async processUpdates(queryRunner: QueryRunner, components: any[]) {
        for (const component of components) {
            const styles = component.styles ? { ...component.styles } : {};

            if (!styles.headerDividerColor.value) {
                styles.headerDividerColor.value = "var(--cc-default-border)"
            }

            if (!styles.footerDividerColor.value) {
                styles.footerDividerColor.value = "var(--cc-default-border)"
            }

            await queryRunner.query(
                `UPDATE components
                 SET styles = $1
                 WHERE id = $2`,
                [styles, component.id]
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
