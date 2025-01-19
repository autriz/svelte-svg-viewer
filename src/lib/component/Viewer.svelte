<script lang="ts">
    import { untrack } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { Props, SVGViewerMethods } from "./types.js";
    import SVGViewer from "$lib/builder/Viewer.svelte.js";
	import { clamp, getters } from "$lib/utils/index.js";
	import type { ComponentProps } from "$lib/types.js";

	type TypedUnit =
		`${number}${"em" | "rem" | "pt" | "%" | "px" | "vw" | "vh" | "lvw" | "lvh" | "dvw" | "dvh"}`;

	let {
		class: className = "",
		svgClass: svgClassName = "",
		style = "",
		height = $bindable(500),
		width = $bindable(500),
		afterMount = undefined,
		methods = $bindable(),
		resizeBehavior = "shrink",
		containerRect = $bindable(),
		viewerRect = $bindable(),
		position = $bindable(),
		scale = $bindable(),
		children,
		...props
	}: ComponentProps<Props> & {
		class?: HTMLAttributes<HTMLDivElement>["class"];
		svgClass?: HTMLAttributes<SVGElement>["class"];
		style?: HTMLAttributes<HTMLDivElement>["style"];
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
		/**
		 * Resizing behavior in situations when height/width of viewer is bigger than container
		 * 
		 * @default "shrink"
		 */
		resizeBehavior?: "zoom" | "shrink";
		afterMount?: (methods: SVGViewerMethods) => void;
		readonly methods?: SVGViewerMethods;
		/**
		 * Read-only size and position of a container rectangle
		 */
		readonly containerRect?: DOMRect;
		/**
		 * Read-only size and position of a viewer rectangle
		 */
		readonly viewerRect?: DOMRect;
		children?: import("svelte").Snippet;
	} = $props();

	let viewerRef = $state<SVGSVGElement>();
	let containerRef = $state<SVGGElement>();

	let viewer = new SVGViewer({
		position: () => position,
		onPositionChange: (v) => { position = v; },
		scale: () => scale,
		onScaleChange: (v) => { scale = v; },
		viewerRef: () => viewerRef, 
		containerRef: () => containerRef,
		...getters(props)
	});

	methods = {
		panTo: (x: number, y: number) => viewer.panTo(x, y),
		pan: (x: number, y: number) => viewer.pan(x, y),
		zoom: (x: number, y: number, newScale: number) => viewer.zoom(x, y, newScale),
		zoomOnCenter: (newScale: number) => viewer.zoomOnCenter(newScale),
		fitSelection: (x: number, y: number, selectionWidth: number, selectionHeight: number) => viewer.fitSelection(x, y, selectionWidth, selectionHeight),
		fitToViewer: (forceScale?: boolean) => viewer.fitToViewer(forceScale),
		center: () => viewer.center()
	};

	/** Converts value to '{value}px' if value is an integer, leaves as is otherwise */
	const formatValue = (value: string | number | undefined) =>
		Number.isInteger(value) ? `${value}px` : value;

	$effect(() => {
		containerRect;
		viewerRect;
		untrack(() => {
			if (containerRect && viewer.lockToBoundaries) {
				const vRect = viewerRect ?? viewerRef?.getBoundingClientRect()!;

				const newX = clamp(
					-(containerRect.width - vRect.width), 
					viewer.position.x, 
					0
				);
				const newY = clamp(
					-(containerRect.height - vRect.height), 
					viewer.position.y, 
					0
				);

				viewer.panTo(newX, newY);
			}

			if (viewerRect || containerRect)
				checkRects(
					viewerRect ?? viewerRef?.getBoundingClientRect()!, 
					containerRect ?? containerRef?.getBoundingClientRect()!
				);
		});
	});

	$effect(() => {
		untrack(() => {
			if (containerRef && viewerRef) {
				const containerRect = containerRef.getBoundingClientRect();
				const viewerRect = viewerRef.getBoundingClientRect();

				checkRects(viewerRect, containerRect);

				if (afterMount) afterMount(methods);
			} else {
				throw new Error(`Missing reference to container or/and viewer`);
			}
		});
	});

	// check if viewer is bigger than container
	// also check for an adaptive container size (always 0 at the start)
	function checkRects(viewerRect: DOMRect, containerRect: DOMRect) {
		if (viewer.lockToBoundaries) {
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
					methods?.fitToViewer();
			}
		}
	}
</script>

<svelte:window onkeydown={viewer.onKeyDown} onkeyup={viewer.onKeyUp} />

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
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<svg
		class={svgClassName}
		{width}
		{height}
		bind:contentRect={viewerRect}
		bind:this={viewerRef}
		{...viewer.viewer}
	>
		<rect x={0} y={0} {width} {height} style="pointer-events: none;" />
		<g
			bind:this={containerRef}
			bind:contentRect={containerRect}
			{...viewer.container}
		>
			{@render children?.()}
		</g>
	</svg>
</div>

<style>
	[data-moving=true] {
		pointer-events: none;
	}
</style>
