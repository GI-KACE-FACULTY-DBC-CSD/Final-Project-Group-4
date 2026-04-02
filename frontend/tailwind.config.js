/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // GI-KACE Brand Colors
        primary: '#1e3a5f',      // Navy Blue
        secondary: '#d4a574',    // Gold
        'primary-dark': '#142a47', // Darker Navy
        'primary-light': '#2d5a8f', // Lighter Navy
        'gold-dark': '#b8935f',   // Darker Gold
        'gold-light': '#e8c8a0',  // Lighter Gold
        // Utility colors
        danger: '#EF4444',
        warning: '#F59E0B',
      },
    },
  },
  plugins: [],
}
