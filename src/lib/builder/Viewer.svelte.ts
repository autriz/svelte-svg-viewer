import { untrack } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import { on } from "svelte/events";
import type {
	ControlledValues,
	MaybeGetter,
	MaybeGetterValues,
	DragBehavior,
	Key,
	PinchBehavior,
	Position,
	SvelteEvent,
} from "$lib/types.js";
import Synced from "$lib/Synced.svelte.js";
import {
	clamp,
	extract,
	getMousePosition,
	getPinchCenter,
	getPinchDistance,
	getTouchPosition,
	isPinchGesture,
} from "$lib/utils/index.js";

function toSynced<T>(
	value: MaybeGetter<T | undefined>,
	onChange: ((v: T) => void) | undefined,
	defaultValue: T,
): Synced<T> {
	return new Synced({
		value,
		onChange,
		defaultValue,
	});
}

export type SVGViewerProps = ControlledValues<{
	position: Position;
	scale: number;
}> &
	MaybeGetterValues<{
		maxScale?: number;
		minScale?: number;
		ignoreScale?: boolean;
		scaleMouseSensitivity?: number;
		scaleTouchpadSensitivity?: number;
		lockToBoundaries?: boolean;
		actionKey?: Key | undefined;
		pinchBehavior?: PinchBehavior;
		dragBehavior?: DragBehavior;
		viewerRef?: SVGSVGElement;
		containerRef?: SVGGElement;
	}>;

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

export default class SVGViewer {
	#props!: SVGViewerProps;

	#position: Synced<Position>;
	#scale: Synced<number>;

	maxScale = $derived(extract(this.#props.maxScale, defaultProps.maxScale))!;
	minScale = $derived(extract(this.#props.minScale, defaultProps.minScale))!;
	ignoreScale = $derived(
		extract(this.#props.ignoreScale, defaultProps.ignoreScale),
	)!;
	scaleMouseSensitivity = $derived(
		extract(
			this.#props.scaleMouseSensitivity,
			defaultProps.scaleMouseSensitivity,
		),
	)!;
	scaleTouchpadSensitivity = $derived(
		extract(
			this.#props.scaleTouchpadSensitivity,
			defaultProps.scaleTouchpadSensitivity,
		),
	)!;
	lockToBoundaries = $derived(
		extract(this.#props.lockToBoundaries, defaultProps.lockToBoundaries),
	)!;
	actionKey = $derived(
		extract(this.#props?.actionKey, defaultProps.actionKey),
	)!;
	pinchBehavior = $derived(
		extract(this.#props.pinchBehavior, defaultProps.pinchBehavior),
	)!;
	dragBehavior = $derived(
		extract(this.#props.dragBehavior, defaultProps.dragBehavior),
	)!;
	viewerRef = $derived(extract(this.#props.viewerRef, undefined));
	containerRef = $derived(extract(this.#props.containerRef, undefined));

	offset = $state<Position>({ x: 0, y: 0 });
	lastCenter = $state<Position>({ x: 0, y: 0 });
	lastDistance = $state(0);
	hasActionKeyPressed = $state(this.actionKey === undefined ? true : false);
	hasPointerDown = $state(false);
	isMoving = $state(false);

	constructor(props: SVGViewerProps = {}) {
		this.#position = toSynced(
			props.position,
			props.onPositionChange,
			defaultProps.position,
		);
		this.#scale = toSynced(
			props.scale,
			props.onScaleChange,
			defaultProps.scale,
		);
		this.#props = props;

		$effect.pre(() => {
			this.lockToBoundaries;
			untrack(() => {
				if (
					!this.lockToBoundaries ||
					!this.viewerRef ||
					!this.containerRef
				)
					return;

				const containerRect = this.containerRef.getBoundingClientRect();
				const viewerRect = this.viewerRef.getBoundingClientRect();

				const width = -(containerRect.width - viewerRect.width);
				const height = -(containerRect.height - viewerRect.height);

				if (width > 0 || height > 0) {
					this.fitToViewer();
					return;
				}

				const newX = clamp(width, this.position.x, 0);
				const newY = clamp(height, this.position.y, 0);

				this.position = { x: newX, y: newY };
			});
		});

		$effect.pre(() => {
			this.#scale;
			untrack(() => {
				if (this.ignoreScale) return;

				const clampedScale = clamp(
					this.minScale,
					this.scale,
					this.maxScale,
				);

				this.scale = clampedScale;
			});
		});
	}

	get position() {
		return this.#position.current;
	}
	set position(position: Position) {
		this.#position.current = position;
	}

	get scale() {
		return this.#scale.current;
	}
	set scale(scale: number) {
		this.#scale.current = scale;
	}

	get viewer() {
		$effect(() => {
			const target = extract(this.viewerRef);
			if (!target) return;
			return on(
				target,
				"touchstart",
				(e) => this.onTouchStart(e as any),
				{ passive: false },
			);
		});
		$effect(() => {
			const target = extract(this.viewerRef);
			if (!target) return;
			return on(target, "touchmove", (e) => this.onTouchMove(e as any), {
				passive: false,
			});
		});

		return {
			id: "svg-viewer",
			onmousedown: (e) => this.onMouseDown(e),
			onmousemove: (e) => this.onMouseMove(e),
			onmouseup: (e) => this.onMouseUp(e),
			onmouseleave: (e) => {
				e.preventDefault();
				this.onMouseUp(e);
			},
			ontouchend: (e) => this.onTouchEnd(e),
			ontouchcancel: (e) => {
				e.preventDefault();
				this.onTouchEnd(e);
			},
			onwheel: (e) => {
				e.preventDefault();
				this.onWheel(e);
			},
		} as const satisfies HTMLAttributes<SVGSVGElement>;
	}

	get container() {
		return {
			id: "svg-container",
			style: `transform: translate3d(${this.position.x}px, ${this.position.y}px, 0px) scale3d(${this.scale}, ${this.scale}, ${this.scale});`,
			["data-moving"]: this.isMoving,
		} as const satisfies HTMLAttributes<SVGGElement>;
	}

	onMouseDown(event: SvelteEvent<MouseEvent, SVGElement>) {
		if (!this.containerRef || !this.viewerRef || !this.hasActionKeyPressed)
			return;

		const newOffset = getMousePosition(event, this.viewerRef);

		this.offset = {
			x: newOffset.x - this.position.x,
			y: newOffset.y - this.position.y,
		};

		this.hasPointerDown = true;

		if (event.cancelable) event.preventDefault();
	}

	onMouseMove(event: SvelteEvent<MouseEvent, SVGElement>) {
		if (
			!this.containerRef ||
			!this.viewerRef ||
			!this.hasActionKeyPressed ||
			(!this.hasPointerDown && !this.isMoving)
		)
			return;

		if (!this.isMoving) {
			this.isMoving = true;
			this.hasPointerDown = false;
		}

		const newPosition = getMousePosition(event, this.viewerRef);

		const newX = newPosition.x - this.offset.x;
		const newY = newPosition.y - this.offset.y;

		this.panTo(newX, newY);

		if (this.lockToBoundaries && this.dragBehavior === "borderReset") {
			const containerRect = this.containerRef.getBoundingClientRect();
			const viewerRect = this.viewerRef.getBoundingClientRect();

			if (newX > 0 || newX < -(containerRect.width - viewerRect.width)) {
				this.offset.x = newPosition.x - this.position.x;
			}

			if (
				newY > 0 ||
				newY < -(containerRect.height - viewerRect.height)
			) {
				this.offset.y = newPosition.y - this.position.y;
			}
		}

		if (event.cancelable) event.preventDefault();
	}

	onMouseUp(_event: SvelteEvent<MouseEvent, SVGElement>) {
		if (!this.containerRef || !this.viewerRef) return;

		this.isMoving = false;
		this.hasPointerDown = false;
		this.offset = { x: 0, y: 0 };
	}

	onWheel(event: SvelteEvent<WheelEvent, SVGElement>) {
		if (!this.containerRef || !this.viewerRef || !this.hasActionKeyPressed)
			return;

		const cursorPos = getMousePosition(event, this.viewerRef);
		const delta = event.deltaY || event.deltaX;
		const scaleStep =
			Math.abs(delta) > 50
				? this.scaleMouseSensitivity
				: this.scaleTouchpadSensitivity;
		const scaleDelta = delta < 0 ? 1 / scaleStep : scaleStep;
		const newScale = this.scale / scaleDelta;

		this.zoom(cursorPos.x, cursorPos.y, newScale);
	}

	onTouchStart(event: SvelteEvent<TouchEvent, SVGElement>) {
		if (!this.containerRef || !this.viewerRef) return;

		if (isPinchGesture(event)) {
			if (this.isMoving) this.isMoving = false;

			const [touch1, touch2] = [event.touches[0], event.touches[1]];

			const touch1Pos = { x: touch1.clientX, y: touch1.clientY };
			const touch2Pos = { x: touch2.clientX, y: touch2.clientY };

			this.lastDistance = getPinchDistance(touch1Pos, touch2Pos);
			this.lastCenter = getPinchCenter(touch1Pos, touch2Pos);

			if (this.pinchBehavior == "zoomDrag") {
				const newOffset = getPinchCenter(touch1Pos, touch2Pos);

				this.offset = {
					x: newOffset.x - this.position.x,
					y: newOffset.y - this.position.y,
				};
			}

			if (event.cancelable) event.preventDefault();
		} else {
			const newOffset = getTouchPosition(event, this.viewerRef);

			this.offset = {
				x: newOffset.x - this.position.x,
				y: newOffset.y - this.position.y,
			};
		}

		this.hasPointerDown = true;
	}

	onTouchMove(event: SvelteEvent<TouchEvent, SVGElement>) {
		if (!this.containerRef || !this.viewerRef) return;

		if (isPinchGesture(event)) {
			this.onPinchMove(event);
			return;
		}

		if (!this.isMoving) {
			this.isMoving = true;
			this.hasPointerDown = false;
		}

		const newPosition = getTouchPosition(event, this.viewerRef);

		const newX = newPosition.x - this.offset.x;
		const newY = newPosition.y - this.offset.y;

		this.panTo(newX, newY);

		if (this.lockToBoundaries && this.dragBehavior === "borderReset") {
			const containerRect = this.containerRef.getBoundingClientRect();
			const viewerRect = this.viewerRef.getBoundingClientRect();

			if (
				newX == 0 ||
				newX == -(containerRect.width - viewerRect.width)
			) {
				this.offset.x = newPosition.x - this.position.x;
			}

			if (
				newY == 0 ||
				newY == -(containerRect.height - viewerRect.height)
			) {
				this.offset.y = newPosition.y - this.position.y;
			}
		}

		if (event.cancelable) event.preventDefault();
	}

	onPinchMove(event: SvelteEvent<TouchEvent, SVGElement>) {
		if (!this.containerRef || !this.viewerRef || this.isMoving) return;

		const [touch1, touch2] = [event.touches[0], event.touches[1]];

		const touch1Pos = { x: touch1.clientX, y: touch1.clientY };
		const touch2Pos = { x: touch2.clientX, y: touch2.clientY };

		const newCenter = getPinchCenter(touch1Pos, touch2Pos);
		const distance = getPinchDistance(touch1Pos, touch2Pos);

		const newScale = this.scale * (distance / this.lastDistance);

		if (this.scale === newScale) return;

		const scaleDiff = newScale / this.scale;

		if (this.pinchBehavior === "zoomDrag") {
			let newX = scaleDiff * (newCenter.x - this.lastCenter.x);
			let newY = scaleDiff * (newCenter.y - this.lastCenter.y);

			this.zoom(newCenter.x, newCenter.y, newScale);
			this.pan(newX, newY);
		} else if (this.pinchBehavior === "zoomOnly") {
			this.zoom(newCenter.x, newCenter.y, newScale);
		}

		this.lastDistance = distance;
		this.lastCenter = newCenter;
	}

	onTouchEnd(event: SvelteEvent<TouchEvent, SVGElement>) {
		if (!this.containerRef || !this.viewerRef) return;

		if (event.touches.length == 1) {
			this.lastDistance = 0;
			this.lastCenter = { x: 0, y: 0 };

			const newOffset = getTouchPosition(event, this.viewerRef);

			this.offset = {
				x: newOffset.x - this.position.x,
				y: newOffset.y - this.position.y,
			};

			event.preventDefault();
		} else {
			this.isMoving = false;
			this.hasPointerDown = false;
			this.offset = { x: 0, y: 0 };
		}
	}

	onKeyDown(e: SvelteEvent<KeyboardEvent, Window>) {
		if (e.repeat || this.hasActionKeyPressed) return;

		if (this.actionKey === e.key) this.hasActionKeyPressed = true;
	}

	onKeyUp(e: SvelteEvent<KeyboardEvent, Window>) {
		if (!this.hasActionKeyPressed) return;

		if (this.actionKey === e.key) this.hasActionKeyPressed = false;
	}

	/**
	 * Move top-left corner to position
	 * @param x Pixels to move to in x axis
	 * @param y Pixels to move to in y axis
	 */
	panTo(x: number, y: number) {
		if (!this.containerRef || !this.viewerRef) return;

		const containerRect = this.containerRef.getBoundingClientRect();
		const viewerRect = this.viewerRef.getBoundingClientRect();

		if (this.lockToBoundaries) {
			x = clamp(-(containerRect.width - viewerRect.width), x, 0);
			y = clamp(-(containerRect.height - viewerRect.height), y, 0);
		}

		this.position = { x, y };
	}

	/**
	 * Move top-left corner in direction by certain amount of pixels
	 * @param x Pixels to move in x axis
	 * @param y Pixels to move in y axis
	 */
	pan(x: number, y: number) {
		if (!this.containerRef || !this.viewerRef) return;

		const containerRect = this.containerRef.getBoundingClientRect();
		const viewerRect = this.viewerRef.getBoundingClientRect();

		let newPosition = {
			x: this.position.x + x,
			y: this.position.y + y,
		};

		if (this.lockToBoundaries) {
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

		this.#position.current = newPosition;
	}

	/**
	 * Zoom in/out on viewer center
	 * @param newScale Scale to zoom to
	 */
	zoomOnCenter(newScale: number) {
		if (!this.containerRef || !this.viewerRef) return;

		const viewerRect = this.viewerRef.getBoundingClientRect();

		newScale = clamp(this.minScale, newScale, this.maxScale);

		const centerPosition = {
			x: viewerRect.width / 2,
			y: viewerRect.height / 2,
		};

		this.zoom(centerPosition.x, centerPosition.y, newScale);
	}

	/**
	 * Zoom in/out
	 * @param x X axis position to zoom in/out
	 * @param y Y axis position to zoom in/out
	 * @param newScale Scale to zoom to
	 */
	zoom(x: number, y: number, newScale: number) {
		if (!this.containerRef || !this.viewerRef) return;

		const containerRect = this.containerRef.getBoundingClientRect();
		const viewerRect = this.viewerRef.getBoundingClientRect();

		// TODO: hmm
		if (!this.ignoreScale) {
			newScale = clamp(this.minScale, newScale, this.maxScale);
		}

		const scaleDiff = newScale / this.scale;
		const scaledContainerWidth = containerRect.width * scaleDiff;
		const scaledContainerHeight = containerRect.height * scaleDiff;

		if (
			this.lockToBoundaries &&
			(scaledContainerWidth < viewerRect.width ||
				scaledContainerHeight < viewerRect.height)
		) {
			this.fitToViewer();

			return;
		}

		let newX = scaleDiff * (this.position.x - x) + x;
		let newY = scaleDiff * (this.position.y - y) + y;

		if (this.lockToBoundaries) {
			newX = clamp(-(scaledContainerWidth - viewerRect.width), newX, 0);
			newY = clamp(-(scaledContainerHeight - viewerRect.height), newY, 0);
		}

		this.position = {
			x: newX,
			y: newY,
		};
		this.scale = newScale;
	}

	/**
	 * Fit container size to viewer size by scaling it
	 * @param forceScale If true neglect `maxScale`/`minScale` parameters. Does not neglect `lockToBoundaries`
	 */
	fitToViewer(forceScale: boolean = false) {
		if (!this.containerRef || !this.viewerRef) return;

		const { height: viewerHeight, width: viewerWidth } =
			this.viewerRef.getBoundingClientRect();
		const { height: containerHeight, width: containerWidth } =
			this.containerRef.getBoundingClientRect();

		const initialContainerHeight = containerHeight / this.scale;
		const initialContainerWidth = containerWidth / this.scale;

		// calculate scale that needed to be set to fit container in the window
		const scaleY = viewerHeight / initialContainerHeight;
		const scaleX = viewerWidth / initialContainerWidth;

		let newScale: number;

		if (this.lockToBoundaries) {
			newScale = [scaleX, scaleY].reduce((prev, curr) =>
				Math.abs(curr - 1) > Math.abs(prev - 1) ? curr : prev,
			);
		} else {
			// if not locked this should do the trick
			newScale = (scaleY + scaleX) / 2;
		}

		if (!forceScale) {
			newScale = clamp(this.minScale, newScale, this.maxScale);
		}

		this.scale = newScale;
		this.position = { x: 0, y: 0 };
	}

	/**
	 * Fit viewer to specified selection
	 * @param x X position of top left corner
	 * @param y Y position of top left corner
	 * @param selectionWidth
	 * @param selectionHeight
	 */
	fitSelection(
		x: number,
		y: number,
		selectionWidth: number,
		selectionHeight: number,
	) {
		if (!this.containerRef || !this.viewerRef) return;

		const viewerRect = this.viewerRef.getBoundingClientRect();

		const scaleX = viewerRect.width / selectionWidth;
		const scaleY = viewerRect.height / selectionHeight;

		const newScale = Math.min(scaleX, scaleY);

		this.position = { x: -x * newScale, y: -y * newScale };
		this.scale = newScale;
	}

	/**
	 * Places viewer to the center of the container
	 */
	center() {
		if (!this.containerRef || !this.viewerRef) return;

		const containerRect = this.containerRef.getBoundingClientRect();
		const viewerRect = this.viewerRef.getBoundingClientRect();

		this.position = {
			x: -(containerRect.width - viewerRect.width) / 2,
			y: -(containerRect.height - viewerRect.height) / 2,
		};
	}
}
