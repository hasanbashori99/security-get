/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'blob': 'blob 7s infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'scan-line': 'scanLine 2s linear infinite', // Animasi Garis Scan
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
            '0%': { opacity: '0', transform: 'translateY(-10px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        float: {
            '0%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-20px) rotate(5deg)' },
            '100%': { transform: 'translateY(0px) rotate(0deg)' },
        }
      }
    },
  },
  plugins: [],
}