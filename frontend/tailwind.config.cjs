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
        primary: '#0095f6',
        'primary-dark': '#0074cc',
        'chat-bg-light': '#fafafa',
        'chat-bg-dark': '#121212',
        'chat-message-sent-bg': '#efefef',
        'chat-message-sent-dark': '#262626',
        'chat-message-received-bg': '#0095f6',
        'chat-message-received-dark': '#0095f6',
      },
      boxShadow: {
        message: '0 1px 2px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}
