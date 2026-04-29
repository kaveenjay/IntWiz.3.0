/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'page':        '#F4F1EA',
        'frame':       '#FFFFFF',
        'soft':        '#F8F6F0',
        'tint':        '#EFE9DC',
        'ink':         '#1A1814',
        'ink-soft':    '#5C5750',
        'ink-faint':   '#8A8478',
        'line':        '#E5DFD0',
        'line-strong': '#D4CCBA',
        'accent':      '#2D4A3E',
        'accent-soft': '#3D6B57',
        'accent-bg':   '#E8EFEB',
        'warn':        '#B8553D',
        'gold':        '#C49A3A',
        'success':     '#4A7C59',
      },
      fontFamily: {
        'display': ['"Instrument Serif"', 'Georgia', 'serif'],
        'body':    ['"DM Sans"', 'system-ui', 'sans-serif'],
        'mono':    ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
