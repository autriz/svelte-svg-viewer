<script lang="ts">
	import { AlertCircle, Check, Copy } from "lucide-svelte";
	import { fly } from "svelte/transition";

	interface Props {
		text: string;
		class?: HTMLButtonElement["className"];
	}

	let { text, class: className = "" }: Props = $props();

	

	enum CopyStatus {
		COPIED,
		FAILED,
	}

	let copyStatus: CopyStatus | null = $state(null);
	let copyTimeout: ReturnType<typeof setTimeout>;

	function copyInstallCommand() {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(text);
			copyStatus = CopyStatus.COPIED;
		} else {
			copyStatus = CopyStatus.FAILED;
		}

		clearTimeout(copyTimeout);

		copyTimeout = setTimeout(() => {
			copyStatus = null;
		}, 2500);
	}
</script>

<button
	onclick={copyInstallCommand}
	class={className}
	aria-label="Copy button"
>
	<span>{text}</span>
	{#if copyStatus === CopyStatus.COPIED}
		<div in:fly={{ y: -4 }}>
			<Check class="inline-block size-4 text-primary transition" />
		</div>
	{:else if copyStatus === CopyStatus.FAILED}
		<div in:fly={{ y: -4 }}>
			<AlertCircle class="inline-block size-4 text-red-600 transition" />
		</div>
	{:else}
		<div in:fly={{ y: 4 }}>
			<Copy class="inline-block size-4 transition" />
		</div>
	{/if}
</button>
