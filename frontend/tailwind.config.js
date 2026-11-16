/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070B19',
          900: '#0B132B',
          800: '#1C2541',
          700: '#2A3656',
        },
        electric: {
          blue: '#48CAE4',
          dark: '#0077B6',
          deep: '#03045E'
        },
        vibrant: {
          purple: '#7209B7',
          dark: '#560BAD'
        },
        whatsapp: {
          emerald: '#25D366',
          teal: '#128C7E',
          dark: '#075E54',
          bubble: '#064E3B'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
