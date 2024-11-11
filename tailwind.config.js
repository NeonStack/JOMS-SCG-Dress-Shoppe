/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#1a202c",
        primary: {
          DEFAULT: "#B73233",
          dark: "#E85D2F",
        },
        secondary: "#64748b",
        muted: "#FFF0E8",
        accent: {
          DEFAULT: "#E85D2F",
          hover: "#C87D41",
        },
        "accent-foreground": "#ffffff",
        input: "#FFE0D1",
        border: "#FFB599",
        success: {
          light: '#E6F4EA',
          DEFAULT: '#34A853',
          dark: '#1E7E34'
        },
        error: {
          light: '#FDECEA',
          DEFAULT: '#EA4335',
          dark: '#B31412'
        }
      },
      keyframes: {
        scale: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        scale: 'scale 0.2s ease-out',
        slideDown: 'slideDown 0.2s ease-out',
      },
    },
  },
  plugins: [],
};
