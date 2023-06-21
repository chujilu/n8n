import type { INode } from '../Interfaces';
import { BaseError } from './BaseError';
import type { BaseErrorOptions } from './BaseError';

abstract class WorkflowBaseError extends BaseError {}

export class WorkflowExecutionWarning extends WorkflowBaseError {
	constructor(message: string, cause?: Error) {
		super(message, { cause, severity: 'warning' });
	}
}

interface WorkflowActivationErrorOptions extends BaseErrorOptions {
	node?: INode;
}

/**
 * Class for instantiating an workflow activation error
 */
export class WorkflowActivationError extends WorkflowBaseError {
	node: INode | undefined;

	constructor(message: string, { cause, node, severity }: WorkflowActivationErrorOptions) {
		let error = cause as Error;
		if (cause instanceof BaseError) {
			error = new Error(cause.message);
			error.constructor = cause.constructor;
			error.name = cause.name;
			error.stack = cause.stack;
		}
		super(message, { cause: error, severity });
		this.node = node;
		this.message = message;
	}
}

/**
 * Class for instantiating an operational error, e.g. a timeout error.
 */
export class WorkflowOperationError extends WorkflowBaseError {
	node: INode | undefined;

	timestamp: number;

	description: string | undefined;

	constructor(message: string, node?: INode, options: BaseErrorOptions = {}) {
		super(message, options);
		this.name = this.constructor.name;
		this.node = node;
		this.timestamp = Date.now();
	}
}

export class SubworkflowOperationError extends WorkflowOperationError {
	description = '';

	cause: { message: string; stack: string };

	constructor(message: string, description: string, options: BaseErrorOptions = {}) {
		super(message, undefined, options);
		this.name = this.constructor.name;
		this.description = description;

		this.cause = {
			message,
			stack: this.stack as string,
		};
	}
}

export class CliWorkflowOperationError extends SubworkflowOperationError {}
