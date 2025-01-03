import { type Writable, type Updater, writable } from "svelte/store";

export type ChangeFn<T> = (args: { curr: T; next: T }) => T;
export type Overridable<T> = Writable<T> & {
	update(updater: Updater<T>, sideEffect?: (newValue: T) => void): void;
	set(value: T): void;
};

export const overridable = <T>(
	store: Writable<T>,
	onChange?: ChangeFn<T>,
): Overridable<T> => {
	function update(updater: Updater<T>, sideEffect?: (newValue: T) => void) {
		store.update((curr) => {
			const next = updater(curr);
			let res: T = next;
			if (onChange) {
				res = onChange({ curr, next });
			}

			sideEffect?.(res);
			return res;
		});
	}

	function set(curr: T) {
		update(() => curr);
	}

	return {
		...store,
		update,
		set,
	};
};

export type MaybeWritable<T> = Writable<T> | T;
export type Extracted<T> =
	T extends MaybeWritable<infer U> ? U : T extends Writable<infer U> ? U : T;

export type ToWritableStores<T extends Record<string, unknown>> = {
	[K in keyof T]: Writable<Extracted<T[K]>>;
};

function isWritable<T>(value: MaybeWritable<T>): value is Writable<T> {
	return value instanceof Object && "subscribe" in value;
}

/**
 * Given an object of properties, returns an object of writable stores
 * with the same properties and values.
 */
export function toWritableStores<T extends Record<string, MaybeWritable<any>>>(
	properties: T,
): ToWritableStores<T> {
	const result = {} as { [K in keyof T]: Writable<Extracted<T[K]>> };

	Object.keys(properties).forEach((key) => {
		const propertyKey = key as keyof T;
		const value = properties[propertyKey];
		result[propertyKey] = isWritable(value) ? value : writable(value);
	});

	return result;
}
