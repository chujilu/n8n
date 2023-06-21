import type { ExpressionError } from './ExpressionErrors';
import type { NodeApiError, NodeOperationError } from './NodeErrors';
import type { WorkflowActivationError, WorkflowOperationError } from './WorkflowErrors';

export * from './BaseError';
export * from './CredentialErrors';
export * from './ExpressionErrors';
export * from './NodeErrors';
export * from './WebhookErrors';
export * from './WorkflowErrors';

export type ExecutionError =
	| ExpressionError
	| WorkflowActivationError
	| WorkflowOperationError
	| NodeOperationError
	| NodeApiError;
