/** @type {import('prettier').Config} */
export default {
	plugins: ["prettier-plugin-svelte", "prettier-plugin-tailwindcss"],
	tailwindConfig: "./tailwind.config.js",
	tabWidth: 4,
	useTabs: true,
};
