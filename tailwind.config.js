/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0b5d3b',
          dark: '#083f28',
          light: '#e6f2ec',
        },
        accent: '#c8a24a',
      },
    },
  },
  plugins: [],
};
