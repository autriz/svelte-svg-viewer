# Svelte SVG Viewer

A component for displaying something big in a small (or not) space.

# Usage

To start using the library, install it in your project:

```
npm install svelte-svg-viewer
```

And then use it in your app:

```svelte
<script>
	import { SVGViewer } from "svelte-svg-viewer";
</script>

<SVGViewer
	width="600px"
	height="600px"
>
	<foreignObject
		width="1000"
		height="1000"
		xmlns="http://www.w3.org/2000/svg"
	>
		<p>Content</p>
	</foreignObject>
</SVGViewer>
```

# Examples

soon™

# Props

Almost all props have controllable and uncontrollable (i.e. default) versions,
where controllable use stores and uncontrollable use raw values:

```svelte
<script>
	import { writable } from "svelte/store";
	import { SVGViewer } from "svelte-svg-viewer";

	// This is a default version. It cannot 
	// be modified after component initialization.
	const defaultActionKey = "Control";

	// And this is controllable version. It can be modified.
	// Also, if used, it overrides default version.
	const actionKey = writable("Control"); 
</script>

<SVGViewer 
	{defaultActionKey} 
	{actionKey}
>
	...
</SVGViewer>
```

Also component has afterMount prop that we can use to call methods right after component is mounted:

```svelte
<script>
	import { SVGViewer } from "svelte-svg-viewer";
</script>

<SVGViewer 
	afterMount={(methods) => methods.center()}
>
	...
</SVGViewer>
```

To see the rest go to [this file](https://github.com/autriz/svelte-svg-viewer/src/lib/SVGViewer/types.ts)

# Methods

Methods can be bound to a variable right from the component:

```svelte
<script>
	import { writable } from "svelte/store";
	import { SVGViewer } from "svelte-svg-viewer";

	// We declare a methods variable
	let methods;

	onMount(() => {
		// And then we can use method we need on mount
		methods.center();
	});
</script>

<SVGViewer 
	bind:methods
>
	...
</SVGViewer>

<!-- Or use it on click, etc. -->
<button on:click={() => methods.center()}>Center</button>
```

### Current issues

#### Incorrect XML namespace uri for foreignObject
This issue lies in incorrect xmlns attribute of foreignObject when inserted into a ```<slot>```, [link](https://github.com/sveltejs/svelte/issues/7563). The only workaround right now, if you want to use foreignObject in SVGViewer, is to provide correct value shown in the example above.

# Inspirations

-   [`Vaul Svelte`](https://github.com/huntabyte/vaul-svelte) (project structure is nice)
-   [`React Svg Pan Zoom`](https://github.com/chrvadala/react-svg-pan-zoom)
-	[`Melt UI`](https://github.com/melt-ui/melt-ui) (Prop documentation is nice)
