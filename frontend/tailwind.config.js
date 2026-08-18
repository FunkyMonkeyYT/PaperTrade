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
        // TradingView Dark Palette
        tv: {
          dark: '#131722',
          panel: '#1E222D',
          border: '#2A2E39',
          blue: '#2962FF',
          green: '#089981',
          red: '#F23645',
          amber: '#F59E0B',
          purple: '#8B5CF6',
          // Light Mode Elements
          lightBg: '#F0F3FA',
          lightPanel: '#FFFFFF',
          lightBorder: '#E0E3EB',
          lightText: '#131722',
          lightMuted: '#787B86',
        },
        dark: {
          900: '#131722',
          800: '#1E222D',
          700: '#2A2E39',
          600: '#363A45',
          500: '#434651'
        },
        brand: {
          blue: '#2962FF',
          green: '#089981',
          red: '#F23645',
          amber: '#F59E0B',
          purple: '#8B5CF6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}

