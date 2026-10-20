/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'navy-900': '#0A1128', // Deep Navy Blue
        'gold-400': '#FFD700', // Gold for accents
        'gold-500': '#DAA520', // Darker Gold for buttons
        'maridadi-blue': '#1E3A8A', // A nice blue for primary elements
        'maridadi-gold': '#B8860B', // A more muted gold
      },
    },
  },
  plugins: [],
}