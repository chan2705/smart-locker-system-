/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        zalo: {
          blue: '#0068FF',
          hover: '#0055D4',
          light: '#E5EFFF',
        },
        brand: {
          dark: '#0B0F19',
          card: '#131B2E',
          cyan: '#00E5FF',
          emerald: '#10B981',
          amber: '#F59E0B',
        }
      },
      boxShadow: {
        'glow-blue': '0 0 20px -3px rgba(0, 104, 255, 0.4)',
        'glow-cyan': '0 0 20px -3px rgba(0, 229, 255, 0.4)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.4)',
      }
    },
  },
  plugins: [],
}
