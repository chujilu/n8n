import type { MigrationContext, ReversibleMigration } from '@db/types';

export class AddWaitTillColumn implements ReversibleMigration {
	async up({ schemaBuilder: { addColumns, column, createIndex } }: MigrationContext) {
		await addColumns('execution_entity', [column('waitTill').timestamp()]);
		await createIndex('ca4a71b47f28ac6ea88293a8e2', 'execution_entity', ['waitTill']);
	}

	async down({ schemaBuilder: { dropIndex, dropColumns } }: MigrationContext) {
		await dropIndex('ca4a71b47f28ac6ea88293a8e2', 'execution_entity');
		await dropColumns('execution_entity', ['waitTill']);
	}
}
