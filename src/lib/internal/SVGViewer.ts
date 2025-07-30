import { derived, get, writable, type Writable } from "svelte/store";
import {
	removeUndefined,
	toWritableStores,
	omit,
	type MaybeWritable,
	clamp,
} from "./index.js";
import {
	type PinchBehavior,
	type DragBehavior,
	type Key,
	type Position,
	type SvelteEvent,
} from "./types.js";
import { onDestroy } from "svelte";
import {
	getMousePosition,
	getPinchCenter,
	getPinchDistance,
	getPinchPosition,
	getTouchPosition,
	isPinchGesture,
	posSubtract,
} from "./helpers/functions.js";

export type CreateSVGViewerProps = {
	position?: MaybeWritable<Position>;
	maxScale?: number;
	minScale?: number;
	ignoreScale?: MaybeWritable<boolean>;
	scale?: MaybeWritable<number>;
	scaleMouseSensitivity?: number;
	scaleTouchpadSensitivity?: number;
	lockToBoundaries?: MaybeWritable<boolean>;
	actionKey?: MaybeWritable<Key>;
	disabled?: MaybeWritable<boolean>;
	pinchBehavior?: MaybeWritable<PinchBehavior>;
	dragBehavior?: MaybeWritable<DragBehavior>;
	viewerRef: Writable<SVGSVGElement | undefined>;
	containerRef: Writable<SVGGElement | undefined>;
};

const defaultProps = {
	position: { x: 0, y: 0 },
	maxScale: 1.4,
	minScale: 0.6,
	ignoreScale: false,
	scale: 1,
	scaleMouseSensitivity: 1.1,
	scaleTouchpadSensitivity: 1.06,
	lockToBoundaries: false,
	actionKey: undefined,
	disabled: undefined,
	pinchBehavior: "zoomOnly",
	dragBehavior: "normal",
} as const;

const omittedOptions = [
	"maxScale",
	"minScale",
	"scaleMouseSensitivity",
	"scaleTouchpadSensitivity",
	"viewerRef",
	"containerRef",
] as const;

export function createViewer(props: CreateSVGViewerProps) {
	const { ...withDefaults } = {
		...defaultProps,
		...removeUndefined(props),
	} satisfies CreateSVGViewerProps;

	const options = toWritableStores(
		omit({ ...withDefaults }, ...omittedOptions),
	);

	// TODO: Consider making maxScale and minScale controllable
	// TODO: Consider adjusting minScale when container is small for that scale
	// This would be applicable when lockToBoundaries is true
	const minScale = withDefaults.minScale;
	const maxScale = withDefaults.maxScale;
	const scaleMouseSensitivity = withDefaults.scaleMouseSensitivity;
	const scaleTouchpadSensitivity = withDefaults.scaleTouchpadSensitivity;

	const position = options.position;
	const ignoreScale = options.ignoreScale;
	const scale = options.scale;
	const lockToBoundaries = options.lockToBoundaries;
	const actionKey = options.actionKey;
	const disabled = options.disabled;
	const pinchBehavior = options.pinchBehavior;
	const dragBehavior = options.dragBehavior;

	const viewerRef = withDefaults.viewerRef;
	const containerRef = withDefaults.containerRef;

	let offset: Position = { x: 0, y: 0 };
	let lastCenter: Position = { x: 0, y: 0 };
	let lastDistance: number;

	let hasActionKeyPressed = get(actionKey) === undefined ? true : false;
	// Both of these variables detect how to respond on a client interaction
	let hasPointerDown = false;
	const isMoving = writable(false);

	// an "effect" that returns position to boundaries
	// if lockToBoundaries is toggled to true
	const lockUnsub = derived(lockToBoundaries, (locked) => {
		if (!locked) return;

		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);

		if (!($viewerRef && $containerRef)) return;

		const containerRect = $containerRef.getBoundingClientRect();
		const viewerRect = $viewerRef.getBoundingClientRect();

		position.update(($position) => {
			const newX = clamp(
				-(containerRect.width - viewerRect.width),
				$position.x,
				0,
			);
			const newY = clamp(
				-(containerRect.height - viewerRect.height),
				$position.y,
				0,
			);

			return { x: newX, y: newY };
		});
	}).subscribe(() => {});

	// an "effect" that clamps scale when it changes
	const scaleUnsub = derived(scale, (newScale) => {
		if (get(ignoreScale)) return;

		const clampedScale = clamp(minScale, newScale, maxScale);

		if (Math.abs(clampedScale - newScale) > 0.0001) {
			scale.set(clampedScale);
		}
	}).subscribe(() => {});

	onDestroy(() => {
		lockUnsub();
		scaleUnsub();
	});

	function onMouseDown(event: SvelteEvent<MouseEvent, SVGElement>) {
		if (!hasActionKeyPressed || get(disabled)) return;

		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $position = get(position);

		if (!$containerRef || !$viewerRef) return;

		const newOffset = getMousePosition(event, $viewerRef);

		offset = posSubtract(newOffset, $position);
		hasPointerDown = true;

		if (event.cancelable) event.preventDefault();
	}

	function onMouseMove(event: SvelteEvent<MouseEvent, SVGElement>) {
		if (!hasActionKeyPressed || get(disabled)) return;

		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $isMoving = get(isMoving);

		if (!$containerRef || !$viewerRef || (!hasPointerDown && !$isMoving))
			return;

		const cursorPos = getMousePosition(event, $viewerRef);

		onMove(event, $viewerRef, $containerRef, cursorPos);
	}

	function onMouseUp(_event: SvelteEvent<MouseEvent, SVGElement>) {
		if (!hasActionKeyPressed || get(disabled)) return;

		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);

		if (!$containerRef || !$viewerRef) return;

		onPointerUp();
	}

	function onWheel(event: SvelteEvent<WheelEvent, SVGElement>) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const oldScale = get(scale);

		if (!$containerRef || !$viewerRef || !hasActionKeyPressed) return;

		const cursorPos = getMousePosition(event, $viewerRef);
		const delta = event.deltaY || event.deltaX;
		const scaleStep =
			Math.abs(delta) > 50
				? scaleMouseSensitivity
				: scaleTouchpadSensitivity;
		const scaleDelta = delta < 0 ? 1 / scaleStep : scaleStep;
		const newScale = oldScale / scaleDelta;

		zoom(cursorPos.x, cursorPos.y, newScale);
	}

	function onTouchStart(event: SvelteEvent<TouchEvent, SVGElement>) {
		if (get(disabled)) return;

		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $position = get(position);
		const $isMoving = get(isMoving);

		if (!$containerRef || !$viewerRef) return;

		if (isPinchGesture(event)) {
			if ($isMoving) isMoving.set(false);

			const { touch1Pos, touch2Pos } = getPinchPosition(event);
			lastDistance = getPinchDistance(touch1Pos, touch2Pos);
			lastCenter = getPinchCenter(touch1Pos, touch2Pos);

			if (get(pinchBehavior) === "zoomDrag") {
				offset = posSubtract(lastCenter, $position);
			}

			if (event.cancelable) event.preventDefault();
		} else {
			offset = posSubtract(
				getTouchPosition(event, $viewerRef),
				$position,
			);
		}

		hasPointerDown = true;
	}

	function onTouchMove(event: SvelteEvent<TouchEvent, SVGElement>) {
		if (get(disabled)) return;

		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);

		if (!$containerRef || !$viewerRef) return;
		if (isPinchGesture(event)) {
			return void onPinchMove(event);
		}

		const touchPos = getTouchPosition(event, $viewerRef);

		onMove(event, $viewerRef, $containerRef, touchPos);
	}

	function onMove(
		event: SvelteEvent<TouchEvent | MouseEvent, SVGElement>,
		viewerRef: SVGSVGElement,
		containerRef: SVGGElement,
		pointerPosition: Position,
	) {
		const $isMoving = get(isMoving);

		if (!$isMoving) {
			isMoving.set(true);
			hasPointerDown = false;
		}

		const newPosition = posSubtract(pointerPosition, offset);

		panTo(newPosition.x, newPosition.y);

		if (get(lockToBoundaries) && get(dragBehavior) === "borderReset") {
			const $position = get(position);
			const containerRect = containerRef.getBoundingClientRect();
			const viewerRect = viewerRef.getBoundingClientRect();

			if (
				newPosition.x > 0 ||
				newPosition.x < -(containerRect.width - viewerRect.width)
			) {
				offset.x = pointerPosition.x - $position.x;
			}

			if (
				newPosition.y > 0 ||
				newPosition.y < -(containerRect.height - viewerRect.height)
			) {
				offset.y = pointerPosition.y - $position.y;
			}
		}

		if (event.cancelable) event.preventDefault();
	}

	function onPinchMove(event: SvelteEvent<TouchEvent, SVGElement>) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $isMoving = get(isMoving);

		if (!$containerRef || !$viewerRef || $isMoving) return;

		const { touch1Pos, touch2Pos } = getPinchPosition(event);
		const distance = getPinchDistance(touch1Pos, touch2Pos);
		const newCenter = getPinchCenter(touch1Pos, touch2Pos);

		const $scale = get(scale);
		const newScale = $scale * (distance / lastDistance);

		if (Math.abs($scale - newScale) <= 0.0001) return;

		const $pinchBehavior = get(pinchBehavior);

		if ($pinchBehavior === "zoomDrag") {
			const diff = posSubtract(newCenter, lastCenter);
			const scaleDiff = newScale / $scale;
			const newX = diff.x * scaleDiff;
			const newY = diff.y * scaleDiff;

			zoom(newCenter.x, newCenter.y, newScale);
			pan(newX, newY);
		} else if ($pinchBehavior === "zoomOnly") {
			zoom(newCenter.x, newCenter.y, newScale);
		}

		lastDistance = distance;
		lastCenter = newCenter;

		if (event.cancelable) event.preventDefault();
	}

	function onTouchEnd(event: SvelteEvent<TouchEvent, SVGElement>) {
		if (get(disabled)) return;

		const $containerRef = get(containerRef);
		const $viewerRef = get(viewerRef);

		if (!$containerRef || !$viewerRef) return;

		if (event.touches.length === 1) {
			lastDistance = 0;
			lastCenter = { x: 0, y: 0 };

			const newOffset = getTouchPosition(event, $viewerRef);
			const $position = get(position);

			offset = posSubtract(newOffset, $position);

			event.preventDefault();
		} else {
			onPointerUp();
		}
	}

	function onPointerUp() {
		isMoving.set(false);
		hasPointerDown = false;
		offset = { x: 0, y: 0 };
	}

	function onKeyDown(e: SvelteEvent<KeyboardEvent, Window>) {
		const $actionKey = get(actionKey);

		if (!$actionKey || e.repeat || hasActionKeyPressed) return;

		if ($actionKey === e.key) hasActionKeyPressed = true;
	}

	function onKeyUp(e: SvelteEvent<KeyboardEvent, Window>) {
		const $actionKey = get(actionKey);

		if (!$actionKey || !hasActionKeyPressed) return;

		if ($actionKey === e.key) hasActionKeyPressed = false;
	}

	/**
	 * Move top-left corner to position
	 * @param x Pixels to move to in x axis
	 * @param y Pixels to move to in y axis
	 */
	function panTo(x: number, y: number) {
		const $containerRef = get(containerRef);
		const $viewerRef = get(viewerRef);
		const $lockToBoundaries = get(lockToBoundaries);

		if (!$containerRef || !$viewerRef) return;

		const containerRect = $containerRef.getBoundingClientRect();
		const viewerRect = $viewerRef.getBoundingClientRect();

		if ($lockToBoundaries) {
			x = clamp(-(containerRect.width - viewerRect.width), x, 0);
			y = clamp(-(containerRect.height - viewerRect.height), y, 0);
		}

		position.set({ x, y });
	}

	/**
	 * Move top-left corner in direction by certain amount of pixels
	 * @param x Pixels to move in x axis
	 * @param y Pixels to move in y axis
	 */
	function pan(x: number, y: number) {
		const $containerRef = get(containerRef);
		const $viewerRef = get(viewerRef);
		const $lockToBoundaries = get(lockToBoundaries);
		const $position = get(position);

		if (!$containerRef || !$viewerRef) return;

		const containerRect = $containerRef.getBoundingClientRect();
		const viewerRect = $viewerRef.getBoundingClientRect();

		let newPosition = {
			x: $position.x + x,
			y: $position.y + y,
		};

		if ($lockToBoundaries) {
			newPosition.x = clamp(
				-(containerRect.width - viewerRect.width),
				newPosition.x,
				0,
			);
			newPosition.y = clamp(
				-(containerRect.height - viewerRect.height),
				newPosition.y,
				0,
			);
		}

		position.set(newPosition);
	}

	/**
	 * Zoom in/out on viewer center
	 * @param newScale Scale to zoom to
	 */
	function zoomOnCenter(newScale: number) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);

		if (!$containerRef || !$viewerRef) return;

		const viewerRect = $viewerRef.getBoundingClientRect();

		newScale = clamp(minScale, newScale, maxScale);

		const centerPosition = {
			x: viewerRect.width / 2,
			y: viewerRect.height / 2,
		};

		zoom(centerPosition.x, centerPosition.y, newScale);
	}

	/**
	 * Zoom in/out
	 * @param x X axis position to zoom in/out
	 * @param y Y axis position to zoom in/out
	 * @param newScale Scale to zoom to
	 */
	function zoom(x: number, y: number, newScale: number) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $lockToBoundaries = get(lockToBoundaries);
		const $ignoreScale = get(ignoreScale);
		const oldScale = get(scale);

		if (!$containerRef || !$viewerRef) return;

		const containerRect = $containerRef.getBoundingClientRect();
		const viewerRect = $viewerRef.getBoundingClientRect();

		// TODO: hmm
		if (!$ignoreScale) {
			newScale = clamp(minScale, newScale, maxScale);
		}

		const scaleDiff = newScale / oldScale;
		const scaledContainerWidth = containerRect.width * scaleDiff;
		const scaledContainerHeight = containerRect.height * scaleDiff;

		if (
			$lockToBoundaries &&
			(scaledContainerWidth < viewerRect.width ||
				scaledContainerHeight < viewerRect.height)
		) {
			fitToViewer();

			return;
		}

		position.update(($position) => {
			let newX = scaleDiff * ($position.x - x) + x;
			let newY = scaleDiff * ($position.y - y) + y;

			if ($lockToBoundaries) {
				newX = clamp(
					-(scaledContainerWidth - viewerRect.width),
					newX,
					0,
				);
				newY = clamp(
					-(scaledContainerHeight - viewerRect.height),
					newY,
					0,
				);
			}

			return {
				x: newX,
				y: newY,
			};
		});

		scale.set(newScale);
	}

	/**
	 * Fit container size to viewer size by scaling it
	 * @param forceScale If true neglect `maxScale`/`minScale` parameters. Does not neglect `lockToBoundaries`
	 */
	function fitToViewer(forceScale: boolean = false) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $lockToBoundaries = get(lockToBoundaries);

		if (!$containerRef || !$viewerRef) return;

		const $scale = get(scale);

		const { height: viewerHeight, width: viewerWidth } =
			$viewerRef.getBoundingClientRect();
		const { height: containerHeight, width: containerWidth } =
			$containerRef.getBoundingClientRect();

		const initialContainerHeight = containerHeight / $scale;
		const initialContainerWidth = containerWidth / $scale;

		// calculate scale that needed to be set to fit container in the window
		const scaleY = viewerHeight / initialContainerHeight;
		const scaleX = viewerWidth / initialContainerWidth;

		let newScale: number;

		if ($lockToBoundaries) {
			newScale = [scaleX, scaleY].reduce((prev, curr) =>
				Math.abs(curr * 10 - 1) > Math.abs(prev * 10 - 1) ? curr : prev,
			);
		} else {
			// if not locked this should do the trick
			newScale = (scaleY + scaleX) / 2;
		}

		if (!forceScale) {
			newScale = clamp(minScale, newScale, maxScale);
		}

		if (Math.abs($scale - newScale) <= 0.0001) return;

		scale.set(newScale);
		position.set({ x: 0, y: 0 });
	}

	/**
	 * Fit viewer to specified selection
	 * @param x X position of top left corner
	 * @param y Y position of top left corner
	 * @param selectionWidth
	 * @param selectionHeight
	 */
	function fitSelection(
		x: number,
		y: number,
		selectionWidth: number,
		selectionHeight: number,
	) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);

		if (!$containerRef || !$viewerRef) return;

		const viewerRect = $viewerRef.getBoundingClientRect();

		const scaleX = viewerRect.width / selectionWidth;
		const scaleY = viewerRect.height / selectionHeight;

		const newScale = Math.min(scaleX, scaleY);

		position.set({ x: -x * newScale, y: -y * newScale });
		scale.set(newScale);
	}

	/**
	 * Places viewer to the center of the container
	 */
	function center() {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);

		if (!$containerRef || !$viewerRef) return;

		const containerRect = $containerRef.getBoundingClientRect();
		const viewerRect = $viewerRef.getBoundingClientRect();

		position.set({
			x: -(containerRect.width - viewerRect.width) / 2,
			y: -(containerRect.height - viewerRect.height) / 2,
		});
	}

	return {
		states: {
			position,
			ignoreScale,
			scale,
			lockToBoundaries,
			isMoving,
			disabled,
			pinchBehavior,
		},
		listeners: {
			onMouseDown,
			onMouseMove,
			onMouseUp,
			onWheel,
			onTouchStart,
			onTouchMove,
			onTouchEnd,
			onKeyDown,
			onKeyUp,
		},
		methods: {
			panTo,
			pan,
			zoomOnCenter,
			zoom,
			fitToViewer,
			fitSelection,
			center,
		},
	};
}
