<script lang="ts">
	import { AlertCircle, Check, Copy } from "lucide-svelte";
	import { fly } from "svelte/transition";

	export let text: string;
	let className: HTMLButtonElement["className"] = "";

	export { className as class };

	enum CopyStatus {
		COPIED,
		FAILED,
	}

	let copyStatus: CopyStatus | null = null;
	let copyTimeout: ReturnType<typeof setTimeout>;

	async function copyInstallCommand() {
		try {
			if (navigator.clipboard) {
				await navigator.clipboard.writeText(text);
			} else {
				// Fallback for older browsers
				const textArea = document.createElement("textarea");
				textArea.value = text;
				document.body.appendChild(textArea);
				textArea.select();
				document.execCommand("copy");
				document.body.removeChild(textArea);
			}
			copyStatus = CopyStatus.COPIED;
		} catch (error) {
			console.error("Failed to copy text:", error);
			copyStatus = CopyStatus.FAILED;
		}

		clearTimeout(copyTimeout);

		copyTimeout = setTimeout(() => {
			copyStatus = null;
		}, 2500);
	}
</script>

<button
	on:click={copyInstallCommand}
	class={className}
	aria-label="Copy to clipboard"
	type="button"
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
