/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./Component/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00a884',
          dark: '#008068',
        },
        whatsapp: {
          'dark': '#111b21',
          'light': '#202c33',
          'message-in': '#202c33',
          'message-out': '#005c4b',
          'chat-bg': '#0b141a',
        }
      },
      chat: {
        bg: {
          light: '#F9FAFB',
          dark: '#1F2937',
        },
        message: {
          sent: {
            bg: '#005c4b',
            dark: '#005c4b',
          },
          received: {
            bg: '#F3F4F6', // Gray-100
            dark: '#374151', // Gray-700
          }
        }
      },
      spacing: {
        'chat': '32rem', // Custom height for chat container
      },
      boxShadow: {
        'message': '0 2px 4px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
