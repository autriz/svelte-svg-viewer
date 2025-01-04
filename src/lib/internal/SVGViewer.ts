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
	pinchBehavior?: MaybeWritable<PinchBehavior>;
	dragBehavior?: MaybeWritable<DragBehavior>;
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
	pinchBehavior: "zoomOnly",
	dragBehavior: "normal",
} as const;

const omittedOptions = [
	"maxScale",
	"minScale",
	"scaleMouseSensitivity",
	"scaleTouchpadSensitivity",
] as const;

export function createViewer(props: CreateSVGViewerProps) {
	const { ...withDefaults } = {
		...defaultProps,
		...removeUndefined(props),
	} satisfies CreateSVGViewerProps;

	const options = toWritableStores(
		omit({ ...withDefaults }, ...omittedOptions),
	);

	const minScale = withDefaults.minScale;
	const maxScale = withDefaults.maxScale;
	const scaleMouseSensitivity = withDefaults.scaleMouseSensitivity;
	const scaleTouchpadSensitivity = withDefaults.scaleTouchpadSensitivity;

	const position = options.position;
	const ignoreScale = options.ignoreScale;
	const scale = options.scale;
	const lockToBoundaries = options.lockToBoundaries;
	const actionKey = options.actionKey;
	const pinchBehavior = options.pinchBehavior;
	const dragBehavior = options.dragBehavior;

	const viewerRef: Writable<SVGElement | undefined> = writable(undefined);
	const containerRef: Writable<SVGElement | undefined> = writable(undefined);

	let offset: Position = { x: 0, y: 0 };
	let lastCenter: Position | null = null;
	let lastDistance: number;

	let hasActionKeyPressed = get(actionKey) === undefined ? true : false;
	// Both of these variables detect how to respond on a client interaction
	let hasPointerDown = false;
	const isMoving = writable(false);

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

	const scaleUnsub = derived(scale, (newScale) => {
		if (get(ignoreScale)) return;

		const clampedScale = clamp(minScale, newScale, maxScale);

		if (clampedScale !== newScale) {
			scale.set(clampedScale);
		}
	}).subscribe(() => {});

	onDestroy(() => {
		lockUnsub();
		scaleUnsub();
	});

	function getMousePosition(
		event: SvelteEvent<MouseEvent, SVGElement>,
		element: SVGElement,
	): Position {
		const rect = element.getBoundingClientRect();

		return {
			x: event.clientX - rect.x,
			y: event.clientY - rect.y,
		};
	}

	function getTouchPosition(
		event: SvelteEvent<TouchEvent, SVGElement>,
		element: SVGElement,
	): Position {
		const rect = element.getBoundingClientRect();

		return {
			x: event.touches[0].clientX - rect.x,
			y: event.touches[0].clientY - rect.y,
		};
	}

	/**
	 * Get position between two touches
	 *
	 * @param touch1Pos Position of first touch
	 * @param touch2Pos Position of second touch
	 */
	function getPinchCenter(
		touch1Pos: Position,
		touch2Pos: Position,
	): Position {
		return {
			x: (touch1Pos.x + touch2Pos.x) / 2,
			y: (touch1Pos.y + touch2Pos.y) / 2,
		};
	}

	/**
	 * Get distance between two touches
	 *
	 * @param touch1Pos Position of first touch
	 * @param touch2Pos Position of second touch
	 */
	function getPinchDistance(
		touch1Pos: Position,
		touch2Pos: Position,
	): number {
		return Math.sqrt(
			Math.pow(touch2Pos.x - touch1Pos.x, 2) +
				Math.pow(touch2Pos.y - touch1Pos.y, 2),
		);
	}

	function isPinchGesture(
		event: SvelteEvent<TouchEvent, SVGElement>,
	): boolean {
		return event.touches.length > 1;
	}

	function onMouseDown(event: SvelteEvent<MouseEvent, SVGElement>) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $position = get(position);

		if (!$containerRef || !$viewerRef) return;
		if (!hasActionKeyPressed) return;

		const newOffset = getMousePosition(event, $viewerRef);

		offset = {
			x: newOffset.x - $position.x,
			y: newOffset.y - $position.y,
		};

		hasPointerDown = true;

		if (event.cancelable) event.preventDefault();
	}

	function onMouseMove(event: SvelteEvent<MouseEvent, SVGElement>) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $isMoving = get(isMoving);

		if (
			!$containerRef ||
			!$viewerRef ||
			!hasActionKeyPressed ||
			(!hasPointerDown && !$isMoving)
		)
			return;

		if (!$isMoving) {
			isMoving.set(true);
			hasPointerDown = false;
		}

		const newPosition = getMousePosition(event, $viewerRef);

		const newX = newPosition.x - offset.x;
		const newY = newPosition.y - offset.y;

		panTo(newX, newY);

		if (get(lockToBoundaries) && get(dragBehavior) === "borderReset") {
			const $position = get(position);
			const containerRect = $containerRef.getBoundingClientRect();
			const viewerRect = $viewerRef.getBoundingClientRect();

			if (newX > 0 || newX < -(containerRect.width - viewerRect.width)) {
				offset.x = newPosition.x - $position.x;
			}

			if (
				newY > 0 ||
				newY < -(containerRect.height - viewerRect.height)
			) {
				offset.y = newPosition.y - $position.y;
			}
		}

		if (event.cancelable) event.preventDefault();
	}

	function onMouseUp(_event: SvelteEvent<MouseEvent, SVGElement>) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);

		if (!$containerRef || !$viewerRef) return;

		isMoving.set(false);
		hasPointerDown = false;
		offset = { x: 0, y: 0 };
	}

	function onWheel(event: SvelteEvent<WheelEvent, SVGElement>) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const oldScale = get(scale);

		if (!$containerRef || !$viewerRef || !hasActionKeyPressed) return;

		const delta = event.deltaY || event.deltaX;

		let cursorPos = getMousePosition(event, $viewerRef);

		const scaleStep =
			Math.abs(delta) > 50
				? scaleMouseSensitivity
				: scaleTouchpadSensitivity;
		const scaleDelta = delta < 0 ? 1 / scaleStep : scaleStep;

		const newScale = oldScale / scaleDelta;

		zoom(cursorPos.x, cursorPos.y, newScale);
	}

	function onTouchStart(event: SvelteEvent<TouchEvent, SVGElement>) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $position = get(position);
		const $isMoving = get(isMoving);

		if (!$containerRef || !$viewerRef) return;

		if (isPinchGesture(event)) {
			if ($isMoving) isMoving.set(false);

			const [touch1, touch2] = [event.touches[0], event.touches[1]];

			const touch1Pos = { x: touch1.clientX, y: touch1.clientY };
			const touch2Pos = { x: touch2.clientX, y: touch2.clientY };

			lastDistance = getPinchDistance(touch1Pos, touch2Pos);

			if (get(pinchBehavior) == "zoomDrag") {
				const newOffset = getPinchCenter(touch1Pos, touch2Pos);

				offset = {
					x: newOffset.x - $position.x,
					y: newOffset.y - $position.y,
				};
			}

			if (event.cancelable) event.preventDefault();
		} else {
			const newOffset = getTouchPosition(event, $viewerRef);

			offset = {
				x: newOffset.x - $position.x,
				y: newOffset.y - $position.y,
			};

			hasPointerDown = true;
		}
	}

	function onTouchMove(event: SvelteEvent<TouchEvent, SVGElement>) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $isMoving = get(isMoving);

		if (!$containerRef || !$viewerRef) return;

		if (isPinchGesture(event)) {
			onPinchMove(event);
			return;
		}

		if (!$isMoving) {
			// fixes issue when pinch zoom is ended
			// it triggers onTouchMove after onTouchEnd,
			// thereafter setting position to 0,0
			if (!hasPointerDown) return;

			isMoving.set(true);
			hasPointerDown = false;
		}

		const newPosition = getTouchPosition(event, $viewerRef);

		const newX = newPosition.x - offset.x;
		const newY = newPosition.y - offset.y;

		panTo(newX, newY);

		if (get(lockToBoundaries) && get(dragBehavior) === "borderReset") {
			const $position = get(position);
			const containerRect = $containerRef.getBoundingClientRect();
			const viewerRect = $viewerRef.getBoundingClientRect();

			if (
				newX == 0 ||
				newX == -(containerRect.width - viewerRect.width)
			) {
				offset.x = newPosition.x - $position.x;
			}

			if (
				newY == 0 ||
				newY == -(containerRect.height - viewerRect.height)
			) {
				offset.y = newPosition.y - $position.y;
			}
		}

		if (event.cancelable) event.preventDefault();
	}

	function onPinchMove(event: SvelteEvent<TouchEvent, SVGElement>) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $isMoving = get(isMoving);

		// probably not needed, because this function is called from
		// another function that already checks this
		if (!$containerRef || !$viewerRef || $isMoving) return;

		const [touch1, touch2] = [event.touches[0], event.touches[1]];

		const touch1Pos = { x: touch1.clientX, y: touch1.clientY };
		const touch2Pos = { x: touch2.clientX, y: touch2.clientY };

		const newCenter = getPinchCenter(touch1Pos, touch2Pos);

		if (!lastCenter) {
			lastCenter = newCenter;
			return;
		}

		const distance = getPinchDistance(touch1Pos, touch2Pos);

		const $scale = get(scale);
		const $pinchBehavior = get(pinchBehavior);

		if (!lastDistance) {
			lastDistance = distance;
		}

		const newScale = $scale * (distance / lastDistance);

		if ($scale == newScale) return;

		const scaleDiff = newScale / $scale;

		const containerRect = $containerRef.getBoundingClientRect();
		const viewerRect = $viewerRef.getBoundingClientRect();

		const initialContainerHeight = containerRect.height * scaleDiff;
		const initialContainerWidth = containerRect.width * scaleDiff;

		// FIXME: ignoreScale
		if (
			newScale <= maxScale &&
			newScale >= minScale &&
			initialContainerWidth > viewerRect.width &&
			initialContainerHeight > viewerRect.height
		) {
			// FIXME: when you start to zoom, position shifts unexpectedly
			if ($pinchBehavior === "zoomDrag") {
				let newX = newCenter.x - lastCenter.x;
				let newY = newCenter.y - lastCenter.y;

				zoom(newCenter.x, newCenter.y, newScale);
				pan(newX * scaleDiff, newY * scaleDiff);
			} else if ($pinchBehavior === "zoomOnly") {
				zoom(newCenter.x, newCenter.y, newScale);
			}

			lastDistance = distance;
			lastCenter = newCenter;
		}
	}

	function onTouchEnd(event: SvelteEvent<TouchEvent, SVGElement>) {
		const $containerRef = get(containerRef);
		const $viewerRef = get(viewerRef);

		if (!$containerRef || !$viewerRef) return;

		isMoving.set(false);
		hasPointerDown = false;
		offset = { x: 0, y: 0 };

		if (isPinchGesture(event)) {
			lastDistance = 0;
			lastCenter = null;
		}
	}

	function onKeyDown(e: SvelteEvent<KeyboardEvent, Window>) {
		const $actionKey = get(actionKey);

		if (e.repeat || hasActionKeyPressed) return;

		if ($actionKey === e.key) hasActionKeyPressed = true;
	}

	function onKeyUp(e: SvelteEvent<KeyboardEvent, Window>) {
		const $actionKey = get(actionKey);

		if (!hasActionKeyPressed) return;

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
			if (newScale > maxScale) newScale = maxScale;
			if (newScale < minScale) newScale = minScale;
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
	 * @param forceScale If true neglect maxScale/minScale parameters. Does not neglect lockToBoundaries
	 */
	function fitToViewer(forceScale: boolean = false) {
		// TODO: should it fit to viewer even if maxScale/minScale doesn't allow it?
		// Added force to allow both behaviors exist in the future

		// FIXME: on Android Firefox does not fit correctly,
		// leaving empty line on the right side and
		// some not fitted space at the top

		// ^ it fixed itself?

		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $lockToBoundaries = get(lockToBoundaries);

		if (!$containerRef || !$viewerRef) return;

		const $scale = get(scale);

		const { height: viewerHeight, width: viewerWidth } =
			$viewerRef.getBoundingClientRect();
		const { height: containerHeight, width: containerWidth } =
			$containerRef.getBoundingClientRect();

		// initial container size
		const initialContainerHeight = containerHeight / $scale;
		const initialContainerWidth = containerWidth / $scale;

		// calculate scale that needed to be set to fit container in the window
		const scaleY = viewerHeight / initialContainerHeight;
		const scaleX = viewerWidth / initialContainerWidth;

		let newScale: number;

		if ($lockToBoundaries) {
			newScale = [scaleX, scaleY].reduce((prev, curr) =>
				Math.abs(curr - 1) < Math.abs(prev - 1) ? curr : prev,
			);
		} else {
			// if not locked this should do the trick
			newScale = (scaleY + scaleX) / 2;
		}

		if (!forceScale) {
			newScale = clamp(minScale, newScale, maxScale);
		}

		scale.set(newScale);
		position.set({ x: 0, y: 0 });
	}

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
		refs: {
			viewerRef,
			containerRef,
		},
	};
}
