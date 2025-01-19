export type Getter<T> = () => T;
export type MaybeGetter<T> = T | Getter<T>;

export type Expand<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

/**
 * Given name and type T, generates two object properties -
 * `name` with type `T | Getter<T>` and on`Name`Change with type `(v: T) => void`
 */
type PropWithOnChange<K extends string, T> = {
	[P in K]?: MaybeGetter<T | undefined>;
} & {
	[P in `on${Capitalize<K>}Change`]?: (v: T) => void;
};

/**
 * Converts union ( | ) type to intersection ( & ) type
 */
type UnionToIntersection<U> = (U extends any ? (x: U) => void : never) extends (
	x: infer I,
) => void
	? I
	: never;

/**
 * Extracts properties of object values 1 level deep
 */
type Extract<T> = {
	[K in keyof T]-?: T[K] extends infer U ? U : never;
}[keyof T];

/**
 * Flattens intersected types
 */
type Flatten<T> = { [K in keyof T]: T[K] };

export type ControlledValues<T extends Record<string, unknown>> = Flatten<
	UnionToIntersection<
		Extract<{
			[K in keyof T]: PropWithOnChange<K & string, T[K]>;
		}>
	>
>;

/**
 * Pinch behavior has two modes: zoom only and zoom drag.
 * * "zoom only" mode allows for zooming while pinching only;
 * * "zoom drag" mode allows for zooming while pinching and dragging.
 */
export type PinchBehavior = "zoomDrag" | "zoomOnly";

/**
 * Drag behavior has two modes: normal and border reset.
 *
 * **Both of these reflect on dragging only when `lockToBoundaries` is true.**
 *
 * * "normal" mode does not reset offset when dragging past boundaries,
 * i.e. when you drag, hit border and drag further, you need to drag the
 * same distance, unless you stop dragging and start again;
 * * "border reset" mode does reset offset when dragging past boundaries.
 */
export type DragBehavior = "normal" | "borderReset";

export type Position = { x: number; y: number };

export type SvelteEvent<
	T extends Event = Event,
	U extends EventTarget = EventTarget,
> = T & {
	currentTarget: EventTarget & U;
};

type Split<S extends string, D extends string> = string extends S
	? string[]
	: S extends ""
		? []
		: S extends `${infer T}${D}${infer U}`
			? [T, ...Split<U, D>]
			: [S];

type ASCIICapitalChars = Split<"ABCDEFGHIJKLMNOPQRSTUVWXYZ", "">;
type ASCIIChars = Split<"abcdefghijklmnopqrstuvwxyz", "">;
type ASCIISymbols = Split<" !\"#$%&'()*+,-./:;<=>?[\\]^_`{|}~", "">;
type ASCIINumbers = Split<"0123456789", "">;

type ASCII =
	| ASCIICapitalChars[number]
	| ASCIIChars[number]
	| ASCIISymbols[number]
	| ASCIINumbers[number];

export type Key =
	| "Shift"
	| "Control"
	| "Alt"
	| "ArrowDown"
	| "ArrowUp"
	| "ArrowLeft"
	| "ArrowRight"
	| ASCII;

export type MaybeGetterValues<T extends Record<string, unknown>> = {
	[K in keyof T]: MaybeGetter<T[K]>;
};

type WithoutGetters<Obj extends Record<string, unknown>> = {
	[K in keyof Obj]: Obj[K] extends MaybeGetter<infer T> ? T : Obj[K];
};

export type ComponentProps<Obj extends Record<string, unknown>> = Omit<
	WithoutGetters<Obj>,
	`on${string}Change`
>;

export type Export<Class, Methods extends keyof Class> = {
	[K in Methods]: Class[K];
};
