import type { Getter, MaybeGetter } from "../types.js";
import { isFunction } from "./is.js";

/**
 * Extracts the value from a getter or a value.
 * Optionally, a default value can be provided.
 */
export function extract<T>(value: MaybeGetter<T>, defaultValue?: T): T {
	if (isFunction(value)) {
		const getter = value as Getter<T>;
		return getter() ?? defaultValue ?? getter();
	}

	return value ?? defaultValue ?? value;
}
