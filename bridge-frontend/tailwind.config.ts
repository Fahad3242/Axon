import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        axon: {
          bg: '#08080F',
          surface: '#111118',
          border: '#1E1E2E',
          input: '#0D0D16',
          primary: '#3B82F6',
          'primary-hover': '#60A5FA',
          'primary-glow': 'rgba(59,130,246,0.15)',
          'text-primary': '#FFFFFF',
          'text-secondary': '#6B7280',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
