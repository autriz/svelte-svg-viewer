<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import { setMode, mode } from "mode-watcher";
    import { Moon, Sun } from "lucide-svelte";
</script>

<button
    class="z-10 mb-5"
    onclick={() => { $mode === "dark" ? setMode("light") : setMode("dark") }}
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