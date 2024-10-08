import { get, writable, type Writable } from "svelte/store";
import {
	overridable,
	type ChangeFn,
	effect,
	removeUndefined,
	toWritableStores,
	omit,
} from "./index.js";
import {
	type PinchBehavior,
	type Key,
	type Position,
	type SvelteEvent,
} from "./types.js";

export type CreateSVGViewerProps = {
	defaultPosition?: Position;
	position?: Writable<Position>;
	maxScale?: number;
	minScale?: number;
	defaultIgnoreScale?: boolean;
	ignoreScale?: Writable<boolean>;
	defaultScale?: number;
	scale?: Writable<number>;
	scaleMouseSensitivity?: number;
	scaleTouchpadSensitivity?: number;
	defaultLockToBoundaries?: boolean;
	lockToBoundaries?: Writable<boolean>;
	defaultActionKey?: Key;
	actionKey?: Writable<Key>;
	defaultPinchBehavior?: PinchBehavior;
	pinchBehavior?: Writable<PinchBehavior>;
};

const defaultProps = {
	defaultPosition: { x: 0, y: 0 },
	position: undefined,
	maxScale: 1.4,
	minScale: 0.6,
	defaultIgnoreScale: false,
	ignoreScale: undefined,
	defaultScale: 1,
	scale: undefined,
	scaleMouseSensitivity: 1.1,
	scaleTouchpadSensitivity: 1.06,
	defaultLockToBoundaries: false,
	lockToBoundaries: undefined,
	defaultActionKey: undefined,
	actionKey: undefined,
	defaultPinchBehavior: "zoomOnly",
	pinchBehavior: undefined,
} as const;

const omittedOptions = [
	"lockToBoundaries",
	"position",
	"ignoreScale",
	"scale",
	"actionKey",
	"pinchBehavior"
] as const;

export function createViewer(props: CreateSVGViewerProps) {
	const { ...withDefaults } = {
		...defaultProps,
		...removeUndefined(props),
	} satisfies CreateSVGViewerProps;

	const options = toWritableStores(
		omit({ ...withDefaults }, ...omittedOptions),
	);

	// export let bracketWidth: number;
	// export let bracketHeight: number;
	let minScale: number = withDefaults.minScale;
	let maxScale: number = withDefaults.maxScale;
	let scaleMouseSensitivity = withDefaults.scaleMouseSensitivity;
	let scaleTouchpadSensitivity = withDefaults.scaleTouchpadSensitivity;

	const positionStore = withDefaults.position ?? options.defaultPosition;
	const ignoreScaleStore =
		withDefaults.ignoreScale ?? options.defaultIgnoreScale;
	const scaleStore = withDefaults.scale ?? options.defaultScale;
	const lockToBoundariesStore =
		withDefaults.lockToBoundaries ?? options.defaultLockToBoundaries;
	const actionKeyStore = withDefaults.actionKey ?? options.defaultActionKey;
	const pinchBehaviorStore = withDefaults.pinchBehavior ?? options.defaultPinchBehavior;

	// possibly useless functions
	let onLockChange: ChangeFn<boolean> = ({ curr, next }) => {
		return next;
	};

	let onPositionChange: ChangeFn<Position> | undefined = ({ curr, next }) => {
		return next;
	};

	// not that useless, controls scale to not overflow minScale/maxScale
	let onScaleChange: ChangeFn<number> | undefined = ({ curr, next }) => {
		if (get(ignoreScaleStore)) return next;

		if (next > maxScale) return curr;
		if (next < minScale) return curr;

		return next;
	};

	let lockToBoundaries = overridable(lockToBoundariesStore, onLockChange);
	let scale = overridable<number>(scaleStore, onScaleChange);
	let position = overridable<Position>(positionStore, onPositionChange);
	let viewerRef: Writable<SVGElement | undefined> = writable(undefined);
	let containerRef: Writable<SVGElement | undefined> = writable(undefined);

	let offset: Position = { x: 0, y: 0 };
	let lastCenter: Position | null = null;
	let lastDistance: number;

	let hasActionKeyPressed = get(actionKeyStore) === undefined ? true : false;
	// Both of these variables detect how to respond on a client interaction
	let hasPointerDown = false;
	let isMoving = writable(false);

	// DONE? FIXME: mobile zooming?
	// DONE? FIXME: adjust x/y positioning when locking to container rect

	// This effect is handling locking of viewer by
	// recalculating position
	effect([lockToBoundaries], ([$lockToBoundaries]) => {
		if (!$lockToBoundaries) return;

		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);

		if (!($viewerRef && $containerRef)) return;

		const containerRect = $containerRef.getBoundingClientRect();
		const viewerRect = $viewerRef.getBoundingClientRect();

		position.update(($position) => {
			const newX = Math.min(
				0,
				Math.max(
					$position.x,
					-(containerRect.width - viewerRect.width),
				),
			);
			const newY = Math.min(
				0,
				Math.max(
					$position.y,
					-(containerRect.height - viewerRect.height),
				),
			);

			return { x: newX, y: newY };
		});
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

	function isPinchGesture(event: SvelteEvent<TouchEvent, SVGElement>): boolean {
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

		if (!$containerRef || !$viewerRef) return;
		if (!hasActionKeyPressed) return;
		if (!hasPointerDown && !$isMoving) return;

		if (!$isMoving) {
			isMoving.set(true);
			hasPointerDown = false;
		}

		const newPosition = getMousePosition(event, $viewerRef);

		let newX = newPosition.x - offset.x;
		let newY = newPosition.y - offset.y;

		panTo(newX, newY);

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

			if (get(pinchBehaviorStore) == "zoomDrag") {
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

		let newX = newPosition.x - offset.x;
		let newY = newPosition.y - offset.y;

		console.log({newX, newY}, newPosition, offset);

		panTo(newX, newY);

		if (event.cancelable) event.preventDefault();
	}

	function onPinchMove(event: SvelteEvent<TouchEvent, SVGElement>) {
		const $viewerRef = get(viewerRef);
		const $containerRef = get(containerRef);
		const $isMoving = get(isMoving);

		// probably not needed, because this function is called from
		// another function that already checks this
		if (!$containerRef || !$viewerRef) return;
		if ($isMoving) return;

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
		const $pinchBehavior = get(pinchBehaviorStore);

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
			}
			else if ($pinchBehavior === "zoomOnly") {
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
		const $actionKey = get(actionKeyStore);

		if (e.repeat || hasActionKeyPressed) return;

		if ($actionKey === e.key) hasActionKeyPressed = true;
	}

	function onKeyUp(e: SvelteEvent<KeyboardEvent, Window>) {
		const $actionKey = get(actionKeyStore);

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
			x = Math.min(
				0,
				Math.max(x, -(containerRect.width - viewerRect.width)),
			);
			y = Math.min(
				0,
				Math.max(y, -(containerRect.height - viewerRect.height)),
			);
	
			// TODO:
			// optional thing, resets offset when hitting borders
			// maybe hide it behind some option like dragBehavior
	
			// if (newX == 0 || newX == -(containerRect.width - viewerRect.width)) {
			//     offset.x = newPos.x - get(position).x;
			// }
	
			// if (newY == 0 || newY == -(containerRect.height - viewerRect.height)) {
			//     offset.y = newPos.y - get(position).y;
			// }
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
			newPosition.x = Math.min(
				0,
				Math.max(
					newPosition.x,
					-(containerRect.width - viewerRect.width),
				),
			);
			newPosition.y = Math.min(
				0,
				Math.max(
					newPosition.y,
					-(containerRect.height - viewerRect.height),
				),
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

		if (newScale > maxScale) newScale = maxScale;
		if (newScale < minScale) newScale = minScale;

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
		const $ignoreScale = get(ignoreScaleStore);
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
			// for mouse
			let newX = scaleDiff * ($position.x - x) + x;
			let newY = scaleDiff * ($position.y - y) + y;

			// for touch
			// let newX = newCenter.x - pointTo.x * newScale + dx;
			// let newY = newCenter.y - pointTo.y * newScale + dy;

			// let newX = x;
			// let newY = y;

			if ($lockToBoundaries) {
				newX = Math.min(
					0,
					Math.max(
						newX,
						-(
							scaledContainerWidth -
							viewerRect.width
						),
					),
				);

				newY = Math.min(
					0,
					Math.max(
						newY,
						-(
							scaledContainerHeight -
							viewerRect.height
						),
					),
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
  				(Math.abs(curr - 1) < Math.abs(prev - 1) ? curr : prev));
		} else {
			// if not locked this should do the trick
			newScale = (scaleY + scaleX) / 2;
		}

		if (!forceScale) {
			newScale = Math.max(minScale, Math.min(maxScale, newScale));
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

	function reset() {
		// TODO: should we store initial position and scale?
		// TODO: if we'll be implementing this, then yes
	}

	return {
		states: {
			position,
			ignoreScale: ignoreScaleStore,
			scale,
			lockToBoundaries,
			isMoving,
			pinchBehavior: pinchBehaviorStore,
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
