module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf4ff',
          100: '#fbe8ff',
          200: '#f7c5fd',
          300: '#f19cf9',
          400: '#e75cf0',
          500: '#d12bd8',
          600: '#af1bb3',
          700: '#8e1691',
          800: '#711373',
          900: '#5c125d',
          950: '#3b003c',
        }
      }
    },
  },
  plugins: [],
}
