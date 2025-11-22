import type { Config } from "tailwindcss";

// Tailwind CSS v4 uses CSS-based configuration in globals.css
// This file is kept minimal for compatibility
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
} satisfies Config;

