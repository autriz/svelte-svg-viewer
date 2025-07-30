<script lang="ts">
	import { getContext, onMount, setContext } from "svelte";
	import type { HTMLAttributes, SVGAttributes } from "svelte/elements";
	import { writable } from "svelte/store";
	import type { SVGViewerMethods } from "$lib/internal/types.js";
	import type { Props } from "./types.js";
	import { clamp, parseUnit } from "$lib/internal/index.js";
	import { createViewer } from "$lib/internal/SVGViewer.js";

	type $$Props = Props & {
		/**
		 * Height of the viewer.
		 *
		 * @default 500
		 */
		height?: SVGAttributes<SVGElement>["height"] & {};
		/**
		 * Width of the viewer.
		 *
		 * @default 500
		 */
		width?: SVGAttributes<SVGElement>["width"] & {};
		class?: HTMLAttributes<HTMLDivElement>["class"];
		style?: HTMLAttributes<HTMLDivElement>["style"];
		readonly methods?: SVGViewerMethods;
		/**
		 * Read-only size and position of a container rectangle.
		 */
		readonly containerRect?: DOMRect;
		/**
		 * Read-only size and position of a viewer rectangle.
		 */
		readonly viewerRect?: DOMRect;
		/**
		 * Resizing behavior in situations when height/width
		 * of viewer is bigger than container.
		 *
		 * When set to "shrink" and sizes are set to pixel units,
		 * viewer will try to return to initial sizes if container size changes.
		 *
		 * @default "shrink"
		 */
		resizeBehavior?: "zoom" | "shrink";
		afterMount?: (methods: SVGViewerMethods) => void;
	};

	let className: $$Props["class"] = undefined;
	export let style: $$Props["style"] = undefined;
	export let height: $$Props["height"] = 500;
	export let width: $$Props["width"] = 500;
	export let afterMount: $$Props["afterMount"] = undefined;
	export let containerRect: $$Props["containerRect"] = undefined;
	export let viewerRect: $$Props["viewerRect"] = undefined;
	export let resizeBehavior: $$Props["resizeBehavior"] = "shrink";
	export { className as class };

	const viewerRef = writable<SVGSVGElement>();
	const containerRef = writable<SVGGElement>();

	let {
		states: { position, scale, isMoving, lockToBoundaries, disabled },
		methods,
		listeners: {
			onMouseDown,
			onMouseMove,
			onMouseUp,
			onTouchStart,
			onTouchMove,
			onTouchEnd,
			onWheel,
			onKeyDown,
			onKeyUp,
		},
	} = createViewer({
		...$$restProps,
		viewerRef,
		containerRef,
	});

	export { methods };

	// These initial variables serve as returning point if
	// resize behavior is set to shrink and container is getting smaller than viewer
	// at some point and then returns to the inital size
	// Note that it works only when height/width was set as a number or as a pixel unit
	const initialHeight = parseUnit(height);
	const initialWidth = parseUnit(width);

	let resizeObserver: ResizeObserver | undefined;

	onMount(() => {
		resizeObserver =
			resizeObserver ??
			new ResizeObserver((entries) => {
				let containerEntry: ResizeObserverEntry | undefined;
				let viewerEntry: ResizeObserverEntry | undefined;

				for (const entry of entries) {
					if (entry.target.id === $containerRef?.id) {
						containerEntry = entry;
					} else if (entry.target.id === $viewerRef?.id) {
						viewerEntry = entry;
					}
					if (containerEntry && viewerEntry) break;
				}

				if (containerEntry || viewerEntry) {
					const viewerRect = viewerEntry
						? viewerEntry.contentRect
						: $viewerRef.getBoundingClientRect();
					const containerRect = containerEntry
						? containerEntry.contentRect
						: $containerRef.getBoundingClientRect();

					checkRects(viewerRect, containerRect);
				}

				if (containerEntry && $lockToBoundaries) {
					const viewerRect = viewerEntry
						? viewerEntry.contentRect
						: $viewerRef?.getBoundingClientRect()!;
					const containerRect = containerEntry.contentRect;

					// Check viewerRect against height and width,
					// if not equal or sizes are relative - skip panning.
					if (
						!(
							typeof height === "string" ||
							typeof width === "string"
						) &&
						(viewerRect.height !== height ||
							viewerRect.width !== width)
					) {
						// If position is in the negatives - fix it.
						if ($position.x < 0 || $position.y < 0) {
							$position = {
								x: Math.max($position.x, 0),
								y: Math.max($position.y, 0),
							};
						}

						return;
					}

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

					methods.panTo(newX, newY);
				}
			});

		// resize if container is smaller than viewer
		if ($containerRef && $viewerRef) {
			const containerRect = $containerRef.getBoundingClientRect();
			const viewerRect = $viewerRef.getBoundingClientRect();

			checkRects(viewerRect, containerRect);

			resizeObserver?.observe($containerRef);
			resizeObserver?.observe($viewerRef);

			if (afterMount) afterMount(methods);
		} else {
			console.error(
				"SVGViewer: Missing reference to container or/and viewer",
			);
			return;
		}

		return () => {
			resizeObserver?.disconnect();
		};
	});

	/**
	 * Checks viewer and container rectangles and adjusts
	 * width and height of the viewer rect if locked to boundaries.
	 */
	function checkRects(viewerRect: DOMRect, containerRect: DOMRect) {
		if (!$lockToBoundaries) return;

		if (resizeBehavior === "shrink") {
			if (
				viewerRect.width > containerRect.width &&
				containerRect.width !== 0
			) {
				width = containerRect.width;
			} else if (viewerRect.width < containerRect.width) {
				width = initialWidth;
			}

			if (
				viewerRect.height > containerRect.height &&
				containerRect.height !== 0
			) {
				height = containerRect.height;
			} else if (viewerRect.height < containerRect.height) {
				height = initialHeight;
			}
		} else {
			const needsZoom =
				(viewerRect.width > containerRect.width &&
					containerRect.width !== 0) ||
				(viewerRect.height > containerRect.height &&
					containerRect.height !== 0);

			if (needsZoom) {
				methods.fitToViewer();
			}
		}
	}
</script>

<svelte:window on:keydown={onKeyDown} on:keyup={onKeyUp} />

<!-- 
	preventDefault on mousedown disables :active pseudo-class
	on Firefox desktop from running, from what I can tell

	on Firefox mobile :active is active until user presses
	somewhere else

	Don't think I can find workaround for that issue
-->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<svg
	id="svg-viewer"
	class={className}
	{style}
	{width}
	{height}
	aria-disabled={$disabled}
	bind:contentRect={viewerRect}
	bind:this={$viewerRef}
	on:mousedown={onMouseDown}
	on:mousemove={onMouseMove}
	on:mouseup={onMouseUp}
	on:mouseleave|preventDefault={onMouseUp}
	on:wheel|preventDefault={onWheel}
	on:touchstart={onTouchStart}
	on:touchmove={onTouchMove}
	on:touchend={onTouchEnd}
	on:touchcancel|preventDefault={onTouchEnd}
>
	<rect x={0} y={0} {width} {height} style="pointer-events: none;" />
	<g
		id="svg-container"
		bind:this={$containerRef}
		bind:contentRect={containerRect}
		data-moving={$isMoving ? "" : undefined}
		style="transform: translate3d({$position.x}px, {$position.y}px, 0px) scale3d({$scale}, {$scale}, {$scale});"
	>
		<slot />
	</g>
</svg>

<style>
	[data-moving] {
		pointer-events: none;
	}
</style>
