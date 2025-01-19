import type { SvelteEvent, Position } from "$lib/types.js";

/**
 * Returns position of a mouse relative to SVG element
 * @param event A mouse event
 * @param element A SVG element
 */
export function getMousePosition(
	event: SvelteEvent<MouseEvent, SVGElement>,
	element: SVGElement,
): Position {
	const rect = element.getBoundingClientRect();

	return {
		x: event.clientX - rect.x,
		y: event.clientY - rect.y,
	};
}

/**
 * Returns position of a touch relative to SVG element
 * @param event A touch event
 * @param element A SVG element
 */
export function getTouchPosition(
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
export function getPinchCenter(
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
export function getPinchDistance(
	touch1Pos: Position,
	touch2Pos: Position,
): number {
	return Math.sqrt(
		Math.pow(touch2Pos.x - touch1Pos.x, 2) +
			Math.pow(touch2Pos.y - touch1Pos.y, 2),
	);
}

/**
 * Checks if current touch event has more than one touch
 * @param event A touch event
 */
export function isPinchGesture(
	event: SvelteEvent<TouchEvent, SVGElement>,
): boolean {
	return event.touches.length > 1;
}

/**
 * Returns clamped value between min and max values
 */
export function clamp(min: number, value: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}
