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
      },
    },
  },
  plugins: [],
};
