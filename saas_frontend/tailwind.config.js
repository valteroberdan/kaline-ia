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
        kaline: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        medical: {
          dark: '#0a0f1d',
          card: '#111827',
          border: '#1f2937',
          art: '#ef4444',     // Red for Arterial Line
          ecg: '#22c55e',     // Green for ECG / normal
          pleth: '#06b6d4',   // Cyan for Pleth
          warning: '#f59e0b', // Amber for Warning
          critical: '#ef4444' // Red for Critical
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      }
    },
  },
  plugins: [],
}
