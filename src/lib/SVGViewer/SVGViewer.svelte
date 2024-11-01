<script lang="ts">
	import { onMount } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { writable } from "svelte/store";
	import type { SvelteEvent, SVGViewerMethods } from "$lib/internal/types.js";
	import { overridable } from "$lib/internal/index.js";
	import { setCtx } from "./ctx.js";
	import type { Props } from "./types.js";

	type TypedUnit =
		`${number}${"em" | "rem" | "pt" | "%" | "px" | "vw" | "vh" | "lvw" | "lvh" | "dvw" | "dvh"}`;

	let {
		class: className = "",
		svgClass: svgClassName = "",
		style = "",
		height = $bindable(500),
		width = $bindable(500),
		defaultPosition = { x: 0, y: 0 },
		position = undefined,
		maxScale = undefined,
		minScale = undefined,
		defaultIgnoreScale = false,
		ignoreScale = undefined,
		defaultScale = 1,
		scale = undefined,
		scaleMouseSensitivity = undefined,
		scaleTouchpadSensitivity = undefined,
		defaultLockToBoundaries = false,
		lockToBoundaries = undefined,
		defaultActionKey = undefined,
		actionKey = undefined,
		pinchBehavior = undefined,
		defaultPinchBehavior = undefined,
		afterMount = undefined,
		methods = $bindable(),
		children,
	}: Props & {
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
		afterMount?: (methods: SVGViewerMethods) => void;
		methods?: SVGViewerMethods;
		children?: import("svelte").Snippet;
	} = $props();

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
		defaultPinchBehavior,
		pinchBehavior,
	});

	methods = _methods;

	const viewerSize = overridable(writable({ height: 0, width: 0 }));

	const initialViewerSize = writable({ height: 0, width: 0 });

	let resizeObserver: ResizeObserver | undefined = undefined;

	/** Converts value to '{value}px' if value is an integer, leaves as it is otherwise */
	const formatValue = (value: string | number | undefined) =>
		Number.isInteger(value) ? `${value}px` : value;

	function preventDefault<T extends Event, U extends EventTarget>(
		fn: (ev: SvelteEvent<T, U>) => void,
	) {
		return function (this: ThisType<T>, event: SvelteEvent<T, U>) {
			event.preventDefault();

			fn.call(this, event);
		};
	}

	onMount(() => {
		resizeObserver =
			resizeObserver &&
			new ResizeObserver((entries) => {
				const findEntry = (
					id: string,
				): ResizeObserverEntry | undefined =>
					entries.find((entry) => entry.target.id === id);

				let containerEntry: ResizeObserverEntry | undefined = findEntry(
					$containerRef?.id!,
				);
				let viewerEntry: ResizeObserverEntry | undefined = findEntry(
					$viewerRef?.id!,
				);

				if (containerEntry && $lockToBoundariesState) {
					const viewerRect = viewerEntry
						? viewerEntry.contentRect
						: $viewerRef?.getBoundingClientRect()!;
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
		}

		// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#using_passive_listeners
		$viewerRef.addEventListener("touchstart", onTouchStart as any, {
			passive: false,
		});
		$viewerRef.addEventListener("touchmove", onTouchMove as any, {
			passive: false,
		});

		return () => {
			resizeObserver?.disconnect();
		};
	});
</script>

<svelte:window onkeydown={onKeyDown} onkeyup={onKeyUp} />

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
		bind:this={$viewerRef}
		onmousedown={onMouseDown}
		onmousemove={onMouseMove}
		onmouseup={onMouseUp}
		onmouseleave={preventDefault(onMouseUp)}
		onwheel={preventDefault(onWheel)}
		ontouchend={onTouchEnd}
		ontouchcancel={preventDefault(onTouchEnd)}
	>
		<rect x={0} y={0} {width} {height} style="pointer-events: none;" />
		<g
			bind:this={$containerRef}
			transform="translate({$positionState.x} {$positionState.y}), scale({$scaleState})"
			style={$isMoving ? "pointer-events: none;" : ""}
		>
			{@render children?.()}
		</g>
	</svg>
</div>
