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
          50: '#f5f0f7',
          100: '#e9dcee',
          200: '#d3b9dd',
          500: '#6b2c82',
          600: '#5a2470',
          700: '#481c5b',
        },
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
