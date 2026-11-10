/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sentra: {
          bg: '#f3f6fa',
          canvas: '#e2ecf5',
          card: '#ffffff',
          panel: '#ffffff',
          border: '#e2e8f0',
          text: {
            primary: '#0f172a',
            secondary: '#475569',
            muted: '#94a3b8',
          },
          amber: '#f59e0b',
          red: '#f43f5e',
          orange: '#f97316',
          green: '#10b981',
          blue: '#0284c7',
          sky: '#0ea5e9',
          indigo: '#6366f1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'stitch': '0 4px 20px -2px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
}
