import type { createViewer } from "./SVGViewer.js";

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

export type SVGViewerMethods = ReturnType<typeof createViewer>["methods"];
