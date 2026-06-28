/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./graph.html", "./graph.js"],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: 'var(--bg-color)',
          text: 'var(--text-color)',
          border: 'var(--border-color)',
          accent: 'var(--accent-color)'
        }
      },
      fontFamily: {
        sans: ['"Lexend"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      }
    }
  },
  plugins: [],
}
