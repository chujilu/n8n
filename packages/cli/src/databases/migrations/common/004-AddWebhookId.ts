import type { MigrationContext, ReversibleMigration } from '@db/types';

export abstract class AddWebhookId implements ReversibleMigration {
	abstract indexName: string;

	async up({ schemaBuilder: { addColumns, column, createIndex } }: MigrationContext) {
		await addColumns('webhook_entity', [
			column('webhookId').varchar().primary,
			column('pathLength').int.primary,
		]);
		await createIndex(this.indexName, 'webhook_entity', ['webhookId', 'method', 'pathLength']);
	}

	async down({ schemaBuilder: { dropIndex, dropColumns } }: MigrationContext) {
		await dropIndex(this.indexName, 'webhook_entity');
		await dropColumns('webhook_entity', ['pathLength', 'webhookId']);
	}
}
