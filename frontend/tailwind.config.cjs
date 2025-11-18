/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./Component/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        whatsapp: {
          dark: '#111b21',
          light: '#202c33',
          'message-in': '#202c33',
          'message-out': '#005c4b',
          'chat-bg': '#0b141a',
          'toolbar': '#1e2e35',
          'hover': '#2a3942',
          'input': '#2a3942'
        },
        primary: '#00a884',
        'primary-dark': '#008068',
      },
      boxShadow: {
        message: '0 1px 2px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
