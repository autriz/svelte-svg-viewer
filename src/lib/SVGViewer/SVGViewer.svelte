<script lang="ts">
	import { onMount } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { writable } from "svelte/store";
	import type { SVGViewerMethods } from "$lib/internal/types.js";
	import { overridable } from "$lib/internal/index.js";
	import { setCtx } from "./ctx.js";
	import type { Props } from "./types.js";

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
		afterMount?: (methods: SVGViewerMethods) => void;
	};

	let className: $$Props["class"] = "";
	let svgClassName: $$Props["svgClass"] = "";
	export let style: $$Props["style"] = "";
	export let height: $$Props["height"] = 500;
	export let width: $$Props["width"] = 500;
	export let defaultPosition: $$Props["defaultPosition"] = { x: 0, y: 0 };
	export let position: $$Props["position"] = undefined;
	export let maxScale: $$Props["maxScale"] = undefined;
	export let minScale: $$Props["minScale"] = undefined;
	export let defaultIgnoreScale: $$Props["defaultIgnoreScale"] = false;
	export let ignoreScale: $$Props["ignoreScale"] = undefined;
	export let defaultScale: $$Props["defaultScale"] = 1;
	export let scale: $$Props["scale"] = undefined;
	export let scaleMouseSensitivity: $$Props["scaleMouseSensitivity"] =
		undefined;
	export let scaleTouchpadSensitivity: $$Props["scaleTouchpadSensitivity"] =
		undefined;
	export let defaultLockToBoundaries: $$Props["defaultLockToBoundaries"] = false;
	export let lockToBoundaries: $$Props["lockToBoundaries"] = undefined;
	export let defaultActionKey: $$Props["defaultActionKey"] = undefined;
	export let actionKey: $$Props["actionKey"] = undefined;
	/** TODO */
	export let pinchBehavior: $$Props["pinchBehavior"] = undefined;
	export let afterMount: $$Props["afterMount"] = undefined;
	// export let bracketWidth: number;
	// export let bracketHeight: number;
	export { className as class };
	export { svgClassName as svgClass };

	let {
		states: {
			position: positionState,
			scale: scaleState,
			isMoving,
			lockToBoundaries: lockToBoundariesState,
		},
		methods: _methods,
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
		refs: { viewerRef, containerRef },
	} = setCtx({
		defaultPosition,
		position,
		maxScale,
		minScale,
		defaultIgnoreScale,
		ignoreScale,
		defaultScale,
		scale,
		scaleMouseSensitivity,
		scaleTouchpadSensitivity,
		defaultLockToBoundaries,
		lockToBoundaries,
		defaultActionKey,
		actionKey,
		pinchBehavior,
	});

	export const methods = _methods;

	const viewerSize = overridable(
		writable({ height: 0, width: 0 })
	);

	const initialViewerSize = writable({ height: 0, width: 0 });

	let resizeObserver: ResizeObserver | undefined = undefined;

	/** Converts value to '{value}px' if value is an integer, leaves as it is otherwise */
	const formatValue = (value: string | number | undefined) => Number.isInteger(value) ? `${value}px` : value;

	onMount(() => {
		resizeObserver = resizeObserver && new ResizeObserver((entries) => {
			const findEntry = (id: string): ResizeObserverEntry | undefined => entries.find((entry) => entry.target.id === id);

			let containerEntry: ResizeObserverEntry | undefined = findEntry($containerRef?.id!);
			let viewerEntry: ResizeObserverEntry | undefined = findEntry($viewerRef?.id!);

			if (containerEntry && $lockToBoundariesState) {
				const viewerRect = viewerEntry ? viewerEntry.contentRect : $viewerRef?.getBoundingClientRect()!;
				const containerRect = containerEntry.contentRect;

				const newX = Math.min(
					0,
					Math.min(
						-(containerRect.width - viewerRect.width),
						$positionState.x,
					),
				);
				const newY = Math.min(
					0,
					Math.min(
						-(containerRect.height - viewerRect.height),
						$positionState.y,
					),
				);
	
				methods.panTo(newX, newY);
	
				$viewerSize = {
					height: viewerRect.height,
					width: viewerRect.width,
				};
			}

			if (containerEntry && viewerEntry) {
				const viewerRect = viewerEntry.contentRect;
				const containerRect = containerEntry.contentRect;
	
				const scaledContainerSize = {
					width: containerRect.width * (1 / $scaleState),
					height: containerRect.height * (1 / $scaleState),
				};
	
				// FIXME: invalid resizing
	
				// if (viewerRect.width > scaledContainerSize.width)
				//     width = scaledContainerSize.width;
				// else if (viewerRect.width < initialWidth)
				//     width = initialWidth > scaledContainerSize.width ? scaledContainerSize.width : initialWidth;
				// if (viewerRect.height > scaledContainerSize.height)
				//     height = scaledContainerSize.height;
				// else if (viewerRect.height < initialHeight)
				//     height = initialHeight > scaledContainerSize.height ? scaledContainerSize.height : initialHeight;

				// TODO: maybe resizeBehavior prop?
				if ($lockToBoundariesState) {
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
				}

				if (viewerRect.width > containerRect.width)
					methods.zoomOnCenter(
						viewerRect.width / containerRect.width,
					);

				$viewerSize = {
					height: viewerRect.height,
					width: viewerRect.width,
				};
			}
		});

		// resize if container is smaller than viewer
		if ($containerRef && $viewerRef) {
			const containerRect = $containerRef.getBoundingClientRect();
			const viewerRect = $viewerRef.getBoundingClientRect();

			$viewerSize = {
				height: viewerRect.height,
				width: viewerRect.width,
			};

			$initialViewerSize = $viewerSize;

			// check if viewer is bigger than container
			// also check for a adaptive container size (always 0 at the start)
			// TODO (maybe): modes `shrink to fit`/`zoom to fit`, now it works in `shrink to fit` mode only
			if ($lockToBoundariesState) {
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
			}

			resizeObserver?.observe($containerRef);
			resizeObserver?.observe($viewerRef);

			if (afterMount) afterMount(methods);
		} else {
			throw new Error(`Missing reference to container or/and viewer`);
		};

		return () => {
			resizeObserver?.disconnect();
		};
	});
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
		class={svgClassName}
		{width}
		{height}
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
			bind:this={$containerRef}
			transform="translate({$positionState.x} {$positionState.y}), scale({$scaleState})"
			style={$isMoving ? "pointer-events: none;" : ""}
		>
			<slot />
		</g>
	</svg>
</div>
