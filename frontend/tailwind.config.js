/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scan all JS/TS files in the src directory
    "./public/index.html"         // Include index.html if needed
  ],
  theme: {
    extend: {
      // TODO: Define custom theme colors based on the design concept
      // colors: {
      //   'brand-blue': '#1e3a8a', // Example deep blue
      //   'brand-green': '#047857', // Example green
      //   'accent-cyan': '#06b6d4', // Example accent
      // }
    },
  },
  plugins: [],
}

