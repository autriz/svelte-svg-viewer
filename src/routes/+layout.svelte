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

<div class="h-fit min-h-screen w-screen bg-background text-foreground overflow-auto">
	<slot />
</div>

