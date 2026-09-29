/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'console-bg': '#12181F',
        'console-surface': '#1B232C',
        'console-surface-hover': '#242F3B',
        'console-surface-elevated': '#232E3A',
        'console-border': '#2A3644',
        'console-border-light': '#38485B',
        'console-text': '#E7EDF3',
        'console-muted': '#8A97A6',
        'status-available': '#2FB8A6',
        'status-warning': '#E3A008',
        'status-critical': '#E85C4A',
        'console-accent': '#4C8DFF',
        'console-accent-hover': '#3A7AE8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
