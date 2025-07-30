import type { SvelteEvent, Position } from "../types.js";

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
	const dx = touch2Pos.x - touch1Pos.x;
	const dy = touch2Pos.y - touch1Pos.y;

	return Math.sqrt(dx * dx + dy * dy);
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

export function posSubtract(a: Position, b: Position): Position {
	return { x: a.x - b.x, y: a.y - b.y };
}

/**
 * Returns position of two touches (a pinch)
 * @param event A touch event
 * @param element A SVG element
 */
export function getPinchPosition(event: SvelteEvent<TouchEvent, SVGElement>) {
	const [touch1, touch2] = [event.touches[0], event.touches[1]];
	const touch1Pos = { x: touch1.clientX, y: touch1.clientY };
	const touch2Pos = { x: touch2.clientX, y: touch2.clientY };

	return {
		touch1Pos,
		touch2Pos,
	};
}
