import type { Config } from "tailwindcss";

const withVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: withVar("canvas"),
        surface: withVar("surface"),
        surface2: withVar("surface-2"),
        surface3: withVar("surface-3"),
        ink: withVar("ink"),
        inkmuted: withVar("ink-muted"),
        hairline: withVar("hairline"),
        accent: withVar("accent"),
      },
      borderRadius: {
        pill: "100px",
      },
    },
  },
  plugins: [],
};

export default config;
