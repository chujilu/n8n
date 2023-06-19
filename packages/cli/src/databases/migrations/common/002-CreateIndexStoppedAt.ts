import type { MigrationContext, ReversibleMigration } from '@db/types';

export abstract class CreateIndexStoppedAt implements ReversibleMigration {
	abstract indexName: string;

	async up({ schemaBuilder: { createIndex } }: MigrationContext) {
		await createIndex(this.indexName, 'execution_entity', ['stoppedAt']);
	}

	async down({ schemaBuilder: { dropIndex } }: MigrationContext) {
		await dropIndex(this.indexName, 'execution_entity');
	}
}
