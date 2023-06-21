import * as Db from '@/Db';
import config from '@/config';
import { audit } from '@/audit';
import { CREDENTIALS_REPORT } from '@/audit/constants';
import {
	createCredentialDetails,
	createNode,
	createWorkflowDetails,
	getRiskSection,
} from './utils';
import * as testDb from '../shared/testDb';

beforeAll(async () => {
	await testDb.init();
});

beforeEach(async () => {
	await testDb.truncate(['Workflow', 'Credentials', 'Execution']);
});

afterAll(async () => {
	await testDb.terminate();
});

test('should report credentials not in any use', async () => {
	const [credential] = await Promise.all([
		Db.collections.Credentials.save(createCredentialDetails()),
		Db.collections.Workflow.save(
			createWorkflowDetails([createNode('n8n-nodes-base.slack', 'My Node')]),
		),
	]);

	const testAudit = await audit(['credentials']);

	const section = getRiskSection(
		testAudit,
		CREDENTIALS_REPORT.RISK,
		CREDENTIALS_REPORT.SECTIONS.CREDS_NOT_IN_ANY_USE,
	);

	expect(section.location).toHaveLength(1);
	expect(section.location[0]).toMatchObject({
		id: credential.id,
		name: credential.name,
	});
});

test('should report credentials not in active use', async () => {
	const [credential] = await Promise.all([
		Db.collections.Credentials.save(createCredentialDetails()),
		Db.collections.Workflow.save(
			createWorkflowDetails([createNode('n8n-nodes-base.slack', 'My Node')]),
		),
	]);

	const testAudit = await audit(['credentials']);

	const section = getRiskSection(
		testAudit,
		CREDENTIALS_REPORT.RISK,
		CREDENTIALS_REPORT.SECTIONS.CREDS_NOT_IN_ACTIVE_USE,
	);

	expect(section.location).toHaveLength(1);
	expect(section.location[0]).toMatchObject({
		id: credential.id,
		name: credential.name,
	});
});

test('should report credential in not recently executed workflow', async () => {
	const credential = await Db.collections.Credentials.save(createCredentialDetails());
	const workflow = await Db.collections.Workflow.save(
		createWorkflowDetails([
			createNode(
				'n8n-nodes-base.slack',
				'My Node',
				undefined,
				{},
				{
					slackApi: {
						id: credential.id,
						name: credential.name,
					},
				},
			),
		]),
	);

	const date = new Date();
	date.setDate(date.getDate() - config.getEnv('security.audit.daysAbandonedWorkflow') - 1);

	const savedExecution = await Db.collections.Execution.save({
		finished: true,
		mode: 'manual',
		startedAt: date,
		stoppedAt: date,
		workflowId: workflow.id,
		waitTill: null,
	});
	await Db.collections.ExecutionData.save({
		execution: savedExecution,
		data: '[]',
		workflowData: workflow,
	});

	const testAudit = await audit(['credentials']);

	const section = getRiskSection(
		testAudit,
		CREDENTIALS_REPORT.RISK,
		CREDENTIALS_REPORT.SECTIONS.CREDS_NOT_RECENTLY_EXECUTED,
	);

	expect(section.location).toHaveLength(1);
	expect(section.location[0]).toMatchObject({
		id: credential.id,
		name: credential.name,
	});
});

test('should not report credentials in recently executed workflow', async () => {
	const credential = await Db.collections.Credentials.save(createCredentialDetails());
	const workflow = await Db.collections.Workflow.save(
		createWorkflowDetails(
			[
				createNode(
					'n8n-nodes-base.slack',
					'My Node',
					undefined,
					{},
					{
						slackApi: {
							id: credential.id,
							name: credential.name,
						},
					},
				),
			],
			true,
		),
	);

	const date = new Date();
	date.setDate(date.getDate() - config.getEnv('security.audit.daysAbandonedWorkflow') + 1);

	const savedExecution = await Db.collections.Execution.save({
		finished: true,
		mode: 'manual',
		startedAt: date,
		stoppedAt: date,
		workflowId: workflow.id,
		waitTill: null,
	});

	await Db.collections.ExecutionData.save({
		execution: savedExecution,
		data: '[]',
		workflowData: workflow,
	});

	const testAudit = await audit(['credentials']);

	expect(testAudit).toBeEmptyArray();
});
