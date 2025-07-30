<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import { onMount } from "svelte";
	import { SVGViewer } from "$lib/index.js";
	import type { SVGViewerMethods } from "$lib/internal/types.js";
	import GithubMark from "$components/GithubMark.svelte";
	import CopyButton from "$components/CopyButton.svelte";
	import { browser, dev } from "$app/environment";
	import {
		Maximize2,
		SquareDashedMousePointer,
		Lock,
		LockOpen,
		ZoomOut,
	} from "lucide-svelte";
	import { writable } from "svelte/store";
	import ThemeToggleButton from "$components/ThemeToggleButton.svelte";

	let containerRect: DOMRect;
	let viewerRect: DOMRect;
	let methods: SVGViewerMethods;
	let heroEl: HTMLDivElement;

	let mounted = false;

	let isFirstTimeLoad = false;

	if (browser) {
		if ((isFirstTimeLoad = !sessionStorage.getItem("firstTimeLoad"))) {
			sessionStorage.setItem("firstTimeLoad", "done");
		}
	}

	let position = writable({ x: 0, y: 0 });
	let lockToBoundaries = writable(true);
	let scale = writable(1);

	$: scaledWidth = containerRect?.width * $scale;
	$: scaledHeight = containerRect?.height * $scale;

	$: outOfBounds = (() => {
		if (!containerRect || !viewerRect) return false;

		const outOfBoundsX =
			$position.x > 0 ||
			$position.x < -scaledWidth ||
			$position.x - viewerRect.width < -scaledWidth - 1;
		const outOfBoundsY =
			$position.y > 0 ||
			$position.y < -scaledHeight ||
			$position.y - viewerRect.height < -scaledHeight - 1;

		return outOfBoundsX || outOfBoundsY;
	})();

	onMount(() => {
		mounted = true;

		if (isFirstTimeLoad) heroEl.classList.add("hero-animated");
	});
</script>

<SVGViewer
	width="100lvw"
	height="100lvh"
	maxScale={1.3}
	{lockToBoundaries}
	{scale}
	{position}
	class="fill-transparent"
	pinchBehavior="zoomDrag"
	afterMount={(methods) => methods.center()}
	bind:containerRect
	bind:viewerRect
	bind:methods
>
	<foreignObject width="140lvw" height="140lvh">
		<div class="h-full w-full">
			<div
				id="hero"
				class="flex h-full w-full flex-col items-center justify-center"
				bind:this={heroEl}
			>
				<div class="grow"></div>
				<div class="flex flex-col items-center justify-center">
					<h1 class="text-5xl">Svelte SVG Viewer</h1>
					<p class="mt-2 text-lg text-secondary-foreground/80">
						Element viewer for Svelte
					</p>
					<CopyButton
						class="mt-8 flex items-center justify-between gap-4 break-keep rounded-md border
							border-border bg-background px-4 py-3 text-left font-mono text-sm text-foreground
							transition hover:bg-accent active:translate-y-0.5 disabled:text-muted-foreground disabled:active:translate-y-0 sm:shrink"
						text="npm install svelte-svg-viewer"
					/>
					<a
						href="https://github.com/autriz/svelte-svg-viewer"
						target="_blank"
						class="text-md mt-5 flex gap-2 rounded-md bg-primary px-4 py-3 text-primary-foreground transition hover:bg-primary/90 active:translate-y-0.5"
					>
						<GithubMark
							class="h-6 w-6 fill-[#24292f] dark:fill-[#fff]"
						/>
						<p>GitHub</p>
					</a>
				</div>
				<div class="flex grow flex-col items-center justify-center">
					{#if mounted}
						<p
							in:fade={{
								duration: isFirstTimeLoad ? 2000 : 0,
							}}
						>
							Try to zoom and drag around :)
						</p>
					{/if}
				</div>
				<footer class="z-10 mb-16 flex flex-row gap-4">
					<ThemeToggleButton />
				</footer>
			</div>
		</div>
	</foreignObject>
</SVGViewer>

{#if outOfBounds}
	<button
		transition:fly={{ duration: 250, y: -10 }}
		class="absolute bottom-10 left-0 right-0 mx-auto mb-4 w-fit
			rounded-xl border border-border bg-accent px-2 py-1 text-foreground
			transition hover:border-foreground/20"
		on:click={() => methods.center()}
	>
		<p>Go back</p>
	</button>
{/if}

<div class="absolute bottom-0 right-0 z-10 flex w-fit flex-col gap-2 p-3">
	<button
		class="tooltip-root flex flex-row justify-between rounded-md border border-border p-3 text-foreground transition hover:border-foreground/20 hover:bg-accent"
		on:click={() => methods.fitToViewer()}
	>
		<Maximize2 />
		<span
			tabindex="-1"
			role="tooltip"
			class="tooltip left bg-primary-foreground text-foreground"
		>
			.fitToViewer()
		</span>
	</button>
	<button
		class="tooltip-root flex flex-row justify-between rounded-md border border-border p-3 text-foreground transition hover:border-foreground/20 hover:bg-accent"
		on:click={() => ($lockToBoundaries = !$lockToBoundaries)}
	>
		{#if $lockToBoundaries}
			<Lock />
		{:else}
			<LockOpen />
		{/if}
		<span
			tabindex="-1"
			role="tooltip"
			class="tooltip left bg-primary-foreground text-foreground"
		>
			{$lockToBoundaries ? "Unlock" : "Lock"} boundaries
		</span>
	</button>
	{#if dev}
		<button
			class="tooltip-root flex flex-row justify-between rounded-md border border-border p-3 text-foreground transition hover:border-foreground/20 hover:bg-accent"
			on:click={() => methods.fitSelection(40, 40, 200, 200)}
		>
			<SquareDashedMousePointer />
			<span
				tabindex="-1"
				role="tooltip"
				class="tooltip left bg-primary-foreground text-foreground"
			>
				.fitToSelection(40, 40, 200, 200)
			</span>
		</button>
		<button
			class="tooltip-root flex flex-row justify-between rounded-md border border-border p-3 text-foreground transition hover:border-foreground/20 hover:bg-accent"
			on:click={() => ($scale = 0.6)}
		>
			<ZoomOut />
			<span
				tabindex="-1"
				role="tooltip"
				class="tooltip left bg-primary-foreground text-foreground"
			>
				Set scale to .6
			</span>
		</button>
	{/if}
</div>

<style>
	#hero {
		background:
			linear-gradient(-90deg, #6d6d6d25 1px, transparent 0),
			linear-gradient(#6d6d6d25 1px, transparent 0),
			linear-gradient(-90deg, #6d6d6d50 1px, transparent 0),
			linear-gradient(#6d6d6d50 1px, transparent 0),
			0 0;
		background-size:
			32px 32px,
			32px 32px,
			256px 256px,
			256px 256px;
	}

	#hero::after {
		content: "";
		background: linear-gradient(transparent, hsl(var(--background)));
		inset: 60% 0 0;
		position: absolute;
	}

	:global(#hero.hero-animated) {
		animation: 2s cubic-bezier(0.215, 0.61, 0.355, 1) forwards b;
	}

	@keyframes b {
		0% {
			opacity: 0;
		}

		50% {
			opacity: 1;
		}
	}

	.tooltip-root {
		position: relative;
	}

	.tooltip-root .tooltip {
		width: fit-content;
		position: absolute;
		transition: opacity 150ms 75ms;
		text-align: center;
		padding: 6px 6px;
		border-radius: 6px;

		right: 110%;
		bottom: 6px;

		opacity: 0;
		visibility: hidden;
	}

	.tooltip-root:hover .tooltip {
		opacity: 1;
		visibility: visible;
	}
</style>
