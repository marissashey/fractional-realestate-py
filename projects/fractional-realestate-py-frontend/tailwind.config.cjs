/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        sage: {
          50: '#f0f4f0',
          100: '#dce7dc',
          200: '#b9cfb9',
          300: '#96b796',
          400: '#739f73',
          500: '#508750',
          600: '#3d6b3d',
          700: '#2a4f2a',
          800: '#173317',
          900: '#0d1a0d',
        },
        navy: {
          50: '#f0f2f5',
          100: '#d9e0e8',
          200: '#b3c1d1',
          300: '#8ca2ba',
          400: '#6683a3',
          500: '#40648c',
          600: '#334d6f',
          700: '#263652',
          800: '#1a1f35',
          900: '#0d0f18',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  daisyui: {
    themes: ['lofi'],
    logs: false,
  },
  plugins: [require('daisyui')],
}
