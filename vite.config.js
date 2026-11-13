import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// base './' werkt op elk GitHub Pages-pad, ook zonder de reponaam te kennen
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()]
});
