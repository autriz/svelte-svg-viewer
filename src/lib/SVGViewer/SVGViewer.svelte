<script lang="ts">
	import { onMount } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { writable } from "svelte/store";
	import type { SVGViewerMethods } from "$lib/internal/types.js";
	import type { Props } from "./types.js";
	import { clamp } from "$lib/internal/index.js";
	import { createViewer } from "$lib/internal/SVGViewer.js";

	type TypedUnit =
		`${number}${"em" | "rem" | "pt" | "%" | "px" | "vw" | "vh" | "lvw" | "lvh" | "dvw" | "dvh"}`;

	type $$Props = Props & {
		/** 
		 * Height of the viewer 
		 * 
		 * @default 500
		 */
		height?: number | string | TypedUnit;
		/** 
		 * Width of the viewer 
		 * 
		 * @default 500
		 */
		width?: number | string | TypedUnit;
		class?: HTMLAttributes<HTMLDivElement>["class"];
		svgClass?: HTMLAttributes<SVGElement>["class"];
		style?: HTMLAttributes<HTMLDivElement>["style"];
		methods?: SVGViewerMethods;
		containerRect?: DOMRect;
		viewerRect?: DOMRect;
		/**
		 * Resizing behavior in situations when height/width of viewer is bigger than container
		 * 
		 * @default "shrink"
		 */
		resizeBehavior?: "zoom" | "shrink";
		afterMount?: (methods: SVGViewerMethods) => void;
	};

	let className: $$Props["class"] = "";
	let svgClassName: $$Props["svgClass"] = "";
	export let style: $$Props["style"] = "";
	export let height: $$Props["height"] = 500;
	export let width: $$Props["width"] = 500;
	export let afterMount: $$Props["afterMount"] = undefined;
	export let containerRect: $$Props["containerRect"] = undefined;
	export let viewerRect: $$Props["viewerRect"] = undefined;
	export let resizeBehavior: $$Props["resizeBehavior"] = "shrink";
	export { className as class };
	export { svgClassName as svgClass };

	const viewerRef = writable<SVGSVGElement>();
	const containerRef = writable<SVGGElement>();

	let {
		states: {
			position,
			scale,
			isMoving,
			lockToBoundaries,
		},
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
		containerRef
	});

	export { methods };

	let resizeObserver: ResizeObserver;

	/** Converts value to '{value}px' if value is an integer, leaves as is otherwise */
	const formatValue = (value: string | number | undefined) => Number.isInteger(value) ? `${value}px` : value;

	onMount(() => {
		resizeObserver = resizeObserver ?? new ResizeObserver((entries) => {
			const findEntry = (id: string): ResizeObserverEntry | undefined => entries.find((entry) => entry.target.id === id);

			let containerEntry: ResizeObserverEntry | undefined = findEntry($containerRef?.id!);
			let viewerEntry: ResizeObserverEntry | undefined = findEntry($viewerRef?.id!);

			if (containerEntry && $lockToBoundaries) {
				const viewerRect = viewerEntry ? viewerEntry.contentRect : $viewerRef?.getBoundingClientRect()!;
				const containerRect = containerEntry.contentRect;

				const newX = clamp(
					-(containerRect.width - viewerRect.width), 
					$position.x, 
					0
				);
				const newY = clamp(
					-(containerRect.height - viewerRect.height), 
					$position.y, 
					0
				);

				methods.panTo(newX, newY);
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
		});

		// resize if container is smaller than viewer
		if ($containerRef && $viewerRef) {
			const containerRect = $containerRef.getBoundingClientRect();
			const viewerRect = $viewerRef.getBoundingClientRect();
			
			checkRects(viewerRect, containerRect);

			resizeObserver.observe($containerRef);
			resizeObserver.observe($viewerRef);

			if (afterMount) afterMount(methods);
		} else {
			throw new Error(`Missing reference to container or/and viewer`);
		};

		return () => {
			resizeObserver.disconnect();
		};
	});

	// check if viewer is bigger than container
	// also check for an adaptive container size (always 0 at the start)
	function checkRects(viewerRect: DOMRect, containerRect: DOMRect) {
		if ($lockToBoundaries) {
			if (resizeBehavior === "shrink") {
				if (
					viewerRect.width > containerRect.width &&
					containerRect.width !== 0
				)
					width = containerRect.width;

				if (
					viewerRect.height > containerRect.height &&
					containerRect.height !== 0
				)
					height = containerRect.height;
			} else {
				if (
					(viewerRect.width > containerRect.width &&
					containerRect.width !== 0) || 
					(viewerRect.height > containerRect.height &&
					containerRect.height !== 0)
				)
					methods.fitToViewer();
			}
		}
	}
</script>

<svelte:window on:keydown={onKeyDown} on:keyup={onKeyUp} />

<div
	class={className}
	style="{style} width: {formatValue(width)}; height: {formatValue(height)};"
>
	<!-- 
        preventDefault on mousedown disables :active pseudo-class
        on Firefox desktop from running, from what I can tell

        on Firefox mobile :active is active until user presses
        somewhere else

        Don't think I can find workaround for that issue
    -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<svg
		id="svg-viewer"
		class={svgClassName}
		{width}
		{height}
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
			style="transform: translate3d({$position.x}px, {$position.y}px, 0px) scale3d({$scale}, {$scale}, {$scale}); {$isMoving ? "pointer-events: none;" : ""}"
		>
			<slot />
		</g>
	</svg>
</div>
