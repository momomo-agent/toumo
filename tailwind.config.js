/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 深色主题配色
        'bg-primary': '#0a0a0b',
        'bg-secondary': '#141415',
        'bg-tertiary': '#1c1c1e',
        'bg-hover': '#252528',
        'border': '#2a2a2d',
        'border-light': '#3a3a3d',
        'text-primary': '#fafafa',
        'text-secondary': '#a1a1a6',
        'text-tertiary': '#6b6b70',
        'accent': '#6366f1',
        'accent-hover': '#818cf8',
      },
    },
  },
  plugins: [],
}
