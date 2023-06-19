import { v4 as uuid } from 'uuid';
import * as Db from '@/Db';
import { audit } from '@/audit';
import {
	DATABASE_REPORT,
	SQL_NODE_TYPES,
	SQL_NODE_TYPES_WITH_QUERY_PARAMS,
} from '@/audit/constants';
import {
	createNode,
	createWorkflowDetails,
	getRiskSection,
	saveManualTriggerWorkflow,
} from './utils';
import * as testDb from '../shared/testDb';

beforeAll(async () => {
	await testDb.init();
});

beforeEach(async () => {
	await testDb.truncate(['Workflow']);
});

afterAll(async () => {
	await testDb.terminate();
});

test('should report expressions in queries', async () => {
	const map = [...SQL_NODE_TYPES].reduce<{ [nodeType: string]: string }>((acc, cur) => {
		return (acc[cur] = uuid()), acc;
	}, {});

	const promises = Object.entries(map).map(async ([nodeType, nodeId]) => {
		const details = createWorkflowDetails([
			createNode(nodeType, 'MyNode', nodeId, {
				operation: 'executeQuery',
				query: '=SELECT * FROM {{ $json.table }}',
				additionalFields: {},
			}),
		]);

		return Db.collections.Workflow.save(details);
	});

	await Promise.all(promises);

	const testAudit = await audit(['database']);

	const section = getRiskSection(
		testAudit,
		DATABASE_REPORT.RISK,
		DATABASE_REPORT.SECTIONS.EXPRESSIONS_IN_QUERIES,
	);

	expect(section.location).toHaveLength(SQL_NODE_TYPES.size);

	for (const loc of section.location) {
		if (loc.kind === 'node') {
			expect(loc.nodeId).toBe(map[loc.nodeType]);
		}
	}
});

test('should report expressions in query params', async () => {
	const map = [...SQL_NODE_TYPES_WITH_QUERY_PARAMS].reduce<{ [nodeType: string]: string }>(
		(acc, cur) => {
			return (acc[cur] = uuid()), acc;
		},
		{},
	);

	const promises = Object.entries(map).map(async ([nodeType, nodeId]) => {
		const details = createWorkflowDetails([
			createNode(nodeType, 'MyNode', nodeId, {
				operation: 'executeQuery',
				query: 'SELECT * FROM users WHERE id = $1;',
				additionalFields: {
					queryParams: '={{ $json.userId }}',
				},
			}),
		]);

		return Db.collections.Workflow.save(details);
	});

	await Promise.all(promises);

	const testAudit = await audit(['database']);

	const section = getRiskSection(
		testAudit,
		DATABASE_REPORT.RISK,
		DATABASE_REPORT.SECTIONS.EXPRESSIONS_IN_QUERY_PARAMS,
	);

	expect(section.location).toHaveLength(SQL_NODE_TYPES_WITH_QUERY_PARAMS.size);

	for (const loc of section.location) {
		if (loc.kind === 'node') {
			expect(loc.nodeId).toBe(map[loc.nodeType]);
		}
	}
});

test('should report unused query params', async () => {
	const map = [...SQL_NODE_TYPES_WITH_QUERY_PARAMS].reduce<{ [nodeType: string]: string }>(
		(acc, cur) => {
			return (acc[cur] = uuid()), acc;
		},
		{},
	);

	const promises = Object.entries(map).map(async ([nodeType, nodeId]) => {
		const details = createWorkflowDetails([
			createNode(nodeType, 'MyNode', nodeId, {
				operation: 'executeQuery',
				query: 'SELECT * FROM users WHERE id = 123;',
			}),
		]);

		return Db.collections.Workflow.save(details);
	});

	await Promise.all(promises);

	const testAudit = await audit(['database']);

	const section = getRiskSection(
		testAudit,
		DATABASE_REPORT.RISK,
		DATABASE_REPORT.SECTIONS.UNUSED_QUERY_PARAMS,
	);

	expect(section.location).toHaveLength(SQL_NODE_TYPES_WITH_QUERY_PARAMS.size);

	for (const loc of section.location) {
		if (loc.kind === 'node') {
			expect(loc.nodeId).toBe(map[loc.nodeType]);
		}
	}
});

test('should not report non-database node', async () => {
	await saveManualTriggerWorkflow();

	const testAudit = await audit(['database']);

	expect(testAudit).toBeEmptyArray();
});
