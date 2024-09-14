import defaultTheme from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
	content: ["./src/**/*.{html,js,ts,svelte}"],
	darkMode: "class",
	theme: {
		screens: {
			xs: "475px",
			sm: "650px",
			md: "868px",
			lg: "1024px",
			xl: "1280px",
			"2xl": "1540px",
			"3xl": "1792px",
			"4xl": "2048px",
			"5xl": "2304px",
			"6xl": "2560px",
			...defaultTheme.screens,
		},
		// fontSize: {
		//   'tiny': '.65rem',
		//   'xs': '.75rem',
		//   'sm': '.80rem',
		//   'base': '1rem',
		//   'lg': '1.125rem',
		//   'xl': '1.25rem',
		//   '2xl': '1.5rem',
		//   '3xl': '1.875rem',
		//   '4xl': '2.25rem',
		//   '5xl': '3rem',
		//   '6xl': '4rem',
		//   '7xl': '5rem'
		// },
		extend: {
			colors: {
				border: "hsl(var(--border) / <alpha-value>)",
				input: "hsl(var(--input) / <alpha-value>)",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background) / <alpha-value>)",
				foreground: "hsl(var(--foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "hsl(var(--primary) / <alpha-value>)",
					foreground:
						"hsl(var(--primary-foreground) / <alpha-value>)",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
					foreground:
						"hsl(var(--secondary-foreground) / <alpha-value>)",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
					foreground:
						"hsl(var(--destructive-foreground) / <alpha-value>)",
				},
				muted: {
					DEFAULT: "hsl(var(--muted) / <alpha-value>)",
					foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
				},
				accent: {
					DEFAULT: "hsl(var(--accent) / <alpha-value>)",
					foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
				},
				popover: {
					DEFAULT: "hsl(var(--popover) / <alpha-value>)",
					foreground:
						"hsl(var(--popover-foreground) / <alpha-value>)",
				},
				card: {
					DEFAULT: "hsl(var(--card) / <alpha-value>)",
					foreground: "hsl(var(--card-foreground) / <alpha-value>)",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			fontFamily: {
				sans: ["Inter", ...defaultTheme.fontFamily.sans],
			},
			keyframes: {
				animatedgradient: {
					"0%": { backgroundPosition: "0% 50%" },
					"50%": { backgroundPosition: "100% 50%" },
					"100%": { backgroundPosition: "0% 50%" },
				},
			},
			boxShadow: {
				navlink: "inset 0 -4px hsl(var(--primary), <alpha-value>)",
			},
			backgroundSize: {
				"200%": "200%",
				"300%": "300%",
			},
			animation: {
				gradient: "animatedgradient 1s ease infinite alternate",
			},
		},
	},
	plugins: [],
};
