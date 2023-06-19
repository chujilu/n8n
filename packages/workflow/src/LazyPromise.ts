type PromiseExecutor<T> = (
	resolve: (value: T | PromiseLike<T>) => void,
	reject: (reason?: Error) => void,
) => void;

/**
 * This Promise executes only when awaited
 */
export class LazyPromise<T> extends Promise<T> {
	private promise: Promise<T> | undefined;

	constructor(private readonly executor: PromiseExecutor<T>) {
		super((resolve) => resolve(undefined as T));
	}

	async then<R1 = T, R2 = never>(
		onFulfilled: (value: T) => R1 | PromiseLike<R1>,
		onRejected?: (reason: Error) => R2 | PromiseLike<R2>,
	): Promise<R1 | R2> {
		this.promise = this.promise ?? new Promise(this.executor);
		return this.promise.then(onFulfilled, onRejected);
	}

	async catch<R = never>(onRejected: (reason: Error) => R | PromiseLike<R>) {
		this.promise = this.promise ?? new Promise(this.executor);
		return this.promise.catch(onRejected);
	}
}
