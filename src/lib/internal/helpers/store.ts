import { type Writable, writable } from "svelte/store";

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
