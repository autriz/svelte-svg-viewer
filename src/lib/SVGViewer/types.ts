import type { CreateSVGViewerProps } from "$lib/internal/SVGViewer.js";

export type Props = {
	/** 
	 * The uncontrolled default position value of the container inside the viewer.
	 * 
	 * For more control use `position` prop.
	 * 
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 * 
	 * 	let defaultPosition = { x: 100, y: 100 };
	 * </script>
	 * 
	 * <SVGViewer {defaultPosition}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 * 
	 * @default { x: 0, y: 0 } 
	 */
	defaultPosition?: CreateSVGViewerProps["defaultPosition"] & {};
	/** 
	 * The controlled position value store of the container inside the viewer.
	 * 
	 * If provided, this will override the value passed to `defaultPosition`.
	 * 
	 * For less control use `defaultPosition` prop.
	 * 
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { writable } from "svelte/store";
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 * 
	 * 	let position = writable({x: 0, y: 0});
	 * </script>
	 * 
	 * <SVGViewer {position}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 * 
	 * @default undefined 
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
	 * The uncontrolled default value for deciding whether 
	 * the viewer can ignore scale restrictions.
	 * 
	 * **Note: scale changes respect `lockToBoundaries`/`defaultLockToBoundaries` prop.**
	 * 
	 * For more control use `ignoreScale` prop.
	 * 
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 * 
	 * 	let defaultIgnoreScale = true;
	 * </script>
	 * 
	 * <SVGViewer {defaultIgnoreScale}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 * 
	 * @default false 
	 */
	defaultIgnoreScale?: CreateSVGViewerProps["defaultIgnoreScale"] & {};
	/** 
	 * The controlled value store for deciding whether 
	 * the viewer can ignore scale restrictions.
	 * 
	 * If provided, this will override the value passed to `defaultIgnoreScale`.
	 * 
	 * **Note: scale changes respect `lockToBoundaries`/`defaultLockToBoundaries` prop.**
	 * 
	 * For less control use `defaultIgnoreScale` prop.
	 * 
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { writable } from "svelte/store";
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 * 
	 * 	let ignoreScale = writable(false);
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
	 * The uncontrolled default value for the initial scale.
	 * 
	 * **Note: scale changes respect `lockToBoundaries`/`defaultLockToBoundaries` prop.**
	 * 
	 * For more control use `scale` prop.
	 * 
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 * 
	 * 	let defaultScale = 1.2;
	 * </script>
	 * 
	 * <SVGViewer {defaultScale}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 * 
	 * @default 1 
	 */
	defaultScale?: CreateSVGViewerProps["defaultScale"] & {};
	/** 
	 * The controlled value store for the initial scale.
	 * 
	 * If provided, this will override the value passed to `defaultScale`.
	 * 
	 * **Note: scale changes respect `lockToBoundaries`/`defaultLockToBoundaries` prop.**
	 * 
	 * For less control use `defaultScale` prop.
	 * 
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { writable } from "svelte/store";
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 * 
	 * 	let scale = writable(1);
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
	 * The value for configuring scaling for the mouse zoom in/out.
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
	 * The value for configuring scaling for the touchpad zoom in/out.
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
	 * The uncontrolled default value for deciding whether 
	 * the user can go out of bounds of the container.
	 * 
	 * For more control use `lockToBoundaries` prop.
	 * 
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 * 
	 * 	let defaultLockToBoundaries = true;
	 * </script>
	 * 
	 * <SVGViewer {defaultLockToBoundaries}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 * 
	 * @default false 
	 */
	defaultLockToBoundaries?: CreateSVGViewerProps["defaultLockToBoundaries"] & {};
	/** 
	 * The controlled value store for deciding whether 
	 * the user can go out of bounds of the container.
	 * 
	 * If provided, this will override the value passed to `defaultLockToBoundaries`.
	 * 
	 * For less control use `defaultLockToBoundaries` prop.
	 * 
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { writable } from "svelte/store";
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 * 
	 * 	let lockToBoundaries = writable(true);
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
	 * The uncontrolled default value for action key.
	 * 
	 * If provided, panning and zooming are disabled unless action key is pressed.
	 * 
	 * For more control use `actionKey` prop.
	 * 
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 * 
	 * 	let defaultActionKey = "Control";
	 * </script>
	 * 
	 * <SVGViewer {defaultActionKey}>
	 * 	...
	 * </SVGViewer>
	 * ```
	 * 
	 * @default undefined 
	 */
	defaultActionKey?: CreateSVGViewerProps["defaultActionKey"] & {};
	/** 
	 * The controlled value store for action key.
	 * 
	 * If provided, panning and zooming are disabled unless action key is pressed.
	 * 
	 * If provided, this will override the value passed to `defaultActionKey`.
	 * 
	 * For less control use `defaultActionKey` prop.
	 * 
	 * @example
	 * ```svelte
	 * <script>
	 * 	import { writable } from "svelte/store";
	 * 	import { SVGViewer } from "svelte-svg-viewer";
	 * 
	 * 	let actionKey = writable("Control");
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
	/** @todo in development | zoomDrag works hella wonky */
	pinchBehavior?: CreateSVGViewerProps["pinchBehavior"] & {};
};
