/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f0fa',
          100: '#e6dcf2',
          200: '#c9b3e0',
          500: '#4a2d7f',
          600: '#3d2569',
          700: '#2f1d52',
        },
        gold: {
          50: '#fbf6e9',
          100: '#f3e6c3',
          light: '#e8d48a',
          DEFAULT: '#b8982a',
          dark: '#8a6e1a',
        },
        plat: '#9ba8a0',
        accent: {
          blue: '#2ea3d8',
          green: '#8dc63f',
          red: '#e5334a',
        },
      },
    },
  },
  plugins: [],
};
