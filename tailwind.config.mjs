/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#E6F4EB',
        moss: '#2CE680',
        sand: '#213428',
        coral: '#1CA85F',
        gold: '#86F7B9'
      },
      fontFamily: {
        display: ['\"Space Grotesk\"', 'ui-sans-serif', 'system-ui'],
        body: ['\"DM Sans\"', 'ui-sans-serif', 'system-ui']
      }
    }
  },
  plugins: []
};
