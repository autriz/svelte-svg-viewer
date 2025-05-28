<script lang="ts">
	import "./styles.css";
	import { ModeWatcher } from "mode-watcher";
</script>

<svelte:head>
	<title>Svelte Viewer</title>
</svelte:head>

<ModeWatcher
	modeStorageKey={"color-theme"}
	lightClassNames={["light"]}
	darkClassNames={["dark"]}
/>

<div
	class="h-fit min-h-screen w-screen overflow-auto bg-background text-foreground"
>
	<slot />
</div>
