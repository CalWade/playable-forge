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
        /* shadcn compat */
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* Clay palette */
        clay: {
          bg:        "rgb(var(--clay-bg) / <alpha-value>)",
          surface:   "rgb(var(--clay-surface) / <alpha-value>)",
          surface2:  "rgb(var(--clay-surface-2) / <alpha-value>)",
          border:    "rgb(var(--clay-border) / <alpha-value>)",
          primary: {
            DEFAULT: "rgb(var(--clay-primary) / <alpha-value>)",
            lt:      "rgb(var(--clay-primary-lt) / <alpha-value>)",
            dk:      "rgb(var(--clay-primary-dk) / <alpha-value>)",
          },
          accent: {
            DEFAULT: "rgb(var(--clay-accent) / <alpha-value>)",
            lt:      "rgb(var(--clay-accent-lt) / <alpha-value>)",
            dk:      "rgb(var(--clay-accent-dk) / <alpha-value>)",
          },
          success: {
            DEFAULT: "rgb(var(--clay-success) / <alpha-value>)",
            lt:      "rgb(var(--clay-success-lt) / <alpha-value>)",
            dk:      "rgb(var(--clay-success-dk) / <alpha-value>)",
          },
          warning: {
            DEFAULT: "rgb(var(--clay-warning) / <alpha-value>)",
            lt:      "rgb(var(--clay-warning-lt) / <alpha-value>)",
            dk:      "rgb(var(--clay-warning-dk) / <alpha-value>)",
          },
          danger: {
            DEFAULT: "rgb(var(--clay-danger) / <alpha-value>)",
            lt:      "rgb(var(--clay-danger-lt) / <alpha-value>)",
            dk:      "rgb(var(--clay-danger-dk) / <alpha-value>)",
          },
          info: {
            DEFAULT: "rgb(var(--clay-info) / <alpha-value>)",
            lt:      "rgb(var(--clay-info-lt) / <alpha-value>)",
            dk:      "rgb(var(--clay-info-dk) / <alpha-value>)",
          },
          neutral: {
            50:  "rgb(var(--clay-neutral-50)  / <alpha-value>)",
            100: "rgb(var(--clay-neutral-100) / <alpha-value>)",
            200: "rgb(var(--clay-neutral-200) / <alpha-value>)",
            300: "rgb(var(--clay-neutral-300) / <alpha-value>)",
            400: "rgb(var(--clay-neutral-400) / <alpha-value>)",
            500: "rgb(var(--clay-neutral-500) / <alpha-value>)",
            600: "rgb(var(--clay-neutral-600) / <alpha-value>)",
            700: "rgb(var(--clay-neutral-700) / <alpha-value>)",
            800: "rgb(var(--clay-neutral-800) / <alpha-value>)",
            900: "rgb(var(--clay-neutral-900) / <alpha-value>)",
          },
          text:       "rgb(var(--clay-text) / <alpha-value>)",
          "text-muted":"rgb(var(--clay-text-muted) / <alpha-value>)",
          "text-faint":"rgb(var(--clay-text-faint) / <alpha-value>)",
        },
      },

      borderRadius: {
        lg:        "var(--radius)",
        md:        "calc(var(--radius) - 2px)",
        sm:        "calc(var(--radius) - 6px)",
        "clay-xs": "var(--radius-clay-xs)",
        "clay-sm": "var(--radius-clay-sm)",
        "clay-md": "var(--radius-clay-md)",
        "clay-lg": "var(--radius-clay-lg)",
        "clay-xl": "var(--radius-clay-xl)",
        "clay-2xl":"var(--radius-clay-2xl)",
      },

      boxShadow: {
        "clay-xs":      "var(--shadow-clay-xs)",
        "clay-sm":      "var(--shadow-clay-sm)",
        "clay-md":      "var(--shadow-clay-md)",
        "clay-lg":      "var(--shadow-clay-lg)",
        "clay-xl":      "var(--shadow-clay-xl)",
        "clay-effect-sm": "var(--clay-effect-sm)",
        "clay-effect-md": "var(--clay-effect-md)",
        "clay-effect-lg": "var(--clay-effect-lg)",
        "clay-effect-pressed": "var(--clay-effect-pressed)",
        "clay-input":   "var(--clay-input-shadow)",
        "clay-input-focus": "var(--clay-input-focus-shadow)",
        "inset-clay":   "var(--inset-clay)",
        "inset-clay-pressed": "var(--inset-clay-pressed)",
      },

      keyframes: {
        "clay-press": {
          "0%":   { transform: "translateY(0) scale(1)" },
          "40%":  { transform: "translateY(2px) scale(0.96)" },
          "70%":  { transform: "translateY(-1px) scale(1.01)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        "clay-bounce-in": {
          "0%":   { opacity: "0", transform: "scale(0.85) translateY(8px)" },
          "60%":  { opacity: "1", transform: "scale(1.03) translateY(-2px)" },
          "80%":  { transform: "scale(0.98) translateY(1px)" },
          "100%": { transform: "scale(1) translateY(0)" },
        },
        "clay-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-4px)" },
        },
        "clay-shimmer": {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition:  "200% center" },
        },
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-from-right": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "zoom-in-95": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        "zoom-out-95": {
          from: { opacity: "1", transform: "scale(1)" },
          to:   { opacity: "0", transform: "scale(0.95)" },
        },
      },

      animation: {
        "clay-press":      "clay-press 350ms cubic-bezier(0.34,1.56,0.64,1)",
        "clay-bounce-in":  "clay-bounce-in 400ms cubic-bezier(0.34,1.56,0.64,1)",
        "clay-float":      "clay-float 3s ease-in-out infinite",
        "clay-shimmer":    "clay-shimmer 1.5s ease-in-out infinite",
        "accordion-down":  "accordion-down 0.2s ease-out",
        "accordion-up":    "accordion-up 0.2s ease-out",
        "fade-in":         "fade-in 0.2s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.25s ease-out",
        "zoom-in-95":      "zoom-in-95 0.15s ease-out",
        "zoom-out-95":     "zoom-out-95 0.15s ease-out",
      },

      fontFamily: {
        sans:  ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono:  ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
