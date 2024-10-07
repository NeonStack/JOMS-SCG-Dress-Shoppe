/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#1a202c',
        primary: {
          DEFAULT: '#FF6B35', // Bright orange from the logo
          dark: '#E85D2F',    // Slightly darker orange for hover states
        },
        secondary: '#64748b',
        muted: '#FFF0E8',     // Very light orange for muted backgrounds
        accent: {
          DEFAULT: '#FF6B35', // Using the same bright orange as primary
          hover: '#E85D2F',   // Slightly darker for hover states
        },
        'accent-foreground': '#ffffff',
        input: '#FFE0D1',     // Light orange for input backgrounds
        border: '#FFB599',    // Medium orange for borders
      },
    },
  },
  plugins: [],
}