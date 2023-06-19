import type { MigrationContext, ReversibleMigration } from '@db/types';

export class AddExecutionEntityIndices implements ReversibleMigration {
	async up({ schemaBuilder: { dropIndex, createIndex } }: MigrationContext) {
		await dropIndex('c4d999a5e90784e8caccf5589d', 'execution_entity');
		await dropIndex('ca4a71b47f28ac6ea88293a8e2', 'execution_entity');

		await createIndex('06da892aaf92a48e7d3e400003', 'execution_entity', [
			'workflowId',
			'waitTill',
			'id',
		]);

		await createIndex('78d62b89dc1433192b86dce18a', 'execution_entity', [
			'workflowId',
			'finished',
			'id',
		]);

		await createIndex('1688846335d274033e15c846a4', 'execution_entity', ['finished', 'id']);
		await createIndex('b94b45ce2c73ce46c54f20b5f9', 'execution_entity', ['waitTill', 'id']);
		await createIndex('81fc04c8a17de15835713505e4', 'execution_entity', ['workflowId', 'id']);
	}

	async down({ schemaBuilder: { dropIndex, createIndex } }: MigrationContext) {
		await dropIndex('81fc04c8a17de15835713505e4', 'execution_entity');
		await dropIndex('b94b45ce2c73ce46c54f20b5f9', 'execution_entity');
		await dropIndex('1688846335d274033e15c846a4', 'execution_entity');
		await dropIndex('78d62b89dc1433192b86dce18a', 'execution_entity');
		await dropIndex('06da892aaf92a48e7d3e400003', 'execution_entity');
		await createIndex('ca4a71b47f28ac6ea88293a8e2', 'execution_entity', ['waitTill']);
		await createIndex('c4d999a5e90784e8caccf5589d', 'execution_entity', ['workflowId']);
	}
}
