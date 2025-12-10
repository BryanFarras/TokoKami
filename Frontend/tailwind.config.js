/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // 👇 TAMBAHKAN BARIS INI (PENTING!)
  darkMode: 'class', 
  
  theme: {
    extend: {},
  },
  plugins: [],
}