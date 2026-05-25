/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'], // Font chính
      },
      colors: {
        primary: '#4F46E5',    // Indigo
        secondary: '#10B981',  // Emerald
        accent: '#8B5CF6',     // Purple
        background: '#0B0F19',
        surface: '#111827',
      },
      animation: {
        blob: "blob 10s infinite alternate",
        float: "float 4s infinite ease-in-out",
      },
      keyframes: {
        blob: { "0%": { transform: "translate(0, 0) scale(1)" }, "100%": { transform: "translate(30px, 50px) scale(1.1)" } },
        float: { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-10px)" } }
      }
    },
  },
  plugins: [],
}