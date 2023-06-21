import type { IDataObject, JsonObject } from '../Interfaces';

export type Severity = 'warning' | 'error';

export interface BaseErrorOptions {
	cause?: Error | JsonObject;
	severity?: Severity;
}

export abstract class BaseError extends Error {
	description: string | null | undefined;

	cause: Error | JsonObject | undefined;

	timestamp: number;

	context: IDataObject = {};

	lineNumber: number | undefined;

	severity: Severity = 'error';

	constructor(message: string, { cause, severity }: BaseErrorOptions) {
		const options = cause instanceof Error ? { cause } : {};
		super(message, options);

		this.name = this.constructor.name;
		this.timestamp = Date.now();
		this.severity = severity ?? 'error';

		if (cause instanceof BaseError) {
			this.context = cause.context;
		} else if (cause && !(cause instanceof Error)) {
			this.cause = cause;
		}
	}

	toJSON?() {
		return {
			message: this.message,
			lineNumber: this.lineNumber,
			timestamp: this.timestamp,
			name: this.name,
			description: this.description,
			context: this.context,
			cause: this.cause,
		};
	}
}
