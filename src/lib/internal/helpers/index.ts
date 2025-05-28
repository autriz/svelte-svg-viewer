// These helpers are cool, got them from https://github.com/huntabyte/vaul-svelte

export * from "./store.js";
export * from "./object.js";

export function clamp(min: number, value: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}
