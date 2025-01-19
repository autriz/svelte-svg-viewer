import type SVGViewer from "$lib/builder/Viewer.svelte.js";
import type { SVGViewerProps } from "$lib/builder/Viewer.svelte.js";
import type { Export } from "$lib/types.js";

export type Props = {
	/**
	 * Bindable position value of the container inside the viewer.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let position = $state({x: 0, y: 0});
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
	position?: SVGViewerProps["position"] & {};
	/**
	 * The maximum value that viewer can zoom in to.
	 *
	 * **Note: scale changes respect `lockToBoundaries` prop**
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let maxScale = $state(3);
	 * 	// or
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
	maxScale?: SVGViewerProps["maxScale"] & {};
	/**
	 * The minimum value that viewer can zoom out to.
	 *
	 * **Note: scale changes respect `lockToBoundaries` prop.**
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let minScale = $state(0.4);
	 * 	// or
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
	minScale?: SVGViewerProps["minScale"] & {};
	/**
	 * Value for deciding whether the viewer can
	 * ignore scale restrictions.
	 *
	 * **Note: scale changes respect `lockToBoundaries` prop.**
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let ignoreScale = $state(false);
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
	ignoreScale?: SVGViewerProps["ignoreScale"] & {};
	/**
	 * Bindable value for the container scale.
	 *
	 * **Note: scale changes respect `lockToBoundaries` prop.**
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let scale = $state(1);
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
	scale?: SVGViewerProps["scale"] & {};
	/**
	 * Value for configuring scaling for the mouse zoom in/out.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let scaleMouseSensitivity = $state(1.2);
	 * 	// or
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
	scaleMouseSensitivity?: SVGViewerProps["scaleMouseSensitivity"] & {};
	/**
	 * Value for configuring scaling for the touchpad zoom in/out.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let scaleTouchpadSensitivity = $state(1.1);
	 * 	// or
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
	scaleTouchpadSensitivity?: SVGViewerProps["scaleTouchpadSensitivity"] & {};
	/**
	 * Value for deciding whether the user can go
	 * out of bounds of the container.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let lockToBoundaries = $state(true);
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
	lockToBoundaries?: SVGViewerProps["lockToBoundaries"] & {};
	/**
	 * Value for action key.
	 *
	 * If provided, panning and zooming are disabled unless action key is pressed.
	 *
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let actionKey = $state("Control");
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
	actionKey?: SVGViewerProps["actionKey"] & {};
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
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let pinchBehavior = $state("zoomOnly");
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
	pinchBehavior?: SVGViewerProps["pinchBehavior"] & {};
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
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 *
	 * 	let dragBehavior = $state("normal");
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
	dragBehavior?: SVGViewerProps["dragBehavior"] & {};
};

export type SVGViewerMethods = Export<
	SVGViewer,
	| "pan"
	| "panTo"
	| "fitToViewer"
	| "fitSelection"
	| "center"
	| "zoom"
	| "zoomOnCenter"
>;
