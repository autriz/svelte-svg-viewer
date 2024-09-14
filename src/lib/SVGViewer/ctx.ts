import { Viewer } from "$lib/internal/index.js";
import { getContext, setContext } from "svelte";

const VIEWER_ROOT = Symbol("SVGVIEWER_ROOT");

export function setCtx(props?: Viewer.CreateSVGViewerProps) {
	const viewer = Viewer.createViewer(props || {});

	setContext(VIEWER_ROOT, { ...viewer });

	return {
		...viewer,
	};
}

export function getCtx() {
	return getContext<ReturnType<typeof setCtx>>(VIEWER_ROOT);
}
