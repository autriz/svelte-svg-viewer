import type { createViewer } from "./SVGViewer.js";

export type PinchBehavior = "zoomDrag" | "zoomOnly";

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

export type SVGViewerMethods = ReturnType<typeof createViewer>["methods"];
