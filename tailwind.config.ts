import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        popover: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        clay: {
          pink: { 50: '#ffc8dd', 100: '#ffb3d9', 200: '#ff99ac', 300: '#ff8fb3', 400: '#ff6a88' },
          purple: { 50: '#e4c1f9', 100: '#d4a5f3', 200: '#c48ee8' },
          green: { 50: '#d8f3dc', 100: '#b7e4c7', 200: '#95d5b2' },
          yellow: { 50: '#fff4bd', 100: '#ffe6a7', 200: '#ffd98e' },
          blue: { 50: '#cae9ff', 100: '#a2d2ff' },
          bg: '#fff5f7',
          surface: '#ffffff',
          text: '#495057',
          muted: '#adb5bd',
        },
      },
      borderRadius: {
        'clay-sm': '16px',
        'clay': '24px',
        'clay-lg': '32px',
        'clay-xl': '48px',
        'clay-full': '50px',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 4px)",
        sm: "calc(var(--radius) - 8px)",
      },
      fontFamily: {
        sans: ['Nunito', 'Quicksand', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
