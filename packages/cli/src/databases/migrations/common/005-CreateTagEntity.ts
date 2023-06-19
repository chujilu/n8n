import type { MigrationContext, ReversibleMigration } from '@db/types';

export abstract class CreateTagEntity implements ReversibleMigration {
	async up({ schemaBuilder: { createTable, column } }: MigrationContext) {
		await createTable('tag_entity')
			.withColumns(column('id').int.primary.autoGenerate, column('name').varchar(24).notNull)
			.withTimestamps.withIndexOn('name', true);

		await createTable('workflows_tags')
			.withColumns(column('workflowId').int.primary, column('tagId').int.primary)
			.withIndexOn('workflowId')
			.withIndexOn('tagId')
			.withForeignKey('workflowId', {
				tableName: 'workflow_entity',
				columnName: 'id',
				onDelete: 'CASCADE',
			})
			.withForeignKey('tagId', { tableName: 'tag_entity', columnName: 'id', onDelete: 'CASCADE' });
	}

	async down({ schemaBuilder: { dropTable } }: MigrationContext) {
		await dropTable('workflows_tags');
		await dropTable('tag_entity');
	}
}
