/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Arial',
          'Helvetica',
          'sans-serif'
        ],
      },
      colors: {
        whatsapp: {
          lightRail: '#f0f2f5',
          darkRail: '#202c33',
          darkSidebar: '#111b21',
          darkBg: '#0b141a',
          darkCard: '#202c33',
          darkHover: '#182229',
          lightHover: '#f5f6f6',
          teal: '#00a884',
          bubbleLight: '#d9fdd3',
          bubbleDark: '#005c4b',
          doubleTick: '#53bdeb',
          loginBeige: '#fcf5eb',
          activeGreen: '#25d366',
        },
        nexo: {
          royal: '#0044ff',
          blue: '#0055ff',
          violet: '#7b2cbf',
          magenta: '#d946ef',
        },
        nexchat: {
          royal: '#0044ff',
          blue: '#0055ff',
          violet: '#7b2cbf',
          magenta: '#d946ef',
        }
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(11, 20, 26, 0.08)',
        'composer': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'bubble': '0 1px 0.5px rgba(11, 20, 26, 0.13)',
        'dropdown': '0 4px 20px rgba(0, 0, 0, 0.18)',
        'card': '0 8px 30px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}
