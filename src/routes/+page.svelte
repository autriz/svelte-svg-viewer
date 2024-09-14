<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import { onMount } from "svelte";
	import { SVGViewer } from "$lib/index.js";
	import type { SVGViewerMethods } from "$lib/internal/types.js";
	import GithubMark from "$components/GithubMark.svelte";
	import CopyButton from "$components/CopyButton.svelte";
	import { browser, dev } from "$app/environment";
	import { Moon, Sun } from "lucide-svelte";
	import { setMode, mode } from "mode-watcher";

	let methods: SVGViewerMethods;
	let heroEl: HTMLDivElement;

	let mounted = false;

	let isFirstTimeLoad = false;

	if (browser) {
		const firstTimeLoad = sessionStorage.getItem("firstTimeLoad");

		isFirstTimeLoad = !firstTimeLoad ? true : false;

		if (isFirstTimeLoad) {
			sessionStorage.setItem("firstTimeLoad", "done");
		}
	}

	onMount(() => {
		mounted = true;
		
		if (isFirstTimeLoad) heroEl.classList.add("hero-animated");
	});
</script>

<SVGViewer
	width="100vw"
	height="100vh"
	maxScale={5}
	defaultLockToBoundaries={true}
	svgClass="fill-transparent"
	afterMount={(methods) => methods.center()}
	bind:methods
>
	<foreignObject width="140vw" height="140vh">
		<div class="h-full w-full">
			<div
				id="hero"
				class="flex h-full w-full flex-col items-center justify-center"
				bind:this={heroEl}
			>
				<div class="grow" />
				<div class="flex flex-col items-center justify-center">
					<h1 class="text-5xl">Svelte SVG Viewer</h1>
					<p class="mt-2 text-lg text-secondary-foreground/80">
						Element viewer for Svelte
					</p>
					<CopyButton
						class="text-md group mt-8 flex items-center justify-between gap-4 break-keep rounded-md border
							border-border bg-background px-4 py-3 text-left font-mono text-sm text-foreground
							transition hover:bg-accent active:translate-y-0.5 sm:shrink disabled:active:translate-y-0 disabled:text-muted-foreground"
						text="npm install svelte-svg-viewer"
					/>
					<a
						href="https://github.com/autriz/svelte-svg-viewer"
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
					<button
						class="z-10 mb-5"
						on:click={() => { $mode === "dark" ? setMode("light") : setMode("dark") }}
					>
						{#if $mode === "dark"}
							<div
								in:fly={{duration: 250, delay: 250, y: -5}}
							>
								<Moon 
									class="h-7 w-7 fill-[#24292f] dark:fill-[#fff]"
								/>
							</div>
						{:else}
							<div
								in:fly={{duration: 250, delay: 250, y: -5}}
							>
								<Sun
									class="h-7 w-7 fill-[#24292f] dark:fill-[#fff]"
								/>
							</div>
						{/if}
				</button>
				</footer>
			</div>
		</div>
	</foreignObject>
</SVGViewer>

{#if dev}
	<div class="absolute bottom-0 right-0 flex w-fit flex-col gap-2 p-3 z-10">
		<button
			class="rounded-md border border-border p-3 text-foreground transition hover:bg-accent"
			on:click={() => methods.fitToViewer()}
		>
			.fitToViewer()
		</button>
		<button
			class="rounded-md border border-border p-3 text-foreground transition hover:bg-accent"
			on:click={() => methods.fitSelection(40, 40, 200, 200)}
		>
			.fitToSelection(40, 40, 200, 200)
		</button>
	</div>
{/if}

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
</style>
