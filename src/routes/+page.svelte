<script lang="ts">
	import { untrack } from "svelte";
	import { fade, fly } from "svelte/transition";
	import { Maximize2, SquareDashedMousePointer, Lock, LockOpen, ZoomOut } from "lucide-svelte";
	import { SVGViewer, type SVGViewerMethods } from "$lib/index.js";
	import { GithubMark, CopyButton, ThemeToggleButton } from "$components/index.js";
	import { dev } from "$app/environment";

	let containerRect: DOMRect | undefined = $state();
	let viewerRect: DOMRect | undefined = $state();
	let methods: SVGViewerMethods | undefined = $state();
	let heroEl: HTMLDivElement | undefined = $state();
	let mounted = $state(false);
	let isFirstTimeLoad = $state(false);

	let position = $state({ x: 0, y: 0 });
	let lockToBoundaries = $state(true);
	let scale = $state(1);

	let outOfBounds = $derived.by(() => {
		if (!viewerRect || !containerRect) return false;

		return position.x > 1 || position.x < -(containerRect.width) * scale || 
		(position.x - viewerRect.width) < -(containerRect.width * scale) - 1 ||
		position.y > 1 || position.y < -(containerRect.height * scale) ||
		(position.y - viewerRect.height) < -(containerRect.height * scale) - 1;
	});

	$effect(() => untrack(() =>{
		mounted = true;

		if (isFirstTimeLoad = !sessionStorage.getItem("firstTimeLoad")) {
			sessionStorage.setItem("firstTimeLoad", "done");
			heroEl?.classList.add("hero-animated");
		}
	}));
</script>

<SVGViewer
	width="100vw"
	height="100vh"
	maxScale={5}
	{lockToBoundaries}
	bind:scale
	bind:position
	svgClass="fill-transparent"
	pinchBehavior="zoomDrag"
	afterMount={(methods) => methods.center()}
	bind:containerRect
	bind:viewerRect
	bind:methods
>
	<foreignObject width="140vw" height="140vh">
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
						transition hover:bg-accent active:translate-y-0.5 sm:shrink disabled:active:translate-y-0 disabled:text-muted-foreground"
					text="npm install svelte-svg-viewer"
				/>
				<a
					href="https://github.com/autriz/svelte-svg-viewer"
					target="_blank"
					class="flex gap-2 mt-5 rounded-md bg-primary px-4 py-3 text-md text-primary-foreground transition hover:bg-primary/90 active:translate-y-0.5"
				>
					<GithubMark
						class="h-6 w-6 fill-[#24292f] dark:fill-[#fff]"
					/>
					<p>
						GitHub
					</p>
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
			<footer class="z-10 flex flex-row gap-4">
				<ThemeToggleButton />
			</footer>
		</div>
	</foreignObject>
</SVGViewer>

{#if outOfBounds}
	<button 
		transition:fly={{duration: 250, y: -10}} 
		class="absolute bottom-10 right-0 left-0 w-fit mx-auto rounded-xl
			border border-border mb-4 py-1 px-2 text-foreground transition 
			bg-accent hover:border-foreground/20"
		onclick={() => methods?.center()}
	>
		<p>Go back</p>
	</button>
{/if}

<div class="absolute bottom-0 right-0 flex w-fit flex-col gap-2 p-3 z-10">
	<button
		class="tooltip-root rounded-md border border-border flex flex-row justify-between p-3 text-foreground transition hover:bg-accent hover:border-foreground/20"
		onclick={() => methods?.fitToViewer()}
	>
		<Maximize2 />
		<span tabindex="-1" role="tooltip" class="tooltip left bg-primary-foreground text-foreground">
			.fitToViewer()
		</span>
	</button>
	<button
		class="tooltip-root rounded-md border border-border flex flex-row justify-between p-3 text-foreground transition hover:bg-accent hover:border-foreground/20"
		onclick={() => lockToBoundaries = !lockToBoundaries}
	>
		{#if lockToBoundaries}
			<Lock />
		{:else}
			<LockOpen />
		{/if}
		<span tabindex="-1" role="tooltip" class="tooltip left bg-primary-foreground text-foreground">
			{lockToBoundaries ? "Unlock" : "Lock"} boundaries
		</span>
	</button>
	{#if dev}
		<button
			class="tooltip-root rounded-md border border-border flex flex-row justify-between p-3 text-foreground transition hover:bg-accent hover:border-foreground/20"
			onclick={() => methods?.fitSelection(40, 40, 200, 200)}
		>
			<SquareDashedMousePointer />
			<span tabindex="-1" role="tooltip" class="tooltip left bg-primary-foreground text-foreground">
				.fitToSelection(40, 40, 200, 200)
			</span>
		</button>
		<button
			class="tooltip-root rounded-md border border-border flex flex-row justify-between p-3 text-foreground transition hover:bg-accent hover:border-foreground/20"
			onclick={() => scale = .6}
		>
			<ZoomOut />
			<span tabindex="-1" role="tooltip" class="tooltip left bg-primary-foreground text-foreground">
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
			linear-gradient(-90deg, #6d6d6d25 1px, transparent 0),
			linear-gradient(#6d6d6d25 1px, transparent 0),
			linear-gradient(
				transparent 6px,
				transparent 0,
				transparent 156px,
				transparent 0
			),
			linear-gradient(-90deg, #6d6d6d25 1px, transparent 0),
			linear-gradient(
				-90deg,
				transparent 6px,
				transparent 0,
				transparent 156px,
				transparent 0
			),
			linear-gradient(#6d6d6d25 1px, transparent 0),
			0 0;
		background-size:
			32px 32px,
			32px 32px,
			256px 256px,
			256px 256px,
			256px 256px,
			256px 256px,
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
