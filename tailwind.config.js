/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        wow: {
          gold: '#ffb100',
          goldLight: '#ffd100',
          goldDark: '#c68e00',
          blue: '#004a93',
          blueLight: '#0062bd',
          darkBg: '#121212',
          mediumBg: '#1e1e1e',
          lightBg: '#252525'
        }
      },
      fontFamily: {
        wow: ['"Friz Quadrata"', '"Palatino Linotype"', 'Georgia', 'serif']
      }
    }
  },
  plugins: [],
}