/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#09090b',
        'bg-surface': '#111113',
        'bg-elevated': '#18181b',
        'bg-hover': '#1f1f23',
        'bg-active': '#27272b',
        'border-subtle': 'rgba(255,255,255,0.06)',
        'border-default': 'rgba(255,255,255,0.10)',
        'border-strong': 'rgba(255,255,255,0.16)',
        'text-primary': '#fafafa',
        'text-secondary': '#a1a1aa',
        'text-tertiary': '#71717a',
        'text-muted': '#52525b',
        'accent': '#6366f1',
        'accent-hover': '#818cf8',
      },
    },
  },
  plugins: [],
}
