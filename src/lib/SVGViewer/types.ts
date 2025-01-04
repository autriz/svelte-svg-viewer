import type { CreateSVGViewerProps } from "$lib/internal/SVGViewer.js";

export type Props = {
	/**
	 * The position value of the container inside the viewer.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { writable } from "svelte/store";
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let position = writable({x: 0, y: 0});
	 * 	// or
	 * 	let position = {x: 0, y: 0};
	 * </script>
	 *
	 * <SVGViewer {position}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 *
	 * @default { x: 0, y: 0 }
	 */
	position?: CreateSVGViewerProps["position"] & {};
	/**
	 * The maximum value that viewer can zoom in to.
	 *
	 * **Note: scale changes respect `lockToBoundaries`/`defaultLockToBoundaries` prop**
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let maxScale = 3;
	 * </script>
	 *
	 * <SVGViewer {maxScale}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 *
	 * @default 1.4
	 */
	maxScale?: CreateSVGViewerProps["maxScale"] & {};
	/**
	 * The minimum value that viewer can zoom out to.
	 *
	 * **Note: scale changes respect `lockToBoundaries`/`defaultLockToBoundaries` prop.**
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let minScale = 0.4;
	 * </script>
	 *
	 * <SVGViewer {minScale}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 *
	 * @default 0.6
	 */
	minScale?: CreateSVGViewerProps["minScale"] & {};
	/**
	 * Value for deciding whether the viewer can
	 * ignore scale restrictions.
	 *
	 * **Note: scale changes respect `lockToBoundaries` prop.**
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { writable } from "svelte/store";
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let ignoreScale = writable(false);
	 * 	// or
	 * 	let ignoreScale = false;
	 * </script>
	 *
	 * <SVGViewer {ignoreScale}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 *
	 * @default undefined
	 */
	ignoreScale?: CreateSVGViewerProps["ignoreScale"] & {};
	/**
	 * Value for the initial scale.
	 *
	 * **Note: scale changes respect `lockToBoundaries` prop.**
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { writable } from "svelte/store";
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let scale = writable(1);
	 * 	// or
	 * 	let scale = 1;
	 * </script>
	 *
	 * <SVGViewer {scale}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 *
	 * @default undefined
	 */
	scale?: CreateSVGViewerProps["scale"] & {};
	/**
	 * Value for configuring scaling for the mouse zoom in/out.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let scaleMouseSensitivity = 1.2;
	 * </script>
	 *
	 * <SVGViewer {scaleMouseSensitivity}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 *
	 * @default 1.1
	 */
	scaleMouseSensitivity?: CreateSVGViewerProps["scaleMouseSensitivity"] & {};
	/**
	 * Value for configuring scaling for the touchpad zoom in/out.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let scaleTouchpadSensitivity = 1.1;
	 * </script>
	 *
	 * <SVGViewer {scaleTouchpadSensitivity}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 *
	 * @default 1.06
	 */
	scaleTouchpadSensitivity?: CreateSVGViewerProps["scaleTouchpadSensitivity"] & {};
	/**
	 * Value for deciding whether the user can go
	 * out of bounds of the container.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { writable } from "svelte/store";
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let lockToBoundaries = writable(true);
	 * 	// or
	 * 	let lockToBoundaries = true;
	 * </script>
	 *
	 * <SVGViewer {lockToBoundaries}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 *
	 * @default undefined
	 */
	lockToBoundaries?: CreateSVGViewerProps["lockToBoundaries"] & {};
	/**
	 * Value for action key.
	 *
	 * If provided, panning and zooming are disabled unless action key is pressed.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { writable } from "svelte/store";
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let actionKey = writable("Control");
	 * 	// or
	 * 	let actionKey = "Control";
	 * </script>
	 *
	 * <SVGViewer {actionKey}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 *
	 * @default undefined
	 */
	actionKey?: CreateSVGViewerProps["actionKey"] & {};
	/**
	 * Value for pinch behavior.
	 *
	 * Pinch behavior has two modes: zoom only and zoom drag.
	 * * "zoom only" mode allows for zooming while pinching only;
	 * * "zoom drag" mode allows for zooming while pinching and dragging.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { writable } from "svelte/store";
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let pinchBehavior = writable("zoomOnly");
	 * 	// or
	 * 	let pinchBehavior = "zoomOnly";
	 * </script>
	 *
	 * <SVGViewer {pinchBehavior}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 *
	 * @default "zoomOnly"
	 */
	pinchBehavior?: CreateSVGViewerProps["pinchBehavior"] & {};
	/**
	 * Value for drag behavior.
	 *
	 * Drag behavior has two modes: normal and border reset.
	 *
	 * **Both of these reflect on dragging only when `lockToBoundaries` is true.**
	 *
	 * * "normal" mode does not reset offset when dragging past boundaries,
	 * i.e. when you drag, hit border and drag further, you need to drag the
	 * same distance, unless you stop dragging and start again;
	 * * "border reset" mode does reset offset when dragging past boundaries.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { writable } from "svelte/store";
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let dragBehavior = writable("normal");
	 * 	// or
	 * 	let dragBehavior = "borderReset";
	 * </script>
	 *
	 * <SVGViewer {dragBehavior}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 *
	 * @default "normal"
	 */
	dragBehavior?: CreateSVGViewerProps["dragBehavior"] & {};
};
