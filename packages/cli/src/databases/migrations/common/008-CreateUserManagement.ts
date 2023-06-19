import type { MigrationContext, ReversibleMigration } from '@db/types';
import { loadSurveyFromDisk } from '@db/utils/migrationHelpers';

export class CreateUserManagement implements ReversibleMigration {
	async up({
		schemaBuilder: { createTable, column, dropIndex, insertInto, fetchIds },
	}: MigrationContext) {
		await createTable('role')
			.withColumns(
				column('id').int.primary.autoGenerate,
				column('name').varchar(32).notNull,
				column('scope').varchar(255).notNull,
			)
			.withTimestamps.withIndexOn(['scope', 'name'], true);

		const [instanceOwnerRoleId, , workflowOwnerRoleId, credentialOwnerRoleId] = await insertInto(
			'role',
			[
				{ name: 'owner', scope: 'global' },
				{ name: 'member', scope: 'global' },
				{ name: 'owner', scope: 'workflow' },
				{ name: 'owner', scope: 'credential' },
			],
		);

		await createTable('user')
			.withColumns(
				column('id').uuid.primary.autoGenerate,
				column('email').varchar(255),
				column('firstName').varchar(32),
				column('lastName').varchar(32),
				column('password').varchar(255),
				column('resetPasswordToken').varchar(255),
				column('resetPasswordTokenExpiration').int,
				column('personalizationAnswers').text,
				column('globalRoleId').int.notNull,
			)
			.withTimestamps.withIndexOn('email', true)
			.withForeignKey('globalRoleId', { tableName: 'role', columnName: 'id' });

		const [ownerUserId] = await insertInto('user', [
			{ globalRoleId: instanceOwnerRoleId, personalizationAnswers: loadSurveyFromDisk() },
		]);

		await createTable('settings').withColumns(
			column('key').varchar(255).primary,
			column('value').text.notNull,
			column('loadOnStartup').bool.notNull.default(false),
		);

		await insertInto('settings', [
			{ key: 'userManagement.isInstanceOwnerSetUp', value: 'false', loadOnStartup: true },
			{ key: 'userManagement.skipInstanceOwnerSetup', value: 'false', loadOnStartup: true },
		]);

		await createTable('shared_workflow')
			.withColumns(
				column('roleId').int.notNull,
				column('userId').uuid.notNull.primary,
				column('workflowId').int.notNull.primary,
			)
			.withTimestamps.withForeignKey('roleId', { tableName: 'role', columnName: 'id' })
			.withForeignKey('userId', { tableName: 'user', columnName: 'id', onDelete: 'CASCADE' })
			.withForeignKey('workflowId', {
				tableName: 'workflow_entity',
				columnName: 'id',
				onDelete: 'CASCADE',
			})
			.withIndexOn('workflowId');

		const workflowIds = await fetchIds('workflow_entity');
		await insertInto(
			'shared_workflow',
			workflowIds.map((workflowId) => ({
				createdAt: 'NOW()',
				updatedAt: 'NOW()',
				roleId: workflowOwnerRoleId,
				userId: ownerUserId,
				workflowId,
			})),
		);

		await createTable('shared_credentials')
			.withColumns(
				column('roleId').int.notNull,
				column('userId').uuid.notNull.primary,
				column('credentialsId').int.notNull.primary,
			)
			.withTimestamps.withForeignKey('roleId', { tableName: 'role', columnName: 'id' })
			.withForeignKey('userId', { tableName: 'user', columnName: 'id', onDelete: 'CASCADE' })
			.withForeignKey('credentialsId', {
				tableName: 'credentials_entity',
				columnName: 'id',
				onDelete: 'CASCADE',
			})
			.withIndexOn('credentialsId');

		const credentialIds = await fetchIds('credentials_entity');
		await insertInto(
			'shared_credentials',
			credentialIds.map((credentialId) => ({
				createdAt: 'NOW()',
				updatedAt: 'NOW()',
				roleId: credentialOwnerRoleId,
				userId: ownerUserId,
				credentialId,
			})),
		);

		// TODO: why is this here???
		await dropIndex('a252c527c4c89237221fe2c0ab', 'workflow_entity');
	}

	async down({ schemaBuilder: { createIndex, dropTable } }: MigrationContext) {
		await createIndex('a252c527c4c89237221fe2c0ab', 'workflow_entity', ['name'], true);
		await dropTable('settings');
		await dropTable('shared_credentials');
		await dropTable('shared_workflow');
		await dropTable('user');
		await dropTable('role');
	}
}
