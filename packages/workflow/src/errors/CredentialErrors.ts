import type { INodeCredentialsDetails } from '../Interfaces';
import { BaseError } from './BaseError';
import type { BaseErrorOptions } from './BaseError';

export class CredentialError extends BaseError {
	constructor(
		message: string,
		readonly credential: INodeCredentialsDetails | undefined = undefined,
		options: BaseErrorOptions = {},
	) {
		super(message, options);
	}
}
