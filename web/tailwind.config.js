/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f5f5f7',
        bgSidebar: '#fbfbfc',
        card: '#ffffff',
        card2: '#f5f5f7',
        border: '#e4e4e7',
        borderSoft: '#ededef',
        text: '#1d1d1f',
        text2: '#6e6e73',
        text3: '#a1a1a6',
        accent: '#0071e3',
        accentSoft: '#e8f1fd',
        accentH: '#0077ed',
        input: '#ffffff',
        sel: '#e8f1fd',
        hover: 'rgba(0,0,0,0.02)',
        green: '#1f9254',
        greenBg: '#e7f6ed',
        red: '#d0392b',
        redBg: '#fceae8',
        tag: '#f2f2f3',
        kwBar: '#f7f7f8',
        chip: '#f5f5f7',
      },
    },
  },
  plugins: [],
}
